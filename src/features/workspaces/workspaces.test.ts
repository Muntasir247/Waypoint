import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWorkspaceAction, switchWorkspaceAction, updateWorkspaceAction } from "./actions";

// Mock auth session
const mockSession = {
  user: {
    id: "usr_alex",
    email: "techlead@waypoint.demo",
    name: "Alex Rivera",
    role: "ADMIN",
  },
};

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => mockSession),
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

// In-memory mock database
interface MockWorkspace {
  id: string;
  name: string;
  slug: string;
  createdById: string;
  allowDeveloperCreateTasks: boolean;
}

interface MockMembership {
  id: string;
  userId: string;
  workspaceId: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED";
  joinedAt: Date;
  workspace?: MockWorkspace;
}

const mockDbState = {
  workspaces: new Map<string, MockWorkspace>(),
  memberships: new Map<string, MockMembership>(),
  scoringConfigs: new Map<string, unknown>(),
};

vi.mock("@/lib/db", () => ({
  db: {
    workspace: {
      findUnique: vi.fn(async ({ where }: { where: { slug?: string; id?: string } }) => {
        if (where.slug) {
          for (const ws of mockDbState.workspaces.values()) {
            if (ws.slug === where.slug) return ws;
          }
        }
        if (where.id) return mockDbState.workspaces.get(where.id) || null;
        return null;
      }),
      create: vi.fn(async ({ data }: { data: MockWorkspace }) => {
        const ws: MockWorkspace = { ...data, id: data.id || `ws_${Date.now()}` };
        mockDbState.workspaces.set(ws.id, ws);
        return ws;
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<MockWorkspace> }) => {
          const ws = mockDbState.workspaces.get(where.id);
          if (ws) Object.assign(ws, data);
          return ws;
        },
      ),
    },
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
              return { ...m, workspace: mockDbState.workspaces.get(m.workspaceId) };
            }
          }
          if (where.id) {
            for (const m of mockDbState.memberships.values()) {
              if (m.id === where.id) {
                return { ...m, workspace: mockDbState.workspaces.get(m.workspaceId) };
              }
            }
          }
          return null;
        },
      ),
      create: vi.fn(async ({ data }: { data: MockMembership }) => {
        const m: MockMembership = {
          ...data,
          id: data.id || `mem_${Date.now()}`,
          joinedAt: new Date(),
        };
        mockDbState.memberships.set(`${m.userId}_${m.workspaceId}`, m);
        return m;
      }),
      findMany: vi.fn(async () => Array.from(mockDbState.memberships.values())),
      count: vi.fn(async () => 1),
    },
    scoringConfig: {
      create: vi.fn(async ({ data }: { data: { workspaceId: string } }) => {
        mockDbState.scoringConfigs.set(data.workspaceId, data);
        return data;
      }),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      // Execute the callback with the mocked db methods
      const { db } = await import("@/lib/db");
      return cb(db);
    }),
  },
}));

describe("Workspaces Feature", () => {
  beforeEach(() => {
    mockDbState.workspaces.clear();
    mockDbState.memberships.clear();
    mockDbState.scoringConfigs.clear();
    cookieStore.clear();
  });

  it("creates a new workspace with creator as ADMIN and initializes scoring config", async () => {
    const res = await createWorkspaceAction({
      name: "Core Platform",
      slug: "core-platform",
    });

    expect(res.success).toBe(true);
    expect(res.workspace).toBeDefined();
    expect(res.workspace?.name).toBe("Core Platform");
    expect(res.workspace?.slug).toBe("core-platform");

    // Verify creator became ADMIN
    const membershipKey = `usr_alex_${res.workspace?.id}`;
    const membership = mockDbState.memberships.get(membershipKey);
    expect(membership).toBeDefined();
    expect(membership?.role).toBe("ADMIN");

    // Verify active cookie was set
    expect(cookieStore.get("waypoint_active_workspace_id")).toBe(res.workspace?.id);
  });

  it("prevents duplicate workspace slugs", async () => {
    await createWorkspaceAction({
      name: "Core Platform",
      slug: "core-platform",
    });

    const duplicateRes = await createWorkspaceAction({
      name: "Another Platform",
      slug: "core-platform",
    });

    expect(duplicateRes.error).toBeDefined();
    expect(duplicateRes.error).toContain("already exists");
  });

  it("switches active workspace when user is a member", async () => {
    const created = await createWorkspaceAction({
      name: "Alpha Workspace",
      slug: "alpha-ws",
    });

    const wsId = created.workspace!.id;
    const switchRes = await switchWorkspaceAction(wsId);

    expect(switchRes.success).toBe(true);
    expect(cookieStore.get("waypoint_active_workspace_id")).toBe(wsId);
  });

  it("updates workspace settings (name and allowDeveloperCreateTasks)", async () => {
    const created = await createWorkspaceAction({
      name: "Beta Workspace",
      slug: "beta-ws",
    });

    const updateRes = await updateWorkspaceAction({
      workspaceId: created.workspace!.id,
      name: "Beta Workspace Renovated",
      allowDeveloperCreateTasks: true,
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.workspace?.name).toBe("Beta Workspace Renovated");
    expect(updateRes.workspace?.allowDeveloperCreateTasks).toBe(true);
  });
});
