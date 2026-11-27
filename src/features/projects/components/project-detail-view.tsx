"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar,
  Rocket,
  Flag,
  BarChart3,
  Trash2,
  ArrowLeft,
  ChevronRight,
  Kanban,
  List,
  Clock,
} from "lucide-react";
import { getProjectDetailAction, deleteProjectAction } from "@/features/projects/actions";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { CreateSprintModal } from "@/components/projects/create-sprint-modal";
import { CreateMilestoneModal } from "@/components/projects/create-milestone-modal";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { KanbanView } from "@/components/views/kanban-view";
import { ListView } from "@/components/views/list-view";
import { CalendarView } from "@/components/views/calendar-view";
import { TimelineView } from "@/components/views/timeline-view";
import { TaskItem } from "@/components/views/types";
import { ProjectDashboardView } from "@/components/tech-lead/project-dashboard-view";

export type ProjectDetailData = NonNullable<
  Awaited<ReturnType<typeof getProjectDetailAction>>["project"]
>;

interface ProjectDetailViewProps {
  initialProject: ProjectDetailData | null;
  projectId: string;
}

export function ProjectDetailView({ initialProject, projectId }: ProjectDetailViewProps) {
  const router = useRouter();
  const [project, setProject] = React.useState<ProjectDetailData | null>(initialProject);
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "kanban" | "list" | "calendar" | "timeline" | "sprints" | "milestones"
  >("overview");

  // Modals & Drawer
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = React.useState(false);
  const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = React.useState(false);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  const formattedTasks: TaskItem[] = React.useMemo(() => {
    if (!project) return [];
    return project.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      estimatePoints: t.estimatePoints,
      dueDate: t.dueDate
        ? typeof t.dueDate === "string"
          ? t.dueDate
          : (t.dueDate as Date).toISOString()
        : null,
      position: t.position,
      blockedReason: t.blockedReason,
      completedAt: t.completedAt
        ? typeof t.completedAt === "string"
          ? t.completedAt
          : (t.completedAt as Date).toISOString()
        : null,
      createdAt:
        typeof t.createdAt === "string" ? t.createdAt : (t.createdAt as Date).toISOString(),
      project: { id: project.id, name: project.name },
      sprint: t.sprintId ? project.sprints.find((s) => s.id === t.sprintId) || null : null,
      milestone: t.milestoneId
        ? project.milestones.find((m) => m.id === t.milestoneId) || null
        : null,
      assignee: t.assignee
        ? {
            id: t.assignee.id,
            role: t.assignee.role,
            name: t.assignee.user?.name || "Member",
            email: t.assignee.user?.email || "",
            image: t.assignee.user?.image || null,
          }
        : null,
      labels: t.labels.map((l) => l.label),
      checklistTotal: t.checklist.length,
      checklistDone: t.checklist.filter((c) => c.done).length,
      dependenciesCount: t.dependencies.length,
    }));
  }, [project]);

  const refreshProject = React.useCallback(() => {
    if (!projectId) return;
    getProjectDetailAction(projectId).then((res) => {
      if (res.project) {
        setProject(res.project);
      }
    });
  }, [projectId]);

  async function handleDeleteProject() {
    if (
      !confirm(
        "Are you sure you want to delete this project? All associated tasks, sprints, and milestones will be removed and audit-logged.",
      )
    ) {
      return;
    }

    const res = await deleteProjectAction(projectId);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.push("/projects");
  }

  if (!project) {
    return (
      <div className="space-y-3 p-8 text-center">
        <p className="text-muted-foreground text-sm">Project not found or deleted.</p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-semibold">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
              {project.name}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {project.status}
            </span>
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl text-sm">{project.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateSprintOpen(true)}
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
          >
            <Rocket className="text-muted-foreground h-3.5 w-3.5" />
            <span>New Sprint</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateMilestoneOpen(true)}
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
          >
            <Flag className="text-muted-foreground h-3.5 w-3.5" />
            <span>New Milestone</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateTaskOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteProject}
            title="Delete Project (Admin only)"
            className="border-border text-muted-foreground rounded-xl border p-2 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-border flex items-center gap-2 overflow-x-auto border-b">
        {(
          [
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "kanban", label: `Board (${project.tasks.length})`, icon: Kanban },
            { id: "list", label: "List", icon: List },
            { id: "calendar", label: "Calendar", icon: Calendar },
            { id: "timeline", label: "Timeline", icon: Clock },
            { id: "sprints", label: `Sprints (${project.sprints.length})`, icon: Rocket },
            { id: "milestones", label: `Milestones (${project.milestones.length})`, icon: Flag },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <ProjectDashboardView projectId={project.id} projectName={project.name} />

          {/* Sprints & Milestones Quick Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Active Sprints */}
            <div className="border-border bg-card space-y-3 rounded-2xl border p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-foreground text-sm font-bold">Sprints</h3>
                </div>
                <button
                  onClick={() => setActiveTab("sprints")}
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View all ({project.sprints.length})
                </button>
              </div>
              {project.sprints.length === 0 ? (
                <p className="text-muted-foreground py-2 text-xs italic">No sprints planned yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {project.sprints.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="border-border bg-muted/20 flex items-center justify-between rounded-xl border p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground text-xs font-semibold">{s.name}</span>
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {s.status}
                          </span>
                        </div>
                        {s.goal && (
                          <p className="text-muted-foreground mt-0.5 text-[11px]">{s.goal}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Milestones */}
            <div className="border-border bg-card space-y-3 rounded-2xl border p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-foreground text-sm font-bold">Milestones Roadmap</h3>
                </div>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View all ({project.milestones.length})
                </button>
              </div>
              {project.milestones.length === 0 ? (
                <p className="text-muted-foreground py-2 text-xs italic">No milestones set yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {project.milestones.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="border-border bg-muted/20 flex items-center justify-between rounded-xl border p-3"
                    >
                      <div>
                        <span className="text-foreground text-xs font-semibold">{m.name}</span>
                        {m.description && (
                          <p className="text-muted-foreground mt-0.5 text-[11px]">
                            {m.description}
                          </p>
                        )}
                      </div>
                      {m.dueDate && (
                        <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-[11px]">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(m.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: KANBAN BOARD */}
      {activeTab === "kanban" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Kanban Board ({formattedTasks.length} tasks)
            </span>
            <button
              type="button"
              onClick={() => setIsCreateTaskOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>
          </div>
          <KanbanView
            tasks={formattedTasks}
            onSelectTask={setSelectedTaskId}
            onAddTask={() => setIsCreateTaskOpen(true)}
            onRefresh={refreshProject}
          />
        </div>
      )}

      {/* Tab Content: LIST VIEW */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Tasks List ({formattedTasks.length})
            </span>
            <button
              type="button"
              onClick={() => setIsCreateTaskOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>
          </div>
          <ListView
            tasks={formattedTasks}
            onSelectTask={setSelectedTaskId}
            onRefresh={refreshProject}
          />
        </div>
      )}

      {/* Tab Content: CALENDAR */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          <CalendarView
            tasks={formattedTasks}
            onSelectTask={setSelectedTaskId}
            onAddTask={() => setIsCreateTaskOpen(true)}
          />
        </div>
      )}

      {/* Tab Content: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <TimelineView tasks={formattedTasks} onSelectTask={setSelectedTaskId} />
        </div>
      )}

      {/* Tab Content: SPRINTS */}
      {activeTab === "sprints" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Sprint Cycles ({project.sprints.length})
            </span>
            <button
              type="button"
              onClick={() => setIsCreateSprintOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Sprint</span>
            </button>
          </div>

          {project.sprints.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border border-dashed p-10 text-center">
              <Rocket className="text-muted-foreground mx-auto h-8 w-8 opacity-50" />
              <h3 className="text-foreground mt-2 text-xs font-semibold">No sprints created</h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Organize your team&apos;s sprint cadence with start and end dates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className="border-border bg-card space-y-2 rounded-2xl border p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-foreground text-sm font-bold">{sprint.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          sprint.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sprint.status}
                      </span>
                    </div>
                    {(sprint.startDate || sprint.endDate) && (
                      <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {sprint.startDate
                            ? new Date(sprint.startDate).toLocaleDateString()
                            : "Start"}{" "}
                          – {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : "End"}
                        </span>
                      </div>
                    )}
                  </div>
                  {sprint.goal && <p className="text-muted-foreground text-xs">{sprint.goal}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: MILESTONES */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Roadmap Milestones ({project.milestones.length})
            </span>
            <button
              type="button"
              onClick={() => setIsCreateMilestoneOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Milestone</span>
            </button>
          </div>

          {project.milestones.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border border-dashed p-10 text-center">
              <Flag className="text-muted-foreground mx-auto h-8 w-8 opacity-50" />
              <h3 className="text-foreground mt-2 text-xs font-semibold">No milestones created</h3>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Set target deliverable checkpoints for major releases and audits.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="border-border bg-card flex items-center justify-between rounded-2xl border p-4 shadow-xs"
                >
                  <div>
                    <span className="text-foreground block text-sm font-bold">
                      {milestone.name}
                    </span>
                    {milestone.description && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                  {milestone.dueDate && (
                    <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals and Drawer */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={projectId}
        initialProjects={[{ id: project.id, name: project.name }]}
        onTaskCreated={refreshProject}
      />
      <CreateSprintModal
        projectId={projectId}
        isOpen={isCreateSprintOpen}
        onClose={() => setIsCreateSprintOpen(false)}
        onSprintCreated={refreshProject}
      />
      <CreateMilestoneModal
        projectId={projectId}
        isOpen={isCreateMilestoneOpen}
        onClose={() => setIsCreateMilestoneOpen(false)}
        onMilestoneCreated={refreshProject}
      />
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={refreshProject}
        onTaskDeleted={() => {
          setSelectedTaskId(null);
          refreshProject();
        }}
      />
    </div>
  );
}
