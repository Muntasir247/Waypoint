"use server";

import { db } from "@/lib/db";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import {
  type NotificationType,
  type NotificationPayload,
  type FormattedNotification,
  type GetNotificationsInput,
  getNotificationsInputSchema,
  type MarkNotificationReadInput,
  markNotificationReadInputSchema,
} from "./schemas";
import { revalidatePath } from "next/cache";

/**
 * Format raw notification record into rich user-facing representation.
 */
function formatNotification(raw: {
  id: string;
  userId: string;
  workspaceId: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}): FormattedNotification {
  const payload = (raw.payload as NotificationPayload) || {};
  const type = raw.type as NotificationType;

  let title = "Notification";
  let description = "You have a new update.";
  let url = "/board";

  if (payload.taskId) {
    url = payload.projectId
      ? `/projects/${payload.projectId}?task=${payload.taskId}`
      : `/board?task=${payload.taskId}`;
  } else if (payload.url) {
    url = payload.url;
  }

  switch (type) {
    case "ASSIGNMENT":
      title = payload.taskTitle ? `Assigned to: ${payload.taskTitle}` : "New task assigned";
      description = payload.actorName
        ? `${payload.actorName} assigned you to this task.`
        : "You have been assigned to a task.";
      break;

    case "STATUS_CHANGE":
      title = payload.taskTitle
        ? `Status: ${payload.newStatus || "Updated"} - ${payload.taskTitle}`
        : "Task status changed";
      description = payload.actorName
        ? `${payload.actorName} moved this task to ${payload.newStatus || "updated status"}.`
        : `Task moved to ${payload.newStatus || "new status"}.`;
      break;

    case "MENTION":
      title = payload.actorName
        ? `${payload.actorName} mentioned you`
        : "You were mentioned in a comment";
      description = payload.commentSnippet
        ? `"${payload.commentSnippet}"`
        : payload.taskTitle
          ? `On task: ${payload.taskTitle}`
          : "You were mentioned in a task discussion.";
      break;

    case "BLOCKED":
      title = payload.taskTitle ? `Blocked: ${payload.taskTitle}` : "Task blocked";
      description = payload.reason
        ? `Blocked reason: ${payload.reason}`
        : "This task has been flagged as blocked.";
      break;

    case "DUE_SOON":
      title = payload.taskTitle ? `Due Soon: ${payload.taskTitle}` : "Task due soon";
      description = "This task is scheduled to be completed within 24 hours.";
      break;

    case "OVERDUE":
      title = payload.taskTitle ? `Overdue: ${payload.taskTitle}` : "Task is overdue";
      description = "This task has passed its target deadline and requires attention.";
      break;

    case "INVITE":
      title = "Workspace Invitation";
      description = "You have been invited to collaborate in this workspace.";
      url = "/team";
      break;

    case "MONTHLY_RESULTS":
      title = payload.month ? `Monthly Results: ${payload.month}` : "Monthly Results Ready";
      description = "Monthly scoring close has completed. Check out the leaderboard!";
      url = payload.month ? `/leaderboard?month=${payload.month}` : "/leaderboard";
      break;
  }

  return {
    id: raw.id,
    userId: raw.userId,
    workspaceId: raw.workspaceId,
    type,
    title,
    description,
    url,
    readAt: raw.readAt,
    createdAt: raw.createdAt,
    payload,
  };
}

/**
 * Internal helper to record an in-app notification.
 * Safe to call from anywhere; catches errors so it never breaks caller mutations.
 */
export async function createNotification(params: {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  payload: NotificationPayload;
}) {
  try {
    if (!db.notification?.create) return null;

    const notification = await db.notification.create({
      data: {
        userId: params.userId,
        workspaceId: params.workspaceId,
        type: params.type,
        payload: params.payload as object,
      },
    });

    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

/**
 * Retrieve notifications for the current user and active workspace.
 */
export async function getNotificationsAction(input?: GetNotificationsInput): Promise<{
  notifications: FormattedNotification[];
  unreadCount: number;
  error?: string;
}> {
  try {
    const { user, workspace } = await getCurrentUserAndWorkspace();
    if (!user || !workspace) {
      return { notifications: [], unreadCount: 0, error: "Not authenticated" };
    }

    const parsed = getNotificationsInputSchema.safeParse(input || {});
    const { unreadOnly, limit } = parsed.success ? parsed.data : { unreadOnly: false, limit: 20 };

    if (!db.notification?.findMany) {
      return { notifications: [], unreadCount: 0 };
    }

    const [rawNotifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: {
          userId: user.id,
          workspaceId: workspace.id,
          ...(unreadOnly ? { readAt: null } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({
        where: {
          userId: user.id,
          workspaceId: workspace.id,
          readAt: null,
        },
      }),
    ]);

    const formatted = rawNotifications.map(formatNotification);

    return {
      notifications: formatted,
      unreadCount,
    };
  } catch (err) {
    console.error("Failed to get notifications:", err);
    return {
      notifications: [],
      unreadCount: 0,
      error: err instanceof Error ? err.message : "Failed to load notifications",
    };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationReadAction(input: MarkNotificationReadInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user } = await getCurrentUserAndWorkspace();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = markNotificationReadInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid notification ID" };
    }

    if (db.notification?.updateMany) {
      await db.notification.updateMany({
        where: {
          id: parsed.data.notificationId,
          userId: user.id,
        },
        data: {
          readAt: new Date(),
        },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to mark notification read:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update notification",
    };
  }
}

/**
 * Mark all unread notifications as read for current user in active workspace.
 */
export async function markAllNotificationsReadAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { user, workspace } = await getCurrentUserAndWorkspace();
    if (!user || !workspace) {
      return { success: false, error: "Not authenticated" };
    }

    if (db.notification?.updateMany) {
      await db.notification.updateMany({
        where: {
          userId: user.id,
          workspaceId: workspace.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
    }

    revalidatePath("/board");
    return { success: true };
  } catch (err) {
    console.error("Failed to mark all notifications read:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update notifications",
    };
  }
}

/**
 * Lightweight action to get just unread count for topbar badge.
 */
export async function getUnreadNotificationCountAction(): Promise<{
  count: number;
}> {
  try {
    const { user, workspace } = await getCurrentUserAndWorkspace();
    if (!user || !workspace || !db.notification?.count) {
      return { count: 0 };
    }

    const count = await db.notification.count({
      where: {
        userId: user.id,
        workspaceId: workspace.id,
        readAt: null,
      },
    });

    return { count };
  } catch {
    return { count: 0 };
  }
}
