import { z } from "zod";
import { TaskStatus, Priority, AttachmentType } from "@/types/enums";

export const createTaskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  sprintId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  title: z.string().min(2, "Task title must be at least 2 characters").max(200),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
  estimatePoints: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8)])
    .optional()
    .default(1),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  estimatePoints: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8)])
    .optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z
  .object({
    id: z.string().min(1),
    status: z.nativeEnum(TaskStatus),
    blockedReason: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === TaskStatus.BLOCKED) {
        return Boolean(data.blockedReason && data.blockedReason.trim().length > 0);
      }
      return true;
    },
    {
      message: "A short reason is required when marking a task as BLOCKED",
      path: ["blockedReason"],
    },
  );

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const moveTaskSchema = z
  .object({
    taskId: z.string().min(1),
    newStatus: z.nativeEnum(TaskStatus),
    newPosition: z.number().default(0),
    blockedReason: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.newStatus === TaskStatus.BLOCKED) {
        return Boolean(data.blockedReason && data.blockedReason.trim().length > 0);
      }
      return true;
    },
    {
      message: "A short reason is required when moving a task to BLOCKED",
      path: ["blockedReason"],
    },
  );

export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

export const createChecklistItemSchema = z.object({
  taskId: z.string().min(1),
  text: z.string().min(1, "Checklist item text is required").max(300),
});

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;

export const updateChecklistItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(300).optional(),
  done: z.boolean().optional(),
});

export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;

export const createCommentSchema = z.object({
  taskId: z.string().min(1),
  body: z.string().min(1, "Comment cannot be empty").max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createAttachmentSchema = z.object({
  taskId: z.string().min(1),
  name: z.string().min(1, "Attachment name is required").max(120),
  url: z.string().url("Must be a valid URL"),
  type: z.nativeEnum(AttachmentType).default(AttachmentType.LINK),
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

export const createTimeEntrySchema = z.object({
  taskId: z.string().min(1),
  minutes: z.number().int().min(1, "Must log at least 1 minute").max(1440),
  note: z.string().max(500).optional().nullable(),
  loggedAt: z.string().optional().nullable(),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;

export const taskDependencySchema = z.object({
  taskId: z.string().min(1),
  dependsOnTaskId: z.string().min(1),
});

export type TaskDependencyInput = z.infer<typeof taskDependencySchema>;
