"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { wouldCreateCycle, checkPrerequisitesForInProgress } from "./dependencies";
import { rankTaskAssignmentCandidates, CandidateMember } from "./smart-assignment";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createChecklistItemSchema,
  createCommentSchema,
  createAttachmentSchema,
  createTimeEntrySchema,
  taskDependencySchema,
  moveTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type UpdateTaskStatusInput,
  type MoveTaskInput,
  type CreateChecklistItemInput,
  type CreateCommentInput,
  type CreateAttachmentInput,
  type CreateTimeEntryInput,
  type TaskDependencyInput,
} from "./schemas";
import { TaskStatus } from "@/types/enums";
import { recordTaskCompletionScore, recordTaskReopeningReversal } from "@/features/scoring/actions";

/**
 * Get all tasks for the active workspace, with optional filtering.
 */
export async function getTasksAction(filters?: {
  projectId?: string;
  sprintId?: string;
  assigneeId?: string;
  status?: TaskStatus;
}) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "No active workspace found", tasks: [] };
  }

  assertCan(membership, "view:tasks");

  const whereClause: Record<string, unknown> = {
    project: {
      workspaceId: workspace.id,
    },
  };

  if (filters?.projectId) whereClause.projectId = filters.projectId;
  if (filters?.sprintId) whereClause.sprintId = filters.sprintId;
  if (filters?.assigneeId) whereClause.assigneeId = filters.assigneeId;
  if (filters?.status) whereClause.status = filters.status;

  try {
    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true, status: true } },
        milestone: { select: { id: true, name: true, dueDate: true } },
        assignee: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        labels: {
          include: { label: true },
        },
        checklist: {
          select: { id: true, done: true },
        },
        dependencies: {
          select: { dependsOnTaskId: true },
        },
        _count: {
          select: { comments: true, attachments: true, timeEntries: true },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });

    const formatted = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      estimatePoints: t.estimatePoints,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      position: t.position,
      blockedReason: t.blockedReason,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      project: t.project,
      sprint: t.sprint,
      milestone: t.milestone
        ? {
            ...t.milestone,
            dueDate: t.milestone.dueDate ? t.milestone.dueDate.toISOString() : null,
          }
        : null,
      assignee: t.assignee
        ? {
            id: t.assignee.id,
            role: t.assignee.role,
            name: t.assignee.user.name || "Member",
            email: t.assignee.user.email,
            image: t.assignee.user.image,
          }
        : null,
      labels: t.labels.map((l) => l.label),
      checklistTotal: t.checklist.length,
      checklistDone: t.checklist.filter((c) => c.done).length,
      dependenciesCount: t.dependencies.length,
      commentsCount: t._count.comments,
      attachmentsCount: t._count.attachments,
      timeEntriesCount: t._count.timeEntries,
    }));

    return { tasks: formatted, error: null };
  } catch {
    return { tasks: [], error: null };
  }
}

/**
 * Get full task detail for drawer/page.
 */
