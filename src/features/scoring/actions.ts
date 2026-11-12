"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { TaskStatus, Priority } from "@prisma/client";
import {
  defaultScoringRules,
  updateScoringConfigSchema,
  recomputeMonthlyScoresSchema,
  type ScoringRules,
  type UpdateScoringConfigInput,
  type LeaderboardMember,
  type BadgeItem,
} from "./schemas";
import { calculateTaskScore } from "./calculator";
import { ensureSystemBadges, awardBadgeToMember } from "./badges";

/**
 * Get workspace scoring configuration, creating default if not exists.
 */
export async function getWorkspaceScoringConfigAction(): Promise<{
  config: { enabled: boolean; rules: ScoringRules } | null;
  error: string | null;
}> {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { config: null, error: "Authentication and active workspace required" };
  }

  assertCan(membership, "view:leaderboard");

  let scoringConfig = await db.scoringConfig.findUnique({
    where: { workspaceId: workspace.id },
  });

  if (!scoringConfig) {
    scoringConfig = await db.scoringConfig.create({
      data: {
        workspaceId: workspace.id,
        enabled: true,
        rules: defaultScoringRules,
      },
    });
  }

  return {
    config: {
      enabled: scoringConfig.enabled,
      rules: (scoringConfig.rules as ScoringRules) || defaultScoringRules,
    },
    error: null,
  };
}

/**
 * Update workspace scoring rules and enabled state (Admin only).
 */
export async function updateWorkspaceScoringConfigAction(input: UpdateScoringConfigInput): Promise<{
  success: boolean;
  error: string | null;
}> {
  const { workspace, user, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !user || !membership) {
    return { success: false, error: "Authentication and active workspace required" };
  }

  assertCan(membership, "configure:scoring");

  const parsed = updateScoringConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid config input" };
  }

  await db.$transaction([
    db.scoringConfig.upsert({
      where: { workspaceId: workspace.id },
      create: {
        workspaceId: workspace.id,
        enabled: parsed.data.enabled,
        rules: parsed.data.rules,
      },
      update: {
        enabled: parsed.data.enabled,
        rules: parsed.data.rules,
      },
    }),
    db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: user.id,
        action: "UPDATE_SCORING_CONFIG",
        target: "Workspace Scoring Rules",
        metadata: {
          enabled: parsed.data.enabled,
          rules: parsed.data.rules,
        },
      },
    }),
  ]);

  revalidatePath("/leaderboard");
  revalidatePath("/settings");
  return { success: true, error: null };
}

/**
 * Record score award when a task transitions to DONE.
 */
