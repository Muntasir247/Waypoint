import { z } from "zod";

export const updateRoleSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  membershipId: z.string().min(1, "Membership ID is required"),
  newRole: z.enum(["ADMIN", "DEVELOPER", "VIEWER"]),
});

export const updateAvailabilitySchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  membershipId: z.string().min(1, "Membership ID is required"),
  availability: z.enum(["ACTIVE", "ON_LEAVE", "OVERLOADED"]),
});

export const removeMemberSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  membershipId: z.string().min(1, "Membership ID is required"),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
