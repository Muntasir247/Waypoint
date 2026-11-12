"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  Rocket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Database,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
                Acme Engineering Overview
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Sprint 24 Active
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Tech Lead: Alex Rivera • Active cycle until Friday • 6 team members online
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/team"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus className="text-muted-foreground h-3.5 w-3.5" />
              <span>Invite Member</span>
            </a>
            <button
              type="button"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="text-muted-foreground h-3.5 w-3.5" />
              <span>New Project</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Active Sprints */}
          <div className="border-border bg-card rounded-2xl border p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Active Sprints
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Rocket className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-bold tracking-tight">3</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                2 on track
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Across Core API, Mobile & Infra</p>
          </div>

          {/* Card 2: Tasks In Progress */}
          <div className="border-border bg-card rounded-2xl border p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                In Progress
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-bold tracking-tight">18</span>
              <span className="text-muted-foreground text-xs font-medium">tasks assigned</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">5 active developers collaborating</p>
          </div>

          {/* Card 3: Overdue Alerts */}
          <div className="border-border bg-card rounded-2xl border p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Overdue Alerts
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                2
              </span>
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                action required
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">1 blocked by upstream dependency</p>
          </div>

          {/* Card 4: Velocity */}
          <div className="border-border bg-card rounded-2xl border p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Team Velocity
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-bold tracking-tight">94%</span>
              <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                +6%
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Higher on-time delivery rate</p>
          </div>
        </div>

        {/* Phase 0 Architecture & Foundation Status */}
        <div className="via-card to-card rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 p-6 shadow-xs dark:border-indigo-900/40 dark:from-indigo-950/20">
          <div className="border-border flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-foreground text-base font-semibold">
                  Phase 0: Foundation Stack & Design System
                </h2>
                <p className="text-muted-foreground text-xs">
                  Architecture verified, tests passing, Google Stitch MCP design system active.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Phase 0 Complete
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border-border bg-card rounded-xl border p-4">
              <div className="text-foreground flex items-center gap-2 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                <span>Next.js 16 + TypeScript</span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                Strict mode App Router with typed environment module (Zod) and automated CI
                pipeline.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-4">
              <div className="text-foreground flex items-center gap-2 text-xs font-semibold">
                <Database className="h-4 w-4 text-indigo-500" />
                <span>Prisma 6 + PostgreSQL</span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                Multi-tenant schema: Workspaces, Memberships, Tasks, Scoring, Ledgers, and MockEmail
                tables.
              </p>
            </div>

            <div className="border-border bg-card rounded-xl border p-4">
              <div className="text-foreground flex items-center gap-2 text-xs font-semibold">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span>Notion-like Theme System</span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                Polished light/dark mode design tokens, Inter typography, and responsive App Shell.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Next Steps for Tech Lead */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sprints Overview */}
          <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-foreground text-sm font-semibold">Active Sprint Progress</h3>
              <a
                href="/board"
                className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Open Kanban →
              </a>
            </div>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">Core API v2 (Sprint 24)</span>
                  <span className="text-muted-foreground">24 / 32 pts</span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div className="h-full w-3/4 rounded-full bg-indigo-600" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">Mobile Client (Sprint 12)</span>
                  <span className="text-muted-foreground">12 / 20 pts</span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div className="h-full w-3/5 rounded-full bg-emerald-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">Infra Migration (Sprint 5)</span>
                  <span className="text-rose-600 dark:text-rose-400">Blocked (Dependency)</span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div className="h-full w-1/4 rounded-full bg-rose-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Playbook */}
          <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
            <h3 className="text-foreground pb-3 text-sm font-semibold">Tech Lead Shortcuts</h3>
            <div className="space-y-2.5 pt-1">
              <a
                href="/workload"
                className="border-border bg-muted/40 hover:bg-muted flex items-center justify-between rounded-xl border p-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    <UserPlus className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-foreground font-semibold">Check Developer Workloads</span>
                    <p className="text-muted-foreground">
                      Identify overloaded developers and rebalance tasks
                    </p>
                  </div>
                </div>
                <ArrowRight className="text-muted-foreground h-4 w-4" />
              </a>

              <a
                href="/leaderboard"
                className="border-border bg-muted/40 hover:bg-muted flex items-center justify-between rounded-xl border p-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-foreground font-semibold">
                      Review Monthly Leaderboard
                    </span>
                    <p className="text-muted-foreground">Points, on-time rates, and badges</p>
                  </div>
                </div>
                <ArrowRight className="text-muted-foreground h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