export async function recordTaskCompletionScore(taskId: string) {
  if (!db.task?.findUnique || !db.scoringConfig?.findUnique || !db.scoreEvent?.findFirst) {
    return null;
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { workspaceId: true } },
      assignee: true,
      labels: { include: { label: true } },
    },
  });

  if (!task || !task.assigneeId || !task.project) {
    return null;
  }

  // Check if scoring is enabled in this workspace
  let scoringConfig = await db.scoringConfig.findUnique({
    where: { workspaceId: task.project.workspaceId },
  });

  if (!scoringConfig) {
    scoringConfig = await db.scoringConfig.create({
      data: {
        workspaceId: task.project.workspaceId,
        enabled: true,
        rules: defaultScoringRules,
      },
    });
  }

  if (!scoringConfig.enabled) {
    return null;
  }

  const rules = (scoringConfig.rules as ScoringRules) || defaultScoringRules;

  // Check if already scored (avoid double scoring positive points for same task completion)
  const existingPositiveEvent = await db.scoreEvent.findFirst({
    where: {
      taskId: task.id,
      membershipId: task.assigneeId,
      points: { gt: 0 },
    },
    orderBy: { createdAt: "desc" },
  });

  // Count review bounces (IN_REVIEW -> IN_PROGRESS)
  const bounceActivities = await db.activityLog.count({
    where: {
      taskId: task.id,
      action: "STATUS_CHANGE",
      fromValue: "IN_REVIEW",
      toValue: "IN_PROGRESS",
    },
  });

  const breakdown = calculateTaskScore({
    estimatePoints: task.estimatePoints || 1,
    priority: task.priority,
    dueDate: task.dueDate,
    completedAt: task.completedAt || new Date(),
    bounceCount: bounceActivities,
    rules,
  });

  // If already scored and not reversed, return
  if (existingPositiveEvent) {
    const subsequentReversals = await db.scoreEvent.count({
      where: {
        taskId: task.id,
        membershipId: task.assigneeId,
        points: { lt: 0 },
        createdAt: { gt: existingPositiveEvent.createdAt },
      },
    });

    if (subsequentReversals === 0) {
      return existingPositiveEvent;
    }
  }

  // Create immutable ScoreEvent
  const scoreEvent = await db.scoreEvent.create({
    data: {
      membershipId: task.assigneeId,
      taskId: task.id,
      points: breakdown.finalPoints,
      reason: breakdown.formulaExplanation,
    },
  });

  // Evaluate instant badges
  await ensureSystemBadges();

  // 1. Streak 5 badge check: Check member's last 5 completed tasks
  const recentCompletedTasks = await db.task.findMany({
    where: {
      assigneeId: task.assigneeId,
      status: TaskStatus.DONE,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  if (recentCompletedTasks.length === 5) {
    const allOnTime = recentCompletedTasks.every((t) => {
      if (!t.dueDate || !t.completedAt) return true;
      const dueTime = new Date(t.dueDate).setHours(23, 59, 59, 999);
      return t.completedAt.getTime() <= dueTime;
    });

    if (allOnTime) {
      await awardBadgeToMember(task.assigneeId, "STREAK_5");
    }
  }

  // 2. Bug Squasher: Check if task has 'bug' label or Critical priority
  const hasBugLabel = task.labels.some((l) => l.label.name.toLowerCase().includes("bug"));
  if (hasBugLabel || task.priority === Priority.CRITICAL) {
    const bugTasksCount = await db.task.count({
      where: {
        assigneeId: task.assigneeId,
        status: TaskStatus.DONE,
        OR: [
          { priority: Priority.CRITICAL },
          { labels: { some: { label: { name: { contains: "bug", mode: "insensitive" } } } } },
        ],
      },
    });

    if (bugTasksCount >= 3) {
      await awardBadgeToMember(task.assigneeId, "BUG_SQUASHER");
    }
  }

  return scoreEvent;
}

/**
 * Record reversing score event when a task is moved out of DONE.
 */
export async function recordTaskReopeningReversal(taskId: string) {
  if (!db.task?.findUnique || !db.scoreEvent?.findFirst) {
    return null;
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { workspaceId: true } } },
  });

  if (!task || !task.assigneeId) return null;

  // Find latest positive score event for this task
  const lastScoreEvent = await db.scoreEvent.findFirst({
    where: {
      taskId: task.id,
      membershipId: task.assigneeId,
      points: { gt: 0 },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!lastScoreEvent) return null;

  // Check if already reversed
  const subsequentReversals = await db.scoreEvent.count({
    where: {
      taskId: task.id,
      membershipId: task.assigneeId,
      points: { lt: 0 },
      createdAt: { gt: lastScoreEvent.createdAt },
    },
  });

  if (subsequentReversals > 0) return null;

  // Append reversing event to immutable ledger
  return db.scoreEvent.create({
    data: {
      membershipId: task.assigneeId,
      taskId: task.id,
      points: -lastScoreEvent.points,
      reason: `Reversal: Task #${task.id.slice(-6)} reopened from DONE (-${lastScoreEvent.points} pts)`,
    },
  });
}

/**
 * Get monthly leaderboard (live for current month, persisted for past closed months).
 */
export async function getLeaderboardAction(params?: { month?: string }): Promise<{
  month: string;
  isCurrentMonth: boolean;
  members: LeaderboardMember[];
  topPerformer: LeaderboardMember | null;
  availableMonths: string[];
  scoringEnabled: boolean;
  error: string | null;
}> {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return {
      month: "",
      isCurrentMonth: true,
      members: [],
      topPerformer: null,
      availableMonths: [],
      scoringEnabled: true,
      error: "Authentication and active workspace required",
    };
  }

  assertCan(membership, "view:leaderboard");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const targetMonth = params?.month || currentMonth;
  const isCurrentMonth = targetMonth === currentMonth;

  // Ensure badges exist
  await ensureSystemBadges();

  // Check workspace scoring config
  const scoringConfig = await db.scoringConfig.findUnique({
    where: { workspaceId: workspace.id },
  });
  const scoringEnabled = scoringConfig ? scoringConfig.enabled : true;

  // Available months list (distinct from MonthlyResult and current month)
  const pastMonths = await db.monthlyResult.findMany({
    where: { workspaceId: workspace.id },
    select: { month: true },
    distinct: ["month"],
    orderBy: { month: "desc" },
  });
  const monthSet = new Set<string>([currentMonth, ...pastMonths.map((m) => m.month)]);
  const availableMonths = Array.from(monthSet).sort().reverse();

  // If past month, check if MonthlyResults exist
  if (!isCurrentMonth) {
    const persistedResults = await db.monthlyResult.findMany({
      where: {
        workspaceId: workspace.id,
        month: targetMonth,
      },
      include: {
        membership: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            memberBadges: { include: { badge: true } },
          },
        },
      },
      orderBy: { rank: "asc" },
    });

    if (persistedResults.length > 0) {
      const members: LeaderboardMember[] = persistedResults.map((r) => ({
        membershipId: r.membershipId,
        userId: r.membership.user?.id || "",
        name: r.membership.user?.name || r.membership.user?.email?.split("@")[0] || "Developer",
        email: r.membership.user?.email || "",
        avatarUrl: r.membership.user?.image || null,
        role: r.membership.role,
        totalPoints: Math.round(r.totalPoints * 100) / 100,
        tasksCompleted: r.tasksCompleted,
        onTimeRate: Math.round(r.onTimeRate * 100),
        rank: r.rank,
        badges: r.membership.memberBadges.map((b) => ({
          id: b.badge.id,
          key: b.badge.key,
          name: b.badge.name,
          description: b.badge.description,
          icon: b.badge.icon,
          awardedAt: b.awardedAt.toISOString(),
        })),
      }));

      return {
        month: targetMonth,
        isCurrentMonth: false,
        members,
        topPerformer: members[0] || null,
        availableMonths,
        scoringEnabled,
        error: null,
      };
    }
  }

  // Calculate live rankings for target month
  const [yearStr, monthStr] = targetMonth.split("-");
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  // Get all members of workspace
  const workspaceMembers = await db.membership.findMany({
    where: { workspaceId: workspace.id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      memberBadges: { include: { badge: true } },
      scoreEvents: {
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      },
    },
  });

  // Calculate stats per member
  const rawMembers = await Promise.all(
    workspaceMembers.map(async (m) => {
      // Sum points from ScoreEvents in target month
      const totalPoints = m.scoreEvents.reduce((sum, e) => sum + e.points, 0);

      // Query completed tasks for on-time rate in this month
      const completedTasks = await db.task.findMany({
        where: {
          assigneeId: m.id,
          status: TaskStatus.DONE,
          completedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      let onTimeCount = 0;
      completedTasks.forEach((t) => {
        if (!t.dueDate || !t.completedAt) {
          onTimeCount++;
        } else {
          const dueTime = new Date(t.dueDate).setHours(23, 59, 59, 999);
          if (t.completedAt.getTime() <= dueTime) {
            onTimeCount++;
          }
        }
      });

      const onTimeRate =
        completedTasks.length > 0 ? Math.round((onTimeCount / completedTasks.length) * 100) : 100;

      const badges: BadgeItem[] = m.memberBadges.map((b) => ({
        id: b.badge.id,
        key: b.badge.key,
        name: b.badge.name,
        description: b.badge.description,
        icon: b.badge.icon,
        awardedAt: b.awardedAt.toISOString(),
      }));

      return {
        membershipId: m.id,
        userId: m.user?.id || "",
        name: m.user?.name || m.user?.email?.split("@")[0] || "Developer",
        email: m.user?.email || "",
        avatarUrl: m.user?.image || null,
        role: m.role,
        totalPoints: Math.round(totalPoints * 100) / 100,
        tasksCompleted: completedTasks.length,
        onTimeRate,
        badges,
      };
    }),
  );

  // Sort descending by totalPoints, then by onTimeRate, then by tasksCompleted
  rawMembers.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
    return b.tasksCompleted - a.tasksCompleted;
  });

  const rankedMembers: LeaderboardMember[] = rawMembers.map((m, idx) => ({
    ...m,
    rank: idx + 1,
  }));

  return {
    month: targetMonth,
    isCurrentMonth,
    members: rankedMembers,
    topPerformer: rankedMembers[0] || null,
    availableMonths,
    scoringEnabled,
    error: null,
  };
}

