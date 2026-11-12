"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Compass, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { createWorkspaceAction } from "@/features/workspaces/actions";
import { DemoBanner } from "@/components/demo-banner";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slugManuallyEdited) {
      setSlug(
        val
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
      const res = await createWorkspaceAction({ name, slug });
      if (res.error) {
        setError(res.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred while creating workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="fixed top-0 right-0 left-0 z-50">
        <DemoBanner />
      </div>

      <div className="border-border bg-card text-card-foreground w-full max-w-lg rounded-2xl border p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold tracking-tight">
              Create Your Engineering Workspace
            </h1>
            <p className="text-muted-foreground text-xs">
              Set up a shared space for task assignment, sprints, and smart scoring.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="font-semibold">You will become Tech Lead (Admin).</span> You can
                invite developers, create and assign tasks, configure scoring rules, and monitor
                workload.
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Workspace & Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
