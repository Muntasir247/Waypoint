import { z } from "zod";
import { TaskStatus, Priority } from "@/types/enums";

export const bulkTaskActionSchema = z.enum([
  "reassign",
  "change_status",
  "change_priority",
  "assign_sprint",
  "delete",
]);

export type BulkTaskAction = z.infer<typeof bulkTaskActionSchema>;

export const bulkUpdateTasksSchema = z.object({
  taskIds: z.array(z.string().min(1)).min(1, "At least one task must be selected"),
  action: bulkTaskActionSchema,
  assigneeId: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  sprintId: z.string().optional().nullable(),
});

export type BulkUpdateTasksInput = z.infer<typeof bulkUpdateTasksSchema>;

export const reassignMemberTasksSchema = z.object({
  fromMembershipId: z.string().min(1, "Source member is required"),
  toMembershipId: z.string().min(1, "Target member is required"),
  reason: z.string().optional(),
});

export type ReassignMemberTasksInput = z.infer<typeof reassignMemberTasksSchema>;
