"use client";

import * as React from "react";
import { Search, X, Filter, User, Tag, Bookmark, Trash2, Plus, RotateCcw } from "lucide-react";
import { TaskStatus, Priority } from "@prisma/client";
import { FilterState, STATUS_CONFIG, PRIORITY_CONFIG } from "./types";
import {
  getSavedFiltersAction,
  createSavedFilterAction,
  deleteSavedFilterAction,
  SavedFilterItem,
} from "@/features/filters/actions";

interface MemberOption {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface TaskFilterToolbarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  members?: MemberOption[];
  projects?: ProjectOption[];
  availableLabels?: { id: string; name: string; color: string }[];
}

export function TaskFilterToolbar({
  filter,
  onFilterChange,
  members = [],
  projects = [],
  availableLabels = [],
}: TaskFilterToolbarProps) {
  const [savedFilters, setSavedFilters] = React.useState<SavedFilterItem[]>([]);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = React.useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false);
  const [saveFilterName, setSaveFilterName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Active filter count (excluding default values)
  const activeFiltersCount =
    (filter.search ? 1 : 0) +
    filter.assigneeIds.length +
    filter.statuses.length +
    filter.priorities.length +
    filter.labels.length +
    (filter.dueDate !== "all" ? 1 : 0) +
    (filter.projectId ? 1 : 0);

  // Load saved filters on mount
  const refreshSavedFilters = React.useCallback(() => {
    getSavedFiltersAction().then((res) => {
      if (res.filters) setSavedFilters(res.filters);
    });
  }, []);

  React.useEffect(() => {
    refreshSavedFilters();
  }, [refreshSavedFilters]);

  // Keyboard shortcut ⌘K / Ctrl+K
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSaveCurrentFilter(e: React.FormEvent) {
    e.preventDefault();
    if (!saveFilterName.trim()) return;

    setIsSaving(true);
    createSavedFilterAction({
      name: saveFilterName.trim(),
      query: {
        search: filter.search || undefined,
        assigneeIds: filter.assigneeIds.length > 0 ? filter.assigneeIds : undefined,
        statuses: filter.statuses.length > 0 ? filter.statuses : undefined,
        priorities: filter.priorities.length > 0 ? filter.priorities : undefined,
        labels: filter.labels.length > 0 ? filter.labels : undefined,
        dueDate: filter.dueDate,
        projectId: filter.projectId || undefined,
      },
    }).then((res) => {
      setIsSaving(false);
      if (res.error) {
        alert(res.error);
        return;
      }
      setSaveFilterName("");
      setIsSaveModalOpen(false);
      refreshSavedFilters();
    });
  }

  function handleApplySavedFilter(sf: SavedFilterItem) {
    onFilterChange({
      search: sf.query.search || "",
      assigneeIds: sf.query.assigneeIds || [],
      statuses: sf.query.statuses || [],
      priorities: sf.query.priorities || [],
      labels: sf.query.labels || [],
      dueDate: sf.query.dueDate || "all",
      projectId: sf.query.projectId || "",
      sprintId: sf.query.sprintId || "",
    });
    setIsSavedFiltersOpen(false);
  }

  async function handleDeleteSavedFilter(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteSavedFilterAction(id);
    refreshSavedFilters();
  }

  function handleResetFilters() {
    onFilterChange({
      search: "",
      assigneeIds: [],
      statuses: [],
      priorities: [],
      labels: [],
      dueDate: "all",
      projectId: "",
      sprintId: "",
    });
  }

  function toggleStatus(status: TaskStatus) {
    const next = filter.statuses.includes(status)
      ? filter.statuses.filter((s) => s !== status)
      : [...filter.statuses, status];
    onFilterChange({ ...filter, statuses: next });
  }

  function togglePriority(priority: Priority) {
    const next = filter.priorities.includes(priority)
      ? filter.priorities.filter((p) => p !== priority)
      : [...filter.priorities, priority];
    onFilterChange({ ...filter, priorities: next });
  }

  function toggleAssignee(assigneeId: string) {
    const next = filter.assigneeIds.includes(assigneeId)
      ? filter.assigneeIds.filter((id) => id !== assigneeId)
      : [...filter.assigneeIds, assigneeId];
    onFilterChange({ ...filter, assigneeIds: next });
  }

  function toggleLabel(labelName: string) {
    const next = filter.labels.includes(labelName)
      ? filter.labels.filter((l) => l !== labelName)
      : [...filter.labels, labelName];
    onFilterChange({ ...filter, labels: next });
  }

  return (
    <div className="space-y-2.5">
      <div className="border-border bg-card rounded-2xl border p-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Universal Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks, descriptions, or tags... (⌘K)"
              value={filter.search}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground h-9 w-full rounded-xl border pr-8 pl-9 text-xs transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
            />
            {filter.search && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filter, search: "" })}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Project Dropdown Filter (if multiple projects) */}
          {projects.length > 0 && (
            <select
              value={filter.projectId}
              onChange={(e) => onFilterChange({ ...filter, projectId: e.target.value })}
              className="border-border bg-background text-foreground hover:bg-muted/50 h-9 rounded-xl border px-2.5 text-xs font-medium focus:outline-hidden"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Due Date Filter */}
          <select
            value={filter.dueDate}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                dueDate: e.target.value as FilterState["dueDate"],
              })
            }
            className={`border-border bg-background hover:bg-muted/50 h-9 rounded-xl border px-2.5 text-xs font-medium focus:outline-hidden ${
              filter.dueDate !== "all"
                ? "border-indigo-500 font-semibold text-indigo-600"
                : "text-foreground"
            }`}
          >
            <option value="all">Due Date: Any</option>
            <option value="overdue">🚨 Overdue</option>
            <option value="today">Due Today</option>
            <option value="this_week">Due This Week</option>
            <option value="next_week">Due Next Week</option>
            <option value="no_date">No Due Date</option>
          </select>

          {/* Saved Filters Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSavedFiltersOpen((prev) => !prev)}
              className="border-border bg-background text-foreground hover:bg-muted/50 inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium shadow-2xs transition-colors"
            >
              <Bookmark className="text-muted-foreground h-3.5 w-3.5" />
              <span>Saved Filters</span>
              {savedFilters.length > 0 && (
                <span className="py-0.2 rounded-full bg-indigo-100 px-1.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {savedFilters.length}
                </span>
              )}
            </button>

            {isSavedFiltersOpen && (
              <div className="border-border bg-card absolute top-full right-0 z-30 mt-1.5 w-64 rounded-xl border p-2 shadow-lg">
                <div className="text-muted-foreground px-2 py-1 text-[11px] font-semibold tracking-wider uppercase">
                  Saved Filters
                </div>
                <div className="max-h-48 space-y-0.5 overflow-y-auto py-1">
                  {savedFilters.length === 0 ? (
                    <p className="text-muted-foreground px-2 py-2 text-xs italic">
                      No saved filters yet.
                    </p>
                  ) : (
                    savedFilters.map((sf) => (
                      <div
                        key={sf.id}
                        onClick={() => handleApplySavedFilter(sf)}
                        className="hover:bg-muted/80 group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                      >
                        <span className="text-foreground truncate font-medium">{sf.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedFilter(sf.id, e)}
                          title="Delete saved filter"
                          className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-border mt-1 border-t pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSavedFiltersOpen(false);
                      setIsSaveModalOpen(true);
                    }}
                    className="hover:bg-muted/80 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 transition-colors dark:text-indigo-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save Current View as Filter</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Secondary Filter Badges Row: Statuses, Priorities, Assignees, Labels */}
        <div className="border-border mt-2.5 flex flex-wrap items-center gap-1.5 border-t pt-2.5 text-xs">
          <span className="text-muted-foreground mr-1 flex items-center gap-1 text-[11px] font-semibold">
            <Filter className="h-3 w-3" />
            <span>Filters:</span>
          </span>

          {/* Status Pills */}
          {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((st) => {
            const isSelected = filter.statuses.includes(st);
            const cfg = STATUS_CONFIG[st];
            return (
              <button
                key={st}
                type="button"
                onClick={() => toggleStatus(st)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} font-semibold shadow-2xs ring-1 ring-indigo-500 ring-inset`
                    : "border-border text-muted-foreground hover:bg-muted border"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                <span>{cfg.label}</span>
              </button>
            );
          })}

          <span className="text-muted-foreground/30 mx-1">|</span>

          {/* Priority Pills */}
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((pr) => {
            const isSelected = filter.priorities.includes(pr);
            const cfg = PRIORITY_CONFIG[pr];
            return (
              <button
                key={pr}
                type="button"
                onClick={() => togglePriority(pr)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                  isSelected
                    ? `${cfg.badge} font-semibold shadow-2xs ring-1 ring-indigo-500 ring-inset`
                    : "border-border text-muted-foreground hover:bg-muted border"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                <span>{cfg.label}</span>
              </button>
            );
          })}

          {/* Assignees Pill Buttons */}
          {members.length > 0 && (
            <>
              <span className="text-muted-foreground/30 mx-1">|</span>
              {members.slice(0, 4).map((m) => {
                const isSelected = filter.assigneeIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAssignee(m.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-indigo-50 font-semibold text-indigo-700 ring-1 ring-indigo-500 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-border text-muted-foreground hover:bg-muted border"
                    }`}
                  >
                    <User className="h-2.5 w-2.5" />
                    <span>{m.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Labels Filter */}
          {availableLabels.length > 0 && (
            <>
              <span className="text-muted-foreground/30 mx-1">|</span>
              {availableLabels.slice(0, 3).map((l) => {
                const isSelected = filter.labels.includes(l.name);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleLabel(l.name)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-indigo-100 font-semibold text-indigo-700 ring-1 ring-indigo-500 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-border text-muted-foreground hover:bg-muted border"
                    }`}
                  >
                    <Tag className="h-2.5 w-2.5" />
                    <span>#{l.name}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Save Filter Modal */}
      {isSaveModalOpen && (
        <div className="backdrop-blur-2xs fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="border-border bg-card w-full max-w-sm rounded-2xl border p-5 shadow-xl">
            <h3 className="text-foreground text-sm font-bold">Save Current Filter</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Give your current search and filter combination a memorable name.
            </p>

            <form onSubmit={handleSaveCurrentFilter} className="mt-4 space-y-3">
              <div>
                <label className="text-muted-foreground text-xs font-semibold">Filter Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Sprint 24 Blockers, High Priority API"
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  className="border-border bg-background text-foreground mt-1 h-9 w-full rounded-xl border px-3 text-xs focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="border-border bg-background text-foreground hover:bg-muted rounded-xl border px-3 py-1.5 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !saveFilterName.trim()}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Filter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
