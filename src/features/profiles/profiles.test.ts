import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateProfileAction,
  addSkillAction,
  updateSkillLevelAction,
  removeSkillAction,
  getProfileDetailsAction,
} from "./actions";

interface MockSkill {
  id: string;
  workspaceId: string;
  name: string;
}

interface MockMemberSkill {
  id: string;
  membershipId: string;
  skillId: string;
  level: number;
  skill?: MockSkill;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: Date;
}

interface MockMembership {
  id: string;
  userId: string;
  workspaceId: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED";
  joinedAt: Date;
}

const mockDbState = {
  users: new Map<string, MockUser>(),
  memberships: new Map<string, MockMembership>(),
  skills: new Map<string, MockSkill>(),
  memberSkills: new Map<string, MockMemberSkill>(),
};

let currentUserId = "usr_sarah";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: currentUserId,
      email: "sarah@waypoint.demo",
      name: "Sarah Chen",
    },
  })),
}));

vi.mock("@/features/workspaces/actions", () => ({
  getCurrentUserAndWorkspace: vi.fn(async () => ({
    user: { id: currentUserId },
    workspace: { id: "ws_acme", name: "Acme Engineering", slug: "acme-engineering" },
    membership: mockDbState.memberships.get("mem_sarah"),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockUser> }) => {
        const user = mockDbState.users.get(where.id);
        if (user) Object.assign(user, data);
        return user;
      }),
    },
    membership: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { userId_workspaceId?: { userId: string; workspaceId: string }; id?: string };
        }) => {
          if (where.id) {
            const m = mockDbState.memberships.get(where.id);
            if (!m) return null;
            return {
              ...m,
              user: mockDbState.users.get(m.userId),
              workspace: { id: m.workspaceId, name: "Acme Engineering", slug: "acme-engineering" },
              memberSkills: Array.from(mockDbState.memberSkills.values())
                .filter((ms) => ms.membershipId === m.id)
                .map((ms) => ({ ...ms, skill: mockDbState.skills.get(ms.skillId) })),
              memberBadges: [],
            };
          }
          if (where.userId_workspaceId) {
            for (const m of mockDbState.memberships.values()) {
              if (
                m.userId === where.userId_workspaceId.userId &&
                m.workspaceId === where.userId_workspaceId.workspaceId
              ) {
                return m;
              }
            }
          }
          return null;
        },
      ),
    },
    skill: {
      upsert: vi.fn(
        async ({
          where,
          create,
        }: {
          where: { workspaceId_name: { workspaceId: string; name: string } };
          create: { workspaceId: string; name: string };
        }) => {
          let s = Array.from(mockDbState.skills.values()).find(
            (item) =>
              item.workspaceId === where.workspaceId_name.workspaceId &&
              item.name.toLowerCase() === where.workspaceId_name.name.toLowerCase(),
          );
          if (!s) {
            s = { id: `skill_${Date.now()}_${Math.random()}`, ...create };
            mockDbState.skills.set(s.id, s);
          }
          return s;
        },
      ),
    },
    memberSkill: {
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { membershipId_skillId: { membershipId: string; skillId: string } };
          create: { membershipId: string; skillId: string; level: number };
          update: { level: number };
        }) => {
          const key = `${where.membershipId_skillId.membershipId}_${where.membershipId_skillId.skillId}`;
          let ms = mockDbState.memberSkills.get(key);
          if (ms) {
            Object.assign(ms, update);
          } else {
            ms = { id: `ms_${Date.now()}`, ...create };
            mockDbState.memberSkills.set(key, ms);
          }
          return ms;
        },
      ),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        for (const ms of mockDbState.memberSkills.values()) {
          if (ms.id === where.id) {
            return {
              ...ms,
              membership: mockDbState.memberships.get(ms.membershipId),
            };
          }
        }
        return null;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { level: number } }) => {
        for (const ms of mockDbState.memberSkills.values()) {
          if (ms.id === where.id) {
            Object.assign(ms, data);
            return ms;
          }
        }
        return null;
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        for (const [key, ms] of mockDbState.memberSkills.entries()) {
          if (ms.id === where.id) {
            mockDbState.memberSkills.delete(key);
            return ms;
          }
        }
        return null;
      }),
    },
    task: {
      findMany: vi.fn(async () => []),
    },
    scoreEvent: {
      findMany: vi.fn(async () => []),
    },
  },
}));

describe("Profiles & Skills Management", () => {
  beforeEach(() => {
    mockDbState.users.clear();
    mockDbState.memberships.clear();
    mockDbState.skills.clear();
    mockDbState.memberSkills.clear();

    currentUserId = "usr_sarah";

    mockDbState.users.set("usr_sarah", {
      id: "usr_sarah",
      name: "Sarah Chen",
      email: "sarah@waypoint.demo",
      image: null,
      createdAt: new Date(),
    });

    mockDbState.memberships.set("mem_sarah", {
      id: "mem_sarah",
      userId: "usr_sarah",
      workspaceId: "ws_acme",
      role: "DEVELOPER",
      availability: "ACTIVE",
      joinedAt: new Date(),
    });
  });

  it("updates user profile name and image avatar", async () => {
    const res = await updateProfileAction({
      name: "Sarah Chen-Rodriguez",
      image:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });

    expect(res.success).toBe(true);
    expect(res.user?.name).toBe("Sarah Chen-Rodriguez");
    expect(res.user?.image).toContain("data:image/png;base64");
  });

  it("adds engineering skill with level 1-5 to member profile", async () => {
    const res = await addSkillAction({
      workspaceId: "ws_acme",
      membershipId: "mem_sarah",
      skillName: "TypeScript",
      level: 5,
    });

    expect(res.success).toBe(true);
    expect(res.memberSkill).toBeDefined();
    expect(res.memberSkill?.level).toBe(5);
  });

  it("updates skill proficiency level", async () => {
    const addRes = await addSkillAction({
      workspaceId: "ws_acme",
      membershipId: "mem_sarah",
      skillName: "Rust",
      level: 3,
    });

    const msId = addRes.memberSkill!.id;
    const updateRes = await updateSkillLevelAction({
      memberSkillId: msId,
      level: 4,
    });

    expect(updateRes.success).toBe(true);
  });

  it("removes a skill from member profile", async () => {
    const addRes = await addSkillAction({
      workspaceId: "ws_acme",
      membershipId: "mem_sarah",
      skillName: "GraphQL",
      level: 4,
    });

    const msId = addRes.memberSkill!.id;
    const removeRes = await removeSkillAction({
      memberSkillId: msId,
    });

    expect(removeRes.success).toBe(true);
  });

  it("loads profile details with skills and stats", async () => {
    await addSkillAction({
      workspaceId: "ws_acme",
      membershipId: "mem_sarah",
      skillName: "Go",
      level: 5,
    });

    const profileRes = await getProfileDetailsAction("mem_sarah");

    expect(profileRes.success).toBe(true);
    expect(profileRes.profile?.name).toBe("Sarah Chen");
    expect(profileRes.profile?.skills.length).toBe(1);
    expect(profileRes.profile?.skills[0].name).toBe("Go");
    expect(profileRes.profile?.stats).toBeDefined();
  });
});