export async function getTaskDetailAction(taskId: string) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "No active workspace found", task: null };
  }

  assertCan(membership, "view:tasks");

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, name: true, workspaceId: true } },
      sprint: { select: { id: true, name: true, status: true } },
      milestone: { select: { id: true, name: true, dueDate: true } },
      createdBy: { select: { id: true, name: true, email: true, image: true } },
      assignee: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      labels: {
        include: { label: true },
      },
      checklist: {
        orderBy: { position: "asc" },
      },
      dependencies: {
        include: {
          dependsOnTask: {
            select: { id: true, title: true, status: true, priority: true },
          },
        },
      },
      dependents: {
        include: {
          task: {
            select: { id: true, title: true, status: true, priority: true },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
      },
      timeEntries: {
        include: {
          membership: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
        orderBy: { loggedAt: "desc" },
      },
      comments: {
        include: {
          author: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      activityLogs: {
        include: {
          actor: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found", task: null };
  }

  const totalMinutesLogged = task.timeEntries.reduce((sum, entry) => sum + entry.minutes, 0);

  return {
    task: {
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      totalMinutesLogged,
      totalHoursLogged: (totalMinutesLogged / 60).toFixed(1),
      milestone: task.milestone
        ? {
            ...task.milestone,
            dueDate: task.milestone.dueDate ? task.milestone.dueDate.toISOString() : null,
          }
        : null,
      attachments: task.attachments.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      timeEntries: task.timeEntries.map((e) => ({
        ...e,
        loggedAt: e.loggedAt.toISOString(),
      })),
      comments: task.comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      activityLogs: task.activityLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
    },
    error: null,
  };
}

/**
 * Create a new task.
 */
export async function createTaskAction(input: CreateTaskInput) {
  const { workspace, membership, user } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership || !user) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "create:tasks", {
    type: "workspace",
    workspace: { allowDeveloperCreateTasks: workspace.allowDeveloperCreateTasks },
  });

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid task input" };
  }

  const project = await db.project.findFirst({
    where: { id: parsed.data.projectId, workspaceId: workspace.id },
  });

  if (!project) {
    return { error: "Project not found in this workspace" };
  }

  // If assignee provided, verify membership is in workspace
  if (parsed.data.assigneeId) {
    const assignee = await db.membership.findFirst({
      where: { id: parsed.data.assigneeId, workspaceId: workspace.id },
    });
    if (!assignee) {
      return { error: "Assignee not found in this workspace" };
    }
  }

  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  const task = await db.task.create({
    data: {
      projectId: project.id,
      sprintId: parsed.data.sprintId || null,
      milestoneId: parsed.data.milestoneId || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      estimatePoints: parsed.data.estimatePoints,
      dueDate,
      assigneeId: parsed.data.assigneeId || null,
      createdById: user.id,
      activityLogs: {
        create: {
          actorId: membership.id,
          action: "TASK_CREATED",
          toValue: parsed.data.title,
        },
      },
    },
  });

  // Attach labels if provided
  if (parsed.data.labelIds && parsed.data.labelIds.length > 0) {
    for (const labelId of parsed.data.labelIds) {
      await db.taskLabel.create({
        data: {
          taskId: task.id,
          labelId,
        },
      });
    }
  }

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/board");
  revalidatePath("/my-tasks");
  return { task, error: null };
}

/**
 * Update task attributes.
 */
export async function updateTaskAction(input: UpdateTaskInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const task = await db.task.findUnique({
    where: { id: parsed.data.id },
    include: { project: true },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found" };
  }

  // RBAC checks
  // 1. General edit permission check
  assertCan(membership, "edit:task", {
    type: "task",
    task: { id: task.id, assigneeId: task.assigneeId, createdById: task.createdById },
  });

  // 2. Developer can only edit description/checklist on own assigned tasks.
  // Assignment, estimates, priority, dueDate are Admin only.
  if (membership.role === "DEVELOPER") {
    if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== task.assigneeId) {
      return { error: "Only Admins can reassign tasks" };
    }
    if (
      parsed.data.estimatePoints !== undefined &&
      parsed.data.estimatePoints !== task.estimatePoints
    ) {
      return { error: "Only Admins can change task estimate points" };
    }
    if (parsed.data.priority !== undefined && parsed.data.priority !== task.priority) {
      return { error: "Only Admins can change task priority" };
    }
  }

  // If reassigning, verify new assignee belongs to workspace
  if (parsed.data.assigneeId && parsed.data.assigneeId !== task.assigneeId) {
    assertCan(membership, "assign:tasks");
    const newAssignee = await db.membership.findFirst({
      where: { id: parsed.data.assigneeId, workspaceId: workspace.id },
    });
    if (!newAssignee) {
      return { error: "New assignee not found in this workspace" };
    }
  }

  const dueDate =
    parsed.data.dueDate !== undefined
      ? parsed.data.dueDate
        ? new Date(parsed.data.dueDate)
        : null
      : undefined;

  // Build activity logs for changes
  const activityLogsToCreate: { action: string; fromValue?: string; toValue?: string }[] = [];
  if (parsed.data.title && parsed.data.title !== task.title) {
    activityLogsToCreate.push({
      action: "TITLE_CHANGED",
      fromValue: task.title,
      toValue: parsed.data.title,
    });
  }
  if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== task.assigneeId) {
    activityLogsToCreate.push({
      action: "ASSIGNEE_CHANGED",
      fromValue: task.assigneeId || "Unassigned",
      toValue: parsed.data.assigneeId || "Unassigned",
    });
  }
  if (parsed.data.priority && parsed.data.priority !== task.priority) {
    activityLogsToCreate.push({
      action: "PRIORITY_CHANGED",
      fromValue: task.priority,
      toValue: parsed.data.priority,
    });
  }
  if (parsed.data.estimatePoints && parsed.data.estimatePoints !== task.estimatePoints) {
    activityLogsToCreate.push({
      action: "ESTIMATE_CHANGED",
      fromValue: `${task.estimatePoints} pts`,
      toValue: `${parsed.data.estimatePoints} pts`,
    });
  }

  const updated = await db.task.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      estimatePoints: parsed.data.estimatePoints,
      dueDate,
      assigneeId: parsed.data.assigneeId,
      sprintId: parsed.data.sprintId,
      milestoneId: parsed.data.milestoneId,
      activityLogs: {
        create: activityLogsToCreate.map((log) => ({
          actorId: membership.id,
          action: log.action,
          fromValue: log.fromValue,
          toValue: log.toValue,
        })),
      },
    },
  });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/board");
  return { task: updated, error: null };
}

