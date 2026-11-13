"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Prisma, Role, Availability } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
} from "./schemas";

const WORKSPACE_COOKIE_NAME = "waypoint_active_workspace_id";

/**
 * Resolves current user session, active workspace, and user's membership.
 */
export async function getCurrentUserAndWorkspace() {
  const session = await auth();
  if (!session?.user?.id) {
    return { user: null, workspace: null, membership: null, workspaces: [] };
  }

  const userId = session.user.id;
  const cookieStore = await cookies();
  const activeWorkspaceCookie = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;

  type MembershipWithWorkspace = Prisma.MembershipGetPayload<{
    include: { workspace: true };
  }>;

  // Retrieve all memberships for the current user
  let memberships: MembershipWithWorkspace[] = [];
  try {
    memberships = await db.membership.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
      orderBy: { joinedAt: "asc" },
    });

    // In demo mode, if user has no memberships, auto-seed the demo workspace
    if (memberships.length === 0) {
      const demoWorkspace = await ensureDemoWorkspaceForUser(userId, session.user.email);
      if (demoWorkspace) {
        memberships = await db.membership.findMany({
          where: { userId },
          include: { workspace: true },
        });
      }
    }
  } catch {
    const demoWs = {
      id: "demo-workspace-acme",
      name: "Acme Engineering",
      slug: "acme-engineering",
      createdAt: new Date(),
      updatedAt: new Date(),
      allowDeveloperCreateTasks: true,
    };
    const demoMem = {
      id: `demo-membership-${userId}`,
      userId,
      workspaceId: demoWs.id,
      role: ((session.user as { role?: Role }).role as Role) || ("ADMIN" as Role),
      availability: "ACTIVE" as Availability,
      joinedAt: new Date(),
      workspace: demoWs,
    };
    return {
      user: session.user,
      workspace: demoWs,
      membership: demoMem,
      workspaces: [{ ...demoWs, role: demoMem.role, isActive: true }],
    };
  }

  if (memberships.length === 0) {
    return {
      user: session.user,
      workspace: null,
      membership: null,
      workspaces: [],
    };
  }

  // Find active membership matching cookie or fallback to first
  let activeMembership = activeWorkspaceCookie
    ? memberships.find((m) => m.workspaceId === activeWorkspaceCookie)
    : undefined;

  if (!activeMembership) {
    activeMembership = memberships[0];
    cookieStore.set(WORKSPACE_COOKIE_NAME, activeMembership.workspaceId, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });
  }

  const workspacesList = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    role: m.role,
    isActive: m.workspaceId === activeMembership!.workspaceId,
  }));

  return {
    user: session.user,
    workspace: activeMembership.workspace,
    membership: activeMembership,
    workspaces: workspacesList,
  };
}

/**
 * Creates a new workspace and sets the creator as ADMIN.
 */
export async function createWorkspaceAction(input: CreateWorkspaceInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required to create a workspace" };
  }

  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid workspace input" };
  }

  const { name, slug } = parsed.data;

  // Verify slug uniqueness
  const existing = await db.workspace.findUnique({
    where: { slug },
  });

  if (existing) {
    return { error: "A workspace with this URL slug already exists. Please choose another." };
  }

  try {
    const newWorkspace = await db.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name,
          slug,
          createdById: session.user.id,
          allowDeveloperCreateTasks: false,
        },
      });

      // Creator is always ADMIN
      await tx.membership.create({
        data: {
          userId: session.user.id,
          workspaceId: ws.id,
          role: "ADMIN",
          availability: "ACTIVE",
        },
      });

      // Default scoring config (Section 7.1)
      await tx.scoringConfig.create({
        data: {
          workspaceId: ws.id,
          enabled: true,
          rules: {
            priorityMultipliers: { LOW: 1.0, MEDIUM: 1.25, HIGH: 1.5, CRITICAL: 2.0 },
            onTimeBonus: 1.2,
            latePenalty: 0.5,
            bouncePenaltyPercent: 0.1,
            capacityLimitPoints: 20,
          },
        },
      });

      return ws;
    });

    // Set cookie to active workspace
    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE_NAME, newWorkspace.id, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    return { success: true, workspace: newWorkspace };
  } catch (error) {
    console.error("Failed to create workspace:", error);
    return { error: "An unexpected error occurred while creating workspace" };
  }
}

/**
 * Switches the user's active workspace.
 */
export async function switchWorkspaceAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
    include: { workspace: true },
  });

  if (!membership) {
    return { error: "You are not a member of this workspace" };
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE_NAME, workspaceId, {
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { success: true, workspace: membership.workspace };
}

/**
 * Updates workspace settings (name, allowDeveloperCreateTasks).
 */
export async function updateWorkspaceAction(input: UpdateWorkspaceInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const parsed = updateWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid workspace update data" };
  }

  const { workspaceId, name, allowDeveloperCreateTasks } = parsed.data;

  const membership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  try {
    assertCan(membership, "manage:members");
  } catch {
    return { error: "Only workspace admins can update workspace settings" };
  }

  try {
    const updated = await db.workspace.update({
      where: { id: workspaceId },
      data: {
        name,
        allowDeveloperCreateTasks,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, workspace: updated };
  } catch (error) {
    console.error("Failed to update workspace:", error);
    return { error: "Failed to update workspace settings" };
  }
}

/**
 * Auto-seeds the default Acme Engineering demo workspace if none exists for demo accounts.
 */
async function ensureDemoWorkspaceForUser(userId: string, email?: string | null) {
  try {
    let demoWs = await db.workspace.findUnique({
      where: { slug: "acme-engineering" },
    });

    if (!demoWs) {
      demoWs = await db.workspace.create({
        data: {
          name: "Acme Engineering",
          slug: "acme-engineering",
          createdById: userId,
          allowDeveloperCreateTasks: false,
          scoringConfig: {
            create: {
              enabled: true,
              rules: {
                priorityMultipliers: { LOW: 1.0, MEDIUM: 1.25, HIGH: 1.5, CRITICAL: 2.0 },
                onTimeBonus: 1.2,
                latePenalty: 0.5,
                bouncePenaltyPercent: 0.1,
                capacityLimitPoints: 20,
              },
            },
          },
        },
      });
    }

    // Determine initial role based on demo email or default to ADMIN
    let assignedRole: "ADMIN" | "DEVELOPER" | "VIEWER" = "ADMIN";
    if (email === "developer@waypoint.demo") assignedRole = "DEVELOPER";
    if (email === "viewer@waypoint.demo") assignedRole = "VIEWER";

    await db.membership.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: demoWs.id,
        },
      },
      update: {},
      create: {
        userId,
        workspaceId: demoWs.id,
        role: assignedRole,
        availability: "ACTIVE",
      },
    });

    return demoWs;
  } catch (e) {
    console.warn("ensureDemoWorkspaceForUser fallback note:", e);
    return null;
  }
}
