"use client";

import * as React from "react";
import { Sparkles, X, AlertCircle } from "lucide-react";
import { createTaskAction, getSmartSuggestionsAction } from "@/features/tasks/actions";
import { getProjectsAction } from "@/features/projects/actions";
import { getMembersAction } from "@/features/members/actions";
import { Priority } from "@prisma/client";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultSprintId?: string;
  onTaskCreated?: () => void;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface MemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Suggestion {
  membershipId: string;
  name: string;
  avatarUrl?: string | null;
  score: number;
  reasons: string[];
  capacityPoints: number;
  capacityLimit: number;
  isOverloaded: boolean;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  defaultProjectId,
  defaultSprintId,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [projectId, setProjectId] = React.useState(defaultProjectId || "");
  const [sprintId, setSprintId] = React.useState(defaultSprintId || "");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>(Priority.MEDIUM);
  const [estimatePoints, setEstimatePoints] = React.useState<1 | 2 | 3 | 5 | 8>(3);
  const [dueDate, setDueDate] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [labelsInput, setLabelsInput] = React.useState("");

  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [members, setMembers] = React.useState<MemberOption[]>([]);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    Promise.all([getProjectsAction(), getMembersAction()]).then(([projRes, memRes]) => {
      if (!isMounted) return;
      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      }
      if (defaultSprintId) {
        setSprintId(defaultSprintId);
      }

      if (projRes.projects) {
        const list: ProjectOption[] = projRes.projects.map((p) => ({ id: p.id, name: p.name }));
        setProjects(list);
        if (!defaultProjectId && list.length > 0) {
          setProjectId((prev) => prev || list[0].id);
        }
      }

      if (memRes.members) {
        const list: MemberOption[] = memRes.members.map((m) => ({
          id: m.id,
          name: m.user?.name || m.user?.email?.split("@")[0] || "Member",
          email: m.user?.email || "",
          role: m.role,
        }));
        setMembers(list);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, defaultProjectId, defaultSprintId]);

  // Fetch smart suggestions when estimatePoints, labels or title changes
  React.useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      const parsedLabels = labelsInput
        .split(",")
        .map((s) => s.trim().replace(/^#/, ""))
        .filter(Boolean);

      // Also extract common keywords from title
      const titleWords = title
        .split(/\s+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 3);

      const allTags = Array.from(new Set([...parsedLabels, ...titleWords]));

      const res = await getSmartSuggestionsAction({
        estimatePoints,
        labels: allTags,
      });

      if (res.suggestions) {
        setSuggestions(res.suggestions);
      }
      setIsLoadingSuggestions(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [estimatePoints, labelsInput, title, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError("Please select a project");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await createTaskAction({
        projectId,
        sprintId: sprintId || null,
        milestoneId: null,
        title,
        description: description || null,
        priority,
        estimatePoints,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      });

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      onTaskCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="border-border bg-card text-card-foreground animate-in fade-in-0 zoom-in-95 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight">Create New Task</h2>
              <p className="text-muted-foreground text-xs">
                Assign work with AI-assisted capacity suggestions
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
          {/* Title */}
          <div>
            <label className="text-foreground block text-xs font-semibold">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement mTLS handshake between proxy gateways"
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          {/* Project & Sprint selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
          </div>

          {/* Optional Sprint & Milestone links */}
          {(sprintId || defaultSprintId) && (
            <div>
              <label className="text-foreground block text-xs font-semibold">Sprint ID</label>
              <input
                type="text"
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2"
              />
            </div>
          )}

          {/* Priority & Story Points */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-foreground mb-1 block text-xs font-semibold">Priority</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                      priority === p
                        ? p === "CRITICAL"
                          ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : p === "HIGH"
                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-semibold">
                Estimate (Fibonacci Points)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 5, 8] as const).map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setEstimatePoints(pts)}
                    className={`rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                      estimatePoints === pts
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {pts} pts
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Assignment Suggestions Card */}
          <div className="border-border bg-muted/30 rounded-xl border p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-foreground text-xs font-bold">
                  Smart Assignment Suggestions
                </span>
              </div>
              <span className="text-muted-foreground text-[11px]">Ranked by suitability score</span>
            </div>

            {isLoadingSuggestions ? (
              <div className="text-muted-foreground mt-3 py-2 text-center text-xs">
                Analyzing capacity and skill match...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="mt-2.5 space-y-2">
                {suggestions.map((s) => {
                  const isSelected = assigneeId === s.membershipId;
                  return (
                    <div
                      key={s.membershipId}
                      className={`flex flex-col gap-2 rounded-xl border p-2.5 transition-all sm:flex-row sm:items-center sm:justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground text-xs font-semibold">{s.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              s.isOverloaded
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : s.score >= 80
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            }`}
                          >
                            {s.isOverloaded ? "Overloaded" : `${s.score}% Match`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {s.reasons.map((r, rIdx) => (
                            <span
                              key={rIdx}
                              className="text-muted-foreground bg-muted rounded-md px-1.5 py-0.5 text-[10px]"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAssigneeId(s.membershipId)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "border-border bg-muted/60 text-foreground hover:bg-muted"
                        }`}
                      >
                        {isSelected ? "Assigned" : "Assign"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted-foreground mt-2 text-xs">
                No active developers found to suggest.
              </div>
            )}
          </div>

          {/* Or Manual Assignee Selector */}
          <div>
            <label className="text-foreground block text-xs font-semibold">
              Or Choose Assignee Directly
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Skill tags / labels */}
          <div>
            <label className="text-foreground block text-xs font-semibold">
              Tags / Labels (comma separated)
            </label>
            <input
              type="text"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              placeholder="e.g. TypeScript, Backend, OAuth, Bug"
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-foreground block text-xs font-semibold">
              Description (Markdown)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe technical context, acceptance criteria, or repro steps..."
              className="border-border bg-background text-foreground focus:ring-ring mt-1 w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:ring-2"
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || !title.trim() || !projectId}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
