"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { TaskItem, ViewMode, FilterState, INITIAL_FILTER_STATE } from "./types";
import { ViewSwitcher } from "./view-switcher";
import { TaskFilterToolbar } from "./task-filter-toolbar";
import { KanbanView } from "./kanban-view";
import { ListView } from "./list-view";
import { CalendarView } from "./calendar-view";
import { TimelineView } from "./timeline-view";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { getTasksAction } from "@/features/tasks/actions";
import { isOverdue, isDueSoon } from "@/lib/date-utils";

interface BoardWorkspaceViewProps {
  initialTasks: TaskItem[];
  members: { id: string; name: string; email: string; image?: string | null }[];
  projects: { id: string; name: string }[];
  currentUserMembershipId?: string;
  currentUserRole?: "ADMIN" | "DEVELOPER" | "VIEWER";
  initialProjectId?: string;
}

export function BoardWorkspaceView({
  initialTasks,
  members,
  projects,
  currentUserMembershipId,
  currentUserRole,
  initialProjectId,
}: BoardWorkspaceViewProps) {
  const [tasks, setTasks] = React.useState<TaskItem[]>(initialTasks);
  const [currentView, setCurrentView] = React.useState<ViewMode>("kanban");
  const [filter, setFilter] = React.useState<FilterState>({
    ...INITIAL_FILTER_STATE,
    projectId: initialProjectId || "",
  });

  // Modal & Drawer state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  const refreshTasks = React.useCallback(() => {
    getTasksAction().then((res) => {
      if (res.tasks) {
        setTasks(res.tasks as TaskItem[]);
      }
    });
  }, []);

  // Filter tasks based on current FilterState
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      // 1. Search keyword
      if (filter.search.trim()) {
        const q = filter.search.toLowerCase();
        const inTitle = task.title.toLowerCase().includes(q);
        const inDesc = task.description?.toLowerCase().includes(q) || false;
        const inProj = task.project.name.toLowerCase().includes(q);
        const inLabels = task.labels?.some((l) => l.name.toLowerCase().includes(q)) || false;
        if (!inTitle && !inDesc && !inProj && !inLabels) return false;
      }

      // 2. Project
      if (filter.projectId && task.project.id !== filter.projectId) {
        return false;
      }

      // 3. Assignees
      if (filter.assigneeIds.length > 0) {
        if (!task.assignee || !filter.assigneeIds.includes(task.assignee.id)) {
          return false;
        }
      }

      // 4. Statuses
      if (filter.statuses.length > 0) {
        if (!filter.statuses.includes(task.status)) {
          return false;
        }
      }

      // 5. Priorities
      if (filter.priorities.length > 0) {
        if (!filter.priorities.includes(task.priority)) {
          return false;
        }
      }

      // 6. Labels
      if (filter.labels.length > 0) {
        const hasLabel = task.labels?.some((l) => filter.labels.includes(l.name));
        if (!hasLabel) return false;
      }

      // 7. Due Date preset
      if (filter.dueDate !== "all") {
        if (filter.dueDate === "no_date") {
          if (task.dueDate) return false;
        } else if (filter.dueDate === "overdue") {
          if (!isOverdue(task.dueDate, task.status)) return false;
        } else if (filter.dueDate === "today") {
          if (!task.dueDate) return false;
          const todayStr = new Date().toISOString().slice(0, 10);
          if (!task.dueDate.startsWith(todayStr)) return false;
        } else if (filter.dueDate === "this_week") {
          if (!isDueSoon(task.dueDate, 7)) return false;
        } else if (filter.dueDate === "next_week") {
          if (!isDueSoon(task.dueDate, 14)) return false;
        }
      }

      return true;
    });
  }, [tasks, filter]);

  // Extract all available labels from tasks
  const availableLabels = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    tasks.forEach((t) => {
      t.labels?.forEach((l) => {
        if (!map.has(l.name)) map.set(l.name, l);
      });
    });
    return Array.from(map.values());
  }, [tasks]);

  function handleOpenCreateTask() {
    setIsCreateTaskOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
              Task Workspace
            </h1>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Multi-view engineering task board • Drag-and-drop Kanban, tabular list, calendar, and
            Gantt timeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenCreateTask()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* View Switcher Bar */}
      <ViewSwitcher
        currentView={currentView}
        onViewChange={setCurrentView}
        totalTasks={filteredTasks.length}
      />

      {/* Filter and Search Toolbar */}
      <TaskFilterToolbar
        filter={filter}
        onFilterChange={setFilter}
        members={members}
        projects={projects}
        availableLabels={availableLabels}
      />

      {/* Main View Area */}
      <div key={currentView} className="animate-fade-in min-h-[500px]">
        {currentView === "kanban" && (
          <KanbanView
            tasks={filteredTasks}
            onSelectTask={setSelectedTaskId}
            onAddTask={() => handleOpenCreateTask()}
            onRefresh={refreshTasks}
            currentUserMembershipId={currentUserMembershipId}
            currentUserRole={currentUserRole}
          />
        )}

        {currentView === "list" && (
          <ListView
            tasks={filteredTasks}
            onSelectTask={setSelectedTaskId}
            onRefresh={refreshTasks}
            currentUserMembershipId={currentUserMembershipId}
            currentUserRole={currentUserRole}
          />
        )}

        {currentView === "calendar" && (
          <CalendarView
            tasks={filteredTasks}
            onSelectTask={setSelectedTaskId}
            onAddTask={() => handleOpenCreateTask()}
          />
        )}

        {currentView === "timeline" && (
          <TimelineView tasks={filteredTasks} onSelectTask={setSelectedTaskId} />
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={filter.projectId || (projects[0]?.id ?? "")}
        initialProjects={projects}
        onTaskCreated={() => {
          setIsCreateTaskOpen(false);
          refreshTasks();
        }}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={refreshTasks}
        onTaskDeleted={refreshTasks}
      />
    </div>
  );
}
