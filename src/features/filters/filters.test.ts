import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSavedFiltersAction, createSavedFilterAction, deleteSavedFilterAction } from "./actions";
import { TaskStatus, Priority } from "@/types/enums";

const currentMockUser = {
  id: "usr_dev_1",
  email: "dev@waypoint.dev",
  name: "Sarah Chen",
};

const currentMockMembership = {
  id: "mem_dev_1",
  role: "DEVELOPER" as const,
  userId: "usr_dev_1",
  workspaceId: "ws_acme",
};

const mockWorkspace = {
  id: "ws_acme",
  name: "Acme Engineering",
  slug: "acme-eng",
};

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(async () => ({
    user: currentMockUser,
    workspace: mockWorkspace,
    membership: currentMockMembership,
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDbSavedFilter = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: {
    savedFilter: {
      findMany: (...args: unknown[]) => mockDbSavedFilter.findMany(...args),
      findUnique: (...args: unknown[]) => mockDbSavedFilter.findUnique(...args),
      create: (...args: unknown[]) => mockDbSavedFilter.create(...args),
      delete: (...args: unknown[]) => mockDbSavedFilter.delete(...args),
    },
  },
}));

describe("SavedFilter Feature Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a saved filter for the user and workspace", async () => {
    const fakeFilter = {
      id: "filter_1",
      userId: "usr_dev_1",
      workspaceId: "ws_acme",
      name: "High Priority Blockers",
      query: {
        statuses: [TaskStatus.BLOCKED],
        priorities: [Priority.HIGH, Priority.CRITICAL],
      },
      createdAt: new Date("2026-11-12T10:00:00Z"),
    };

    mockDbSavedFilter.create.mockResolvedValue(fakeFilter);

    const res = await createSavedFilterAction({
      name: "High Priority Blockers",
      query: {
        statuses: [TaskStatus.BLOCKED],
        priorities: [Priority.HIGH, Priority.CRITICAL],
      },
    });

    expect(res.error).toBeNull();
    expect(res.filter).toBeDefined();
    expect(res.filter?.name).toBe("High Priority Blockers");
    expect(mockDbSavedFilter.create).toHaveBeenCalledWith({
      data: {
        userId: "usr_dev_1",
        workspaceId: "ws_acme",
        name: "High Priority Blockers",
        query: {
          statuses: [TaskStatus.BLOCKED],
          priorities: [Priority.HIGH, Priority.CRITICAL],
        },
      },
    });
  });

  it("lists saved filters for current user in active workspace", async () => {
    mockDbSavedFilter.findMany.mockResolvedValue([
      {
        id: "filter_1",
        userId: "usr_dev_1",
        workspaceId: "ws_acme",
        name: "Sprint 24 Scope",
        query: { sprintId: "spr_24" },
        createdAt: new Date("2026-11-12T10:00:00Z"),
      },
    ]);

    const res = await getSavedFiltersAction();
    expect(res.error).toBeNull();
    expect(res.filters).toHaveLength(1);
    expect(res.filters[0].name).toBe("Sprint 24 Scope");
    expect(mockDbSavedFilter.findMany).toHaveBeenCalledWith({
      where: {
        userId: "usr_dev_1",
        workspaceId: "ws_acme",
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("deletes a saved filter when user owns it", async () => {
    mockDbSavedFilter.findUnique.mockResolvedValue({
      id: "filter_1",
      userId: "usr_dev_1",
      workspaceId: "ws_acme",
    });
    mockDbSavedFilter.delete.mockResolvedValue({ id: "filter_1" });

    const res = await deleteSavedFilterAction("filter_1");
    expect(res.success).toBe(true);
    expect(res.error).toBeNull();
    expect(mockDbSavedFilter.delete).toHaveBeenCalledWith({
      where: { id: "filter_1" },
    });
  });

  it("refuses to delete a saved filter if owned by someone else", async () => {
    mockDbSavedFilter.findUnique.mockResolvedValue({
      id: "filter_2",
      userId: "usr_other",
      workspaceId: "ws_acme",
    });

    const res = await deleteSavedFilterAction("filter_2");
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/unauthorized|not found/i);
    expect(mockDbSavedFilter.delete).not.toHaveBeenCalled();
  });
});
