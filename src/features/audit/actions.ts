"use server";

import { db } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { type GetAuditLogsInput, getAuditLogsInputSchema, type FormattedAuditLog } from "./schemas";

/**
 * Retrieve audit log events for the active workspace (Admin only).
 */
export async function getAuditLogsAction(input?: GetAuditLogsInput): Promise<{
  logs: FormattedAuditLog[];
  totalCount: number;
  availableActions: string[];
  error?: string;
}> {
  try {
    const { workspace, membership } = await getCurrentUserAndWorkspace();
    if (!workspace || !membership) {
      return { logs: [], totalCount: 0, availableActions: [], error: "Authentication required" };
    }

    // RBAC check: Only admins may inspect security audit logs
    assertCan(membership, "view:audit_log");

    const parsed = getAuditLogsInputSchema.safeParse(input || {});
    const { action, search, limit, offset } = parsed.success
      ? parsed.data
      : { action: undefined, search: undefined, limit: 50, offset: 0 };

    if (!db.auditLog?.findMany) {
      return { logs: [], totalCount: 0, availableActions: [] };
    }

    // Base query filter
    const whereClause: Record<string, unknown> = {
      workspaceId: workspace.id,
    };

    if (action && action !== "ALL") {
      whereClause.action = action;
    }

    if (search && search.trim()) {
      whereClause.OR = [
        { target: { contains: search.trim() } },
        { action: { contains: search.trim() } },
      ];
    }

    const [rawLogs, totalCount, distinctActions] = await Promise.all([
      db.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.auditLog.count({ where: whereClause }),
      db.auditLog.findMany({
        where: { workspaceId: workspace.id },
        select: { action: true },
        distinct: ["action"],
      }),
    ]);

    // Gather unique actorIds to fetch member user info
    const actorIds = Array.from(new Set(rawLogs.map((l) => l.actorId)));
    const actors = await db.membership.findMany({
      where: { id: { in: actorIds } },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    const actorMap = new Map(
      actors.map((m) => [
        m.id,
        {
          name: m.user?.name || "Unknown User",
          email: m.user?.email || "unknown@waypoint.dev",
          image: m.user?.image || null,
        },
      ]),
    );

    const formattedLogs: FormattedAuditLog[] = rawLogs.map((log) => {
      const actor = actorMap.get(log.actorId);
      return {
        id: log.id,
        workspaceId: log.workspaceId,
        actorId: log.actorId,
        actorName: actor?.name || "System Actor",
        actorEmail: actor?.email || "system@waypoint.dev",
        actorImage: actor?.image || null,
        action: log.action,
        target: log.target,
        metadata: (log.metadata as Record<string, unknown>) || null,
        createdAt: log.createdAt,
      };
    });

    const availableActions = distinctActions.map((a) => a.action).sort();

    return {
      logs: formattedLogs,
      totalCount,
      availableActions,
    };
  } catch (err) {
    console.error("Failed to get audit logs:", err);
    return {
      logs: [],
      totalCount: 0,
      availableActions: [],
      error: err instanceof Error ? err.message : "Access denied or failed to retrieve audit logs",
    };
  }
}
