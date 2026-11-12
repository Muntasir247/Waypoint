import { z } from "zod";

export const createInviteSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  role: z.enum(["ADMIN", "DEVELOPER", "VIEWER"]).default("DEVELOPER"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
