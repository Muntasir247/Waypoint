"use server";

import { db } from "@/lib/db";
import { mockEmailProvider } from "@/features/email/mock-provider";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { TaskStatus } from "@/types/enums";

export interface DigestResult {
  sentCount: number;
  recipients: string[];
  error?: string;
}

/**
 * Generate and simulate daily/weekly email digests for workspace members.
 * Writes records to MockEmail table with kind: "DIGEST".
 */
export async function sendWorkspaceDigestsAction(
  targetWorkspaceId?: string,
): Promise<DigestResult> {
  try {
    let workspaceId = targetWorkspaceId;
    let workspaceName = "Waypoint Workspace";

    if (!workspaceId) {
      const { workspace } = await getCurrentUserAndWorkspace();
      if (!workspace) {
        return { sentCount: 0, recipients: [], error: "No active workspace found" };
      }
      workspaceId = workspace.id;
      workspaceName = workspace.name;
    } else {
      const ws = await db.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true },
      });
      if (ws) {
        workspaceName = ws.name;
      }
    }

    if (!db.membership?.findMany || !db.task?.findMany) {
      return { sentCount: 0, recipients: [] };
    }

    // Get all members with user records
    const members = await db.membership.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recipients: string[] = [];

    for (const member of members) {
      if (!member.user?.email) continue;

      // Tasks assigned to this member
      const memberTasks = await db.task.findMany({
        where: {
          assigneeId: member.id,
          project: { workspaceId },
        },
        include: {
          project: { select: { name: true } },
        },
      });

      const openTasks = memberTasks.filter((t) => t.status !== TaskStatus.DONE);
      const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < now);
      const dueSoonTasks = openTasks.filter(
        (t) => t.dueDate && t.dueDate >= now && t.dueDate <= in48Hours,
      );
      const completedRecentTasks = memberTasks.filter(
        (t) => t.status === TaskStatus.DONE && t.completedAt && t.completedAt >= sevenDaysAgo,
      );

      // Skip members with no activity/tasks to avoid spamming
      if (openTasks.length === 0 && completedRecentTasks.length === 0) {
        continue;
      }

      const todayStr = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const subject = `[Waypoint Digest] Daily Task Summary for ${workspaceName} (${todayStr})`;

      const body = `
Hi ${member.user.name || "Developer"},

Here is your daily task and velocity summary for ${workspaceName}.

📊 AT A GLANCE:
- Open Assigned Tasks: ${openTasks.length}
- Overdue Items: ${overdueTasks.length}
- Due in next 48h: ${dueSoonTasks.length}
- Delivered in last 7 days: ${completedRecentTasks.length}

${
  overdueTasks.length > 0
    ? `⚠️ ATTENTION REQUIRED (Overdue Tasks):
${overdueTasks
  .map(
    (t) =>
      `• [${t.priority}] ${t.title} (Project: ${t.project.name}) - Due: ${t.dueDate ? t.dueDate.toLocaleDateString() : "Past due"}`,
  )
  .join("\n")}
`
    : ""
}
${
  dueSoonTasks.length > 0
    ? `⏰ DUE IN NEXT 48 HOURS:
${dueSoonTasks
  .map(
    (t) =>
      `• [${t.priority}] ${t.title} (Project: ${t.project.name}) - Due: ${t.dueDate?.toLocaleDateString()}`,
  )
  .join("\n")}
`
    : ""
}
${
  openTasks.length > 0
    ? `📋 OPEN TASKS IN PROGRESS:
${openTasks
  .slice(0, 5)
  .map((t) => `• [${t.status}] ${t.title} (${t.estimatePoints} pts) - ${t.project.name}`)
  .join("\n")}
`
    : "No tasks currently in progress."
}
${
  completedRecentTasks.length > 0
    ? `🎉 RECENTLY DELIVERED:
${completedRecentTasks
  .slice(0, 3)
  .map((t) => `• ${t.title} (${t.estimatePoints} pts)`)
  .join("\n")}
`
    : ""
}

Log into Waypoint to update your task progress:
http://localhost:3000/board

Best regards,
The Waypoint Team
`.trim();

      await mockEmailProvider.sendEmail({
        to: member.user.email,
        subject,
        body,
        kind: "DIGEST",
      });

      recipients.push(member.user.email);
    }

    return {
      sentCount: recipients.length,
      recipients,
    };
  } catch (err) {
    console.error("Failed to generate digests:", err);
    return {
      sentCount: 0,
      recipients: [],
      error: err instanceof Error ? err.message : "Failed to generate digests",
    };
  }
}
