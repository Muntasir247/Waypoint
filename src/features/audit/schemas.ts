import { z } from "zod";

export const getAuditLogsInputSchema = z.object({
  action: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type GetAuditLogsInput = z.input<typeof getAuditLogsInputSchema>;

export interface FormattedAuditLog {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorImage?: string | null;
  action: string;
  target: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
