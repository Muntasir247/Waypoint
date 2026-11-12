"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, ArrowRight, Kanban, CheckSquare, Trophy, Home } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NotFound() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4">
      <div className="border-border bg-card relative flex w-full max-w-lg flex-col items-center rounded-3xl border p-8 text-center shadow-xl sm:p-12">
        {/* Compass Illustration */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-950/80 dark:text-indigo-400">
          <Compass className="h-10 w-10 animate-pulse" />
          <span className="ring-card absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 font-mono text-xs font-bold text-white ring-2">
            ?
          </span>
        </div>

        <span className="rounded-full bg-rose-100 px-3 py-1 font-mono text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          404 ERROR
        </span>

        <h1 className="text-foreground mt-4 text-2xl font-black tracking-tight sm:text-3xl">
          Destination Not Found
        </h1>

        <p className="text-muted-foreground mt-2 max-w-sm text-xs leading-relaxed sm:text-sm">
          The waypoint you are navigating toward does not exist, has been archived, or belongs to a
          different workspace.
        </p>

        {/* Primary Return Button */}
        <Link
          href="/board"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-98"
        >
          <Kanban className="h-4 w-4" />
          <span>Return to Kanban Board</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {/* Secondary Quick Jump Links */}
        <div className="border-border mt-8 w-full border-t pt-6">
          <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
            Quick Navigations
          </span>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href="/"
              className="border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Overview</span>
            </Link>
            <Link
              href="/my-tasks"
              className="border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>My Tasks</span>
            </Link>
            <Link
              href="/leaderboard"
              className="border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Leaderboard</span>
            </Link>
          </div>
        </div>

        {/* Theme Toggle bottom corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
