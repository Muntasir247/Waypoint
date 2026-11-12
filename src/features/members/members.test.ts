import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateMemberRoleAction,
  updateMemberAvailabilityAction,
  removeMemberAction,
} from "./actions";

interface MockMembership {
  id: string;
  userId: string;
  workspaceId: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED";
  user: { id: string; name: string; email: string };
}

let mockCurrentUserId = "usr_admin_1";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: mockCurrentUserId,
      email: "alex@waypoint.dev",
      name: "Alex Rivera",
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockMemberships = new Map<string, MockMembership>();
const mockAuditLogs: Array<{ action: string; target: string }> = [];

vi.mock("@/lib/db", () => ({
  db: {
    membership: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { userId_workspaceId?: { userId: string; workspaceId: string }; id?: string };
        }) => {
          if (where.userId_workspaceId) {
            for (const m of mockMemberships.values()) {
              if (
                m.userId === where.userId_workspaceId.userId &&
                m.workspaceId === where.userId_workspaceId.workspaceId
              ) {
                return m;
              }
            }
          }
          if (where.id) {
            return mockMemberships.get(where.id) || null;
          }
          return null;
        },
      ),
      count: vi.fn(async ({ where }: { where: { workspaceId: string; role: string } }) => {
        let count = 0;
        for (const m of mockMemberships.values()) {
          if (m.workspaceId === where.workspaceId && m.role === where.role) {
            count++;
          }
        }
        return count;
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<MockMembership> }) => {
          const m = mockMemberships.get(where.id);
          if (m) Object.assign(m, data);
          return m;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const m = mockMemberships.get(where.id);
        mockMemberships.delete(where.id);
        return m;
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: { action: string; target: string } }) => {
        mockAuditLogs.push(data);
        return data;
      }),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const { db } = await import("@/lib/db");
      return cb(db);
    }),
  },
}));

describe("Member Management and Last Admin Protection", () => {
  beforeEach(() => {
    mockMemberships.clear();
    mockAuditLogs.length = 0;
    mockCurrentUserId = "usr_admin_1";

    // Seed 1 Admin, 1 Developer, 1 Viewer in ws_acme
    mockMemberships.set("mem_admin_1", {
      id: "mem_admin_1",
      userId: "usr_admin_1",
      workspaceId: "ws_acme",
      role: "ADMIN",
      availability: "ACTIVE",
      user: { id: "usr_admin_1", name: "Alex Rivera", email: "alex@waypoint.dev" },
    });

    mockMemberships.set("mem_dev_1", {
      id: "mem_dev_1",
      userId: "usr_dev_1",
      workspaceId: "ws_acme",
      role: "DEVELOPER",
      availability: "ACTIVE",
      user: { id: "usr_dev_1", name: "Sarah Chen", email: "sarah@waypoint.dev" },
    });

    mockMemberships.set("mem_viewer_1", {
      id: "mem_viewer_1",
      userId: "usr_viewer_1",
      workspaceId: "ws_acme",
      role: "VIEWER",
      availability: "ACTIVE",
      user: { id: "usr_viewer_1", name: "David Kim", email: "david@waypoint.dev" },
    });
  });

  it("Admin can promote a Developer to Admin", async () => {
    const res = await updateMemberRoleAction({
      workspaceId: "ws_acme",
      membershipId: "mem_dev_1",
      newRole: "ADMIN",
    });

    expect(res.success).toBe(true);
    expect(mockMemberships.get("mem_dev_1")?.role).toBe("ADMIN");
    expect(mockAuditLogs.some((l) => l.action === "MEMBER_ROLE_CHANGE")).toBe(true);
  });

  it("Strictly prevents demoting the last Admin in the workspace", async () => {
    // Only 1 Admin exists: mem_admin_1
    const res = await updateMemberRoleAction({
      workspaceId: "ws_acme",
      membershipId: "mem_admin_1",
      newRole: "DEVELOPER",
    });

    expect(res.error).toBeDefined();
    expect(res.error).toContain("Cannot demote the last administrator");
    expect(mockMemberships.get("mem_admin_1")?.role).toBe("ADMIN");
  });

  it("Allows demoting an Admin when another Admin exists", async () => {
    // Add a second Admin
    mockMemberships.set("mem_admin_2", {
      id: "mem_admin_2",
      userId: "usr_admin_2",
      workspaceId: "ws_acme",
      role: "ADMIN",
      availability: "ACTIVE",
      user: { id: "usr_admin_2", name: "Elena", email: "elena@waypoint.dev" },
    });

    const res = await updateMemberRoleAction({
      workspaceId: "ws_acme",
      membershipId: "mem_admin_1",
      newRole: "DEVELOPER",
    });

    expect(res.success).toBe(true);
    expect(mockMemberships.get("mem_admin_1")?.role).toBe("DEVELOPER");
  });

  it("Strictly prevents removing the last Admin from the workspace", async () => {
    const res = await removeMemberAction({
      workspaceId: "ws_acme",
      membershipId: "mem_admin_1",
    });

    expect(res.error).toBeDefined();
    expect(res.error).toContain("Cannot remove the last administrator");
    expect(mockMemberships.has("mem_admin_1")).toBe(true);
  });

  it("Admin can remove a non-admin member", async () => {
    const res = await removeMemberAction({
      workspaceId: "ws_acme",
      membershipId: "mem_dev_1",
    });

    expect(res.success).toBe(true);
    expect(mockMemberships.has("mem_dev_1")).toBe(false);
    expect(mockAuditLogs.some((l) => l.action === "MEMBER_REMOVED")).toBe(true);
  });

  it("Allows members to update their own availability status", async () => {
    mockCurrentUserId = "usr_dev_1";

    const res = await updateMemberAvailabilityAction({
      workspaceId: "ws_acme",
      membershipId: "mem_dev_1",
      availability: "OVERLOADED",
    });

    expect(res.success).toBe(true);
    expect(mockMemberships.get("mem_dev_1")?.availability).toBe("OVERLOADED");
  });

  it("Prevents non-admins from changing other members' roles", async () => {
    mockCurrentUserId = "usr_dev_1"; // Developer role

    const res = await updateMemberRoleAction({
      workspaceId: "ws_acme",
      membershipId: "mem_viewer_1",
      newRole: "ADMIN",
    });

    expect(res.error).toBeDefined();
    expect(res.error).toContain("Only administrators can change member roles");
  });
});
