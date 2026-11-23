"use client";

import * as React from "react";
import {
  X,
  UserCheck,
  Flag,
  CircleDot,
  Rocket,
  Trash2,
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { TaskStatus, Priority } from "@/types/enums";
import { bulkUpdateTasksAction } from "@/features/tech-lead/actions";

interface BulkActionsToolbarProps {
  selectedTaskIds: string[];
  onClearSelection: () => void;
  members?: Array<{ id: string; name: string; email: string; avatarUrl?: string | null }>;
  sprints?: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function BulkActionsToolbar({
  selectedTaskIds,
  onClearSelection,
  members = [],
  sprints = [],
  onSuccess,
}: BulkActionsToolbarProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Active dropdown open states
  const [openMenu, setOpenMenu] = React.useState<
    "status" | "priority" | "assignee" | "sprint" | null
  >(null);

  if (selectedTaskIds.length === 0) return null;

  const handleAction = async (payload: {
    action: "reassign" | "change_status" | "change_priority" | "assign_sprint" | "delete";
    status?: TaskStatus;
    priority?: Priority;
    assigneeId?: string | null;
    sprintId?: string | null;
  }) => {
    try {
      setIsPending(true);
      setError(null);
      const res = await bulkUpdateTasksAction({
        taskIds: selectedTaskIds,
        ...(payload as any),
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      setOpenMenu(null);
      setShowDeleteConfirm(false);
      onClearSelection();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bulk action failed";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-5 fixed bottom-6 left-1/2 z-50 -translate-x-1/2 duration-200">
      <div className="border-border bg-card/95 text-card-foreground flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-2xl backdrop-blur-md">
        {/* Selection count */}
        <div className="border-border flex items-center gap-2 border-r pr-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-xs">
            {selectedTaskIds.length}
          </div>
          <span className="text-foreground text-xs font-semibold whitespace-nowrap">
            {selectedTaskIds.length === 1 ? "task selected" : "tasks selected"}
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Action 1: Status */}
        <div className="relative">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
            className="hover:bg-muted text-foreground inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <CircleDot className="h-3.5 w-3.5 text-sky-500" />
            <span>Status</span>
            <ChevronDown className="text-muted-foreground h-3 w-3" />
          </button>

          {openMenu === "status" && (
            <div className="border-border bg-popover text-popover-foreground absolute bottom-full left-0 mb-2 w-44 rounded-xl border p-1 shadow-xl">
              {[
                { status: TaskStatus.TODO, label: "To Do", color: "bg-slate-400" },
                { status: TaskStatus.IN_PROGRESS, label: "In Progress", color: "bg-sky-500" },
                { status: TaskStatus.IN_REVIEW, label: "In Review", color: "bg-amber-500" },
                { status: TaskStatus.DONE, label: "Done", color: "bg-emerald-500" },
                { status: TaskStatus.BLOCKED, label: "Blocked", color: "bg-rose-500" },
              ].map((opt) => (
                <button
                  key={opt.status}
                  type="button"
                  onClick={() => handleAction({ action: "change_status", status: opt.status })}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors"
                >
                  <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action 2: Priority */}
        <div className="relative">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpenMenu(openMenu === "priority" ? null : "priority")}
            className="hover:bg-muted text-foreground inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Flag className="h-3.5 w-3.5 text-amber-500" />
            <span>Priority</span>
            <ChevronDown className="text-muted-foreground h-3 w-3" />
          </button>

          {openMenu === "priority" && (
            <div className="border-border bg-popover text-popover-foreground absolute bottom-full left-0 mb-2 w-36 rounded-xl border p-1 shadow-xl">
              {[
                { priority: Priority.LOW, label: "Low" },
                { priority: Priority.MEDIUM, label: "Medium" },
                { priority: Priority.HIGH, label: "High" },
                { priority: Priority.CRITICAL, label: "Critical" },
              ].map((opt) => (
                <button
                  key={opt.priority}
                  type="button"
                  onClick={() =>
                    handleAction({ action: "change_priority", priority: opt.priority })
                  }
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors"
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action 3: Reassign */}
        <div className="relative">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpenMenu(openMenu === "assignee" ? null : "assignee")}
            className="hover:bg-muted text-foreground inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
            <span>Reassign</span>
            <ChevronDown className="text-muted-foreground h-3 w-3" />
          </button>

          {openMenu === "assignee" && (
            <div className="border-border bg-popover text-popover-foreground absolute bottom-full left-0 mb-2 max-h-56 w-52 overflow-y-auto rounded-xl border p-1 shadow-xl">
              <button
                type="button"
                onClick={() => handleAction({ action: "reassign", assigneeId: null })}
                className="hover:bg-muted text-muted-foreground flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors"
              >
                <span>Unassigned</span>
              </button>
              <div className="border-border my-1 border-t" />
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAction({ action: "reassign", assigneeId: m.id })}
                  className="hover:bg-muted flex w-full items-center gap-2 truncate rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors"
                >
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action 4: Sprint */}
        {sprints.length > 0 && (
          <div className="relative">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setOpenMenu(openMenu === "sprint" ? null : "sprint")}
              className="hover:bg-muted text-foreground inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Rocket className="h-3.5 w-3.5 text-purple-500" />
              <span>Sprint</span>
              <ChevronDown className="text-muted-foreground h-3 w-3" />
            </button>

            {openMenu === "sprint" && (
              <div className="border-border bg-popover text-popover-foreground absolute bottom-full left-0 mb-2 max-h-56 w-48 overflow-y-auto rounded-xl border p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => handleAction({ action: "assign_sprint", sprintId: null })}
                  className="hover:bg-muted text-muted-foreground flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors"
                >
                  <span>No Sprint (Backlog)</span>
                </button>
                <div className="border-border my-1 border-t" />
                {sprints.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAction({ action: "assign_sprint", sprintId: s.id })}
                    className="hover:bg-muted flex w-full items-center gap-2 truncate rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors"
                  >
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action 5: Bulk Delete */}
        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:hover:bg-rose-950/50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>

        {isPending && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="border-border bg-card max-w-sm rounded-2xl border p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-foreground text-sm font-bold">Delete Selected Tasks</h3>
                <p className="text-muted-foreground text-xs">
                  Permanently remove {selectedTaskIds.length} tasks from the workspace.
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mt-4 text-xs">
              This action cannot be undone. Associated comments, checklists, and dependencies will
              also be removed. An audit log entry will be recorded.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-border bg-card text-foreground hover:bg-muted rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAction({ action: "delete" })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-center">
          <span className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
