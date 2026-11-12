import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { getMyTasksAction } from "@/features/tasks/actions";
import { MyTasksView } from "@/components/views/my-tasks-view";
import { TaskItem } from "@/components/views/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const instant = false;

export default async function MyTasksPage() {
  const { user, workspace, membership } = await getCurrentUserAndWorkspace();

  if (!user || !workspace || !membership) {
    return (
      <AppShell>
        <div className="space-y-4 p-8 text-center">
          <h2 className="text-foreground text-lg font-bold">Authentication Required</h2>
          <p className="text-muted-foreground text-xs">
            Please log in and select a workspace to view your assigned tasks.
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

  const res = await getMyTasksAction();
  const initialTasks: TaskItem[] = (res.tasks as TaskItem[]) || [];

  return (
    <AppShell>
      <MyTasksView
        initialTasks={initialTasks}
        initialMetrics={res.metrics}
        userName={user.name || (user.email ? user.email.split("@")[0] : "Developer")}
        userEmail={user.email || ""}
        userRole={membership.role}
        membershipId={membership.id}
      />
    </AppShell>
  );
}
