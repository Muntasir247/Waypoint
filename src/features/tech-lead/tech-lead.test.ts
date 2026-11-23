import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getWorkspaceWorkloadAction,
  reassignMemberTasksAction,
  bulkUpdateTasksAction,
  getProjectDashboardAction,
} from "./actions";
import { TaskStatus, Priority, Role } from "@/types/enums";

let currentMockUser = {
  id: "usr_admin",
  email: "admin@waypoint.dev",
  name: "Alex Rivera",
};

let currentMockMembership = {
  id: "mem_admin_1",
  role: Role.ADMIN,
  userId: "usr_admin",
  workspaceId: "ws_acme",
};

const mockWorkspace = {
  id: "ws_acme",
  name: "Acme Engineering",
  slug: "acme-eng",
};

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(async () => ({
    user: currentMockUser,
    workspace: mockWorkspace,
    membership: currentMockMembership,
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDb = {
  task: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  membership: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  scoringConfig: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
};

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      findMany: (...args: unknown[]) => mockDb.task.findMany(...args),
      updateMany: (...args: unknown[]) => mockDb.task.updateMany(...args),
      deleteMany: (...args: unknown[]) => mockDb.task.deleteMany(...args),
    },
    membership: {
      findMany: (...args: unknown[]) => mockDb.membership.findMany(...args),
      findFirst: (...args: unknown[]) => mockDb.membership.findFirst(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockDb.auditLog.create(...args),
    },
    scoringConfig: {
      findUnique: (...args: unknown[]) => mockDb.scoringConfig.findUnique(...args),
    },
    $transaction: (ops: Promise<unknown>[]) => mockDb.$transaction(ops),
  },
}));

