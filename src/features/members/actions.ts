"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { assertCan, canDemoteOrRemoveAdmin } from "@/lib/permissions";
import {
  updateRoleSchema,
  updateAvailabilitySchema,
  removeMemberSchema,
  type UpdateRoleInput,
  type UpdateAvailabilityInput,
  type RemoveMemberInput,
} from "./schemas";

/**
 * Retrieves all members of the specified workspace.
 */
export async function getWorkspaceMembersAction(workspaceId: string) {
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
  });

  try {
    assertCan(membership, "view:workspace");
  } catch {
    return { error: "You are not a member of this workspace" };
  }

  const members = await db.membership.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      memberSkills: {
        include: {
          skill: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return {
    success: true,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      availability: m.availability,
      joinedAt: m.joinedAt,
      user: m.user,
      skills: m.memberSkills.map((ms) => ({
        id: ms.skill.id,
        name: ms.skill.name,
        level: ms.level,
      })),
    })),
  };
}

/**
 * Updates a member's role (Admin only, with last admin protection).
 */
export async function updateMemberRoleAction(input: UpdateRoleInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { workspaceId, membershipId, newRole } = parsed.data;

  const actorMembership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  try {
    assertCan(actorMembership, "manage:roles");
  } catch {
    return { error: "Only administrators can change member roles" };
  }

  const targetMembership = await db.membership.findUnique({
    where: { id: membershipId },
    include: { user: true },
  });

  if (!targetMembership || targetMembership.workspaceId !== workspaceId) {
    return { error: "Member not found in this workspace" };
  }

  // Last Admin Demotion Protection
  if (targetMembership.role === "ADMIN" && newRole !== "ADMIN") {
    const totalAdmins = await db.membership.count({
      where: { workspaceId, role: "ADMIN" },
    });

    if (!canDemoteOrRemoveAdmin("ADMIN", totalAdmins)) {
      return {
        error:
          "Cannot demote the last administrator. A workspace must always retain at least one Admin. Promote another member first.",
      };
    }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: membershipId },
        data: { role: newRole },
      });

      // Audit Log for sensitive role change
      await tx.auditLog.create({
        data: {
          workspaceId,
          actorId: actorMembership.id,
          action: "MEMBER_ROLE_CHANGE",
          target: targetMembership.userId,
          metadata: {
            previousRole: targetMembership.role,
            newRole,
            targetEmail: targetMembership.user.email,
          },
        },
      });
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to update role:", error);
    return { error: "Failed to update member role" };
  }
}

/**
 * Updates member availability (Active, On Leave, Overloaded).
 */
export async function updateMemberAvailabilityAction(input: UpdateAvailabilityInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const parsed = updateAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { workspaceId, membershipId, availability } = parsed.data;

  const actorMembership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!actorMembership) {
    return { error: "Unauthorized" };
  }

  // Allowed if Admin OR self
  const isSelf = actorMembership.id === membershipId;
  const isAdmin = actorMembership.role === "ADMIN";

  if (!isSelf && !isAdmin) {
    return { error: "You can only update your own availability status" };
  }

  try {
    await db.membership.update({
      where: { id: membershipId },
      data: { availability },
    });

    revalidatePath("/team");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update availability:", error);
    return { error: "Failed to update availability status" };
  }
}

/**
 * Removes a member from the workspace (Admin only, with last admin protection).
 */
export async function removeMemberAction(input: RemoveMemberInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { workspaceId, membershipId } = parsed.data;

  const actorMembership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  try {
    assertCan(actorMembership, "manage:members");
  } catch {
    return { error: "Only administrators can remove workspace members" };
  }

  const targetMembership = await db.membership.findUnique({
    where: { id: membershipId },
    include: { user: true },
  });

  if (!targetMembership || targetMembership.workspaceId !== workspaceId) {
    return { error: "Member not found in this workspace" };
  }

  // Last Admin Removal Protection
  if (targetMembership.role === "ADMIN") {
    const totalAdmins = await db.membership.count({
      where: { workspaceId, role: "ADMIN" },
    });

    if (!canDemoteOrRemoveAdmin("ADMIN", totalAdmins)) {
      return {
        error: "Cannot remove the last administrator. A workspace must retain at least one Admin.",
      };
    }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.membership.delete({
        where: { id: membershipId },
      });

      // Audit Log for sensitive member removal
      await tx.auditLog.create({
        data: {
          workspaceId,
          actorId: actorMembership.id,
          action: "MEMBER_REMOVED",
          target: targetMembership.userId,
          metadata: {
            role: targetMembership.role,
            email: targetMembership.user.email,
          },
        },
      });
    });

    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return { error: "Failed to remove member" };
  }
}
