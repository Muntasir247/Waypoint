import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { getWorkspaceMembersAction } from "@/features/members/actions";
import { getPendingInvitesAction } from "@/features/invites/actions";
import { TeamManagementView } from "@/features/members/components/team-management-view";

export const instant = false;

export default async function TeamPage() {
  const { user, workspace, membership } = await getCurrentUserAndWorkspace();

  if (!user) {
    redirect("/login");
  }

  if (!workspace || !membership) {
    redirect("/workspaces/new");
  }

  const membersRes = await getWorkspaceMembersAction(workspace.id);
  const members = membersRes.success && membersRes.members ? membersRes.members : [];

  let pendingInvites: Array<{
    id: string;
    email: string;
    role: "ADMIN" | "DEVELOPER" | "VIEWER";
    expiresAt: Date;
    createdAt: Date;
    invitedBy?: { name: string | null; email: string } | null;
  }> = [];

  if (membership.role === "ADMIN") {
    const invitesRes = await getPendingInvitesAction(workspace.id);
    if (invitesRes.success && invitesRes.invites) {
      pendingInvites = invitesRes.invites as any;
    }
  }

  return (
    <AppShell>
      <TeamManagementView
        workspace={workspace}
        currentUserMembership={membership as any}
        members={members as any}
        pendingInvites={pendingInvites}
      />
    </AppShell>
  );
}
