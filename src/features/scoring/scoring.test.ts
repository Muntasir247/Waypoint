import { describe, it, expect, vi, beforeEach } from "vitest";
import { Priority, Role } from "@/types/enums";
import { calculateTaskScore } from "./calculator";
import { defaultScoringRules } from "./schemas";
import {
  getWorkspaceScoringConfigAction,
  updateWorkspaceScoringConfigAction,
  recordTaskCompletionScore,
  recordTaskReopeningReversal,
} from "./actions";
import { db } from "@/lib/db";
import * as workspacesActions from "@/features/workspaces/actions";

vi.mock("@/lib/db", () => ({
  db: {
    scoringConfig: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    scoreEvent: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    activityLog: {
      count: vi.fn(),
    },
    membership: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    monthlyResult: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    badge: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    memberBadge: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Scoring Calculator", () => {
  it("calculates base points with priority multipliers correctly", () => {
    // LOW: 5 * 1.0 = 5.0
    const resLow = calculateTaskScore({
      estimatePoints: 5,
      priority: Priority.LOW,
      dueDate: null,
      completedAt: new Date(),
    });
    expect(resLow.basePoints).toBe(5);
    expect(resLow.finalPoints).toBe(5);

    // MEDIUM: 4 * 1.25 = 5.0
    const resMed = calculateTaskScore({
      estimatePoints: 4,
      priority: Priority.MEDIUM,
      dueDate: null,
      completedAt: new Date(),
    });
    expect(resMed.basePoints).toBe(5);
    expect(resMed.finalPoints).toBe(5);

    // HIGH: 6 * 1.5 = 9.0
    const resHigh = calculateTaskScore({
      estimatePoints: 6,
      priority: Priority.HIGH,
      dueDate: null,
      completedAt: new Date(),
    });
    expect(resHigh.basePoints).toBe(9);
    expect(resHigh.finalPoints).toBe(9);

    // CRITICAL: 5 * 2.0 = 10.0
    const resCrit = calculateTaskScore({
      estimatePoints: 5,
      priority: Priority.CRITICAL,
      dueDate: null,
      completedAt: new Date(),
    });
    expect(resCrit.basePoints).toBe(10);
    expect(resCrit.finalPoints).toBe(10);
  });

  it("applies +20% bonus for on-time completion (completed <= dueDate)", () => {
    const due = new Date("2026-11-15T18:00:00Z");
    const completed = new Date("2026-11-15T10:00:00Z"); // earlier on same day

    const res = calculateTaskScore({
      estimatePoints: 10,
      priority: Priority.LOW, // base = 10
      dueDate: due,
      completedAt: completed,
    });

    expect(res.timingStatus).toBe("ON_TIME");
    expect(res.timingMultiplier).toBe(1.2);
    expect(res.finalPoints).toBe(12.0); // 10 * 1.2 = 12
  });

  it("applies 50% penalty for late completion (completed > dueDate)", () => {
    const due = new Date("2026-11-10T10:00:00Z");
    const completed = new Date("2026-11-12T14:00:00Z"); // 2 days late

    const res = calculateTaskScore({
      estimatePoints: 10,
      priority: Priority.LOW, // base = 10
      dueDate: due,
      completedAt: completed,
    });

    expect(res.timingStatus).toBe("LATE");
    expect(res.timingMultiplier).toBe(0.5);
    expect(res.finalPoints).toBe(5.0); // 10 * 0.5 = 5
  });

  it("deducts 10% per review bounce and respects the 50% floor", () => {
    const due = new Date("2026-11-15T18:00:00Z");
    const completed = new Date("2026-11-14T10:00:00Z"); // on-time (base 10 * 1.2 = 12 timed points)

    // 1 bounce: -10% of base points (10 * 0.10 = 1.0 deduction) -> 12 - 1 = 11 pts
    const res1Bounce = calculateTaskScore({
      estimatePoints: 10,
      priority: Priority.LOW,
      dueDate: due,
      completedAt: completed,
      bounceCount: 1,
    });
    expect(res1Bounce.bounceDeductionPoints).toBe(1);
    expect(res1Bounce.finalPoints).toBe(11);

    // 6 bounces: capped at 50% of base points (5.0 deduction) -> 12 - 5 = 7 pts
    const res6Bounces = calculateTaskScore({
      estimatePoints: 10,
      priority: Priority.LOW,
      dueDate: due,
      completedAt: completed,
      bounceCount: 6,
    });
    expect(res6Bounces.bounceDeductionPoints).toBe(5);
    expect(res6Bounces.finalPoints).toBe(7);

    // Late task with multiple bounces: must not drop below min 50% of base points (5.0 pts)
    const lateCompleted = new Date("2026-11-20T10:00:00Z");
    const resLateBounced = calculateTaskScore({
      estimatePoints: 10,
      priority: Priority.LOW, // base = 10, timed = 5
      dueDate: due,
      completedAt: lateCompleted,
      bounceCount: 4,
    });
    expect(resLateBounced.finalPoints).toBe(5.0); // Minimum 50% floor preserved
  });
});

describe("Scoring Server Actions & Ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getWorkspaceScoringConfigAction creates default config if not existing", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["workspace"]
      >,
      user: { id: "user-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["user"]
      >,
      membership: { id: "mem-1", role: Role.ADMIN } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["membership"]
      >,
      workspaces: [] as unknown as Awaited<
        ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>
      >["workspaces"],
    });

    vi.mocked(db.scoringConfig.findUnique).mockResolvedValue(null);
    vi.mocked(db.scoringConfig.create).mockResolvedValue({
      id: "cfg-1",
      workspaceId: "ws-1",
      enabled: true,
      rules: defaultScoringRules,
      updatedAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof db.scoringConfig.create>>);

    const res = await getWorkspaceScoringConfigAction();
    expect(res.config?.enabled).toBe(true);
    expect(res.config?.rules.priorityMultipliers.HIGH).toBe(1.5);
    expect(db.scoringConfig.create).toHaveBeenCalled();
  });

  it("updateWorkspaceScoringConfigAction updates rules when user is ADMIN", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["workspace"]
      >,
      user: { id: "user-admin" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["user"]
      >,
      membership: { id: "mem-admin", role: Role.ADMIN } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["membership"]
      >,
      workspaces: [] as unknown as Awaited<
        ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>
      >["workspaces"],
    });

    vi.mocked(db.scoringConfig.upsert).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof db.scoringConfig.upsert>>,
    );
    vi.mocked(db.auditLog.create).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof db.auditLog.create>>,
    );

    const res = await updateWorkspaceScoringConfigAction({
      enabled: true,
      rules: {
        ...defaultScoringRules,
        onTimeMultiplier: 1.3,
      },
    });

    expect(res.success).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "UPDATE_SCORING_CONFIG",
        }),
      }),
    );
  });

  it("recordTaskCompletionScore records immutable ScoreEvent and reverses on reopening", async () => {
    // 1. Task reaches DONE
    vi.mocked(db.task.findUnique).mockResolvedValue({
      id: "task-100",
      title: "Add Stripe Webhook",
      priority: Priority.HIGH,
      estimatePoints: 4,
      dueDate: new Date("2026-11-20"),
      completedAt: new Date("2026-11-15"),
      assigneeId: "mem-dev",
      project: { workspaceId: "ws-1" },
      labels: [],
    } as unknown as Awaited<ReturnType<typeof db.task.findUnique>>);

    vi.mocked(db.scoringConfig.findUnique).mockResolvedValue({
      enabled: true,
      rules: defaultScoringRules,
    } as unknown as Awaited<ReturnType<typeof db.scoringConfig.findUnique>>);

    vi.mocked(db.scoreEvent.findFirst).mockResolvedValue(null);
    vi.mocked(db.activityLog.count).mockResolvedValue(0);
    vi.mocked(db.task.findMany).mockResolvedValue([]);
    vi.mocked(db.task.count).mockResolvedValue(0);

    vi.mocked(db.scoreEvent.create).mockResolvedValue({
      id: "se-1",
      points: 7.2, // 4 * 1.5 * 1.2 = 7.2
    } as unknown as Awaited<ReturnType<typeof db.scoreEvent.create>>);

    const event = await recordTaskCompletionScore("task-100");
    expect(event).toBeDefined();
    expect(db.scoreEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: "task-100",
          membershipId: "mem-dev",
          points: 7.2,
        }),
      }),
    );

    // 2. Task reopened out of DONE -> reversing score event
    vi.mocked(db.scoreEvent.findFirst).mockResolvedValue({
      id: "se-1",
      taskId: "task-100",
      membershipId: "mem-dev",
      points: 7.2,
      createdAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof db.scoreEvent.findFirst>>);
    vi.mocked(db.scoreEvent.count).mockResolvedValue(0); // not yet reversed

    await recordTaskReopeningReversal("task-100");
    expect(db.scoreEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: "task-100",
          membershipId: "mem-dev",
          points: -7.2,
          reason: expect.stringContaining("Reversal"),
        }),
      }),
    );
  });
});
