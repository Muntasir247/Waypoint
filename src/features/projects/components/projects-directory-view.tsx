"use client";

import * as React from "react";
import Link from "next/link";
import { FolderGit2, Plus, Search, Calendar, Rocket } from "lucide-react";
import { getProjectsAction } from "@/features/projects/actions";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { ProjectStatus } from "@/types/enums";

export interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  targetDate: string | null;
  createdAt: string;
  activeSprint: { id: string; name: string } | null;
  milestonesCount: number;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  totalPoints: number;
  completedPoints: number;
}

interface ProjectsDirectoryViewProps {
  initialProjects: ProjectItem[];
}

export function ProjectsDirectoryView({ initialProjects }: ProjectsDirectoryViewProps) {
  const [projects, setProjects] = React.useState<ProjectItem[]>(initialProjects);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);

  const refreshProjects = React.useCallback(() => {
    getProjectsAction().then((res) => {
      if (res.projects) {
        setProjects(res.projects);
      }
    });
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === "ALL" || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
              Engineering Projects
            </h1>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {projects.length} Total
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage multi-sprint technical initiatives, roadmap velocity, and milestone targets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreateTaskOpen(true)}
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="text-muted-foreground h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateProjectOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search initiatives by title or description..."
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2 pr-3 pl-9 text-xs outline-none focus:ring-2"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: "All", value: "ALL" },
            { label: "Active", value: ProjectStatus.ACTIVE },
            { label: "Planning", value: ProjectStatus.PLANNING },
            { label: "On Hold", value: ProjectStatus.ON_HOLD },
            { label: "Completed", value: ProjectStatus.COMPLETED },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedStatus === tab.value
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border border-dashed p-12 text-center">
          <FolderGit2 className="text-muted-foreground mx-auto h-10 w-10 opacity-50" />
          <h3 className="text-foreground mt-3 text-sm font-semibold">No projects found</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Create your first project to organize tasks and sprints"}
          </p>
          <button
            onClick={() => setIsCreateProjectOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => {
            const statusColors = {
              ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
              PLANNING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
              ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
              COMPLETED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
            };

            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="border-border bg-card group flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md dark:hover:border-indigo-600"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${
                        (statusColors as Record<string, string>)[p.status] ||
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                    {p.targetDate && (
                      <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(p.targetDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-foreground text-base font-bold tracking-tight transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {p.name}
                    </h2>
                    {p.description && (
                      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-border/50 mt-5 space-y-3 border-t pt-3">
                  {/* Sprint & milestone info */}
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Rocket className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-foreground font-medium">
                        {p.activeSprint ? p.activeSprint.name : "No active sprint"}
                      </span>
                    </div>
                    <span>{p.milestonesCount} milestones</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                      <span>
                        {p.completedTasks}/{p.totalTasks} tasks done
                      </span>
                      <span className="text-foreground font-semibold">{p.progressPercent}%</span>
                    </div>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={refreshProjects}
      />
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={projects[0]?.id ?? ""}
        initialProjects={projects.map((p) => ({ id: p.id, name: p.name }))}
        onTaskCreated={refreshProjects}
      />
    </div>
  );
}
