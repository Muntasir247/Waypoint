"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Kanban,
  CheckSquare,
  Users2,
  Trophy,
  BarChart3,
  ShieldAlert,
  Mail,
  Plus,
  Moon,
  Sun,
  Keyboard,
  X,
  Layers,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Actions" | "Views";
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  onOpenCreateTask?: () => void;
}

export function CommandPalette({ onOpenCreateTask }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = React.useMemo(
    () => [
      // Navigation
      {
        id: "nav-overview",
        title: "Overview",
        subtitle: "Tech Lead Copilot & project health",
        category: "Navigation",
        icon: Layers,
        shortcut: "G O",
        onSelect: () => router.push("/"),
      },
      {
        id: "nav-board",
        title: "Kanban Board",
        subtitle: "Drag and drop task execution board",
        category: "Navigation",
        icon: Kanban,
        shortcut: "G B",
        onSelect: () => router.push("/board"),
      },
      {
        id: "nav-my-tasks",
        title: "My Tasks",
        subtitle: "Personal assigned work & on-time stats",
        category: "Navigation",
        icon: CheckSquare,
        shortcut: "G M",
        onSelect: () => router.push("/my-tasks"),
      },
      {
        id: "nav-workload",
        title: "Workload View",
        subtitle: "Team capacity distribution & rebalance",
        category: "Navigation",
        icon: Users2,
        shortcut: "G W",
        onSelect: () => router.push("/workload"),
      },
      {
        id: "nav-leaderboard",
        title: "Leaderboard",
        subtitle: "Fair effort rankings, podiums & badges",
        category: "Navigation",
        icon: Trophy,
        shortcut: "G L",
        onSelect: () => router.push("/leaderboard"),
      },
      {
        id: "nav-reports",
        title: "Executive Reports",
        subtitle: "Monthly analytics, CSV and PDF export",
        category: "Navigation",
        icon: BarChart3,
        shortcut: "G R",
        onSelect: () => router.push("/reports"),
      },
      {
        id: "nav-audit-log",
        title: "Security Audit Log",
        subtitle: "Immutable sensitive actions trail (Admin)",
        category: "Navigation",
        icon: ShieldAlert,
        shortcut: "G A",
        onSelect: () => router.push("/audit-log"),
      },
      {
        id: "nav-outbox",
        title: "Demo Outbox",
        subtitle: "Simulated transactional emails & digests",
        category: "Navigation",
        icon: Mail,
        shortcut: "G D",
        onSelect: () => router.push("/demo-outbox"),
      },

      // Actions
      {
        id: "action-create-task",
        title: "Create New Task",
        subtitle: "Open task creation with smart assignment",
        category: "Actions",
        icon: Plus,
        shortcut: "C",
        onSelect: () => {
          if (onOpenCreateTask) {
            onOpenCreateTask();
          } else {
            router.push("/board?create=true");
          }
        },
      },
      {
        id: "action-toggle-theme",
        title: "Toggle Dark / Light Theme",
        subtitle: "Switch appearance palette",
        category: "Actions",
        icon: theme === "dark" ? Sun : Moon,
        shortcut: "T",
        onSelect: () => setTheme(theme === "dark" ? "light" : "dark"),
      },
      {
        id: "action-shortcuts",
        title: "Keyboard Shortcuts Cheat Sheet",
        subtitle: "View all available keyboard navigation shortcuts",
        category: "Actions",
        icon: Keyboard,
        shortcut: "?",
        onSelect: () => setIsShortcutsHelpOpen(true),
      },
    ],
    [router, theme, setTheme, onOpenCreateTask],
  );

  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Global keydown listeners
  React.useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
        return;
      }

      // Escape to close
      if (e.key === "Escape") {
        if (isOpen) {
          setIsOpen(false);
          return;
        }
        if (isShortcutsHelpOpen) {
          setIsShortcutsHelpOpen(false);
          return;
        }
      }

      // Don't trigger letter shortcuts when typing in inputs
      if (isInput) return;

      // Question mark shortcut '?'
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
        return;
      }

      // 'C' shortcut for create task
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onOpenCreateTask) onOpenCreateTask();
        return;
      }

      // Sequence shortcuts: 'G' followed by letter
      const now = Date.now();
      if (e.key.toLowerCase() === "g") {
        lastKey = "g";
        lastKeyTime = now;
        return;
      }

      if (lastKey === "g" && now - lastKeyTime < 1000) {
        lastKey = "";
        const target = e.key.toLowerCase();
        if (target === "b") {
          e.preventDefault();
          router.push("/board");
        } else if (target === "m") {
          e.preventDefault();
          router.push("/my-tasks");
        } else if (target === "l") {
          e.preventDefault();
          router.push("/leaderboard");
        } else if (target === "r") {
          e.preventDefault();
          router.push("/reports");
        } else if (target === "w") {
          e.preventDefault();
          router.push("/workload");
        } else if (target === "a") {
          e.preventDefault();
          router.push("/audit-log");
        } else if (target === "d") {
          e.preventDefault();
          router.push("/demo-outbox");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isShortcutsHelpOpen, router, onOpenCreateTask]);

  // Focus input on open
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    item.onSelect();
  };

  const handleArrowNavigation = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev === 0 ? filteredCommands.length - 1 : prev - 1));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
    }
  };

  return (
    <>
      {/* Command Palette Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-xs">
          <div className="border-border bg-card animate-in fade-in-0 zoom-in-95 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
            {/* Search Input Bar */}
            <div className="border-border flex items-center gap-3 border-b px-4 py-3">
              <Search className="text-muted-foreground h-4 w-4 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleArrowNavigation}
                placeholder="Type a command or search destination..."
                className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm focus:outline-hidden"
              />
              <kbd className="border-border bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center text-xs italic">
                  No matching commands found.
                </div>
              ) : (
                filteredCommands.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            isSelected ? "text-white" : "text-muted-foreground"
                          }`}
                        />
                        <div>
                          <span className="block text-xs font-semibold">{item.title}</span>
                          {item.subtitle && (
                            <span
                              className={`block text-[11px] ${
                                isSelected ? "text-indigo-100" : "text-muted-foreground"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.shortcut && (
                        <kbd
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            isSelected
                              ? "bg-indigo-700 text-white"
                              : "border-border bg-muted text-muted-foreground border"
                          }`}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-border bg-muted/30 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-[11px]">
              <span>Navigate with ↑ ↓ and Enter</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsShortcutsHelpOpen(true);
                }}
                className="hover:text-foreground inline-flex items-center gap-1 font-medium underline"
              >
                <Keyboard className="h-3 w-3" />
                <span>Shortcuts (?)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {isShortcutsHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="border-border bg-card flex w-full max-w-md flex-col rounded-2xl border p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-foreground text-sm font-bold">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsHelpOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Global Actions
              </div>
              <div className="flex items-center justify-between">
                <span>Open command palette / search</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  Cmd + K
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Create new task</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  C
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Show shortcuts cheat sheet</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  ?
                </kbd>
              </div>

              <div className="text-muted-foreground pt-2 text-[10px] font-bold tracking-wider uppercase">
                Navigation Sequence (Press G then Key)
              </div>
              <div className="flex items-center justify-between">
                <span>Go to Board</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  G then B
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Go to My Tasks</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  G then M
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Go to Workload</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  G then W
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Go to Leaderboard</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  G then L
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Go to Reports</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  G then R
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Go to Security Audit Log</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  G then A
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Go to Demo Outbox</span>
                <kbd className="border-border bg-muted rounded border px-2 py-0.5 font-mono text-[11px]">
                  G then D
                </kbd>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsShortcutsHelpOpen(false)}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