/**
 * Get detailed score breakdown and ledger events for a member in a specific month.
 */
export async function getMemberScoreBreakdownAction(input: {
  membershipId: string;
  month?: string;
}): Promise<{
  member: { id: string; name: string; avatarUrl: string | null } | null;
  events: Array<{
    id: string;
    points: number;
    reason: string;
    createdAt: string;
    task: { id: string; title: string; priority: Priority; estimatePoints: number } | null;
  }>;
  totalPoints: number;
  error: string | null;
}> {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { member: null, events: [], totalPoints: 0, error: "Authentication required" };
  }

  assertCan(membership, "view:leaderboard");

  const targetMember = await db.membership.findFirst({
    where: { id: input.membershipId, workspaceId: workspace.id },
    include: { user: { select: { name: true, image: true, email: true } } },
  });

  if (!targetMember) {
    return { member: null, events: [], totalPoints: 0, error: "Member not found" };
  }

  let dateFilter: Record<string, unknown> = {};
  if (input.month) {
    const [yearStr, monthStr] = input.month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    dateFilter = {
      createdAt: {
        gte: new Date(year, monthIndex, 1),
        lte: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
      },
    };
  }

  const events = await db.scoreEvent.findMany({
    where: {
      membershipId: targetMember.id,
      ...dateFilter,
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          priority: true,
          estimatePoints: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPoints = events.reduce((sum, e) => sum + e.points, 0);

  return {
    member: {
      id: targetMember.id,
      name: targetMember.user?.name || targetMember.user?.email?.split("@")[0] || "Developer",
      avatarUrl: targetMember.user?.image || null,
    },
    events: events.map((e) => ({
      id: e.id,
      points: e.points,
      reason: e.reason,
      createdAt: e.createdAt.toISOString(),
      task: e.task
        ? {
            id: e.task.id,
            title: e.task.title,
            priority: e.task.priority,
            estimatePoints: e.task.estimatePoints,
          }
        : null,
    })),
    totalPoints: Math.round(totalPoints * 100) / 100,
    error: null,
  };
}

/**
 * Recomputes and freezes monthly results, ranks developers, and evaluates badge criteria.
 * Can be triggered manually by an Admin or by the monthly close cron.
 */
export async function recomputeMonthlyResultsAction(input?: { month?: string }): Promise<{
  success: boolean;
  affectedCount: number;
  month: string;
  error: string | null;
}> {
  const { workspace, user, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !user || !membership) {
    return { success: false, affectedCount: 0, month: "", error: "Authentication required" };
  }

  assertCan(membership, "configure:scoring");

  const parsed = recomputeMonthlyScoresSchema.safeParse(input || {});
  if (!parsed.success) {
    return { success: false, affectedCount: 0, month: "", error: "Invalid month format" };
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const targetMonth = parsed.data.month || currentMonth;

  const [yearStr, monthStr] = targetMonth.split("-");
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  await ensureSystemBadges();

  const members = await db.membership.findMany({
    where: { workspaceId: workspace.id },
    include: {
      scoreEvents: {
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      },
    },
  });

  const memberAggregates = await Promise.all(
    members.map(async (m) => {
      const totalPoints = m.scoreEvents.reduce((sum, e) => sum + e.points, 0);

      const completedTasks = await db.task.findMany({
        where: {
          assigneeId: m.id,
          status: TaskStatus.DONE,
          completedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      let onTimeCount = 0;
      let reviewBouncesInMonth = 0;

      for (const t of completedTasks) {
        if (!t.dueDate || !t.completedAt) {
          onTimeCount++;
        } else {
          const dueTime = new Date(t.dueDate).setHours(23, 59, 59, 999);
          if (t.completedAt.getTime() <= dueTime) onTimeCount++;
        }

        const bounces = await db.activityLog.count({
          where: {
            taskId: t.id,
            action: "STATUS_CHANGE",
            fromValue: "IN_REVIEW",
            toValue: "IN_PROGRESS",
          },
        });
        reviewBouncesInMonth += bounces;
      }

      const onTimeRate = completedTasks.length > 0 ? onTimeCount / completedTasks.length : 1.0;

      return {
        membershipId: m.id,
        totalPoints: Math.round(totalPoints * 100) / 100,
        tasksCompleted: completedTasks.length,
        onTimeRate,
        reviewBouncesInMonth,
      };
    }),
  );

  // Rank members
  memberAggregates.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
    return b.tasksCompleted - a.tasksCompleted;
  });

  // Upsert MonthlyResult records
  for (let idx = 0; idx < memberAggregates.length; idx++) {
    const agg = memberAggregates[idx];
    const rank = idx + 1;

    await db.monthlyResult.upsert({
      where: {
        workspaceId_membershipId_month: {
          workspaceId: workspace.id,
          membershipId: agg.membershipId,
          month: targetMonth,
        },
      },
      create: {
        workspaceId: workspace.id,
        membershipId: agg.membershipId,
        month: targetMonth,
        totalPoints: agg.totalPoints,
        tasksCompleted: agg.tasksCompleted,
        onTimeRate: agg.onTimeRate,
        rank,
      },
      update: {
        totalPoints: agg.totalPoints,
        tasksCompleted: agg.tasksCompleted,
        onTimeRate: agg.onTimeRate,
        rank,
      },
    });

    // Evaluate badges for monthly close
    // 1. Workhorse badge for #1 rank if points > 0
    if (rank === 1 && agg.totalPoints > 0) {
      await awardBadgeToMember(agg.membershipId, "WORKHORSE");
    }

    // 2. Reviewer's Choice badge if at least 3 tasks completed with 0 bounces
    if (agg.tasksCompleted >= 3 && agg.reviewBouncesInMonth === 0) {
      await awardBadgeToMember(agg.membershipId, "REVIEWER_CHOICE");
    }
  }

  // Audit Log
  await db.auditLog.create({
    data: {
      workspaceId: workspace.id,
      actorId: user.id,
      action: "RECOMPUTE_MONTHLY_SCORES",
      target: `Monthly scores for ${targetMonth}`,
      metadata: {
        month: targetMonth,
        rankedCount: memberAggregates.length,
      },
    },
  });

  revalidatePath("/leaderboard");
  revalidatePath("/");
  return { success: true, affectedCount: memberAggregates.length, month: targetMonth, error: null };
}
