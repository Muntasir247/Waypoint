"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  Mail,
  UserPlus,
  Search,
  MoreHorizontal,
  Trash2,
  ShieldCheck,
  Code,
  Eye,
  ExternalLink,
} from "lucide-react";
import {
  updateMemberRoleAction,
  updateMemberAvailabilityAction,
  removeMemberAction,
} from "@/features/members/actions";
import { revokeInviteAction } from "@/features/invites/actions";
import { InviteModal } from "./invite-modal";

export interface TeamMember {
  id: string;
  userId: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED";
  joinedAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  skills: Array<{
    id: string;
    name: string;
    level: number;
  }>;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  expiresAt: Date | string;
  createdAt: Date | string;
  invitedBy?: {
    name: string | null;
    email: string;
  } | null;
}

interface TeamManagementViewProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  currentUserMembership: {
    id: string;
    role: "ADMIN" | "DEVELOPER" | "VIEWER";
  };
  members: TeamMember[];
  pendingInvites: PendingInvite[];
}

export function TeamManagementView({
  workspace,
  currentUserMembership,
  members: initialMembers,
  pendingInvites: initialInvites,
}: TeamManagementViewProps) {
  const [members, setMembers] = React.useState<TeamMember[]>(initialMembers);
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>(initialInvites);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL");
  const [availabilityFilter, setAvailabilityFilter] = React.useState<string>("ALL");
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [activeMenuMemberId, setActiveMenuMemberId] = React.useState<string | null>(null);
  const [currentTime] = React.useState(() => Date.now());

  const isAdmin = currentUserMembership.role === "ADMIN";

  // Counts
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.availability === "ACTIVE").length;
  const onLeaveCount = members.filter((m) => m.availability === "ON_LEAVE").length;
  const overloadedCount = members.filter((m) => m.availability === "OVERLOADED").length;
  const invitesCount = pendingInvites.length;

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    const nameMatch = m.user.name?.toLowerCase().includes(q) || false;
    const emailMatch = m.user.email.toLowerCase().includes(q);
    const skillMatch = m.skills.some((s) => s.name.toLowerCase().includes(q));

    const matchesSearch = !search || nameMatch || emailMatch || skillMatch;
    const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
    const matchesAvailability =
      availabilityFilter === "ALL" || m.availability === availabilityFilter;

    return matchesSearch && matchesRole && matchesAvailability;
  });

  const handleRoleChange = async (
    membershipId: string,
    newRole: "ADMIN" | "DEVELOPER" | "VIEWER",
  ) => {
    setActionError(null);
    setActionSuccess(null);

    const res = await updateMemberRoleAction({
      workspaceId: workspace.id,
      membershipId,
      newRole,
    });

    if (res.error) {
      setActionError(res.error);
    } else {
      setActionSuccess("Member role updated successfully");
      setMembers((prev) => prev.map((m) => (m.id === membershipId ? { ...m, role: newRole } : m)));
    }
  };

  const handleAvailabilityChange = async (
    membershipId: string,
    availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED",
  ) => {
    setActionError(null);
    setActionSuccess(null);

    const res = await updateMemberAvailabilityAction({
      workspaceId: workspace.id,
      membershipId,
      availability,
    });

    if (res.error) {
      setActionError(res.error);
    } else {
      setActionSuccess("Availability status updated");
      setMembers((prev) => prev.map((m) => (m.id === membershipId ? { ...m, availability } : m)));
    }
  };

  const handleRemoveMember = async (membershipId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    const res = await removeMemberAction({
      workspaceId: workspace.id,
      membershipId,
    });

    if (res.error) {
      setActionError(res.error);
    } else {
      setActionSuccess(`${memberName} removed from workspace`);
      setMembers((prev) => prev.filter((m) => m.id !== membershipId));
    }
    setActiveMenuMemberId(null);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;

    setActionError(null);
    const res = await revokeInviteAction(inviteId, workspace.id);
    if (res.error) {
      setActionError(res.error);
    } else {
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      setActionSuccess("Invite revoked");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <ShieldCheck className="h-3 w-3" />
            <span>Admin</span>
          </span>
        );
      case "DEVELOPER":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
            <Code className="h-3 w-3" />
            <span>Developer</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Eye className="h-3 w-3" />
            <span>Viewer</span>
          </span>
        );
    }
  };

  const getAvailabilityPill = (availability: string) => {
    switch (availability) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
          </span>
        );
      case "OVERLOADED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
            <span>Overloaded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>On Leave</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-muted-foreground mb-1 text-xs font-medium">
            <span>Workspace</span> / <span className="text-foreground">Team Management</span>
          </div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
            Team & Workspace Members
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage engineering roles, member availability, skill profiles, and invitations for{" "}
            {workspace.name}.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite New Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="animate-in fade-in rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="animate-in fade-in rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {actionSuccess}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 md:gap-4">
        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">Total Members</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-bold">{totalCount}</div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">Active Today</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">On Leave</span>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-600 dark:text-slate-400">
            {onLeaveCount}
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">Overloaded</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {overloadedCount}
          </div>
        </div>

        <div className="border-border bg-card col-span-2 rounded-2xl border p-4 shadow-xs sm:col-span-1">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">Pending Invites</span>
            <Mail className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {invitesCount}
          </div>
        </div>
      </div>

      {/* Directory Section */}
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs">
        {/* Filter bar */}
        <div className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or skill..."
              className="border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:bg-background h-9 w-full rounded-xl border pr-4 pl-9 text-xs focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border-border bg-muted/40 text-foreground h-9 rounded-xl border px-3 text-xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin (Tech Lead)</option>
              <option value="DEVELOPER">Developer</option>
              <option value="VIEWER">Viewer</option>
            </select>

            {/* Availability Filter */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="border-border bg-muted/40 text-foreground h-9 rounded-xl border px-3 text-xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">All Availability</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="OVERLOADED">Overloaded</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-border bg-muted/20 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                <th className="px-5 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Skills & Proficiency</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground py-8 text-center">
                    No members match the current search filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const initials = member.user.name
                    ? member.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : member.user.email.slice(0, 2).toUpperCase();

                  const canManageThisMember = isAdmin;
                  const canEditAvailability = isAdmin || member.id === currentUserMembership.id;

                  return (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      {/* Member Info */}
                      <td className="px-5 py-3">
                        <Link
                          href={`/profile/${member.id}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 font-bold text-white shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <div className="text-foreground font-semibold transition-colors group-hover:text-indigo-600">
                              {member.user.name || "Anonymous Member"}
                            </div>
                            <div className="text-muted-foreground text-[11px]">
                              {member.user.email}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        {canManageThisMember ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(
                                member.id,
                                e.target.value as "ADMIN" | "DEVELOPER" | "VIEWER",
                              )
                            }
                            className="border-border bg-muted/40 text-foreground rounded-lg border px-2 py-1 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="DEVELOPER">Developer</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        ) : (
                          getRoleBadge(member.role)
                        )}
                      </td>

                      {/* Availability */}
                      <td className="px-4 py-3">
                        {canEditAvailability ? (
                          <select
                            value={member.availability}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                member.id,
                                e.target.value as "ACTIVE" | "ON_LEAVE" | "OVERLOADED",
                              )
                            }
                            className="border-border bg-muted/40 text-foreground rounded-lg border px-2 py-1 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="ON_LEAVE">On Leave</option>
                            <option value="OVERLOADED">Overloaded</option>
                          </select>
                        ) : (
                          getAvailabilityPill(member.availability)
                        )}
                      </td>

                      {/* Skills */}
                      <td className="px-4 py-3">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {member.skills.length === 0 ? (
                            <span className="text-muted-foreground text-[11px] italic">
                              No skills listed
                            </span>
                          ) : (
                            member.skills.map((skill) => (
                              <span
                                key={skill.id}
                                className="bg-muted text-foreground border-border/50 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium"
                              >
                                <span>{skill.name}</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  [{skill.level}/5]
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="text-muted-foreground px-4 py-3 text-[11px]">
                        {new Date(member.joinedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuMemberId(
                                activeMenuMemberId === member.id ? null : member.id,
                              )
                            }
                            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {activeMenuMemberId === member.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveMenuMemberId(null)}
                              />
                              <div className="border-border bg-card absolute right-0 z-40 mt-1 w-44 rounded-xl border p-1 shadow-lg">
                                <Link
                                  href={`/profile/${member.id}`}
                                  className="text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>View Profile</span>
                                </Link>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveMember(
                                        member.id,
                                        member.user.name || member.user.email,
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Remove Member</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites Section */}
      {isAdmin && (
        <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs">
          <div className="border-border border-b p-5">
            <h2 className="text-foreground text-base font-semibold">
              Pending Invitations ({pendingInvites.length})
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Invitations expire automatically after 7 days if unaccepted.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-border bg-muted/20 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                  <th className="px-5 py-3">Invited Email</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {pendingInvites.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted-foreground py-6 text-center">
                      No pending invitations. Click &quot;Invite New Member&quot; to invite a
                      developer.
                    </td>
                  </tr>
                ) : (
                  pendingInvites.map((invite) => {
                    const daysLeft = Math.max(
                      0,
                      Math.ceil(
                        (new Date(invite.expiresAt).getTime() - currentTime) /
                          (1000 * 60 * 60 * 24),
                      ),
                    );

                    return (
                      <tr key={invite.id} className="hover:bg-muted/30 transition-colors">
                        <td className="text-foreground px-5 py-3 font-medium">{invite.email}</td>
                        <td className="px-4 py-3">{getRoleBadge(invite.role)}</td>
                        <td className="text-muted-foreground px-4 py-3">
                          {daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft} days`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={inviteModalOpen}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
