"use client";

import * as React from "react";
import { Rocket, X, AlertCircle } from "lucide-react";
import { createSprintAction } from "@/features/projects/actions";
import { SprintStatus } from "@/types/enums";

interface CreateSprintModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSprintCreated?: () => void;
}

export function CreateSprintModal({
  projectId,
  isOpen,
  onClose,
  onSprintCreated,
}: CreateSprintModalProps) {
  const [name, setName] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [status, setStatus] = React.useState<SprintStatus>(SprintStatus.PLANNED);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await createSprintAction({
        projectId,
        name,
        goal: goal || null,
        status: status as any,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      onSprintCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create sprint");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="border-border bg-card text-card-foreground animate-in fade-in-0 zoom-in-95 w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">Create Sprint</h2>
              <p className="text-muted-foreground text-xs">Plan a focused sprint iteration cycle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-foreground block text-xs font-semibold">
              Sprint Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 24 - Edge Gateway MVP"
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-foreground block text-xs font-semibold">Sprint Goal</label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What core deliverable will the team accomplish this sprint?"
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-foreground block text-xs font-semibold">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SprintStatus)}
                className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
              >
                <option value={SprintStatus.PLANNED}>Planned</option>
                <option value={SprintStatus.ACTIVE}>Active</option>
                <option value={SprintStatus.CLOSED}>Closed</option>
              </select>
            </div>

            <div>
              <label className="text-foreground block text-xs font-semibold">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="text-foreground block text-xs font-semibold">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="border-border bg-card text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
