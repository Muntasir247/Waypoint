import { z } from "zod";

export const NOTIFICATION_TYPES = [
  "ASSIGNMENT",
  "STATUS_CHANGE",
  "MENTION",
  "DUE_SOON",
  "OVERDUE",
  "BLOCKED",
  "INVITE",
  "MONTHLY_RESULTS",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notificationPayloadSchema = z.object({
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  oldStatus: z.string().optional(),
  newStatus: z.string().optional(),
  reason: z.string().optional(),
  commentId: z.string().optional(),
  commentSnippet: z.string().optional(),
  month: z.string().optional(),
  url: z.string().optional(),
});

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

export interface FormattedNotification {
  id: string;
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  description: string;
  url: string;
  readAt: Date | null;
  createdAt: Date;
  payload: NotificationPayload;
}

export const getNotificationsInputSchema = z.object({
  unreadOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export type GetNotificationsInput = z.infer<typeof getNotificationsInputSchema>;

export const markNotificationReadInputSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadInputSchema>;
