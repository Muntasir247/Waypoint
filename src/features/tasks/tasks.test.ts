import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTaskAction,
  updateTaskStatusAction,
  deleteTaskAction,
  addDependencyAction,
  addChecklistItemAction,
  toggleChecklistItemAction,
  addCommentAction,
  logTimeAction,
  moveTaskAction,
  getMyTasksAction,
} from "./actions";
import { AuthorizationError } from "@/lib/permissions";
import { TaskStatus, Priority } from "@/types/enums";

// Mock user session
let currentMockUser = {
  id: "usr_admin",
  email: "admin@waypoint.dev",
  name: "Alex Rivera",
};

let currentMockMembership: {
  id: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  userId: string;
  workspaceId: string;
} = {
  id: "mem_admin_1",
  role: "ADMIN",
  userId: "usr_admin",
  workspaceId: "ws_acme",
};

const mockWorkspace = {
  id: "ws_acme",
  name: "Acme Engineering",
  slug: "acme-eng",
  allowDeveloperCreateTasks: false,
};

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(async () => ({
    user: currentMockUser,
    workspace: mockWorkspace,
    membership: currentMockMembership,
    workspaces: [{ id: "ws_acme", name: "Acme Engineering", role: currentMockMembership.role }],
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// In-memory mock database for tasks
interface MockTask {
  id: string;
  projectId: string;
  sprintId?: string | null;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  estimatePoints: number;
  dueDate?: Date | null;
  assigneeId?: string | null;
  createdById: string;
  blockedReason?: string | null;
  completedAt?: Date | null;
  position: number;
  createdAt: Date;
}

interface MockTaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

interface MockChecklistItem {
  id: string;
  taskId: string;
  text: string;
  done: boolean;
  position: number;
}

interface MockComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: Date;
}

interface MockTimeEntry {
  id: string;
  taskId: string;
  membershipId: string;
  minutes: number;
  note?: string | null;
  loggedAt: Date;
}

interface MockAuditLog {
  id: string;
  workspaceId: string;
  actorId: string;
  action: string;
  target: string;
  metadata?: unknown;
}

const mockDbState = {
  tasks: new Map<string, MockTask>(),
  dependencies: [] as MockTaskDependency[],
  checklistItems: new Map<string, MockChecklistItem>(),
  comments: new Map<string, MockComment>(),
  timeEntries: new Map<string, MockTimeEntry>(),
  auditLogs: [] as MockAuditLog[],
  activityLogs: [] as unknown[],
};

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; workspaceId: string } }) => {
        if (where.workspaceId === "ws_acme") {
          return { id: where.id, workspaceId: "ws_acme", name: "Test Project" };
        }
        return null;
      }),
    },
    membership: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; workspaceId: string } }) => {
        if (where.workspaceId === "ws_acme") {
          return { id: where.id, workspaceId: "ws_acme" };
        }
        return null;
      }),
    },
    task: {
      create: vi.fn(async ({ data }: { data: Omit<MockTask, "id" | "createdAt" | "position"> }) => {
        const id = `task_${Date.now()}_${Math.random()}`;
        const newTask: MockTask = {
          ...data,
          id,
          position: 0,
          createdAt: new Date(),
        };
        mockDbState.tasks.set(id, newTask);
        return newTask;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const t = mockDbState.tasks.get(where.id);
        if (!t) return null;
        const deps = mockDbState.dependencies
          .filter((d) => d.taskId === t.id)
          .map((d) => {
            const prereq = mockDbState.tasks.get(d.dependsOnTaskId);
            return {
              taskId: d.taskId,
              dependsOnTaskId: d.dependsOnTaskId,
              dependsOnTask: {
                id: d.dependsOnTaskId,
                title: prereq?.title || "Prerequisite",
                status: prereq?.status || "TODO",
              },
            };
          });

        return {
          ...t,
          project: { id: t.projectId, workspaceId: "ws_acme", name: "Test Project" },
          dependencies: deps,
        };
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockTask> }) => {
        const existing = mockDbState.tasks.get(where.id);
        if (!existing) throw new Error("Task not found");
        const updated = { ...existing, ...data };
        mockDbState.tasks.set(where.id, updated);
        return updated;
      }),
      findMany: vi.fn(async ({ where }: { where?: { assigneeId?: string } }) => {
        let list = Array.from(mockDbState.tasks.values());
        if (where?.assigneeId) {
          list = list.filter((t) => t.assigneeId === where.assigneeId);
        }
        return list.map((t) => ({
          ...t,
          project: { id: t.projectId, name: "Test Project" },
          sprint: null,
          milestone: null,
          assignee: t.assigneeId
            ? {
                id: t.assigneeId,
                role: "DEVELOPER",
                user: {
                  id: "usr_dev_1",
                  name: "Sarah Chen",
                  email: "dev@waypoint.dev",
                  image: null,
                },
              }
            : null,
          labels: [],
          checklist: [],
          dependencies: [],
          _count: { comments: 0, attachments: 0, timeEntries: 0 },
        }));
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        mockDbState.tasks.delete(where.id);
        return { id: where.id };
      }),
    },
    taskDependency: {
      findMany: vi.fn(async () => mockDbState.dependencies),
      create: vi.fn(async ({ data }: { data: MockTaskDependency }) => {
        mockDbState.dependencies.push(data);
        return data;
      }),
    },
    checklistItem: {
      count: vi.fn(async () => mockDbState.checklistItems.size),
      create: vi.fn(async ({ data }: { data: Omit<MockChecklistItem, "id"> }) => {
        const id = `chk_${Date.now()}`;
        const item: MockChecklistItem = { ...data, id, done: false };
        mockDbState.checklistItems.set(id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const item = mockDbState.checklistItems.get(where.id);
        if (!item) return null;
        const task = mockDbState.tasks.get(item.taskId);
        return {
          ...item,
          task: { ...task, project: { workspaceId: "ws_acme" } },
        };
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<MockChecklistItem> }) => {
          const item = mockDbState.checklistItems.get(where.id);
          if (!item) throw new Error("Checklist item not found");
          const updated = { ...item, ...data };
          mockDbState.checklistItems.set(where.id, updated);
          return updated;
        },
      ),
    },
    comment: {
      create: vi.fn(async ({ data }: { data: Omit<MockComment, "id" | "createdAt"> }) => {
        const id = `cmt_${Date.now()}`;
        const cmt: MockComment = { ...data, id, createdAt: new Date() };
        mockDbState.comments.set(id, cmt);
        return { ...cmt, author: { user: currentMockUser } };
      }),
    },
    timeEntry: {
      create: vi.fn(async ({ data }: { data: Omit<MockTimeEntry, "id"> }) => {
        const id = `time_${Date.now()}`;
        const entry: MockTimeEntry = { ...data, id };
        mockDbState.timeEntries.set(id, entry);
        return { ...entry, membership: { user: currentMockUser } };
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: Omit<MockAuditLog, "id"> }) => {
        const log: MockAuditLog = { ...data, id: `audit_${Date.now()}` };
        mockDbState.auditLogs.push(log);
        return log;
      }),
    },
    activityLog: {
      create: vi.fn(async ({ data }: { data: unknown }) => {
        mockDbState.activityLogs.push(data);
        return data;
      }),
    },
    taskLabel: {
      create: vi.fn(async () => ({})),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => {
      return Promise.all(ops);
    }),
  },
}));

