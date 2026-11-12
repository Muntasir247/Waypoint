"use server";

import { db } from "@/lib/db";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { TaskStatus, Priority } from "@prisma/client";
import {
  type GetReportsInput,
  getReportsInputSchema,
  type ReportSummary,
  type DeveloperReportItem,
  type ProjectReportItem,
  type MonthlyVelocityPoint,
} from "./schemas";

/**
 * Retrieve comprehensive monthly engineering reporting data.
 */
export async function getMonthlyReportAction(input?: GetReportsInput): Promise<{
  summary: ReportSummary | null;
  availableMonths: string[];
  availableProjects: Array<{ id: string; name: string }>;
  availableMembers: Array<{ id: string; name: string }>;
  error?: string;
}> {
  try {
    const { workspace } = await getCurrentUserAndWorkspace();
    if (!workspace) {
      return {
        summary: null,
        availableMonths: [],
        availableProjects: [],
        availableMembers: [],
        error: "Authentication required",
      };
    }

    const parsed = getReportsInputSchema.safeParse(input || {});
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const selectedMonth = parsed.success && parsed.data.month ? parsed.data.month : currentMonthStr;

    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    if (!db.project?.findMany || !db.membership?.findMany) {
      return {
        summary: null,
        availableMonths: [currentMonthStr],
        availableProjects: [],
        availableMembers: [],
      };
    }

    // Available projects and members for filtering
    const [projects, memberships] = await Promise.all([
      db.project.findMany({
        where: { workspaceId: workspace.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.membership.findMany({
        where: { workspaceId: workspace.id },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { role: "asc" },
      }),
    ]);

    const filterProjectId = parsed.success ? parsed.data.projectId : undefined;
    const filterMemberId = parsed.success ? parsed.data.membershipId : undefined;

    // Fetch tasks completed in this month
    const completedTasks = await db.task.findMany({
      where: {
        project: { workspaceId: workspace.id },
        status: TaskStatus.DONE,
        completedAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        ...(filterProjectId ? { projectId: filterProjectId } : {}),
        ...(filterMemberId ? { assigneeId: filterMemberId } : {}),
      },
      include: {
        assignee: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    // Score events in this month
    const scoreEvents = await db.scoreEvent.findMany({
      where: {
        membership: { workspaceId: workspace.id },
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        ...(filterMemberId ? { membershipId: filterMemberId } : {}),
      },
    });

    // Activity logs for review bounces in this month
    const reviewBounces = await db.activityLog.count({
      where: {
        action: "STATUS_CHANGED",
        fromValue: "IN_REVIEW",
        toValue: "IN_PROGRESS",
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        task: { project: { workspaceId: workspace.id } },
      },
    });

    // Open bugs count across workspace
    const openBugsCount = await db.task.count({
      where: {
        project: { workspaceId: workspace.id },
        status: { not: TaskStatus.DONE },
        labels: {
          some: {
            label: {
              name: { contains: "bug", mode: "insensitive" },
            },
          },
        },
      },
    });

    // 1. Group developer performance
    const devMap = new Map<
      string,
      {
        member: (typeof memberships)[0];
        tasksCompleted: number;
        onTimeTasks: number;
        lateTasks: number;
        criticalTasksDone: number;
      }
    >();

    for (const mem of memberships) {
      if (filterMemberId && mem.id !== filterMemberId) continue;
      devMap.set(mem.id, {
        member: mem,
        tasksCompleted: 0,
        onTimeTasks: 0,
        lateTasks: 0,
        criticalTasksDone: 0,
      });
    }

    for (const t of completedTasks) {
      if (!t.assigneeId) continue;
      let record = devMap.get(t.assigneeId);
      if (!record && t.assignee) {
        record = {
          member: t.assignee as (typeof memberships)[0],
          tasksCompleted: 0,
          onTimeTasks: 0,
          lateTasks: 0,
          criticalTasksDone: 0,
        };
        devMap.set(t.assigneeId, record);
      }

      if (record) {
        record.tasksCompleted += 1;
        if (t.priority === Priority.CRITICAL) {
          record.criticalTasksDone += 1;
        }

        if (t.dueDate && t.completedAt) {
          if (t.completedAt <= t.dueDate) {
            record.onTimeTasks += 1;
          } else {
            record.lateTasks += 1;
          }
        } else {
          // If no dueDate, count as on-time
          record.onTimeTasks += 1;
        }
      }
    }

    // Points per member from scoreEvents
    const memberPointsMap = new Map<string, number>();
    for (const se of scoreEvents) {
      const cur = memberPointsMap.get(se.membershipId) || 0;
      memberPointsMap.set(se.membershipId, cur + se.points);
    }

    const developerReports: DeveloperReportItem[] = Array.from(devMap.values()).map((item) => {
      const pts = Number((memberPointsMap.get(item.member.id) || 0).toFixed(1));
      const totalRated = item.onTimeTasks + item.lateTasks;
      const onTimeRate = totalRated > 0 ? Math.round((item.onTimeTasks / totalRated) * 100) : 100;
      const pointsPerTask =
        item.tasksCompleted > 0 ? Number((pts / item.tasksCompleted).toFixed(1)) : 0;

      return {
        membershipId: item.member.id,
        name: item.member.user?.name || "Team Member",
        email: item.member.user?.email || "",
        avatarUrl: item.member.user?.image,
        role: item.member.role,
        tasksCompleted: item.tasksCompleted,
        onTimeTasks: item.onTimeTasks,
        lateTasks: item.lateTasks,
        onTimeRate,
        totalPoints: pts,
        reviewBounces: 0,
        pointsPerTask,
        criticalTasksDone: item.criticalTasksDone,
      };
    });

    developerReports.sort((a, b) => b.totalPoints - a.totalPoints);

    // 2. Project performance
    const allWorkspaceTasks = await db.task.findMany({
      where: {
        project: { workspaceId: workspace.id },
        ...(filterProjectId ? { projectId: filterProjectId } : {}),
      },
      select: {
        id: true,
        projectId: true,
        status: true,
        estimatePoints: true,
        labels: {
          select: { label: { select: { name: true } } },
        },
      },
    });

    const projectReports: ProjectReportItem[] = projects
      .filter((p) => !filterProjectId || p.id === filterProjectId)
      .map((proj) => {
        const projTasks = allWorkspaceTasks.filter((t) => t.projectId === proj.id);
        const doneTasks = projTasks.filter((t) => t.status === TaskStatus.DONE);
        const totalPointsDelivered = doneTasks.reduce((acc, t) => acc + t.estimatePoints, 0);
        const bugs = projTasks.filter(
          (t) =>
            t.status !== TaskStatus.DONE &&
            t.labels.some((l) => l.label.name.toLowerCase().includes("bug")),
        ).length;

        const completionRate =
          projTasks.length > 0 ? Math.round((doneTasks.length / projTasks.length) * 100) : 0;

        return {
          projectId: proj.id,
          projectName: proj.name,
          totalTasks: projTasks.length,
          completedTasks: doneTasks.length,
          completionRate,
          totalPointsDelivered,
          openBugsCount: bugs,
          activeSprintsCount: 1,
        };
      });

    // 3. Weekly Velocity Trend (4 buckets across the month)
    const velocityTrend: MonthlyVelocityPoint[] = [
      { label: "Week 1", points: 0, tasksCount: 0 },
      { label: "Week 2", points: 0, tasksCount: 0 },
      { label: "Week 3", points: 0, tasksCount: 0 },
      { label: "Week 4", points: 0, tasksCount: 0 },
    ];

    for (const t of completedTasks) {
      if (!t.completedAt) continue;
      const day = t.completedAt.getDate();
      const weekIdx = Math.min(3, Math.floor((day - 1) / 7));
      velocityTrend[weekIdx].points += t.estimatePoints;
      velocityTrend[weekIdx].tasksCount += 1;
    }

    const totalDeliveredPoints = Number(
      scoreEvents.reduce((acc, se) => acc + se.points, 0).toFixed(1),
    );
    const totalTasksCompleted = completedTasks.length;
    const totalOnTime = developerReports.reduce((acc, d) => acc + d.onTimeTasks, 0);
    const overallOnTimeRate =
      totalTasksCompleted > 0 ? Math.round((totalOnTime / totalTasksCompleted) * 100) : 100;

    const summary: ReportSummary = {
      month: selectedMonth,
      generatedAt: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      totalDeliveredPoints,
      totalTasksCompleted,
      overallOnTimeRate,
      totalReviewBounces: reviewBounces,
      openBugsCount,
      developerReports,
      projectReports,
      velocityTrend,
    };

    // Available months (last 6 months)
    const availableMonths: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      availableMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    return {
      summary,
      availableMonths,
      availableProjects: projects,
      availableMembers: memberships.map((m) => ({
        id: m.id,
        name: m.user?.name || "Team Member",
      })),
    };
  } catch (err) {
    console.error("Failed to generate monthly report:", err);
    return {
      summary: null,
      availableMonths: [],
      availableProjects: [],
      availableMembers: [],
      error: err instanceof Error ? err.message : "Failed to generate report",
    };
  }
}
