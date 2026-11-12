"use client";

import * as React from "react";
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  Link2,
  GripVertical,
} from "lucide-react";
import { TaskItem, PRIORITY_CONFIG } from "./types";
import { formatDate, isOverdue, isDueSoon } from "@/lib/date-utils";

interface TaskCardProps {
  task: TaskItem;
  onSelectTask?: (taskId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
  canSelect?: boolean;
}

export function TaskCard({
  task,
  onSelectTask,
  isDragging = false,
  dragHandleProps,
  isSelected = false,
  onToggleSelect,
  canSelect = false,
}: TaskCardProps) {
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);
  const dueSoon = isDueSoon(task.dueDate, 3);

  // Avatar Initials
  const assigneeInitials = task.assignee?.name
    ? task.assignee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div
      onClick={() => onSelectTask?.(task.id)}
      className={`border-border bg-card group relative cursor-pointer rounded-2xl border p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs dark:hover:border-slate-700 ${
        isDragging ? "scale-105 rotate-2 border-indigo-500 opacity-90 shadow-xl" : ""
      } ${isSelected ? "border-indigo-500 bg-indigo-50/10 ring-2 ring-indigo-500/20 dark:bg-indigo-950/10" : ""}`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {canSelect && onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(task.id)}
              onClick={(e) => e.stopPropagation()}
              className="border-border h-3.5 w-3.5 cursor-pointer rounded text-indigo-600 focus:ring-indigo-500"
            />
          )}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="text-muted-foreground text-[11px] font-semibold tracking-tight">
            {task.project.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Estimate Points Chip */}
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
        </div>
      </div>

      {/* Title */}
      <h4 className="text-foreground mt-2 line-clamp-2 text-xs leading-snug font-semibold">
        {task.title}
      </h4>

      {/* Blocked Reason Alert (if blocked) */}
      {task.status === "BLOCKED" && (
        <div className="mt-2.5 flex items-start gap-1.5 rounded-xl bg-rose-50 p-2 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
          <p className="line-clamp-2 text-[11px] leading-tight font-medium">
            {task.blockedReason || "Blocked: waiting on prerequisite or external review."}
          </p>
        </div>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              #{l.name}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer: Subtasks, Due Date, Assignee */}
      <div className="border-border mt-3 flex items-center justify-between border-t pt-2.5 text-[11px]">
        <div className="text-muted-foreground flex items-center gap-2.5">
          {/* Checklist Progress */}
          {task.checklistTotal !== undefined && task.checklistTotal > 0 && (
            <div className="flex items-center gap-1" title="Checklist progress">
              <CheckSquare className="h-3 w-3" />
              <span>
                {task.checklistDone}/{task.checklistTotal}
              </span>
            </div>
          )}

          {/* Dependencies count */}
          {task.dependenciesCount !== undefined && task.dependenciesCount > 0 && (
            <div
              className="flex items-center gap-1 text-amber-600 dark:text-amber-400"
              title="Has dependencies"
            >
              <Link2 className="h-3 w-3" />
              <span>{task.dependenciesCount}</span>
            </div>
          )}

          {/* Comments count */}
          {task.commentsCount !== undefined && task.commentsCount > 0 && (
            <div className="flex items-center gap-1" title="Comments">
              <MessageSquare className="h-3 w-3" />
              <span>{task.commentsCount}</span>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 font-medium ${
                overdue
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : dueSoon
                    ? "font-semibold text-amber-600 dark:text-amber-400"
                    : ""
              }`}
              title={overdue ? "Overdue" : "Due date"}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs"
            title={`Assigned to ${task.assignee.name}`}
          >
            {task.assignee.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={task.assignee.image}
                alt={task.assignee.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              assigneeInitials
            )}
          </div>
        ) : (
          <div
            className="border-muted-foreground/30 text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border border-dashed text-[10px]"
            title="Unassigned"
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
}
