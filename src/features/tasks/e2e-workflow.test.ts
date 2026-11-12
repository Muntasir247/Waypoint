import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role, Priority, Availability } from "@prisma/client";
import { can } from "@/lib/permissions";
import { calculateTaskScore } from "@/features/scoring/calculator";
import { rankTaskAssignmentCandidates } from "./smart-assignment";

describe("E2E Engineering Workflow Matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes full lifecycle: Smart Assignment -> Status Update -> RBAC Delete Protection -> Scoring Ledger", () => {
    // 1. Roles & Memberships
    const adminMembership = {
      id: "mem_admin",
      role: Role.ADMIN,
      userId: "usr_admin",
      workspaceId: "ws_acme",
      availability: Availability.ACTIVE,
    };

    const devMembership = {
      id: "mem_dev",
      role: Role.DEVELOPER,
      userId: "usr_dev",
      workspaceId: "ws_acme",
      availability: Availability.ACTIVE,
    };

    // 2. Smart Assignment Candidate Ranking
    const task = { estimatePoints: 5, labels: ["TypeScript", "Node.js"] };
    const candidates = [
      {
        id: devMembership.id,
        name: "Sarah Chen",
        email: "sarah@waypoint.dev",
        role: "DEVELOPER",
        availability: "ACTIVE" as const,
        skills: [
          { name: "TypeScript", level: 5 },
          { name: "Node.js", level: 5 },
        ],
        openEstimatePoints: 4,
        completedTasksHistory: [
          { dueDate: "2026-11-01", completedAt: "2026-10-31" },
          { dueDate: "2026-11-05", completedAt: "2026-11-04" },
        ],
      },
      {
        id: "mem_dev_2",
        name: "Marcus Vance",
        email: "marcus@waypoint.dev",
        role: "DEVELOPER",
        availability: "ACTIVE" as const,
        skills: [{ name: "Go", level: 5 }],
        openEstimatePoints: 18,
        completedTasksHistory: [],
      },
    ];

    const ranked = rankTaskAssignmentCandidates(task, candidates, { capacityLimit: 20 });
    expect(ranked[0].membershipId).toBe(devMembership.id);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].reasons.some((r) => r.toLowerCase().includes("skill"))).toBe(true);

    // 3. Developer can update own assigned task status
    const assignedTask = {
      id: "task_100",
      assigneeId: devMembership.id,
      createdById: adminMembership.userId,
    };

    const canDevUpdateStatus = can(devMembership, "update_status:task", {
      type: "task",
      task: assignedTask,
    });
    expect(canDevUpdateStatus).toBe(true);

    // 4. Developer CANNOT delete task (Admin only)
    const canDevDelete = can(devMembership, "delete:task", {
      type: "task",
      task: assignedTask,
    });
    expect(canDevDelete).toBe(false);

    const canAdminDelete = can(adminMembership, "delete:task", {
      type: "task",
      task: assignedTask,
    });
    expect(canAdminDelete).toBe(true);

    // 5. Task Reaches DONE -> Mathematical Score Event Calculated
    const completedAt = new Date("2026-11-20T10:00:00Z");
    const dueDate = new Date("2026-11-21T00:00:00Z");

    const scoreResult = calculateTaskScore({
      estimatePoints: 5,
      priority: Priority.HIGH, // 1.5 multiplier
      dueDate,
      completedAt, // On time -> 1.2 bonus
      bounceCount: 0,
    });

    // 5 * 1.5 * 1.2 = 9.0
    expect(scoreResult.basePoints).toBe(7.5);
    expect(scoreResult.finalPoints).toBe(9.0);
    expect(scoreResult.timingStatus).toBe("ON_TIME");
    expect(scoreResult.formulaExplanation).toContain("5 pts × HIGH (1.5x) = 7.5 pts");
    expect(scoreResult.formulaExplanation).toContain("On-time (+20% bonus = ×1.2)");
  });
});
