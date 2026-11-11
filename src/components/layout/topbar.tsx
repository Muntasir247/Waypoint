"use client";

import * as React from "react";
import { Search, Bell, Plus, ChevronDown, Building2, Command } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  return (
    <header className="border-border bg-card/80 flex h-16 w-full items-center justify-between border-b px-6 backdrop-blur-md">
      {/* Left: Workspace Switcher */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="border-border bg-muted/50 text-foreground hover:bg-muted flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
        >
          <Building2 className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold">Acme Engineering</span>
          <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
        </button>
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

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-xs">
            AR
          </div>
          <div className="hidden flex-col text-left text-xs lg:flex">
            <span className="text-foreground font-semibold">Alex Rivera</span>
            <span className="text-muted-foreground text-[11px]">Tech Lead (Admin)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
