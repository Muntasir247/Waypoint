"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { emailProvider } from "@/features/email";
import { env } from "@/env";
import { createInviteSchema, type CreateInviteInput } from "./schemas";

const WORKSPACE_COOKIE_NAME = "waypoint_active_workspace_id";

/**
 * Creates an invitation for a new member to join a workspace.
 */
export async function createInviteAction(input: CreateInviteInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const parsed = createInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid invite parameters" };
  }

  const { workspaceId, email, role } = parsed.data;

  // Verify actor permission
  const actorMembership = await db.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
    include: { workspace: true },
  });

  try {
    assertCan(actorMembership, "manage:invites");
  } catch {
    return { error: "Only administrators can invite new members to this workspace" };
  }

  // Check if user is already a member
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: existingUser.id,
          workspaceId,
        },
      },
    });
    if (existingMembership) {
      return { error: `User with email ${email} is already a member of this workspace` };
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    // Remove any previous pending invite for this email in this workspace
    await db.invite.deleteMany({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
      },
    });

    const invite = await db.invite.create({
      data: {
        workspaceId,
        email,
        role,
        token,
        expiresAt,
        invitedById: session.user.id,
      },
    });

    const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    // Send mock email
    await emailProvider.sendInviteEmail(email, actorMembership.workspace.name, inviteUrl, role);

    revalidatePath("/team");
    return { success: true, invite, inviteUrl };
  } catch (error) {
    console.error("Failed to create invite:", error);
    return { error: "Failed to generate invitation" };
  }
}

/**
 * Retrieves public invite details for display on the accept invite screen.
 */
export async function getInviteDetails(token: string) {
  if (!token) {
    return { error: "Invite token is required" };
  }

  const invite = await db.invite.findUnique({
    where: { token },
    include: {
      workspace: true,
      invitedBy: {
        select: { name: true, email: true },
      },
    },
  });

  if (!invite) {
    return { error: "Invalid invitation token. This invite does not exist or has been removed." };
  }

  const isExpired = new Date() > invite.expiresAt;
  const isAccepted = invite.acceptedAt !== null;

  return {
    success: true,
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      workspaceName: invite.workspace.name,
      workspaceSlug: invite.workspace.slug,
      inviterName: invite.invitedBy?.name || "A workspace admin",
      isExpired,
      isAccepted,
      expiresAt: invite.expiresAt,
    },
  };
}

/**
 * Accepts an invitation and joins the workspace.
 */
export async function acceptInviteAction(token: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Please log in or sign up to accept this invitation", requiresAuth: true };
  }

  if (!token) {
    return { error: "Invite token is required" };
  }

  const invite = await db.invite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite) {
    return { error: "Invitation not found or invalid" };
  }

  if (invite.acceptedAt) {
    return { error: "This invitation has already been accepted" };
  }

  if (new Date() > invite.expiresAt) {
    return {
      error:
        "This invitation has expired. Please request a new invitation from your administrator.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      // Upsert membership
      await tx.membership.upsert({
        where: {
          userId_workspaceId: {
            userId: session.user.id,
            workspaceId: invite.workspaceId,
          },
        },
        update: {
          role: invite.role,
        },
        create: {
          userId: session.user.id,
          workspaceId: invite.workspaceId,
          role: invite.role,
          availability: "ACTIVE",
        },
      });

      // Mark invite as accepted
      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    });

    // Set active workspace cookie
    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE_NAME, invite.workspaceId, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    return { success: true, workspaceSlug: invite.workspace.slug };
  } catch (error) {
    console.error("Failed to accept invite:", error);
    return { error: "Failed to accept invitation" };
  }
}

/**
 * Retrieves pending (unaccepted, non-expired) invites for a workspace.
 */
export async function getPendingInvitesAction(workspaceId: string) {
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
    assertCan(membership, "manage:invites");
  } catch {
    return { error: "Unauthorized" };
  }

  const invites = await db.invite.findMany({
    where: {
      workspaceId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, invites };
}

/**
 * Revokes / deletes a pending invite.
 */
export async function revokeInviteAction(inviteId: string, workspaceId: string) {
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
    assertCan(membership, "manage:invites");
  } catch {
    return { error: "Unauthorized" };
  }

  await db.invite.deleteMany({
    where: {
      id: inviteId,
      workspaceId,
    },
  });

  revalidatePath("/team");
  return { success: true };
}
