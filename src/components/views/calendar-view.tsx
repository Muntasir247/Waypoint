"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { TaskItem, STATUS_CONFIG } from "./types";
import {
  getCalendarGrid,
  formatMonthYear,
  toDateString,
  CalendarDay,
  isOverdue,
} from "@/lib/date-utils";

interface CalendarViewProps {
  tasks: TaskItem[];
  onSelectTask: (taskId: string) => void;
  onAddTask?: (defaultDate?: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ tasks, onSelectTask, onAddTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarGrid = React.useMemo(() => {
    return getCalendarGrid(year, month);
  }, [year, month]);

  // Map tasks by dueDate string "YYYY-MM-DD"
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    tasks.forEach((t) => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) {
          const key = toDateString(d);
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(t);
        }
      }
    });
    return map;
  }, [tasks]);

  // Tasks without due date
  const unscheduledTasks = React.useMemo(() => {
    return tasks.filter((t) => !t.dueDate);
  }, [tasks]);

  function handlePrevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-bold tracking-tight">
            {formatMonthYear(year, month)}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="border-border bg-card text-muted-foreground hover:text-foreground rounded-lg border p-1 shadow-2xs"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="border-border bg-card text-muted-foreground hover:text-foreground rounded-lg border p-1 shadow-2xs"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="border-border bg-card text-foreground hover:bg-muted ml-1 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs"
            >
              Today
            </button>
          </div>
        </div>

        {unscheduledTasks.length > 0 && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            <span>{unscheduledTasks.length} unscheduled tasks</span>
          </div>
        )}
      </div>

      {/* Calendar Grid Container */}
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-2xs">
        {/* Weekday Labels Header */}
        <div className="border-border bg-muted/40 grid grid-cols-7 border-b text-center text-xs font-bold">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-muted-foreground py-2 tracking-wider uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="divide-border grid grid-cols-7 divide-x divide-y border-b">
          {calendarGrid.map((day: CalendarDay) => {
            const dayTasks = tasksByDate.get(day.dateString) || [];
            return (
              <div
                key={day.dateString}
                className={`group min-h-[110px] p-1.5 transition-colors ${
                  day.isCurrentMonth
                    ? "bg-card hover:bg-muted/30"
                    : "bg-muted/15 text-muted-foreground/60"
                } ${day.isToday ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-1">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                      day.isToday
                        ? "bg-indigo-600 font-bold text-white shadow-2xs"
                        : day.isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {onAddTask && (
                    <button
                      type="button"
                      onClick={() => onAddTask(day.dateString)}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                      title={`Add task due on ${day.dateString}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Day Task Chips */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const statusCfg = STATUS_CONFIG[task.status];
                    const overdue = isOverdue(task.dueDate, task.status);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task.id)}
                        className={`hover:bg-muted/80 flex cursor-pointer items-center gap-1.5 rounded-lg border px-1.5 py-1 text-[10px] shadow-2xs transition-all ${
                          overdue
                            ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
                            : "border-border bg-card text-foreground"
                        }`}
                        title={`${task.title} (${statusCfg.label})`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusCfg.dot}`} />
                        <span className="truncate font-medium">{task.title}</span>
                      </div>
                    );
                  })}

                  {dayTasks.length > 3 && (
                    <div className="text-muted-foreground px-1 text-[9px] font-semibold">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <div className="border-border bg-card rounded-2xl border p-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground text-xs font-bold">
              Unscheduled Tasks without Due Date ({unscheduledTasks.length})
            </h3>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {unscheduledTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className="border-border hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground text-[10px] font-semibold">
                    {task.project.name}
                  </span>
                  <p className="text-foreground truncate text-xs font-medium">{task.title}</p>
                </div>
                <span className="bg-muted text-muted-foreground ml-2 rounded-md px-1.5 py-0.5 font-mono text-[10px]">
                  {task.estimatePoints} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
