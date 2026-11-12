import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  createSprintAction,
  updateSprintAction,
  createMilestoneAction,
} from "./actions";
import { AuthorizationError } from "@/lib/permissions";

// Mock user session
let currentMockUser = {
  id: "usr_admin",
  email: "admin@waypoint.dev",
  name: "Alex Rivera",
};

let currentMockMembership: {
  id: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  userId: string;
  workspaceId: string;
} = {
  id: "mem_admin_1",
  role: "ADMIN",
  userId: "usr_admin",
  workspaceId: "ws_acme",
};

const mockWorkspace = {
  id: "ws_acme",
  name: "Acme Engineering",
  slug: "acme-eng",
  allowDeveloperCreateTasks: false,
};

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(async () => ({
    user: currentMockUser,
    workspace: mockWorkspace,
    membership: currentMockMembership,
    workspaces: [{ id: "ws_acme", name: "Acme Engineering", role: currentMockMembership.role }],
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// In-memory mock database for projects
interface MockProject {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
  targetDate?: Date | null;
  createdAt: Date;
}

interface MockSprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  status: "PLANNED" | "ACTIVE" | "CLOSED";
  startDate?: Date | null;
  endDate?: Date | null;
}

interface MockMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  dueDate?: Date | null;
}

interface MockAuditLog {
  id: string;
  workspaceId: string;
  actorId: string;
  action: string;
  target: string;
}

const mockDbState = {
  projects: new Map<string, MockProject>(),
  sprints: new Map<string, MockSprint>(),
  milestones: new Map<string, MockMilestone>(),
  auditLogs: [] as MockAuditLog[],
};

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; workspaceId: string } }) => {
        const p = mockDbState.projects.get(where.id);
        if (p && p.workspaceId === where.workspaceId) return p;
        return null;
      }),
      create: vi.fn(async ({ data }: { data: Omit<MockProject, "id" | "createdAt"> }) => {
        const id = `proj_${Date.now()}_${Math.random()}`;
        const newProj: MockProject = { ...data, id, createdAt: new Date() };
        mockDbState.projects.set(id, newProj);
        return newProj;
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<MockProject> }) => {
          const existing = mockDbState.projects.get(where.id);
          if (!existing) throw new Error("Project not found");
          const updated = { ...existing, ...data };
          mockDbState.projects.set(where.id, updated);
          return updated;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        mockDbState.projects.delete(where.id);
        return { id: where.id };
      }),
    },
    sprint: {
      create: vi.fn(async ({ data }: { data: Omit<MockSprint, "id"> }) => {
        const id = `sprint_${Date.now()}`;
        const newSprint: MockSprint = { ...data, id };
        mockDbState.sprints.set(id, newSprint);
        return newSprint;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const s = mockDbState.sprints.get(where.id);
        if (!s) return null;
        const p = mockDbState.projects.get(s.projectId);
        return { ...s, project: p };
      }),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<MockSprint> }) => {
          const existing = mockDbState.sprints.get(where.id);
          if (!existing) throw new Error("Sprint not found");
          const updated = { ...existing, ...data };
          mockDbState.sprints.set(where.id, updated);
          return updated;
        },
      ),
    },
    milestone: {
      create: vi.fn(async ({ data }: { data: Omit<MockMilestone, "id"> }) => {
        const id = `ms_${Date.now()}`;
        const newMs: MockMilestone = { ...data, id };
        mockDbState.milestones.set(id, newMs);
        return newMs;
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: Omit<MockAuditLog, "id"> }) => {
        const newLog: MockAuditLog = { ...data, id: `audit_${Date.now()}` };
        mockDbState.auditLogs.push(newLog);
        return newLog;
      }),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => {
      return Promise.all(ops);
    }),
  },
}));

describe("Projects, Sprints & Milestones RBAC & Operations", () => {
  beforeEach(() => {
    mockDbState.projects.clear();
    mockDbState.sprints.clear();
    mockDbState.milestones.clear();
    mockDbState.auditLogs = [];

    currentMockUser = {
      id: "usr_admin",
      email: "admin@waypoint.dev",
      name: "Alex Rivera",
    };
    currentMockMembership = {
      id: "mem_admin_1",
      role: "ADMIN",
      userId: "usr_admin",
      workspaceId: "ws_acme",
    };
  });

  it("allows Admin to create, update, and delete projects with audit logging", async () => {
    // 1. Create project
    const createResult = await createProjectAction({
      name: "Core API v2 Gateway",
      description: "High-performance edge proxy",
      status: "ACTIVE",
      targetDate: "2025-06-30",
    });

    expect(createResult.error).toBeNull();
    expect(createResult.project).toBeDefined();
    expect(createResult.project?.name).toBe("Core API v2 Gateway");

    const projectId = createResult.project!.id;

    // 2. Update project
    const updateResult = await updateProjectAction({
      id: projectId,
      name: "Core API v2 Gateway - Updated",
      status: "COMPLETED",
    });

    expect(updateResult.error).toBeNull();
    expect(updateResult.project?.name).toBe("Core API v2 Gateway - Updated");
    expect(updateResult.project?.status).toBe("COMPLETED");

    // 3. Delete project
    const deleteResult = await deleteProjectAction(projectId);
    expect(deleteResult.error).toBeNull();
    expect(deleteResult.success).toBe(true);
    expect(mockDbState.projects.has(projectId)).toBe(false);

    // Verify audit log entry
    expect(mockDbState.auditLogs.some((l) => l.action === "PROJECT_DELETED")).toBe(true);
  });

  it("prevents Developer from creating or editing projects", async () => {
    // Switch to Developer role
    currentMockMembership = {
      id: "mem_dev_1",
      role: "DEVELOPER",
      userId: "usr_dev",
      workspaceId: "ws_acme",
    };

    await expect(
      createProjectAction({
        name: "Unauthorized Project",
      }),
    ).rejects.toThrow(AuthorizationError);
  });

  it("allows Admin to manage sprints and milestones for a project", async () => {
    // Setup a project
    const proj = await createProjectAction({
      name: "Telemetry Pipeline",
      status: "ACTIVE",
    });
    const projectId = proj.project!.id;

    // Create Sprint
    const sprintRes = await createSprintAction({
      projectId,
      name: "Sprint 24",
      goal: "Ship v1 exporter",
      status: "ACTIVE",
    });
    expect(sprintRes.error).toBeNull();
    expect(sprintRes.sprint?.name).toBe("Sprint 24");

    // Update Sprint
    const updateSprintRes = await updateSprintAction({
      id: sprintRes.sprint!.id,
      goal: "Ship v1 exporter and p99 alerts",
    });
    expect(updateSprintRes.error).toBeNull();
    expect(updateSprintRes.sprint?.goal).toBe("Ship v1 exporter and p99 alerts");

    // Create Milestone
    const milestoneRes = await createMilestoneAction({
      projectId,
      name: "Alpha Release",
      dueDate: "2025-05-15",
    });
    expect(milestoneRes.error).toBeNull();
    expect(milestoneRes.milestone?.name).toBe("Alpha Release");
  });
});
