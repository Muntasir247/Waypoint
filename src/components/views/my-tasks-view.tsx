"use client";

import * as React from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Play,
  RotateCcw,
} from "lucide-react";
import { TaskStatus } from "@/types/enums";
import { TaskItem, STATUS_CONFIG, PRIORITY_CONFIG } from "./types";
import { KanbanView } from "./kanban-view";
import { CalendarView } from "./calendar-view";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { updateTaskStatusAction, getMyTasksAction } from "@/features/tasks/actions";
import { formatDate, isOverdue } from "@/lib/date-utils";

interface MyTasksMetrics {
  totalAssigned: number;
  inProgress: number;
  todo: number;
  inReview: number;
  blocked: number;
  done: number;
  overdue: number;
  completedThisMonth: number;
}

interface MyTasksViewProps {
  initialTasks: TaskItem[];
  initialMetrics: MyTasksMetrics | null;
  userName: string;
  userEmail: string;
  userRole: string;
  membershipId: string;
}

type TabOption = "all" | "in_progress" | "todo" | "in_review" | "blocked" | "done";

export function MyTasksView({
  initialTasks,
  initialMetrics,
  userName,
  userEmail,
  userRole,
  membershipId,
}: MyTasksViewProps) {
  const [tasks, setTasks] = React.useState<TaskItem[]>(initialTasks);
  const [metrics, setMetrics] = React.useState<MyTasksMetrics | null>(initialMetrics);
  const [activeTab, setActiveTab] = React.useState<TabOption>("all");
  const [viewMode, setViewMode] = React.useState<"list" | "kanban" | "calendar">("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPriority, setSelectedPriority] = React.useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  const refreshData = React.useCallback(() => {
    getMyTasksAction().then((res) => {
      if (res.tasks) {
        setTasks(res.tasks as TaskItem[]);
      }
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    });
  }, []);

  // Quick status transitions
  async function handleQuickStatusChange(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (newStatus === TaskStatus.BLOCKED) {
      const reason = prompt("Please provide a reason why this task is blocked:");
      if (!reason) return;
      const res = await updateTaskStatusAction({
        id: taskId,
        status: newStatus as any,
        blockedReason: reason,
      });
      if (res.error) alert(res.error);
    } else {
      const res = await updateTaskStatusAction({ id: taskId, status: newStatus as any });
      if (res.error) alert(res.error);
    }
    refreshData();
  }

  // Filter tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      // Tab filter
      if (activeTab === "in_progress" && t.status !== TaskStatus.IN_PROGRESS) return false;
      if (activeTab === "todo" && t.status !== TaskStatus.TODO) return false;
      if (activeTab === "in_review" && t.status !== TaskStatus.IN_REVIEW) return false;
      if (activeTab === "blocked" && t.status !== TaskStatus.BLOCKED) return false;
      if (activeTab === "done" && t.status !== TaskStatus.DONE) return false;

      // Priority filter
      if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchProject = t.project.name.toLowerCase().includes(q);
        if (!matchTitle && !matchProject) return false;
      }

      return true;
    });
  }, [tasks, activeTab, selectedPriority, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
              My Tasks
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {userRole}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Assigned to {userName || userEmail} • Update progress, view blockers, and track
            completion.
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="border-border bg-muted/60 flex items-center rounded-xl border p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "kanban"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "calendar"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Personal Metrics Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Assigned */}
        <div className="border-border bg-card rounded-2xl border p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Assigned
            </span>
            <CheckSquare className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold">{metrics?.totalAssigned ?? tasks.length}</div>
          <p className="text-muted-foreground mt-0.5 text-[11px]">Active work items</p>
        </div>

        {/* In Progress */}
        <div className="border-border bg-card rounded-2xl border p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              In Progress
            </span>
            <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">
            {metrics?.inProgress ?? 0}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[11px]">Currently active</p>
        </div>

        {/* Blocked */}
        <div className="border-border bg-card rounded-2xl border p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Blocked
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics?.blocked ?? 0}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[11px]">Needs attention</p>
        </div>

        {/* Overdue */}
        <div className="border-border bg-card rounded-2xl border p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Overdue
            </span>
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics?.overdue ?? 0}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[11px]">Past target date</p>
        </div>

        {/* Completed this month */}
        <div className="border-border bg-card rounded-2xl border p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Done This Month
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics?.completedThisMonth ?? 0}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[11px]">Delivered on time</p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: "all", label: `All (${tasks.length})` },
              { id: "in_progress", label: `In Progress (${metrics?.inProgress ?? 0})` },
              { id: "todo", label: `To Do (${metrics?.todo ?? 0})` },
              { id: "in_review", label: `In Review (${metrics?.inReview ?? 0})` },
              { id: "blocked", label: `Blocked (${metrics?.blocked ?? 0})` },
              { id: "done", label: `Done (${metrics?.done ?? 0})` },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 pb-2">
          <input
            type="text"
            placeholder="Search my tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border bg-card text-foreground placeholder:text-muted-foreground h-8 w-44 rounded-xl border px-2.5 text-xs focus:outline-hidden"
          />

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="border-border bg-card text-foreground h-8 rounded-xl border px-2 text-xs font-medium focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "kanban" && (
        <KanbanView
          tasks={filteredTasks}
          onSelectTask={setSelectedTaskId}
          onRefresh={refreshData}
          currentUserMembershipId={membershipId}
          currentUserRole="DEVELOPER"
        />
      )}

      {viewMode === "calendar" && (
        <CalendarView tasks={filteredTasks} onSelectTask={setSelectedTaskId} />
      )}

      {viewMode === "list" && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="border-border bg-card text-muted-foreground rounded-2xl border p-12 text-center text-xs">
              No tasks found in this view.
            </div>
          ) : (
            <div className="border-border bg-card divide-border divide-y overflow-hidden rounded-2xl border shadow-2xs">
              {filteredTasks.map((task) => {
                const priorityCfg = PRIORITY_CONFIG[task.priority];
                const statusCfg = STATUS_CONFIG[task.status];
                const overdue = isOverdue(task.dueDate, task.status);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="hover:bg-muted/40 group flex cursor-pointer flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Left Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[10px] font-semibold">
                          {task.project.name}
                        </span>
                        <span
                          className={`py-0.2 inline-flex items-center gap-1 rounded-full px-2 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                          <span>{statusCfg.label}</span>
                        </span>
                        <span
                          className={`py-0.2 rounded-full px-2 text-[10px] font-semibold ${priorityCfg.badge}`}
                        >
                          {priorityCfg.label}
                        </span>
                        <span className="bg-muted text-muted-foreground py-0.2 rounded px-1.5 font-mono text-[10px]">
                          {task.estimatePoints} pts
                        </span>
                      </div>

                      <h3
                        className={`text-foreground text-sm font-semibold ${
                          task.status === TaskStatus.DONE
                            ? "text-muted-foreground line-through"
                            : ""
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.blockedReason && task.status === TaskStatus.BLOCKED && (
                        <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                          Blocked: {task.blockedReason}
                        </p>
                      )}

                      <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 text-[11px] font-medium ${
                              overdue ? "font-bold text-rose-600 dark:text-rose-400" : ""
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.dueDate)}</span>
                            {overdue && <span>(Overdue)</span>}
                          </span>
                        )}
                        {task.checklistTotal !== undefined && task.checklistTotal > 0 && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <CheckSquare className="h-3 w-3" />
                            <span>
                              {task.checklistDone}/{task.checklistTotal} subtasks
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Quick Actions for Developer */}
                    <div
                      className="flex items-center gap-2 sm:shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.status === TaskStatus.TODO && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(task.id, TaskStatus.IN_PROGRESS)}
                          className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-sky-700"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Start Task</span>
                        </button>
                      )}

                      {task.status === TaskStatus.IN_PROGRESS && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(task.id, TaskStatus.IN_REVIEW)}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-amber-700"
                          >
                            <span>Ready for Review</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(task.id, TaskStatus.DONE)}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Mark Done</span>
                          </button>
                        </>
                      )}

                      {task.status === TaskStatus.IN_REVIEW && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(task.id, TaskStatus.DONE)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Mark Done</span>
                        </button>
                      )}

                      {task.status === TaskStatus.BLOCKED && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(task.id, TaskStatus.IN_PROGRESS)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors dark:bg-slate-200 dark:text-slate-900"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Unblock</span>
                        </button>
                      )}

                      {task.status !== TaskStatus.BLOCKED && task.status !== TaskStatus.DONE && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(task.id, TaskStatus.BLOCKED)}
                          className="border-border text-muted-foreground rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Report Blocked"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={refreshData}
        onTaskDeleted={refreshData}
      />
    </div>
  );
}
