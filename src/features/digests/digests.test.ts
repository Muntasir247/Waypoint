import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskStatus, Priority } from "@/types/enums";
import { sendWorkspaceDigestsAction } from "./actions";
import { db } from "@/lib/db";
import { mockEmailProvider } from "@/features/email/mock-provider";
import * as workspacesActions from "@/features/workspaces/actions";

vi.mock("@/lib/db", () => ({
  db: {
    membership: {
      findMany: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/features/email/mock-provider", () => ({
  mockEmailProvider: {
    sendEmail: vi.fn(),
  },
}));

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(),
}));

describe("Digests Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates and dispatches mock email digests to members with assigned tasks", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1", name: "Acme Eng" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["workspace"]
      >,
      user: { id: "user-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["user"]
      >,
      membership: { id: "mem-1" } as unknown as NonNullable<
        Awaited<ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>>["membership"]
      >,
      workspaces: [] as unknown as Awaited<
        ReturnType<typeof workspacesActions.getCurrentUserAndWorkspace>
      >["workspaces"],
    });

    vi.mocked(db.membership.findMany).mockResolvedValue([
      {
        id: "mem-1",
        workspaceId: "ws-1",
        user: { id: "user-1", name: "Alex Rivera", email: "alex@waypoint.dev" },
      },
    ] as unknown as Awaited<ReturnType<typeof db.membership.findMany>>);

    const now = new Date();
    const overdueDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    vi.mocked(db.task.findMany).mockResolvedValue([
      {
        id: "task-1",
        title: "Fix Stripe Webhook 500 error",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        estimatePoints: 4,
        dueDate: overdueDate,
        completedAt: null,
        project: { name: "Billing Service" },
      },
    ] as unknown as Awaited<ReturnType<typeof db.task.findMany>>);

    vi.mocked(mockEmailProvider.sendEmail).mockResolvedValue({ id: "email-1", success: true });

    const res = await sendWorkspaceDigestsAction("ws-1");

    expect(res.sentCount).toBe(1);
    expect(res.recipients).toContain("alex@waypoint.dev");
    expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alex@waypoint.dev",
        kind: "DIGEST",
        subject: expect.stringContaining("[Waypoint Digest] Daily Task Summary"),
        body: expect.stringContaining("Fix Stripe Webhook 500 error"),
      }),
    );
  });
});
