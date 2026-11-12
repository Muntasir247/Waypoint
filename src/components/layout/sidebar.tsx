"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  CheckSquare,
  FolderGit2,
  Kanban,
  Users2,
  Trophy,
  BarChart3,
  Mail,
  Settings,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyTasksAction } from "@/features/tasks/actions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: "primary" | "warning" | "neutral";
}

const mainNavItems: NavItem[] = [
  { label: "Overview", href: "/", icon: Layers },
  { label: "Projects", href: "/projects", icon: FolderGit2 },
  { label: "Team & Members", href: "/team", icon: Users2 },
  { label: "My Tasks", href: "/my-tasks", icon: CheckSquare, badgeVariant: "primary" },
  { label: "Kanban Board", href: "/board", icon: Kanban },
  { label: "Workload View", href: "/workload", icon: Users2 },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Audit Log", href: "/audit-log", icon: ShieldAlert },
];

const secondaryNavItems: NavItem[] = [
  {
    label: "Demo Outbox",
    href: "/demo-outbox",
    icon: Mail,
    badge: "Mocked",
    badgeVariant: "warning",
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [projectsOpen, setProjectsOpen] = React.useState(true);
  const [myTasksCount, setMyTasksCount] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    getMyTasksAction()
      .then((res) => {
        if (res.metrics) {
          const activeCount = res.metrics.totalAssigned - res.metrics.done;
          setMyTasksCount(activeCount > 0 ? activeCount : undefined);
        }
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <aside className="border-border bg-card text-card-foreground flex h-screen w-64 flex-col border-r">
      {/* Brand Header */}
      <div className="border-border flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
          <Compass className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-base font-semibold tracking-tight">Waypoint</span>
          <span className="text-muted-foreground text-[11px] font-medium">Tech Lead Copilot</span>
        </div>
      </div>

      {/* Nav Content */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {/* Main Section */}
        <div>
          <div className="text-muted-foreground px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase">
            Workspace
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const displayBadge = item.href === "/my-tasks" ? myTasksCount : item.badge;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground",
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {displayBadge !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        item.badgeVariant === "primary" &&
                          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
                        item.badgeVariant === "warning" &&
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
                        (!item.badgeVariant || item.badgeVariant === "neutral") &&
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {displayBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Projects Tree */}
        <div>
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase"
          >
            <div className="flex items-center gap-1.5">
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>Projects</span>
            </div>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", !projectsOpen && "-rotate-90")}
            />
          </button>
          {projectsOpen && (
            <div className="space-y-1 pl-2">
              <Link
                href="/projects/core-api"
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Core API v2</span>
                </div>
                <span className="text-muted-foreground text-[10px]">Sprint 24</span>
              </Link>
              <Link
                href="/projects/mobile-client"
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span>Mobile Client</span>
                </div>
                <span className="text-muted-foreground text-[10px]">Sprint 12</span>
              </Link>
              <Link
                href="/projects/infra-migration"
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Infra Migration</span>
                </div>
                <span className="text-muted-foreground text-[10px]">Blocked</span>
              </Link>
            </div>
          )}
        </div>

        {/* Secondary Links */}
        <div>
          <div className="text-muted-foreground px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase">
            System
          </div>
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase dark:bg-amber-900/60 dark:text-amber-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Sprint Mini-Widget */}
      <div className="border-border border-t p-3">
        <div className="border-border bg-muted/50 rounded-xl border p-3">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Sprint 24 Cycle
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              On Track
            </span>
          </div>
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div className="h-full w-3/4 rounded-full bg-indigo-600" />
          </div>
          <div className="text-muted-foreground mt-1.5 flex items-center justify-between text-[11px]">
            <span>74% done</span>
            <span>4 days left</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