describe("Tech Lead Tools & Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockUser = {
      id: "usr_admin",
      email: "admin@waypoint.dev",
      name: "Alex Rivera",
    };
    currentMockMembership = {
      id: "mem_admin_1",
      role: Role.ADMIN,
      userId: "usr_admin",
      workspaceId: "ws_acme",
    };
  });

  it("calculates developer workload, open points, capacity, and identifies overloaded members", async () => {
    mockDb.scoringConfig.findUnique.mockResolvedValue({
      rules: { capacityLimit: 20 },
    });

    mockDb.membership.findMany.mockResolvedValue([
      {
        id: "mem_dev_1",
        role: Role.DEVELOPER,
        availability: "ACTIVE",
        user: { id: "u1", name: "Sarah Chen", email: "sarah@waypoint.dev", image: null },
        memberSkills: [{ skill: { name: "TypeScript" }, level: 5 }],
        assignedTasks: [
          {
            id: "t1",
            title: "Task 1",
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.HIGH,
            estimatePoints: 8,
            dueDate: new Date("2026-11-20"),
            project: { name: "Core API" },
          },
          {
            id: "t2",
            title: "Task 2",
            status: TaskStatus.TODO,
            priority: Priority.MEDIUM,
            estimatePoints: 15,
            dueDate: new Date("2026-11-25"),
            project: { name: "Core API" },
          },
        ],
      },
      {
        id: "mem_dev_2",
        role: Role.DEVELOPER,
        availability: "ACTIVE",
        user: { id: "u2", name: "Elena Rostova", email: "elena@waypoint.dev", image: null },
        memberSkills: [{ skill: { name: "PostgreSQL" }, level: 4 }],
        assignedTasks: [
          {
            id: "t3",
            title: "Task 3",
            status: TaskStatus.TODO,
            priority: Priority.LOW,
            estimatePoints: 5,
            dueDate: new Date("2026-11-30"),
            project: { name: "Core API" },
          },
        ],
      },
    ]);

    const res = await getWorkspaceWorkloadAction();
    expect(res.error).toBeNull();
    expect(res.members).toHaveLength(2);

    // Dev 1 has 8 + 15 = 23 points -> Over capacity limit (20)
    const dev1 = res.members.find((m) => m.membershipId === "mem_dev_1");
    expect(dev1?.openEstimatePoints).toBe(23);
    expect(dev1?.isOverloaded).toBe(true);

    // Dev 2 has 5 points -> Within capacity
    const dev2 = res.members.find((m) => m.membershipId === "mem_dev_2");
    expect(dev2?.openEstimatePoints).toBe(5);
    expect(dev2?.isOverloaded).toBe(false);

    expect(res.summary?.totalAllocatedPoints).toBe(28);
    expect(res.summary?.overloadedCount).toBe(1);
  });

  it("reassigns all tasks of a member going on leave and records an audit log", async () => {
    mockDb.membership.findFirst
      .mockResolvedValueOnce({
        id: "mem_dev_leave",
        availability: "ACTIVE",
        user: { email: "leave@waypoint.dev", name: "Dev On Leave" },
      })
      .mockResolvedValueOnce({
        id: "mem_dev_target",
        availability: "ACTIVE",
        user: { email: "target@waypoint.dev", name: "Target Dev" },
      });

    mockDb.task.findMany.mockResolvedValue([
      { id: "task_1", title: "Task 1" },
      { id: "task_2", title: "Task 2" },
    ]);
    mockDb.task.updateMany.mockResolvedValue({ count: 2 });
    mockDb.auditLog.create.mockResolvedValue({ id: "audit_1" });

    const res = await reassignMemberTasksAction({
      fromMembershipId: "mem_dev_leave",
      toMembershipId: "mem_dev_target",
      reason: "Paternity leave starting next week",
    });

    expect(res.error).toBeNull();
    expect(res.reallocatedCount).toBe(2);
    expect(mockDb.task.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["task_1", "task_2"] } },
      data: { assigneeId: "mem_dev_target" },
    });
    expect(mockDb.auditLog.create).toHaveBeenCalled();
  });

  it("performs bulk status update, priority change, and reassign", async () => {
    mockDb.task.findMany.mockResolvedValue([
      { id: "t1", title: "T1", status: TaskStatus.TODO, assigneeId: "m1" },
      { id: "t2", title: "T2", status: TaskStatus.TODO, assigneeId: "m1" },
    ]);
    mockDb.task.updateMany.mockResolvedValue({ count: 2 });

    // Bulk status change
    const resStatus = await bulkUpdateTasksAction({
      taskIds: ["t1", "t2"],
      action: "change_status",
      status: TaskStatus.IN_PROGRESS,
    });
    expect(resStatus.error).toBeNull();
    expect(resStatus.affectedCount).toBe(2);
    expect(mockDb.task.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["t1", "t2"] } },
      data: { status: TaskStatus.IN_PROGRESS, completedAt: null },
    });

    // Bulk priority change
    const resPriority = await bulkUpdateTasksAction({
      taskIds: ["t1", "t2"],
      action: "change_priority",
      priority: Priority.CRITICAL,
    });
    expect(resPriority.error).toBeNull();
    expect(mockDb.task.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["t1", "t2"] } },
      data: { priority: Priority.CRITICAL },
    });
  });

  it("performs bulk delete with audit logging for Admin", async () => {
    mockDb.task.findMany.mockResolvedValue([
      { id: "t1", title: "T1", status: TaskStatus.TODO, assigneeId: "m1" },
    ]);
    mockDb.task.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.auditLog.create.mockResolvedValue({ id: "audit_del" });

    const res = await bulkUpdateTasksAction({
      taskIds: ["t1"],
      action: "delete",
    });

    expect(res.error).toBeNull();
    expect(res.affectedCount).toBe(1);
    expect(mockDb.task.deleteMany).toHaveBeenCalled();
    expect(mockDb.auditLog.create).toHaveBeenCalled();
  });

  it("calculates dashboard metrics with burndown, overdue, and blocked alerts", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockDb.task.findMany.mockResolvedValue([
      {
        id: "t_done",
        title: "Done Task",
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        estimatePoints: 5,
        dueDate: null,
        completedAt: new Date(),
        project: { name: "Project Alpha" },
        assignee: {
          id: "m_top",
          user: { name: "Top Dev", email: "top@dev.com", image: null },
        },
      },
      {
        id: "t_overdue",
        title: "Overdue Task",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.CRITICAL,
        estimatePoints: 3,
        dueDate: yesterday,
        project: { name: "Project Alpha" },
        assignee: {
          id: "m_dev",
          user: { name: "Dev One", email: "one@dev.com", image: null },
        },
      },
      {
        id: "t_blocked",
        title: "Blocked Task",
        status: TaskStatus.BLOCKED,
        blockedReason: "Waiting on Auth gateway",
        priority: Priority.HIGH,
        estimatePoints: 8,
        dueDate: null,
        project: { name: "Project Alpha" },
        assignee: null,
      },
    ]);

    const res = await getProjectDashboardAction();
    expect(res.error).toBeNull();
    expect(res.dashboard).toBeDefined();

    const d = res.dashboard!;
    expect(d.totalTasks).toBe(3);
    expect(d.completedTasks).toBe(1);
    expect(d.completionPercentage).toBe(33);
    expect(d.totalPoints).toBe(16);
    expect(d.completedPoints).toBe(5);
    expect(d.remainingPoints).toBe(11);

    // Overdue alerts
    expect(d.overdueTasks).toHaveLength(1);
    expect(d.overdueTasks[0].title).toBe("Overdue Task");

    // Blocked alerts
    expect(d.blockedTasks).toHaveLength(1);
    expect(d.blockedTasks[0].blockedReason).toBe("Waiting on Auth gateway");

    // Burndown data points
    expect(d.burndown.length).toBeGreaterThan(0);

    // Top Performer
    expect(d.topPerformer?.name).toBe("Top Dev");
    expect(d.topPerformer?.completedPoints).toBe(5);
  });
});