describe("Phase 3: Core Tasks & RBAC", () => {
  beforeEach(() => {
    mockDbState.tasks.clear();
    mockDbState.dependencies = [];
    mockDbState.checklistItems.clear();
    mockDbState.comments.clear();
    mockDbState.timeEntries.clear();
    mockDbState.auditLogs = [];
    mockDbState.activityLogs = [];

    currentMockUser = {
      id: "usr_admin",
      email: "admin@waypoint.dev",
      name: "Alex Rivera",
    };
    currentMockMembership = {
      id: "mem_admin_1",
      role: "ADMIN",
      userId: "usr_admin",
      workspaceId: "ws_acme",
    };
  });

  it("Admin can create a task and assign it to a developer", async () => {
    const res = await createTaskAction({
      projectId: "proj_1",
      title: "Implement Auth Gateway",
      priority: Priority.HIGH,
      estimatePoints: 5,
      assigneeId: "mem_dev_1",
    });

    expect(res.error).toBeNull();
    expect(res.task).toBeDefined();
    expect(res.task?.title).toBe("Implement Auth Gateway");
    expect(res.task?.assigneeId).toBe("mem_dev_1");
    expect(res.task?.status).toBe(TaskStatus.TODO);
  });

  it("Phase 3 Acceptance Criterion: Developer can update ONLY their own tasks' status and CANNOT delete", async () => {
    // 1. Create a task assigned to dev_1
    const taskRes1 = await createTaskAction({
      projectId: "proj_1",
      title: "Dev 1 Task",
      assigneeId: "mem_dev_1",
    });
    const devTaskId = taskRes1.task!.id;

    // 2. Create another task assigned to dev_2
    const taskRes2 = await createTaskAction({
      projectId: "proj_1",
      title: "Dev 2 Task",
      assigneeId: "mem_dev_2",
    });
    const otherTaskId = taskRes2.task!.id;

    // Switch session to Developer 1
    currentMockUser = {
      id: "usr_dev_1",
      email: "sarah@waypoint.dev",
      name: "Sarah Chen",
    };
    currentMockMembership = {
      id: "mem_dev_1",
      role: "DEVELOPER",
      userId: "usr_dev_1",
      workspaceId: "ws_acme",
    };

    // A: Developer CAN update own task status to IN_PROGRESS
    const updateOwnRes = await updateTaskStatusAction({
      id: devTaskId,
      status: TaskStatus.IN_PROGRESS,
    });
    expect(updateOwnRes.error).toBeNull();
    expect(updateOwnRes.task?.status).toBe(TaskStatus.IN_PROGRESS);

    // B: Developer CANNOT update someone else's task status
    await expect(
      updateTaskStatusAction({
        id: otherTaskId,
        status: TaskStatus.IN_PROGRESS,
      }),
    ).rejects.toThrow(AuthorizationError);

    // C: Developer CANNOT delete own task
    await expect(deleteTaskAction(devTaskId)).rejects.toThrow(AuthorizationError);

    // D: Developer CANNOT delete someone else's task
    await expect(deleteTaskAction(otherTaskId)).rejects.toThrow(AuthorizationError);
  });

  it("Admin can delete any task, and deletion is recorded in AuditLog", async () => {
    const taskRes = await createTaskAction({
      projectId: "proj_1",
      title: "Task to be Deleted",
      assigneeId: "mem_dev_1",
    });
    const taskId = taskRes.task!.id;

    const delRes = await deleteTaskAction(taskId);
    expect(delRes.error).toBeNull();
    expect(delRes.success).toBe(true);
    expect(mockDbState.tasks.has(taskId)).toBe(false);

    // Verify audit log
    const audit = mockDbState.auditLogs.find((l) => l.action === "TASK_DELETED");
    expect(audit).toBeDefined();
    expect(audit?.target).toBe("Task to be Deleted");
  });

  it("requires a short reason when marking status as BLOCKED, and clears it when unblocked", async () => {
    const taskRes = await createTaskAction({
      projectId: "proj_1",
      title: "Blocked Task Flow",
      assigneeId: "mem_dev_1",
    });
    const taskId = taskRes.task!.id;

    // A: Fail when reason is missing
    const failRes = await updateTaskStatusAction({
      id: taskId,
      status: TaskStatus.BLOCKED,
      blockedReason: "",
    });
    expect(failRes.error).toContain("reason is required");

    // B: Succeed when reason is provided
    const blockRes = await updateTaskStatusAction({
      id: taskId,
      status: TaskStatus.BLOCKED,
      blockedReason: "Waiting on upstream database migration PR #104",
    });
    expect(blockRes.error).toBeNull();
    expect(blockRes.task?.status).toBe(TaskStatus.BLOCKED);
    expect(blockRes.task?.blockedReason).toBe("Waiting on upstream database migration PR #104");

    // C: Moving to IN_PROGRESS clears blocked reason
    const unblockRes = await updateTaskStatusAction({
      id: taskId,
      status: TaskStatus.IN_PROGRESS,
    });
    expect(unblockRes.error).toBeNull();
    expect(unblockRes.task?.status).toBe(TaskStatus.IN_PROGRESS);
    expect(unblockRes.task?.blockedReason).toBeNull();
  });

  it("enforces dependency prerequisites: task cannot start (IN_PROGRESS) while dependency is not DONE", async () => {
    // Task A (prerequisite)
    const taskA = await createTaskAction({
      projectId: "proj_1",
      title: "Prerequisite Database Setup",
      assigneeId: "mem_dev_1",
    });
    // Task B (dependent)
    const taskB = await createTaskAction({
      projectId: "proj_1",
      title: "Dependent API Route",
      assigneeId: "mem_dev_1",
    });

    // Add dependency: Task B depends on Task A
    const depRes = await addDependencyAction({
      taskId: taskB.task!.id,
      dependsOnTaskId: taskA.task!.id,
    });
    expect(depRes.error).toBeNull();

    // Attempt to start Task B while Task A is TODO
    const startFail = await updateTaskStatusAction({
      id: taskB.task!.id,
      status: TaskStatus.IN_PROGRESS,
    });
    expect(startFail.error).toContain("Unresolved prerequisite task(s)");
    expect(startFail.error).toContain("Prerequisite Database Setup");

    // Complete Task A (mark DONE)
    await updateTaskStatusAction({
      id: taskA.task!.id,
      status: TaskStatus.DONE,
    });

    // Now Task B can start
    const startSuccess = await updateTaskStatusAction({
      id: taskB.task!.id,
      status: TaskStatus.IN_PROGRESS,
    });
    expect(startSuccess.error).toBeNull();
    expect(startSuccess.task?.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it("prevents circular dependencies between tasks", async () => {
    const taskA = await createTaskAction({ projectId: "proj_1", title: "Task A" });
    const taskB = await createTaskAction({ projectId: "proj_1", title: "Task B" });

    // A requires B
    const dep1 = await addDependencyAction({
      taskId: taskA.task!.id,
      dependsOnTaskId: taskB.task!.id,
    });
    expect(dep1.error).toBeNull();

    // Attempt B requires A -> Circular!
    const dep2 = await addDependencyAction({
      taskId: taskB.task!.id,
      dependsOnTaskId: taskA.task!.id,
    });
    expect(dep2.error).toContain("circular dependency deadlock");
  });

  it("supports subtasks checklist, comments with mentions, and time logging", async () => {
    const taskRes = await createTaskAction({
      projectId: "proj_1",
      title: "Comprehensive Features Task",
      assigneeId: "mem_dev_1",
    });
    const taskId = taskRes.task!.id;

    // Subtasks / Checklist
    const chk = await addChecklistItemAction({
      taskId,
      text: "Write unit tests",
    });
    expect(chk.error).toBeNull();
    expect(chk.item?.text).toBe("Write unit tests");

    const toggled = await toggleChecklistItemAction({
      id: chk.item!.id,
      done: true,
    });
    expect(toggled.error).toBeNull();
    expect(toggled.item?.done).toBe(true);

    // Comments
    const cmt = await addCommentAction({
      taskId,
      body: "cc @Alex Rivera - ready for review",
    });
    expect(cmt.error).toBeNull();
    expect(cmt.comment?.body).toContain("@Alex Rivera");

    // Time logging
    const timeRes = await logTimeAction({
      taskId,
      minutes: 90,
      note: "Investigated latency query plans",
    });
    expect(timeRes.error).toBeNull();
    expect(timeRes.entry?.minutes).toBe(90);
  });

  it("supports moveTaskAction with position, status change, and blockedReason validation", async () => {
    const taskRes = await createTaskAction({
      projectId: "proj_1",
      title: "Kanban Task Move",
      assigneeId: "mem_dev_1",
    });
    const taskId = taskRes.task!.id;

    // Moving to BLOCKED without reason should fail
    const blockedFail = await moveTaskAction({
      taskId,
      newStatus: TaskStatus.BLOCKED,
      newPosition: 1,
      blockedReason: "",
    });
    expect(blockedFail.error).toContain("reason is required");

    // Moving to BLOCKED with reason should succeed
    const blockedOk = await moveTaskAction({
      taskId,
      newStatus: TaskStatus.BLOCKED,
      newPosition: 1,
      blockedReason: "Waiting on upstream auth token",
    });
    expect(blockedOk.error).toBeNull();
    expect(blockedOk.task?.status).toBe(TaskStatus.BLOCKED);
    expect(blockedOk.task?.position).toBe(1);
    expect(blockedOk.task?.blockedReason).toBe("Waiting on upstream auth token");
  });

  it("returns My Tasks with personal metrics for the logged-in member", async () => {
    // Admin creates tasks assigned to dev_1
    await createTaskAction({
      projectId: "proj_1",
      title: "Dev Assigned Task 1",
      assigneeId: "mem_dev_1",
    });
    await createTaskAction({
      projectId: "proj_1",
      title: "Dev Assigned Task 2",
      assigneeId: "mem_dev_1",
    });

    // Switch to dev_1
    currentMockUser = {
      id: "usr_dev_1",
      email: "dev@waypoint.dev",
      name: "Sarah Chen",
    };
    currentMockMembership = {
      id: "mem_dev_1",
      role: "DEVELOPER",
      userId: "usr_dev_1",
      workspaceId: "ws_acme",
    };

    const myTasksRes = await getMyTasksAction();
    expect(myTasksRes.error).toBeNull();
    expect(myTasksRes.tasks.length).toBeGreaterThanOrEqual(2);
    expect(myTasksRes.metrics).toBeDefined();
    expect(myTasksRes.metrics?.totalAssigned).toBeGreaterThanOrEqual(2);
  });
});
