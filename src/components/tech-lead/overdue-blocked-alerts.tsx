"use client";

import * as React from "react";
import { Ban, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import type { DashboardMetrics } from "@/features/tech-lead/actions";
import { updateTaskStatusAction } from "@/features/tasks/actions";
import { TaskStatus } from "@/types/enums";

interface OverdueBlockedAlertsProps {
  overdueTasks: DashboardMetrics["overdueTasks"];
  blockedTasks: DashboardMetrics["blockedTasks"];
  onSelectTask?: (taskId: string) => void;
  onRefresh?: () => void;
}

export function OverdueBlockedAlerts({
  overdueTasks,
  blockedTasks,
  onSelectTask,
  onRefresh,
}: OverdueBlockedAlertsProps) {
  const [unblockingId, setUnblockingId] = React.useState<string | null>(null);

  const handleUnblock = async (taskId: string) => {
    try {
      setUnblockingId(taskId);
      await updateTaskStatusAction({
        id: taskId,
        status: TaskStatus.IN_PROGRESS,
        blockedReason: null,
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to unblock task:", err);
    } finally {
      setUnblockingId(null);
    }
  };

  const hasAlerts = overdueTasks.length > 0 || blockedTasks.length > 0;

  if (!hasAlerts) {
    return (
      <div className="border-border bg-card flex items-center justify-between rounded-2xl border p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-foreground text-sm font-semibold">Zero Blockers & Overdue Tasks</h4>
            <p className="text-muted-foreground text-xs">
              All active tasks are running on schedule. Engineering velocity is healthy.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Clean Board
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue Tasks Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="border-border bg-card overflow-hidden rounded-2xl border border-rose-200/80 shadow-xs dark:border-rose-900/40">
          <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/60 px-5 py-3 dark:border-rose-950 dark:bg-rose-950/30">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="text-foreground text-xs font-bold tracking-wider uppercase">
                  Overdue Tasks ({overdueTasks.length})
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Requires tech lead attention or rescheduling
                </p>
              </div>
            </div>
          </div>

          <div className="divide-border/60 divide-y">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="hover:bg-muted/30 flex flex-col justify-between gap-3 p-4 transition-colors sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                      {task.daysOverdue} {task.daysOverdue === 1 ? "day" : "days"} overdue
                    </span>
                    <span className="text-foreground text-sm font-semibold hover:underline">
                      {task.title}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {task.projectName}
                    </span>
                    <span>•</span>
                    <span>Assignee: {task.assigneeName}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTask?.(task.id)}
                    className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>View Task</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked Tasks Alert Banner */}
      {blockedTasks.length > 0 && (
        <div className="border-border bg-card overflow-hidden rounded-2xl border border-amber-200/80 shadow-xs dark:border-amber-900/40">
          <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/60 px-5 py-3 dark:border-amber-950 dark:bg-amber-950/30">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
                <Ban className="h-4 w-4" />
              </div>
              <div>
                <span className="text-foreground text-xs font-bold tracking-wider uppercase">
                  Blocked Tasks ({blockedTasks.length})
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Unblock team members to resume sprint progress
                </p>
              </div>
            </div>
          </div>

          <div className="divide-border/60 divide-y">
            {blockedTasks.map((task) => (
              <div
                key={task.id}
                className="hover:bg-muted/30 flex flex-col justify-between gap-3 p-4 transition-colors sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      Blocked
                    </span>
                    <span className="text-foreground text-sm font-semibold">{task.title}</span>
                  </div>
                  {task.blockedReason && (
                    <p className="text-muted-foreground text-xs italic">
                      Reason: &quot;{task.blockedReason}&quot;
                    </p>
                  )}
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {task.projectName}
                    </span>
                    <span>•</span>
                    <span>Assignee: {task.assigneeName}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={unblockingId === task.id}
                    onClick={() => handleUnblock(task.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{unblockingId === task.id ? "Unblocking..." : "1-Click Unblock"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTask?.(task.id)}
                    className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Details</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
