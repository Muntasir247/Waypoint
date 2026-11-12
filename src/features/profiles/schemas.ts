import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  image: z.string().optional().nullable(),
});

export const addSkillSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  membershipId: z.string().min(1, "Membership ID is required"),
  skillName: z.string().trim().min(1, "Skill name is required").max(30),
  level: z.number().int().min(1).max(5).default(3),
});

export const updateSkillLevelSchema = z.object({
  memberSkillId: z.string().min(1, "Member skill ID is required"),
  level: z.number().int().min(1).max(5),
});

export const removeSkillSchema = z.object({
  memberSkillId: z.string().min(1, "Member skill ID is required"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type UpdateSkillLevelInput = z.infer<typeof updateSkillLevelSchema>;
export type RemoveSkillInput = z.infer<typeof removeSkillSchema>;
