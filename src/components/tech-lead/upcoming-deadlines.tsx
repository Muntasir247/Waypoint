"use client";

import * as React from "react";
import { Calendar, Clock } from "lucide-react";
import type { DashboardMetrics } from "@/features/tech-lead/actions";

interface UpcomingDeadlinesProps {
  upcomingTasks: DashboardMetrics["upcomingDueTasks"];
  onSelectTask?: (taskId: string) => void;
}

export function UpcomingDeadlines({ upcomingTasks, onSelectTask }: UpcomingDeadlinesProps) {
  if (!upcomingTasks || upcomingTasks.length === 0) {
    return (
      <div className="border-border bg-card flex h-64 flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-xs">
        <Calendar className="text-muted-foreground/40 mb-2 h-8 w-8" />
        <h4 className="text-foreground text-sm font-semibold">No Deadlines In Next 7 Days</h4>
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          All tasks are either completed or scheduled beyond the current sprint cycle.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-sm font-semibold tracking-tight">
            Upcoming Deadlines
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Tasks due within the next 7 days ({upcomingTasks.length} items)
          </p>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Clock className="h-4 w-4" />
        </div>
      </div>

      <div className="divide-border/60 divide-y overflow-y-auto">
        {upcomingTasks.map((task) => {
          const due = new Date(task.dueDate);
          const now = new Date();
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isUrgent = diffDays <= 1;

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask?.(task.id)}
              className="hover:bg-muted/40 flex cursor-pointer items-center justify-between py-3 transition-colors"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="text-foreground truncate text-xs font-semibold">{task.title}</div>
                <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[11px]">
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {task.projectName}
                  </span>
                  <span>•</span>
                  <span>{task.assigneeName}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    isUrgent
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {diffDays <= 0
                    ? "Due Today"
                    : diffDays === 1
                      ? "Due Tomorrow"
                      : `In ${diffDays} days`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
