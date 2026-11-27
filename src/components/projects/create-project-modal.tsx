"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderGit2, X, AlertCircle } from "lucide-react";
import { createProjectAction } from "@/features/projects/actions";
import { ProjectStatus } from "@/types/enums";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (project: { id: string; name: string }) => void;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [targetDate, setTargetDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await createProjectAction({
        name,
        description: description || null,
        status: status as "ACTIVE" | "PLANNING" | "ON_HOLD" | "COMPLETED",
        targetDate: targetDate || null,
      });

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      if (res.project) {
        onProjectCreated?.({ id: res.project.id, name: res.project.name });
        router.refresh();
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
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
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">
                Create New Project
              </h2>
              <p className="text-muted-foreground text-xs">
                Set up a roadmap initiative for your workspace
              </p>
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
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core API v2 Gateway"
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-foreground block text-xs font-semibold">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of goals, architecture, and team ownership..."
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-foreground block text-xs font-semibold">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
              >
                <option value={ProjectStatus.ACTIVE}>Active</option>
                <option value={ProjectStatus.PLANNING}>Planning</option>
                <option value={ProjectStatus.ON_HOLD}>On Hold</option>
                <option value={ProjectStatus.COMPLETED}>Completed</option>
              </select>
            </div>

            <div>
              <label className="text-foreground block text-xs font-semibold">
                Target Launch Date
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="border-border bg-background text-foreground focus:ring-ring w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                />
              </div>
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
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
