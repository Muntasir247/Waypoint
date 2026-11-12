import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TaskStatus } from "@prisma/client";
import { ensureSystemBadges, awardBadgeToMember } from "@/features/scoring/badges";

export const instant = false;

/**
 * Vercel Cron job endpoint for closing monthly engineering scoring and computing monthly rankings.
 * Protected by CRON_SECRET authorization header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Calculate previous month string (e.g. if run on Dec 1st, close Nov: "2026-11")
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const targetMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const [yearStr, monthStr] = targetMonth.split("-");
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  await ensureSystemBadges();

  const workspaces = await db.workspace.findMany({ select: { id: true, name: true } });
  let totalWorkspacesProcessed = 0;
  let totalMembersRanked = 0;

  for (const workspace of workspaces) {
    // Check if scoring is enabled
    const config = await db.scoringConfig.findUnique({
      where: { workspaceId: workspace.id },
    });
    if (config && !config.enabled) continue;

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

    memberAggregates.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
      return b.tasksCompleted - a.tasksCompleted;
    });

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

      if (rank === 1 && agg.totalPoints > 0) {
        await awardBadgeToMember(agg.membershipId, "WORKHORSE");
      }
      if (agg.tasksCompleted >= 3 && agg.reviewBouncesInMonth === 0) {
        await awardBadgeToMember(agg.membershipId, "REVIEWER_CHOICE");
      }
      totalMembersRanked++;
    }

    totalWorkspacesProcessed++;
  }

  return NextResponse.json({
    success: true,
    month: targetMonth,
    workspacesProcessed: totalWorkspacesProcessed,
    membersRanked: totalMembersRanked,
    timestamp: new Date().toISOString(),
  });
}
