"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, Bell, Plus, ChevronDown, Command, LogOut, LogIn, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  WorkspaceSwitcher,
  type WorkspaceItem,
} from "@/features/workspaces/components/workspace-switcher";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";

export function Topbar() {
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [workspaces, setWorkspaces] = React.useState<WorkspaceItem[]>([]);
  const [currentWorkspaceName, setCurrentWorkspaceName] =
    React.useState<string>("Acme Engineering");
  const [currentRole, setCurrentRole] = React.useState<string>("ADMIN");

  React.useEffect(() => {
    let mounted = true;
    if (session?.user) {
      getCurrentUserAndWorkspace().then((res) => {
        if (!mounted) return;
        if (res.workspace) {
          setCurrentWorkspaceName(res.workspace.name);
        }
        if (res.membership) {
          setCurrentRole(res.membership.role);
        }
        if (res.workspaces) {
          setWorkspaces(res.workspaces);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [session]);

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AR";

  const userName = session?.user?.name || "Alex Rivera";
  const userRole =
    currentRole === "ADMIN"
      ? "Tech Lead (Admin)"
      : currentRole === "DEVELOPER"
        ? "Developer"
        : "Viewer";

  return (
    <header className="border-border bg-card/80 flex h-16 w-full items-center justify-between border-b px-6 backdrop-blur-md">
      {/* Left: Workspace Switcher */}
      <div className="flex items-center gap-3">
        <WorkspaceSwitcher
          initialWorkspaces={workspaces}
          currentWorkspaceName={currentWorkspaceName}
          currentRole={currentRole}
        />
      </div>

      {/* Center: Global Search */}
      <div className="hidden max-w-md flex-1 px-4 md:block">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search tasks, projects, members... (Cmd+K)"
            className="border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:bg-background h-9 w-full rounded-xl border pr-12 pl-9 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
          />
          <kbd className="border-border bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 inline-flex h-5 -translate-y-1/2 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
        </button>

        <div className="bg-border mx-1 h-5 w-px" />

        {/* Notifications Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground relative inline-flex h-9 w-9 items-center justify-center rounded-lg border p-2 shadow-xs transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="ring-card absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile / Auth Dropdown */}
        <div className="relative pl-2">
          {session ? (
            <div>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="hover:bg-muted flex items-center gap-2 rounded-xl p-1 text-left transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-xs">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={userName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="hidden flex-col text-left text-xs lg:flex">
                  <span className="text-foreground font-semibold">{userName}</span>
                  <span className="text-muted-foreground text-[11px]">{userRole}</span>
                </div>
                <ChevronDown className="text-muted-foreground hidden h-3.5 w-3.5 lg:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="border-border bg-card animate-in fade-in-0 zoom-in-95 absolute right-0 z-50 mt-2 w-48 rounded-xl border p-1.5 shadow-lg">
                    <div className="border-border border-b px-3 py-2">
                      <p className="text-foreground text-xs font-semibold">{userName}</p>
                      <p className="text-muted-foreground truncate text-[11px]">
                        {session.user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                    >
                      <User className="text-muted-foreground h-3.5 w-3.5" />
                      <span>My Profile</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold shadow-xs transition-colors"
            >
              <LogIn className="text-muted-foreground h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
