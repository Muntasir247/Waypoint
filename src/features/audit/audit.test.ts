import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@/types/enums";
import { getAuditLogsAction } from "./actions";
import { db } from "@/lib/db";
import * as workspacesActions from "@/features/workspaces/actions";

vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    membership: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(),
}));

describe("Audit Log Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admin members from viewing the audit log", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["workspace"]
      >,
      user: { id: "user-dev" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["user"]
      >,
      membership: { id: "mem-dev", role: Role.DEVELOPER } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["membership"]
      >,
      workspaces: [] as unknown as Awaited<
        ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>
      >["workspaces"],
    });

    const res = await getAuditLogsAction();
    expect(res.error).toBeDefined();
    expect(res.logs).toHaveLength(0);
  });

  it("allows Admin to retrieve audit logs with formatted actor info", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["workspace"]
      >,
      user: { id: "user-admin" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["user"]
      >,
      membership: { id: "mem-admin", role: Role.ADMIN } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["membership"]
      >,
      workspaces: [] as unknown as Awaited<
        ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>
      >["workspaces"],
    });

    vi.mocked(db.auditLog.findMany)
      .mockResolvedValueOnce([
        {
          id: "log-1",
          workspaceId: "ws-1",
          actorId: "mem-admin",
          action: "TASK_DELETED",
          target: "Stripe Webhook Bug",
          metadata: { taskId: "task-99", points: 4 },
          createdAt: new Date(),
        },
      ] as unknown as Awaited<ReturnType<typeof db.auditLog.findMany>>)
      .mockResolvedValueOnce([
        { action: "TASK_DELETED" },
        { action: "MEMBER_ROLE_CHANGE" },
      ] as unknown as Awaited<ReturnType<typeof db.auditLog.findMany>>);

    vi.mocked(db.auditLog.count).mockResolvedValue(1);

    vi.mocked(db.membership.findMany).mockResolvedValue([
      {
        id: "mem-admin",
        user: {
          id: "user-admin",
          name: "Alex Rivera",
          email: "alex@waypoint.dev",
          image: null,
        },
      },
    ] as unknown as Awaited<ReturnType<typeof db.membership.findMany>>);

    const res = await getAuditLogsAction();
    expect(res.error).toBeUndefined();
    expect(res.totalCount).toBe(1);
    expect(res.logs[0].actorName).toBe("Alex Rivera");
    expect(res.logs[0].action).toBe("TASK_DELETED");
    expect(res.logs[0].metadata?.taskId).toBe("task-99");
    expect(res.availableActions).toContain("TASK_DELETED");
  });
});
