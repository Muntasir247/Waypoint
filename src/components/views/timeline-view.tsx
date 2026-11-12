"use client";

import * as React from "react";
import { Link2, ChevronLeft, ChevronRight } from "lucide-react";
import { TaskItem, STATUS_CONFIG } from "./types";
import { formatDate, parseDate, toDateString } from "@/lib/date-utils";

interface TimelineViewProps {
  tasks: TaskItem[];
  onSelectTask: (taskId: string) => void;
}

export function TimelineView({ tasks, onSelectTask }: TimelineViewProps) {
  // Timeline viewport: 14 days centered around today
  const [viewportStart, setViewportStart] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 4);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const daysToShow = 14;

  const daysArray = React.useMemo(() => {
    const arr: { date: Date; label: string; isToday: boolean; dateString: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysToShow; i++) {
      const cur = new Date(viewportStart);
      cur.setDate(cur.getDate() + i);
      arr.push({
        date: cur,
        label: new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric" }).format(cur),
        isToday: cur.getTime() === today.getTime(),
        dateString: toDateString(cur),
      });
    }
    return arr;
  }, [viewportStart]);

  function handleShift(days: number) {
    setViewportStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  function handleToday() {
    const d = new Date();
    d.setDate(d.getDate() - 4);
    d.setHours(0, 0, 0, 0);
    setViewportStart(d);
  }

  // Calculate horizontal position and width for each task bar
  const viewportStartTime = viewportStart.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const viewportEndTime = viewportStartTime + daysToShow * oneDayMs;

  return (
    <div className="space-y-4">
      {/* Timeline Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-bold tracking-tight">
            Timeline Schedule
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleShift(-7)}
              className="border-border bg-card text-muted-foreground hover:text-foreground rounded-lg border p-1"
              title="Previous 7 days"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleShift(7)}
              className="border-border bg-card text-muted-foreground hover:text-foreground rounded-lg border p-1"
              title="Next 7 days"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="border-border bg-card text-foreground hover:bg-muted ml-1 rounded-lg border px-2.5 py-1 text-xs font-semibold"
            >
              Today
            </button>
          </div>
        </div>

        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Blocked</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Grid */}
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-2xs">
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Header row: Left title + Dates axis */}
            <div className="border-border bg-muted/40 flex border-b text-xs font-bold">
              <div className="text-muted-foreground w-64 shrink-0 border-r p-3 tracking-wider uppercase">
                Task & Assignee
              </div>
              <div className="divide-border grid flex-1 grid-cols-14 divide-x text-center">
                {daysArray.map((day) => (
                  <div
                    key={day.dateString}
                    className={`p-2 text-[11px] font-semibold ${
                      day.isToday
                        ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            <div className="divide-border divide-y">
              {tasks.length === 0 ? (
                <div className="text-muted-foreground p-12 text-center text-xs">
                  No tasks to display on timeline.
                </div>
              ) : (
                tasks.map((task) => {
                  const statusCfg = STATUS_CONFIG[task.status];

                  // Determine task start and end timestamps
                  const createdAtDate = parseDate(task.createdAt) || new Date();
                  const dueDate =
                    parseDate(task.dueDate) || new Date(createdAtDate.getTime() + 3 * oneDayMs);

                  const taskStartTime = Math.max(
                    createdAtDate.getTime(),
                    viewportStartTime - 3 * oneDayMs,
                  );
                  const taskEndTime = dueDate.getTime();

                  // Calculate left % and width % relative to current 14-day viewport
                  const clampStart = Math.max(taskStartTime, viewportStartTime);
                  const clampEnd = Math.min(taskEndTime, viewportEndTime);

                  const isVisibleInWindow =
                    clampEnd >= viewportStartTime && clampStart <= viewportEndTime;

                  const leftPercent = isVisibleInWindow
                    ? ((clampStart - viewportStartTime) / (viewportEndTime - viewportStartTime)) *
                      100
                    : 0;
                  const rawWidthPercent = isVisibleInWindow
                    ? ((clampEnd - clampStart) / (viewportEndTime - viewportStartTime)) * 100
                    : 0;
                  const widthPercent = Math.max(rawWidthPercent, 5); // Minimum bar width so small tasks are clickable

                  const barColorClass =
                    task.status === "DONE"
                      ? "bg-emerald-500 text-white"
                      : task.status === "IN_PROGRESS"
                        ? "bg-sky-500 text-white"
                        : task.status === "IN_REVIEW"
                          ? "bg-amber-500 text-white"
                          : task.status === "BLOCKED"
                            ? "bg-rose-500 text-white"
                            : "bg-slate-400 text-white";

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task.id)}
                      className="hover:bg-muted/30 group flex cursor-pointer items-center transition-colors"
                    >
                      {/* Left Info Pane */}
                      <div className="border-border w-64 shrink-0 border-r p-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${statusCfg.dot}`} />
                          <span className="text-muted-foreground text-[10px] font-semibold">
                            {task.project.name}
                          </span>
                          <span className="bg-muted text-muted-foreground ml-auto rounded px-1 font-mono text-[9px]">
                            {task.estimatePoints} pts
                          </span>
                        </div>
                        <p className="text-foreground mt-0.5 truncate text-xs font-semibold">
                          {task.title}
                        </p>
                        <div className="text-muted-foreground mt-1 flex items-center justify-between text-[10px]">
                          <span>{task.assignee ? task.assignee.name : "Unassigned"}</span>
                          {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
                        </div>
                      </div>

                      {/* Right Gantt Chart Area */}
                      <div className="relative flex-1 py-3">
                        {/* Day Grid Lines */}
                        <div className="divide-border pointer-events-none absolute inset-0 grid grid-cols-14 divide-x opacity-40">
                          {daysArray.map((day) => (
                            <div
                              key={day.dateString}
                              className={day.isToday ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""}
                            />
                          ))}
                        </div>

                        {/* Task Schedule Bar */}
                        {isVisibleInWindow && (
                          <div
                            className="relative mx-1 h-7"
                            style={{
                              marginLeft: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                          >
                            <div
                              className={`flex h-full w-full items-center justify-between overflow-hidden rounded-xl px-2.5 text-[10px] font-bold shadow-xs transition-transform group-hover:scale-y-105 ${barColorClass}`}
                              title={`${task.title} (Due: ${formatDate(task.dueDate)})`}
                            >
                              <span className="truncate">{task.title}</span>
                              {task.dependenciesCount !== undefined &&
                                task.dependenciesCount > 0 && (
                                  <Link2 className="ml-1 h-3 w-3 shrink-0 opacity-80" />
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
