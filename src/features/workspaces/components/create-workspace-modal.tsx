"use client";

import * as React from "react";
import { Building2, X, Sparkles, Loader2 } from "lucide-react";
import { createWorkspaceAction } from "../actions";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (workspace: { id: string; name: string; slug: string }) => void;
}

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!slugManuallyEdited) {
      setSlug(
        newName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await createWorkspaceAction({ name, slug });
      if (result.error) {
        setError(result.error);
      } else if (result.workspace) {
        onSuccess?.(result.workspace);
        onClose();
        window.location.reload();
      }
    } catch {
      setError("Failed to create workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="border-border bg-card text-card-foreground animate-in fade-in-0 zoom-in-95 w-full max-w-md rounded-2xl border p-6 shadow-xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground text-base font-semibold">Create Workspace</h3>
              <p className="text-muted-foreground text-xs">
                Start a new project space for your team
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="text-foreground text-xs font-semibold">Workspace Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Acme Engineering, Platform Core"
              className="border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:bg-background mt-1.5 h-10 w-full rounded-xl border px-3.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-foreground text-xs font-semibold">Workspace URL Slug</label>
            <div className="border-border bg-muted/40 focus-within:bg-background mt-1.5 flex items-center rounded-xl border focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
              <span className="text-muted-foreground pl-3.5 text-xs select-none">
                waypoint.app/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
                placeholder="acme-engineering"
                className="text-foreground h-10 w-full bg-transparent px-2 text-sm focus:outline-hidden"
              />
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Lowercase alphanumeric characters and hyphens only.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="font-semibold">You will be the Tech Lead (Admin).</span> You can
                invite teammates, create projects, configure scoring weights, and assign tasks.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="border-border bg-muted/50 text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
