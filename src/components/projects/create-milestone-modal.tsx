"use client";

import * as React from "react";
import { Flag, X, AlertCircle } from "lucide-react";
import { createMilestoneAction } from "@/features/projects/actions";

interface CreateMilestoneModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onMilestoneCreated?: () => void;
}

export function CreateMilestoneModal({
  projectId,
  isOpen,
  onClose,
  onMilestoneCreated,
}: CreateMilestoneModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await createMilestoneAction({
        projectId,
        name,
        description: description || null,
        dueDate: dueDate || null,
      });

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      onMilestoneCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create milestone");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="border-border bg-card text-card-foreground animate-in fade-in-0 zoom-in-95 w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">Create Milestone</h2>
              <p className="text-muted-foreground text-xs">Target deliverable checkpoint</p>
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
              Milestone Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alpha Release v0.9"
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-foreground block text-xs font-semibold">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Criteria for reaching this milestone..."
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-foreground block text-xs font-semibold">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
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
              {isSubmitting ? "Creating..." : "Create Milestone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
