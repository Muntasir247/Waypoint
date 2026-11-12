import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

export const filterQuerySchema = z.object({
  search: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  statuses: z.array(z.nativeEnum(TaskStatus)).optional(),
  priorities: z.array(z.nativeEnum(Priority)).optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.enum(["all", "overdue", "today", "this_week", "next_week", "no_date"]).optional(),
  projectId: z.string().optional(),
  sprintId: z.string().optional(),
});

export type FilterQuery = z.infer<typeof filterQuerySchema>;

export const createSavedFilterSchema = z.object({
  name: z.string().min(1, "Filter name is required").max(60, "Filter name too long"),
  query: filterQuerySchema,
});

export type CreateSavedFilterInput = z.infer<typeof createSavedFilterSchema>;
