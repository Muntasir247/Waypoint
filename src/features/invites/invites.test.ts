import { describe, it, expect, vi, beforeEach } from "vitest";
import { createInviteAction, acceptInviteAction, getInviteDetails } from "./actions";

interface MockInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedById: string;
  workspace?: { id: string; name: string; slug: string };
  invitedBy?: { name: string | null; email: string };
}

interface MockMembership {
  id: string;
  userId: string;
  workspaceId: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED";
}

let mockCurrentUserId = "usr_admin";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: mockCurrentUserId,
      email: "techlead@waypoint.demo",
      name: "Alex Rivera",
    },
  })),
}));

// Mock cookies
const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => ({ value: cookieStore.get(key) }),
    set: (key: string, value: string) => cookieStore.set(key, value),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDbState = {
  invites: new Map<string, MockInvite>(),
  memberships: new Map<string, MockMembership>(),
  sentEmails: [] as Array<{ to: string; subject: string; kind: string }>,
};

vi.mock("@/features/email", () => ({
  emailProvider: {
    sendInviteEmail: vi.fn(async (to: string, workspaceName: string) => {
      mockDbState.sentEmails.push({
        to,
        subject: `You've been invited to join ${workspaceName} on Waypoint`,
        kind: "INVITE",
      });
      return { id: "email_1", success: true };
    }),
  },
}));

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
            const key = `${where.userId_workspaceId.userId}_${where.userId_workspaceId.workspaceId}`;
            const m = mockDbState.memberships.get(key);
            if (m) {
              return {
                ...m,
                workspace: {
                  id: m.workspaceId,
                  name: "Acme Engineering",
                  slug: "acme-engineering",
                },
              };
            }
          }
          return null;
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { userId_workspaceId: { userId: string; workspaceId: string } };
          create: MockMembership;
          update: Partial<MockMembership>;
        }) => {
          const key = `${where.userId_workspaceId.userId}_${where.userId_workspaceId.workspaceId}`;
          const existing = mockDbState.memberships.get(key);
          if (existing) {
            Object.assign(existing, update);
            return existing;
          }
          const m: MockMembership = { ...create, id: `mem_${Date.now()}` };
          mockDbState.memberships.set(key, m);
          return m;
        },
      ),
    },
    user: {
      findUnique: vi.fn(async () => null),
    },
    invite: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
      create: vi.fn(async ({ data }: { data: Omit<MockInvite, "id" | "acceptedAt"> }) => {
        const invite: MockInvite = {
          ...data,
          id: `inv_${Date.now()}`,
          acceptedAt: null,
          workspace: { id: data.workspaceId, name: "Acme Engineering", slug: "acme-engineering" },
          invitedBy: { name: "Alex Rivera", email: "techlead@waypoint.demo" },
        };
        mockDbState.invites.set(invite.token, invite);
        return invite;
      }),
      findUnique: vi.fn(async ({ where }: { where: { token: string } }) => {
        return mockDbState.invites.get(where.token) || null;
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<MockInvite> }) => {
          for (const inv of mockDbState.invites.values()) {
            if (inv.id === where.id) {
              Object.assign(inv, data);
              return inv;
            }
          }
          return null;
        },
      ),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      const { db } = await import("@/lib/db");
      return cb(db);
    }),
  },
}));