/**
 * Update task status (enforces RBAC + BLOCKED reason + dependency prerequisite completion).
 */
export async function updateTaskStatusAction(input: UpdateTaskStatusInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid status transition" };
  }

  const task = await db.task.findUnique({
    where: { id: parsed.data.id },
    include: {
      project: true,
      dependencies: {
        include: {
          dependsOnTask: {
            select: { id: true, title: true, status: true },
          },
        },
      },
    },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found" };
  }

  // RBAC check: Developer can only update own assigned tasks
  assertCan(membership, "update_status:task", {
    type: "task",
    task: { id: task.id, assigneeId: task.assigneeId, createdById: task.createdById },
  });

  const nextStatus = parsed.data.status;
  const currentStatus = task.status;

  if (nextStatus === currentStatus) {
    return { task, error: null };
  }

  // If transitioning to IN_PROGRESS, check dependency prerequisites
  if (nextStatus === TaskStatus.IN_PROGRESS) {
    const prerequisites = task.dependencies.map((d) => d.dependsOnTask);
    const check = checkPrerequisitesForInProgress(prerequisites);
    if (!check.canStart) {
      return { error: check.message || "Prerequisite tasks must be marked DONE first." };
    }
  }

  // Handle completion timestamp
  let completedAt = task.completedAt;
  if (nextStatus === TaskStatus.DONE) {
    completedAt = new Date();
  } else if (currentStatus === TaskStatus.DONE) {
    completedAt = null;
  }

  // Handle blocked reason
  const blockedReason =
    nextStatus === TaskStatus.BLOCKED ? parsed.data.blockedReason || null : null;

  const updated = await db.task.update({
    where: { id: task.id },
    data: {
      status: nextStatus,
      blockedReason,
      completedAt,
      activityLogs: {
        create: {
          actorId: membership.id,
          action: "STATUS_CHANGED",
          fromValue: currentStatus,
          toValue: nextStatus,
        },
      },
    },
  });

  if (nextStatus === TaskStatus.DONE) {
    await recordTaskCompletionScore(task.id);
  } else if (currentStatus === TaskStatus.DONE) {
    await recordTaskReopeningReversal(task.id);
  }

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/board");
  revalidatePath("/my-tasks");
  return { task: updated, error: null };
}

/**
 * Move a task (Kanban drag-and-drop: updates status and/or position, validates RBAC, blocked reason, and dependencies).
 */
export async function moveTaskAction(input: MoveTaskInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid move task payload" };
  }

  const task = await db.task.findUnique({
    where: { id: parsed.data.taskId },
    include: {
      project: true,
      dependencies: {
        include: {
          dependsOnTask: {
            select: { id: true, title: true, status: true },
          },
        },
      },
    },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found" };
  }

  const nextStatus = parsed.data.newStatus;
  const currentStatus = task.status;
  const nextPosition = parsed.data.newPosition;

  // If status changes, RBAC and prerequisites check
  let completedAt = task.completedAt;
  let blockedReason = task.blockedReason;
  const statusChanged = nextStatus !== currentStatus;

  if (statusChanged) {
    // RBAC check: Developer can only update own assigned tasks
    assertCan(membership, "update_status:task", {
      type: "task",
      task: { id: task.id, assigneeId: task.assigneeId, createdById: task.createdById },
    });

    // Check prerequisites if moving to IN_PROGRESS
    if (nextStatus === TaskStatus.IN_PROGRESS) {
      const prerequisites = task.dependencies.map((d) => d.dependsOnTask);
      const check = checkPrerequisitesForInProgress(prerequisites);
      if (!check.canStart) {
        return { error: check.message || "Prerequisite tasks must be marked DONE first." };
      }
    }

    if (nextStatus === TaskStatus.DONE) {
      completedAt = new Date();
    } else if (currentStatus === TaskStatus.DONE) {
      completedAt = null;
    }

    blockedReason = nextStatus === TaskStatus.BLOCKED ? parsed.data.blockedReason || null : null;
  }

  const updated = await db.task.update({
    where: { id: task.id },
    data: {
      status: nextStatus,
      position: nextPosition,
      blockedReason,
      completedAt,
      ...(statusChanged
        ? {
            activityLogs: {
              create: {
                actorId: membership.id,
                action: "STATUS_CHANGED",
                fromValue: currentStatus,
                toValue: nextStatus,
              },
            },
          }
        : {}),
    },
  });

  if (nextStatus === TaskStatus.DONE) {
    await recordTaskCompletionScore(task.id);
  } else if (currentStatus === TaskStatus.DONE) {
    await recordTaskReopeningReversal(task.id);
  }

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/board");
  revalidatePath("/my-tasks");
  return { task: updated, error: null };
}

