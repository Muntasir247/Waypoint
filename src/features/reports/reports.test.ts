import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskStatus, Priority, Role } from "@/types/enums";
import { getMonthlyReportAction } from "./actions";
import { generateReportCSV } from "./csv-export";
import { db } from "@/lib/db";
import * as workspacesActions from "@/features/workspaces/actions";
import type { ReportSummary } from "./schemas";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findMany: vi.fn(),
    },
    membership: {
      findMany: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    scoreEvent: {
      findMany: vi.fn(),
    },
    activityLog: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(),
}));

describe("Reports Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates developer and project metrics for the requested month", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["workspace"]
      >,
      user: { id: "user-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["user"]
      >,
      membership: { id: "mem-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["membership"]
      >,
      workspaces: [] as unknown as Awaited<
        ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>
      >["workspaces"],
    });

    vi.mocked(db.project.findMany).mockResolvedValue([
      { id: "proj-1", name: "Core Infrastructure" },
    ] as unknown as Awaited<ReturnType<typeof db.project.findMany>>);

    vi.mocked(db.membership.findMany).mockResolvedValue([
      {
        id: "mem-1",
        role: Role.DEVELOPER,
        user: { id: "u-1", name: "Sarah Connor", email: "sarah@waypoint.dev", image: null },
      },
    ] as unknown as Awaited<ReturnType<typeof db.membership.findMany>>);

    const now = new Date(2026, 10, 15); // Nov 15, 2026

    // Completed tasks
    vi.mocked(db.task.findMany)
      .mockResolvedValueOnce([
        {
          id: "task-1",
          projectId: "proj-1",
          assigneeId: "mem-1",
          priority: Priority.CRITICAL,
          estimatePoints: 5,
          dueDate: new Date(2026, 10, 16),
          completedAt: new Date(2026, 10, 14), // On time
          status: TaskStatus.DONE,
          project: { id: "proj-1", name: "Core Infrastructure" },
          assignee: {
            id: "mem-1",
            role: Role.DEVELOPER,
            user: { id: "u-1", name: "Sarah Connor", email: "sarah@waypoint.dev", image: null },
          },
        },
      ] as unknown as Awaited<ReturnType<typeof db.task.findMany>>)
      // All workspace tasks query for project breakdown
      .mockResolvedValueOnce([
        {
          id: "task-1",
          projectId: "proj-1",
          status: TaskStatus.DONE,
          estimatePoints: 5,
          labels: [],
        },
      ] as unknown as Awaited<ReturnType<typeof db.task.findMany>>);

    vi.mocked(db.scoreEvent.findMany).mockResolvedValue([
      {
        id: "se-1",
        membershipId: "mem-1",
        workspaceId: "ws-1",
        points: 12.0,
        createdAt: now,
      },
    ] as unknown as Awaited<ReturnType<typeof db.scoreEvent.findMany>>);

    vi.mocked(db.activityLog.count).mockResolvedValue(0);
    vi.mocked(db.task.count).mockResolvedValue(0);

    const res = await getMonthlyReportAction({ month: "2026-11" });

    expect(res.summary).toBeDefined();
    expect(res.summary?.totalTasksCompleted).toBe(1);
    expect(res.summary?.totalDeliveredPoints).toBe(12.0);
    expect(res.summary?.overallOnTimeRate).toBe(100);

    const dev = res.summary?.developerReports.find((d) => d.membershipId === "mem-1");
    expect(dev?.name).toBe("Sarah Connor");
    expect(dev?.tasksCompleted).toBe(1);
    expect(dev?.criticalTasksDone).toBe(1);
    expect(dev?.onTimeRate).toBe(100);
    expect(dev?.totalPoints).toBe(12.0);

    const proj = res.summary?.projectReports.find((p) => p.projectId === "proj-1");
    expect(proj?.projectName).toBe("Core Infrastructure");
    expect(proj?.completedTasks).toBe(1);
    expect(proj?.completionRate).toBe(100);
  });

  it("generateReportCSV formats an RFC-4180 compliant CSV string", () => {
    const mockSummary: ReportSummary = {
      month: "2026-11",
      generatedAt: "Nov 15, 2026",
      totalDeliveredPoints: 34.5,
      totalTasksCompleted: 8,
      overallOnTimeRate: 88,
      totalReviewBounces: 2,
      openBugsCount: 1,
      developerReports: [
        {
          membershipId: "mem-1",
          name: 'Sarah "The Rock" Connor',
          email: "sarah@waypoint.dev",
          role: "DEVELOPER",
          tasksCompleted: 5,
          onTimeTasks: 4,
          lateTasks: 1,
          onTimeRate: 80,
          totalPoints: 22.5,
          reviewBounces: 1,
          pointsPerTask: 4.5,
          criticalTasksDone: 2,
        },
      ],
      projectReports: [
        {
          projectId: "proj-1",
          projectName: "Billing & Subscriptions, Inc.",
          totalTasks: 10,
          completedTasks: 8,
          completionRate: 80,
          totalPointsDelivered: 34,
          openBugsCount: 1,
          activeSprintsCount: 1,
        },
      ],
      velocityTrend: [],
    };

    const csv = generateReportCSV(mockSummary);
    expect(csv).toContain("WAYPOINT ENGINEERING MONTHLY REPORT");
    expect(csv).toContain("Month,2026-11");
    expect(csv).toContain("Total Delivered Points,34.5");
    // Quotes escaped per RFC-4180
    expect(csv).toContain('"Sarah ""The Rock"" Connor"');
    // Commas in project name escaped per RFC-4180
    expect(csv).toContain('"Billing & Subscriptions, Inc."');
  });
});
