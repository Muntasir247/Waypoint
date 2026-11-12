"use client";

import * as React from "react";
import { Calendar, CheckSquare, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { TaskStatus, Priority } from "@prisma/client";
import { TaskItem, STATUS_CONFIG, PRIORITY_CONFIG } from "./types";
import { formatDate, isOverdue, isDueSoon } from "@/lib/date-utils";
import { updateTaskStatusAction } from "@/features/tasks/actions";

interface ListViewProps {
  tasks: TaskItem[];
  onSelectTask: (taskId: string) => void;
  onRefresh?: () => void;
  currentUserMembershipId?: string;
  currentUserRole?: "ADMIN" | "DEVELOPER" | "VIEWER";
}

type GroupByOption = "status" | "priority" | "assignee" | "none";
type SortByOption = "priority" | "dueDate" | "points" | "title";

export function ListView({
  tasks,
  onSelectTask,
  onRefresh,
  currentUserMembershipId,
  currentUserRole,
}: ListViewProps) {
  const [groupBy, setGroupBy] = React.useState<GroupByOption>("status");
  const [sortBy, setSortBy] = React.useState<SortByOption>("priority");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");

  // Handle inline quick status change
  async function handleQuickStatusChange(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (currentUserRole === "DEVELOPER" && task.assignee?.id !== currentUserMembershipId) {
      alert("Developers can only update status on their own assigned tasks.");
      return;
    }

    if (newStatus === TaskStatus.BLOCKED && !task.blockedReason) {
      const reason = prompt("Please provide a reason for blocking this task:");
      if (!reason) return;
      await updateTaskStatusAction({ id: taskId, status: newStatus, blockedReason: reason });
    } else {
      await updateTaskStatusAction({ id: taskId, status: newStatus });
    }
    onRefresh?.();
  }

  // Sorted tasks
  const sortedTasks = React.useMemo(() => {
    const list = [...tasks];
    const priorityWeight: Record<Priority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "priority") {
        comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
      } else if (sortBy === "points") {
        comparison = a.estimatePoints - b.estimatePoints;
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "dueDate") {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = da - db;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    return list;
  }, [tasks, sortBy, sortDirection]);

  // Grouped tasks
  const groupedTasks = React.useMemo(() => {
    if (groupBy === "none") {
      return [
        { groupKey: "all", groupTitle: `All Tasks (${sortedTasks.length})`, items: sortedTasks },
      ];
    }

    if (groupBy === "status") {
      const statuses: TaskStatus[] = [
        TaskStatus.IN_PROGRESS,
        TaskStatus.TODO,
        TaskStatus.IN_REVIEW,
        TaskStatus.BLOCKED,
        TaskStatus.DONE,
      ];
      return statuses
        .map((st) => ({
          groupKey: st,
          groupTitle: `${STATUS_CONFIG[st].label}`,
          items: sortedTasks.filter((t) => t.status === st),
        }))
        .filter((g) => g.items.length > 0);
    }

    if (groupBy === "priority") {
      const priorities: Priority[] = [
        Priority.CRITICAL,
        Priority.HIGH,
        Priority.MEDIUM,
        Priority.LOW,
      ];
      return priorities
        .map((pr) => ({
          groupKey: pr,
          groupTitle: `${PRIORITY_CONFIG[pr].label} Priority`,
          items: sortedTasks.filter((t) => t.priority === pr),
        }))
        .filter((g) => g.items.length > 0);
    }

    if (groupBy === "assignee") {
      const map = new Map<string, TaskItem[]>();
      sortedTasks.forEach((t) => {
        const key = t.assignee?.name || "Unassigned";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      });
      return Array.from(map.entries()).map(([name, items]) => ({
        groupKey: name,
        groupTitle: name,
        items,
      }));
    }

    return [{ groupKey: "all", groupTitle: "Tasks", items: sortedTasks }];
  }, [sortedTasks, groupBy]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
            className="border-border bg-card text-foreground rounded-lg border px-2.5 py-1 font-medium focus:outline-hidden"
          >
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="assignee">Assignee</option>
            <option value="none">No Grouping</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortByOption)}
            className="border-border bg-card text-foreground rounded-lg border px-2.5 py-1 font-medium focus:outline-hidden"
          >
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="points">Points</option>
            <option value="title">Title</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="border-border bg-card text-muted-foreground hover:text-foreground rounded-lg border p-1"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Task Groups Table */}
      {groupedTasks.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground rounded-2xl border p-12 text-center text-xs">
          No tasks found matching current filters.
        </div>
      ) : (
        <div className="space-y-5">
          {groupedTasks.map((group) => {
            const groupPoints = group.items.reduce((s, i) => s + (i.estimatePoints || 0), 0);
            return (
              <div
                key={group.groupKey}
                className="border-border bg-card overflow-hidden rounded-2xl border shadow-2xs"
              >
                {/* Group Header */}
                <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-xs font-bold tracking-tight">
                      {group.groupTitle}
                    </span>
                    <span className="bg-muted text-muted-foreground py-0.2 rounded-full px-2 text-[10px] font-semibold">
                      {group.items.length}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-[11px] font-medium">
                    {groupPoints} pts
                  </span>
                </div>

                {/* Rows Table */}
                <div className="divide-border divide-y">
                  {group.items.map((task) => {
                    const priorityCfg = PRIORITY_CONFIG[task.priority];
                    const statusCfg = STATUS_CONFIG[task.status];
                    const overdue = isOverdue(task.dueDate, task.status);
                    const dueSoon = isDueSoon(task.dueDate, 3);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task.id)}
                        className="hover:bg-muted/40 group flex cursor-pointer flex-col gap-2 p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4"
                      >
                        {/* Left Side: Checkbox, Project, Title */}
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickStatusChange(
                                task.id,
                                task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE,
                              );
                            }}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
                              task.status === TaskStatus.DONE
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 hover:border-indigo-600 dark:border-slate-600"
                            }`}
                            title={
                              task.status === TaskStatus.DONE ? "Mark incomplete" : "Mark done"
                            }
                          >
                            {task.status === TaskStatus.DONE && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-[10px] font-semibold">
                                {task.project.name}
                              </span>
                              {task.blockedReason && task.status === TaskStatus.BLOCKED && (
                                <span className="py-0.2 inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 text-[9px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  Blocked
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-foreground truncate text-xs font-medium ${
                                task.status === TaskStatus.DONE
                                  ? "text-muted-foreground line-through"
                                  : ""
                              }`}
                            >
                              {task.title}
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Meta indicators, Status select, Priority, Assignee */}
                        <div
                          className="flex flex-wrap items-center gap-3 text-xs sm:shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Checklist */}
                          {task.checklistTotal !== undefined && task.checklistTotal > 0 && (
                            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                              <CheckSquare className="h-3 w-3" />
                              <span>
                                {task.checklistDone}/{task.checklistTotal}
                              </span>
                            </span>
                          )}

                          {/* Estimate Points */}
                          <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                            {task.estimatePoints} pts
                          </span>

                          {/* Priority Badge */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityCfg.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${priorityCfg.dot}`} />
                            <span>{priorityCfg.label}</span>
                          </span>

                          {/* Due Date */}
                          <span
                            className={`flex items-center gap-1 text-[11px] ${
                              overdue
                                ? "font-bold text-rose-600 dark:text-rose-400"
                                : dueSoon
                                  ? "font-semibold text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.dueDate)}</span>
                          </span>

                          {/* Status Select */}
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleQuickStatusChange(task.id, e.target.value as TaskStatus)
                            }
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold focus:outline-hidden ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="DONE">Done</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>

                          {/* Assignee Avatar */}
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white"
                            title={
                              task.assignee ? `Assigned to ${task.assignee.name}` : "Unassigned"
                            }
                          >
                            {task.assignee?.name ? task.assignee.name[0].toUpperCase() : "?"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