/**
 * Get tasks assigned to the current user with personal summary metrics (Developer Home / My Tasks).
 */
export async function getMyTasksAction() {
  const { workspace, membership, user } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership || !user) {
    return { error: "Authentication and active workspace required", tasks: [], metrics: null };
  }

  assertCan(membership, "view:tasks");

  const tasks = await db.task.findMany({
    where: {
      project: { workspaceId: workspace.id },
      assigneeId: membership.id,
    },
    include: {
      project: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true, status: true } },
      milestone: { select: { id: true, name: true, dueDate: true } },
      assignee: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      labels: {
        include: { label: true },
      },
      checklist: {
        select: { id: true, done: true },
      },
      dependencies: {
        select: { dependsOnTaskId: true },
      },
      _count: {
        select: { comments: true, attachments: true, timeEntries: true },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { position: "asc" }],
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const formatted = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    estimatePoints: t.estimatePoints,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    position: t.position,
    blockedReason: t.blockedReason,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    project: t.project,
    sprint: t.sprint,
    milestone: t.milestone
      ? {
          ...t.milestone,
          dueDate: t.milestone.dueDate ? t.milestone.dueDate.toISOString() : null,
        }
      : null,
    assignee: t.assignee
      ? {
          id: t.assignee.id,
          role: t.assignee.role,
          name: t.assignee.user.name || "Member",
          email: t.assignee.user.email,
          image: t.assignee.user.image,
        }
      : null,
    labels: t.labels.map((l) => l.label),
    checklistTotal: t.checklist.length,
    checklistDone: t.checklist.filter((c) => c.done).length,
    dependenciesCount: t.dependencies.length,
    commentsCount: t._count.comments,
    attachmentsCount: t._count.attachments,
    timeEntriesCount: t._count.timeEntries,
  }));

  const metrics = {
    totalAssigned: tasks.length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
    inReview: tasks.filter((t) => t.status === TaskStatus.IN_REVIEW).length,
    blocked: tasks.filter((t) => t.status === TaskStatus.BLOCKED).length,
    done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
    overdue: tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== TaskStatus.DONE)
      .length,
    completedThisMonth: tasks.filter(
      (t) => t.status === TaskStatus.DONE && t.completedAt && t.completedAt >= startOfMonth,
    ).length,
  };

  return { tasks: formatted, metrics, error: null };
}

/**
 * Delete a task (Admin only, with audit log).
 */
export async function deleteTaskAction(taskId: string) {
  const { workspace, membership, user } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership || !user) {
    return { error: "Authentication required" };
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found" };
  }

  // RBAC check: Admin only
  assertCan(membership, "delete:task", {
    type: "task",
    task: { id: task.id, assigneeId: task.assigneeId, createdById: task.createdById },
  });

  await db.$transaction([
    db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: membership.id,
        action: "TASK_DELETED",
        target: task.title,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          estimatePoints: task.estimatePoints,
        },
      },
    }),
    db.task.delete({
      where: { id: taskId },
    }),
  ]);

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/board");
  revalidatePath("/my-tasks");
  return { success: true, error: null };
}

/**
 * Add a task dependency with cycle prevention.
 */
