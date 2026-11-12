import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createNotification,
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  getUnreadNotificationCountAction,
} from "./actions";
import { db } from "@/lib/db";
import * as workspacesActions from "@/features/workspaces/actions";

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Notifications Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createNotification records a notification in the database", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
      workspaceId: "ws-1",
      type: "ASSIGNMENT",
      payload: { taskId: "task-10", taskTitle: "Build Stripe webhook" },
      readAt: null,
      createdAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof db.notification.create>>);

    const result = await createNotification({
      userId: "user-1",
      workspaceId: "ws-1",
      type: "ASSIGNMENT",
      payload: { taskId: "task-10", taskTitle: "Build Stripe webhook" },
    });

    expect(result).toBeDefined();
    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          workspaceId: "ws-1",
          type: "ASSIGNMENT",
        }),
      }),
    );
  });

  it("getNotificationsAction returns formatted notifications and unread count", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
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

    vi.mocked(db.notification.findMany).mockResolvedValue([
      {
        id: "notif-1",
        userId: "user-1",
        workspaceId: "ws-1",
        type: "BLOCKED",
        payload: {
          taskId: "t-1",
          taskTitle: "Database migration",
          reason: "Waiting on AWS credentials",
        },
        readAt: null,
        createdAt: new Date(),
      },
      {
        id: "notif-2",
        userId: "user-1",
        workspaceId: "ws-1",
        type: "STATUS_CHANGE",
        payload: {
          taskId: "t-2",
          taskTitle: "Refactor navbar",
          newStatus: "IN_REVIEW",
          actorName: "Sarah Connor",
        },
        readAt: new Date(),
        createdAt: new Date(),
      },
    ] as unknown as Awaited<ReturnType<typeof db.notification.findMany>>);

    vi.mocked(db.notification.count).mockResolvedValue(1);

    const res = await getNotificationsAction();
    expect(res.unreadCount).toBe(1);
    expect(res.notifications).toHaveLength(2);
    expect(res.notifications[0].title).toContain("Blocked: Database migration");
    expect(res.notifications[0].description).toContain("Waiting on AWS credentials");
    expect(res.notifications[1].description).toContain("Sarah Connor moved this task to IN_REVIEW");
  });

  it("markNotificationReadAction marks single notification as read", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
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

    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 1 });

    const res = await markNotificationReadAction({ notificationId: "notif-1" });
    expect(res.success).toBe(true);
    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "notif-1",
          userId: "user-1",
        }),
      }),
    );
  });

  it("markAllNotificationsReadAction marks all workspace notifications as read", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
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

    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 3 });

    const res = await markAllNotificationsReadAction();
    expect(res.success).toBe(true);
    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          workspaceId: "ws-1",
          readAt: null,
        }),
      }),
    );
  });

  it("getUnreadNotificationCountAction returns unread count", async () => {
    vi.mocked(workspacesActions.getCurrentUserAndWorkspace).mockResolvedValue({
      workspace: { id: "ws-1" } as unknown as NonNullable<
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

    vi.mocked(db.notification.count).mockResolvedValue(5);

    const res = await getUnreadNotificationCountAction();
    expect(res.count).toBe(5);
  });
});
