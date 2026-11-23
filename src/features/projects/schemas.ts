import { z } from "zod";
import { ProjectStatus, SprintStatus } from "@/types/enums";

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(80),
  description: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.ACTIVE),
  targetDate: z.string().optional().nullable(),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Project name must be at least 2 characters").max(80).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional(),
  targetDate: z.string().optional().nullable(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createSprintSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2, "Sprint name must be at least 2 characters").max(80),
  goal: z.string().max(1000).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.nativeEnum(SprintStatus).default(SprintStatus.PLANNED),
});

export type CreateSprintInput = z.input<typeof createSprintSchema>;

export const updateSprintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80).optional(),
  goal: z.string().max(1000).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.nativeEnum(SprintStatus).optional(),
});

export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;

export const createMilestoneSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2, "Milestone name must be at least 2 characters").max(80),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