export async function addDependencyAction(input: TaskDependencyInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const parsed = taskDependencySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid dependency input" };
  }

  const { taskId, dependsOnTaskId } = parsed.data;
  if (taskId === dependsOnTaskId) {
    return { error: "A task cannot depend on itself." };
  }

  // Load both tasks to ensure they exist and belong to the workspace
  const [task, prerequisite] = await Promise.all([
    db.task.findUnique({ where: { id: taskId }, include: { project: true } }),
    db.task.findUnique({ where: { id: dependsOnTaskId }, include: { project: true } }),
  ]);

  if (
    !task ||
    !prerequisite ||
    task.project.workspaceId !== workspace.id ||
    prerequisite.project.workspaceId !== workspace.id
  ) {
    return { error: "One or both tasks were not found in this workspace." };
  }

  // Load all existing dependencies across the workspace to run cycle detection
  const allWorkspaceEdges = await db.taskDependency.findMany({
    where: {
      task: { project: { workspaceId: workspace.id } },
    },
    select: { taskId: true, dependsOnTaskId: true },
  });

  if (wouldCreateCycle(allWorkspaceEdges, { taskId, dependsOnTaskId })) {
    return {
      error:
        "Cannot add dependency: This would create a circular dependency deadlock in the project.",
    };
  }

  // Create dependency
  await db.$transaction([
    db.taskDependency.create({
      data: { taskId, dependsOnTaskId },
    }),
    db.activityLog.create({
      data: {
        taskId,
        actorId: membership.id,
        action: "DEPENDENCY_ADDED",
        toValue: prerequisite.title,
      },
    }),
  ]);

  revalidatePath(`/projects/${task.projectId}`);
  return { success: true, error: null };
}

/**
 * Remove a dependency.
 */
export async function removeDependencyAction(input: TaskDependencyInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const parsed = taskDependencySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid dependency input" };
  }

  const { taskId, dependsOnTaskId } = parsed.data;

  const existing = await db.taskDependency.findUnique({
    where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
    include: { task: { include: { project: true } } },
  });

  if (!existing || existing.task.project.workspaceId !== workspace.id) {
    return { error: "Dependency not found" };
  }

  await db.taskDependency.delete({
    where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
  });

  revalidatePath(`/projects/${existing.task.projectId}`);
  return { success: true, error: null };
}

/**
 * Checklist operations (Subtasks)
 */
export async function addChecklistItemAction(input: CreateChecklistItemInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const parsed = createChecklistItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid checklist item" };
  }

  const task = await db.task.findUnique({
    where: { id: parsed.data.taskId },
    include: { project: true },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found" };
  }

  // Permission: Admin, or assigned Developer
  if (membership.role === "DEVELOPER" && task.assigneeId !== membership.id) {
    return { error: "Only the assigned developer or an Admin can modify subtasks" };
  }

  const count = await db.checklistItem.count({ where: { taskId: task.id } });

  const item = await db.checklistItem.create({
    data: {
      taskId: task.id,
      text: parsed.data.text,
      position: count,
    },
  });

  return { item, error: null };
}

export async function toggleChecklistItemAction(input: { id: string; done: boolean }) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const item = await db.checklistItem.findUnique({
    where: { id: input.id },
    include: { task: { include: { project: true } } },
  });

  if (!item || item.task.project.workspaceId !== workspace.id) {
    return { error: "Checklist item not found" };
  }

  // Permission: Admin or assigned Developer
  if (membership.role === "DEVELOPER" && item.task.assigneeId !== membership.id) {
    return { error: "Only the assigned developer or an Admin can modify subtasks" };
  }

  const updated = await db.checklistItem.update({
    where: { id: input.id },
    data: { done: input.done },
  });

  return { item: updated, error: null };
}

export async function deleteChecklistItemAction(id: string) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const item = await db.checklistItem.findUnique({
    where: { id },
    include: { task: { include: { project: true } } },
  });

  if (!item || item.task.project.workspaceId !== workspace.id) {
    return { error: "Checklist item not found" };
  }

  if (membership.role === "DEVELOPER" && item.task.assigneeId !== membership.id) {
    return { error: "Only the assigned developer or an Admin can delete subtasks" };
  }

  await db.checklistItem.delete({ where: { id } });
  return { success: true, error: null };
}

/**
 * Comments with @mentions
 */