describe("Invites Flow and Acceptance", () => {
  beforeEach(() => {
    mockDbState.invites.clear();
    mockDbState.memberships.clear();
    mockDbState.sentEmails = [];
    cookieStore.clear();

    mockCurrentUserId = "usr_admin";

    // Setup Admin membership in workspace ws_acme
    mockDbState.memberships.set("usr_admin_ws_acme", {
      id: "mem_admin",
      userId: "usr_admin",
      workspaceId: "ws_acme",
      role: "ADMIN",
      availability: "ACTIVE",
    });
  });

  it("Admin successfully creates an invite and sends a mock email", async () => {
    const res = await createInviteAction({
      workspaceId: "ws_acme",
      email: "newdeveloper@waypoint.demo",
      role: "DEVELOPER",
    });

    expect(res.success).toBe(true);
    expect(res.inviteUrl).toBeDefined();
    expect(res.invite?.token).toBeDefined();
    expect(res.invite?.role).toBe("DEVELOPER");

    // Verify simulated email was recorded
    expect(mockDbState.sentEmails.length).toBe(1);
    expect(mockDbState.sentEmails[0].to).toBe("newdeveloper@waypoint.demo");
    expect(mockDbState.sentEmails[0].kind).toBe("INVITE");
  });

  it("Non-admin is blocked from creating invites", async () => {
    mockCurrentUserId = "usr_dev_guest";
    mockDbState.memberships.set("usr_dev_guest_ws_acme", {
      id: "mem_dev",
      userId: "usr_dev_guest",
      workspaceId: "ws_acme",
      role: "DEVELOPER",
      availability: "ACTIVE",
    });

    const res = await createInviteAction({
      workspaceId: "ws_acme",
      email: "viewer@external.io",
      role: "VIEWER",
    });

    expect(res.error).toBeDefined();
    expect(res.error).toContain("Only administrators can invite");
  });

  it("Invitee can view public details and accept invite to become a member", async () => {
    // Admin creates invite
    const inviteRes = await createInviteAction({
      workspaceId: "ws_acme",
      email: "sarah@waypoint.demo",
      role: "DEVELOPER",
    });

    const token = inviteRes.invite!.token;

    // Public details lookup
    const details = await getInviteDetails(token);
    expect(details.success).toBe(true);
    expect(details.invite?.workspaceName).toBe("Acme Engineering");
    expect(details.invite?.role).toBe("DEVELOPER");
    expect(details.invite?.isExpired).toBe(false);
    expect(details.invite?.isAccepted).toBe(false);

    // Sarah signs in and accepts
    mockCurrentUserId = "usr_sarah";
    const acceptRes = await acceptInviteAction(token);

    expect(acceptRes.success).toBe(true);
    expect(acceptRes.workspaceSlug).toBe("acme-engineering");

    // Verify membership was created with DEVELOPER role
    const membership = mockDbState.memberships.get("usr_sarah_ws_acme");
    expect(membership).toBeDefined();
    expect(membership?.role).toBe("DEVELOPER");

    // Verify invite marked accepted
    const acceptedInvite = mockDbState.invites.get(token);
    expect(acceptedInvite?.acceptedAt).toBeInstanceOf(Date);
  });

  it("Rejects expired invitations", async () => {
    const expiredInvite: MockInvite = {
      id: "inv_expired",
      workspaceId: "ws_acme",
      email: "late@waypoint.demo",
      role: "DEVELOPER",
      token: "expired_token_123",
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // Expired 1 hour ago
      acceptedAt: null,
      invitedById: "usr_admin",
      workspace: { id: "ws_acme", name: "Acme Engineering", slug: "acme-engineering" },
    };
    mockDbState.invites.set("expired_token_123", expiredInvite);

    mockCurrentUserId = "usr_late";
    const acceptRes = await acceptInviteAction("expired_token_123");

    expect(acceptRes.error).toBeDefined();
    expect(acceptRes.error).toContain("expired");
  });

  it("Rejects already accepted invitations", async () => {
    const usedInvite: MockInvite = {
      id: "inv_used",
      workspaceId: "ws_acme",
      email: "used@waypoint.demo",
      role: "DEVELOPER",
      token: "used_token_456",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      acceptedAt: new Date(), // Already accepted
      invitedById: "usr_admin",
      workspace: { id: "ws_acme", name: "Acme Engineering", slug: "acme-engineering" },
    };
    mockDbState.invites.set("used_token_456", usedInvite);

    mockCurrentUserId = "usr_someone_else";
    const acceptRes = await acceptInviteAction("used_token_456");

    expect(acceptRes.error).toBeDefined();
    expect(acceptRes.error).toContain("already been accepted");
  });
});
