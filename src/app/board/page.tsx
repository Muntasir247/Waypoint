import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { getTasksAction } from "@/features/tasks/actions";
import { getMembersAction } from "@/features/members/actions";
import { getProjectsAction } from "@/features/projects/actions";
import { BoardWorkspaceView } from "@/components/views/board-workspace-view";
import { TaskItem } from "@/components/views/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const instant = false;

export default async function BoardPage() {
  const { user, workspace, membership } = await getCurrentUserAndWorkspace();

  if (!user || !workspace || !membership) {
    return (
      <AppShell>
        <div className="space-y-4 p-8 text-center">
          <h2 className="text-foreground text-lg font-bold">Workspace Required</h2>
          <p className="text-muted-foreground text-xs">
            Please log in and select or create an active workspace to view the task board.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go to Login</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const [tasksRes, membersRes, projectsRes] = await Promise.all([
    getTasksAction(),
    getMembersAction(),
    getProjectsAction(),
  ]);

  const initialTasks: TaskItem[] = (tasksRes.tasks as TaskItem[]) || [];
  const members =
    membersRes.members?.map((m) => ({
      id: m.id,
      name: m.user?.name || m.user?.email?.split("@")[0] || "Member",
      email: m.user?.email || "",
      image: m.user?.image || null,
    })) || [];
  const projects =
    projectsRes.projects?.map((p) => ({
      id: p.id,
      name: p.name,
    })) || [];

  return (
    <AppShell>
      <BoardWorkspaceView
        initialTasks={initialTasks}
        members={members}
        projects={projects}
        currentUserMembershipId={membership.id}
        currentUserRole={membership.role}
      />
    </AppShell>
  );
}