export async function addCommentAction(input: CreateCommentInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "create:comments");

  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid comment" };
  }

  const task = await db.task.findUnique({
    where: { id: parsed.data.taskId },
    include: { project: true },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found" };
  }

  const comment = await db.comment.create({
    data: {
      taskId: task.id,
      authorId: membership.id,
      body: parsed.data.body,
    },
    include: {
      author: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  await db.activityLog.create({
    data: {
      taskId: task.id,
      actorId: membership.id,
      action: "COMMENT_ADDED",
      toValue: parsed.data.body.slice(0, 100),
    },
  });

  return { comment, error: null };
}

/**
 * Attachments & Links
 */
export async function addAttachmentAction(input: CreateAttachmentInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const parsed = createAttachmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid attachment" };
  }

  const task = await db.task.findUnique({
    where: { id: parsed.data.taskId },
    include: { project: true },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found" };
  }

  const attachment = await db.attachment.create({
    data: {
      taskId: task.id,
      name: parsed.data.name,
      url: parsed.data.url,
      type: parsed.data.type,
    },
  });

  await db.activityLog.create({
    data: {
      taskId: task.id,
      actorId: membership.id,
      action: "ATTACHMENT_ADDED",
      toValue: parsed.data.name,
    },
  });

  return { attachment, error: null };
}

export async function deleteAttachmentAction(attachmentId: string) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
    include: { task: { include: { project: true } } },
  });

  if (!attachment || attachment.task.project.workspaceId !== workspace.id) {
    return { error: "Attachment not found" };
  }

  await db.attachment.delete({ where: { id: attachmentId } });
  return { success: true, error: null };
}

/**
 * Time Logging
 */
export async function logTimeAction(input: CreateTimeEntryInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  const parsed = createTimeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid time entry" };
  }

  const task = await db.task.findUnique({
    where: { id: parsed.data.taskId },
    include: { project: true },
  });

  if (!task || task.project.workspaceId !== workspace.id) {
    return { error: "Task not found" };
  }

  assertCan(membership, "log_time", {
    type: "task",
    task: { id: task.id, assigneeId: task.assigneeId, createdById: task.createdById },
  });

  const loggedAt = parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : new Date();

  const entry = await db.timeEntry.create({
    data: {
      taskId: task.id,
      membershipId: membership.id,
      minutes: parsed.data.minutes,
      note: parsed.data.note,
      loggedAt,
    },
    include: {
      membership: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  await db.activityLog.create({
    data: {
      taskId: task.id,
      actorId: membership.id,
      action: "TIME_LOGGED",
      toValue: `${(parsed.data.minutes / 60).toFixed(1)}h logged`,
    },
  });

  return { entry, error: null };
}

/**
 * Smart Assignment Suggestions for a task.
 */
export async function getSmartSuggestionsAction(params: {
  estimatePoints?: number;
  labels?: string[];
}) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required", suggestions: [] };
  }

  // Retrieve all eligible developers in the workspace
  const members = await db.membership.findMany({
    where: {
      workspaceId: workspace.id,
      role: { in: ["DEVELOPER", "ADMIN"] },
      availability: { not: "ON_LEAVE" },
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      memberSkills: {
        include: { skill: true },
      },
      assignedTasks: {
        where: {
          status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] },
        },
        select: { estimatePoints: true },
      },
    },
  });

  // Calculate 90 days ago cutoff for on-time track record
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const completedHistory = await db.task.findMany({
    where: {
      project: { workspaceId: workspace.id },
      assigneeId: { in: members.map((m) => m.id) },
      status: "DONE",
      completedAt: { gte: ninetyDaysAgo },
    },
    select: {
      assigneeId: true,
      dueDate: true,
      completedAt: true,
    },
  });

  const candidates: CandidateMember[] = members.map((m) => {
    const openEstimatePoints = m.assignedTasks.reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
    const history = completedHistory.filter((h) => h.assigneeId === m.id);

    return {
      id: m.id,
      name: m.user.name || m.user.email.split("@")[0],
      email: m.user.email,
      avatarUrl: m.user.image,
      role: m.role as any,
      availability: m.availability as any,
      skills: m.memberSkills.map((ms) => ({
        name: ms.skill.name,
        level: ms.level,
      })),
      openEstimatePoints,
      completedTasksHistory: history,
    };
  });

  const suggestions = rankTaskAssignmentCandidates(
    { estimatePoints: params.estimatePoints, labels: params.labels },
    candidates,
  );

  return { suggestions, error: null };
}
