"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { TaskStatus, Priority, Role } from "@prisma/client";
import {
  bulkUpdateTasksSchema,
  reassignMemberTasksSchema,
  type BulkUpdateTasksInput,
  type ReassignMemberTasksInput,
} from "./schemas";
import { STATUS_CONFIG } from "@/components/views/types";

export interface MemberWorkload {
  membershipId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED";
  skills: { name: string; level: number }[];
  openTasksCount: number;
  openEstimatePoints: number;
  capacityLimit: number;
  capacityPercent: number;
  isOverloaded: boolean;
  tasks: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    estimatePoints: number;
    dueDate: string | null;
    projectName: string;
  }[];
}

export interface WorkloadSummary {
  totalDevelopers: number;
  totalAllocatedPoints: number;
  totalCapacityPoints: number;
  overloadedCount: number;
  onLeaveCount: number;
}

const DEFAULT_CAPACITY_LIMIT = 20;

/**
 * Get workload metrics and task allocation for all developers in the active workspace.
 */
export async function getWorkspaceWorkloadAction(): Promise<{
  members: MemberWorkload[];
  summary: WorkloadSummary | null;
  error: string | null;
}> {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { members: [], summary: null, error: "Authentication and active workspace required" };
  }

  assertCan(membership, "view:tasks");

  // Fetch scoring config for capacity limit if configured
  const scoringConfig = await db.scoringConfig.findUnique({
    where: { workspaceId: workspace.id },
  });
  const rules = scoringConfig?.rules as { capacityLimit?: number } | undefined;
  const capacityLimit = rules?.capacityLimit ?? DEFAULT_CAPACITY_LIMIT;

  // Fetch all members in workspace
  const members = await db.membership.findMany({
    where: { workspaceId: workspace.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      memberSkills: {
        include: { skill: true },
      },
      assignedTasks: {
        where: {
          project: { workspaceId: workspace.id },
          status: { not: TaskStatus.DONE },
        },
        include: {
          project: { select: { name: true } },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const memberWorkloads: MemberWorkload[] = members.map((m) => {
    const openTasks = m.assignedTasks;
    const openPoints = openTasks.reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
    const percent = Math.min(Math.round((openPoints / capacityLimit) * 100), 100);
    const isOverloaded = openPoints > capacityLimit || m.availability === "OVERLOADED";

    return {
      membershipId: m.id,
      name: m.user.name || m.user.email.split("@")[0] || "Member",
      email: m.user.email,
      avatarUrl: m.user.image,
      role: m.role,
      availability: m.availability,
      skills: m.memberSkills.map((ms) => ({
        name: ms.skill.name,
        level: ms.level,
      })),
      openTasksCount: openTasks.length,
      openEstimatePoints: openPoints,
      capacityLimit,
      capacityPercent: percent,
      isOverloaded,
      tasks: openTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        estimatePoints: t.estimatePoints,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        projectName: t.project.name,
      })),
    };
  });

  const totalDevs = memberWorkloads.filter((m) => m.role === "DEVELOPER").length;
  const totalAllocated = memberWorkloads.reduce((acc, m) => acc + m.openEstimatePoints, 0);
  const totalCapacity = totalDevs * capacityLimit;
  const overloaded = memberWorkloads.filter((m) => m.isOverloaded).length;
  const onLeave = memberWorkloads.filter((m) => m.availability === "ON_LEAVE").length;

  const summary: WorkloadSummary = {
    totalDevelopers: totalDevs,
    totalAllocatedPoints: totalAllocated,
    totalCapacityPoints: totalCapacity,
    overloadedCount: overloaded,
    onLeaveCount: onLeave,
  };

  return { members: memberWorkloads, summary, error: null };
}

/**
 * Reassign all open tasks from one member to another (e.g. member going on leave).
 */
export async function reassignMemberTasksAction(input: ReassignMemberTasksInput): Promise<{
  reallocatedCount: number;
  error: string | null;
}> {
  const { workspace, membership, user } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership || !user) {
    return { reallocatedCount: 0, error: "Authentication and active workspace required" };
  }

  assertCan(membership, "assign:tasks");

  const parsed = reassignMemberTasksSchema.safeParse(input);
  if (!parsed.success) {
    return { reallocatedCount: 0, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const [fromMember, toMember] = await Promise.all([
    db.membership.findFirst({
      where: { id: parsed.data.fromMembershipId, workspaceId: workspace.id },
      include: { user: { select: { email: true, name: true } } },
    }),
    db.membership.findFirst({
      where: { id: parsed.data.toMembershipId, workspaceId: workspace.id },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  if (!fromMember || !toMember) {
    return { reallocatedCount: 0, error: "Selected team members not found in this workspace" };
  }

  if (toMember.availability === "ON_LEAVE") {
    return { reallocatedCount: 0, error: "Cannot reassign tasks to a member currently on leave" };
  }

  // Find all open tasks belonging to fromMember in this workspace
  const openTasks = await db.task.findMany({
    where: {
      assigneeId: fromMember.id,
      project: { workspaceId: workspace.id },
      status: { not: TaskStatus.DONE },
    },
    select: { id: true, title: true },
  });

  if (openTasks.length === 0) {
    return { reallocatedCount: 0, error: null };
  }

  const taskIds = openTasks.map((t) => t.id);

  await db.$transaction([
    // Update all tasks assignee
    db.task.updateMany({
      where: { id: { in: taskIds } },
      data: { assigneeId: toMember.id },
    }),
    // Log audit log for sensitive tech lead operation
    db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: user.id,
        action: "REASSIGN_ALL_MEMBER_TASKS",
        target: fromMember.user.email,
        metadata: {
          fromMembershipId: fromMember.id,
          toMembershipId: toMember.id,
          targetName: toMember.user.name || toMember.user.email,
          taskCount: openTasks.length,
          reason: parsed.data.reason || "Member going on leave / capacity rebalancing",
        },
      },
    }),
  ]);

  revalidatePath("/workload");
  revalidatePath("/board");
  revalidatePath("/my-tasks");
  revalidatePath("/projects");
  return { reallocatedCount: openTasks.length, error: null };
}

/**
 * Bulk update multiple tasks at once (Status, Priority, Assignee, Sprint, or Delete).
 */
export async function bulkUpdateTasksAction(input: BulkUpdateTasksInput): Promise<{
  affectedCount: number;
  error: string | null;
}> {
  const { workspace, membership, user } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership || !user) {
    return { affectedCount: 0, error: "Authentication and active workspace required" };
  }

  const parsed = bulkUpdateTasksSchema.safeParse(input);
  if (!parsed.success) {
    return { affectedCount: 0, error: parsed.error.issues[0]?.message || "Invalid bulk input" };
  }

  // Find tasks belonging to current workspace
  const validTasks = await db.task.findMany({
    where: {
      id: { in: parsed.data.taskIds },
      project: { workspaceId: workspace.id },
    },
    select: { id: true, title: true, status: true, assigneeId: true, createdById: true },
  });

  if (validTasks.length === 0) {
    return { affectedCount: 0, error: "No valid tasks found for this workspace" };
  }

  const validTaskIds = validTasks.map((t) => t.id);

  // Authorize based on action
  switch (parsed.data.action) {
    case "delete": {
      assertCan(membership, "delete:task");

      await db.$transaction([
        db.task.deleteMany({
          where: { id: { in: validTaskIds } },
        }),
        db.auditLog.create({
          data: {
            workspaceId: workspace.id,
            actorId: user.id,
            action: "BULK_DELETE_TASKS",
            target: `${validTaskIds.length} tasks`,
            metadata: {
              taskIds: validTaskIds,
              deletedCount: validTaskIds.length,
            },
          },
        }),
      ]);
      break;
    }

    case "reassign": {
      assertCan(membership, "assign:tasks");

      if (parsed.data.assigneeId) {
        const targetMember = await db.membership.findFirst({
          where: { id: parsed.data.assigneeId, workspaceId: workspace.id },
        });
        if (!targetMember) {
          return { affectedCount: 0, error: "Target assignee not found in this workspace" };
        }
      }

      await db.task.updateMany({
        where: { id: { in: validTaskIds } },
        data: { assigneeId: parsed.data.assigneeId || null },
      });
      break;
    }

    case "change_status": {
      if (!parsed.data.status) {
        return { affectedCount: 0, error: "Status must be provided" };
      }

      // If developer, verify all tasks belong to them
      if (membership.role === Role.DEVELOPER) {
        const hasUnowned = validTasks.some((t) => t.assigneeId !== membership.id);
        if (hasUnowned) {
          return {
            affectedCount: 0,
            error: "Developers can only update status on their own assigned tasks",
          };
        }
      } else {
        assertCan(membership, "update_status:task");
      }

      const completedAt = parsed.data.status === TaskStatus.DONE ? new Date() : null;

      await db.task.updateMany({
        where: { id: { in: validTaskIds } },
        data: {
          status: parsed.data.status,
          completedAt,
        },
      });
      break;
    }

    case "change_priority": {
      assertCan(membership, "edit:task");
      if (!parsed.data.priority) {
        return { affectedCount: 0, error: "Priority must be provided" };
      }

      await db.task.updateMany({
        where: { id: { in: validTaskIds } },
        data: { priority: parsed.data.priority },
      });
      break;
    }

    case "assign_sprint": {
      assertCan(membership, "edit:task");

      await db.task.updateMany({
        where: { id: { in: validTaskIds } },
        data: { sprintId: parsed.data.sprintId || null },
      });
      break;
    }
  }

  revalidatePath("/board");
  revalidatePath("/projects");
  revalidatePath("/workload");
  revalidatePath("/my-tasks");
  return { affectedCount: validTaskIds.length, error: null };
}

export interface DashboardMetrics {
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  statusBreakdown: { name: string; count: number; points: number; color: string }[];
  burndown: { day: string; ideal: number; actual: number }[];
  overdueTasks: {
    id: string;
    title: string;
    priority: Priority;
    estimatePoints: number;
    dueDate: string;
    daysOverdue: number;
    assigneeName: string;
    projectName: string;
  }[];
  blockedTasks: {
    id: string;
    title: string;
    priority: Priority;
    estimatePoints: number;
    blockedReason: string | null;
    assigneeName: string;
    projectName: string;
  }[];
  upcomingDueTasks: {
    id: string;
    title: string;
    dueDate: string;
    priority: Priority;
    assigneeName: string;
    projectName: string;
  }[];
  topPerformer: {
    name: string;
    email: string;
    avatarUrl: string | null;
    completedPoints: number;
    completedTasksCount: number;
    onTimeRate: number;
  } | null;
}

/**
 * Get comprehensive tech lead project dashboard data (completion, burndown, status breakdown, alerts, top performer).
 */
export async function getProjectDashboardAction(projectId?: string): Promise<{
  dashboard: DashboardMetrics | null;
  error: string | null;
}> {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { dashboard: null, error: "Authentication and active workspace required" };
  }

  assertCan(membership, "view:tasks");

  const whereClause: Record<string, unknown> = {
    project: { workspaceId: workspace.id },
  };
  if (projectId) {
    whereClause.projectId = projectId;
  }

  const tasks = await db.task.findMany({
    where: whereClause,
    include: {
      project: { select: { id: true, name: true } },
      assignee: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
  const totalPoints = tasks.reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
  const completedPoints = tasks
    .filter((t) => t.status === TaskStatus.DONE)
    .reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
  const remainingPoints = totalPoints - completedPoints;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Status breakdown
  const statusColors: Record<TaskStatus, string> = {
    TODO: "#94a3b8", // Slate
    IN_PROGRESS: "#0284c7", // Sky
    IN_REVIEW: "#d97706", // Amber
    DONE: "#059669", // Emerald
    BLOCKED: "#e11d48", // Rose
  };

  const statusBreakdown = (
    [
      TaskStatus.IN_PROGRESS,
      TaskStatus.TODO,
      TaskStatus.IN_REVIEW,
      TaskStatus.DONE,
      TaskStatus.BLOCKED,
    ] as TaskStatus[]
  ).map((st) => {
    const matching = tasks.filter((t) => t.status === st);
    const pts = matching.reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
    return {
      name: STATUS_CONFIG[st].label,
      count: matching.length,
      points: pts,
      color: statusColors[st],
    };
  });

  // Overdue tasks
  const overdueTasks = tasks
    .filter((t) => t.dueDate && t.status !== TaskStatus.DONE && new Date(t.dueDate) < now)
    .map((t) => {
      const due = new Date(t.dueDate!);
      const diffTime = Math.abs(now.getTime() - due.getTime());
      const daysOverdue = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      return {
        id: t.id,
        title: t.title,
        priority: t.priority,
        estimatePoints: t.estimatePoints,
        dueDate: t.dueDate!.toISOString(),
        daysOverdue,
        assigneeName: t.assignee?.user.name || t.assignee?.user.email || "Unassigned",
        projectName: t.project.name,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Blocked tasks
  const blockedTasks = tasks
    .filter((t) => t.status === TaskStatus.BLOCKED)
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      estimatePoints: t.estimatePoints,
      blockedReason: t.blockedReason,
      assigneeName: t.assignee?.user.name || t.assignee?.user.email || "Unassigned",
      projectName: t.project.name,
    }));

  // Upcoming due tasks (next 7 days)
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const upcomingDueTasks = tasks
    .filter(
      (t) =>
        t.dueDate &&
        t.status !== TaskStatus.DONE &&
        new Date(t.dueDate) >= now &&
        new Date(t.dueDate) <= inSevenDays,
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!.toISOString(),
      priority: t.priority,
      assigneeName: t.assignee?.user.name || t.assignee?.user.email || "Unassigned",
      projectName: t.project.name,
    }));

  // Burndown chart data: 10-day period
  const burndown: { day: string; ideal: number; actual: number }[] = [];
  const daysTotal = 10;
  for (let i = 0; i <= daysTotal; i++) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - (daysTotal - i));
    const dayStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
      dayDate,
    );

    // Ideal: linear decrease from totalPoints to 0
    const ideal = Math.max(0, Math.round(totalPoints - (totalPoints / daysTotal) * i));

    // Actual: remaining points at that point in time
    const completedUpToDay = tasks
      .filter(
        (t) => t.status === TaskStatus.DONE && t.completedAt && new Date(t.completedAt) <= dayDate,
      )
      .reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
    const actual = Math.max(0, totalPoints - completedUpToDay);

    burndown.push({ day: dayStr, ideal, actual });
  }

  // Top Performer: calculate developer with most completed points
  const devPointsMap = new Map<
    string,
    { member: (typeof tasks)[0]["assignee"]; points: number; count: number; onTimeCount: number }
  >();

  tasks
    .filter((t) => t.status === TaskStatus.DONE && t.assignee)
    .forEach((t) => {
      const aId = t.assignee!.id;
      if (!devPointsMap.has(aId)) {
        devPointsMap.set(aId, { member: t.assignee, points: 0, count: 0, onTimeCount: 0 });
      }
      const entry = devPointsMap.get(aId)!;
      entry.points += t.estimatePoints;
      entry.count += 1;
      if (!t.dueDate || (t.completedAt && new Date(t.completedAt) <= new Date(t.dueDate))) {
        entry.onTimeCount += 1;
      }
    });

  let topPerformer: DashboardMetrics["topPerformer"] = null;
  if (devPointsMap.size > 0) {
    const sortedPerformers = Array.from(devPointsMap.values()).sort((a, b) => b.points - a.points);
    const best = sortedPerformers[0];
    topPerformer = {
      name: best.member?.user.name || best.member?.user.email || "Top Developer",
      email: best.member?.user.email || "",
      avatarUrl: best.member?.user.image || null,
      completedPoints: best.points,
      completedTasksCount: best.count,
      onTimeRate: best.count > 0 ? Math.round((best.onTimeCount / best.count) * 100) : 100,
    };
  }

  const dashboard: DashboardMetrics = {
    completionPercentage,
    totalTasks,
    completedTasks,
    totalPoints,
    completedPoints,
    remainingPoints,
    statusBreakdown,
    burndown,
    overdueTasks,
    blockedTasks,
    upcomingDueTasks,
    topPerformer,
  };

  return { dashboard, error: null };
}
