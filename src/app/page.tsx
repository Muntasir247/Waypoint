"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, UserPlus, ArrowRight } from "lucide-react";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { ProjectDashboardView } from "@/components/tech-lead/project-dashboard-view";

export default function HomePage() {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
                Tech Lead Overview
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Live Copilot
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Real-time sprint burndown, velocity analytics, developer workload, and blocker triage.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/workload"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Workload View</span>
              <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
            </Link>
            <Link
              href="/team"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus className="text-muted-foreground h-3.5 w-3.5" />
              <span>Invite</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(true)}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="text-muted-foreground h-3.5 w-3.5" />
              <span>New Project</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateTaskOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Live Project Dashboard Analytics */}
        <ProjectDashboardView key={refreshKey} />

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          onProjectCreated={() => setRefreshKey((k) => k + 1)}
        />

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          onTaskCreated={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </AppShell>
  );
}
