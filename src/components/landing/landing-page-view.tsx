"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Compass,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  Trophy,
  Users2,
  Kanban,
  BarChart3,
  Loader2,
  Clock,
  Layers,
  Award,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export function LandingPageView() {
  const router = useRouter();
  const [demoLoading, setDemoLoading] = React.useState<string | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = React.useState<
    "ASSIGNMENT" | "SCORING" | "VIEWS" | "REPORTING"
  >("ASSIGNMENT");

  const handleDemoSignIn = async (email: string, roleName: string) => {
    setDemoLoading(email);
    try {
      const res = await signIn("credentials", {
        email,
        password: "demo1234",
        redirect: false,
        callbackUrl: "/board",
      });

      if (res?.error) {
        toast.error("Could not sign in with demo credentials.");
      } else {
        toast.success(`Welcome to Waypoint! Signed in as ${roleName}.`);
        router.push("/board");
        router.refresh();
      }
    } catch {
      toast.error("Demo sign-in failed.");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <span className="text-foreground text-lg font-black tracking-tight">Waypoint</span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
            >
              Features
            </a>
            <a
              href="#smart-assignment"
              className="text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
            >
              Smart Assignment
            </a>
            <a
              href="#scoring"
              className="text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
            >
              Fair Scoring
            </a>
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
              <a
                href="#demo-accounts"
                className="text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
              >
                Demo Logins
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-foreground hover:bg-muted hidden rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* Decorative Floating Preview Badges */}
          <div className="pointer-events-none absolute top-4 left-4 hidden lg:block animate-float">
            <div className="border-border bg-card/90 flex items-center gap-2.5 rounded-2xl border p-3 shadow-xl backdrop-blur-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-600">
                SC
              </div>
              <div className="text-left text-xs">
                <span className="text-foreground block font-bold">Sarah Chen</span>
                <span className="text-[10px] font-medium text-emerald-600">98% Match • 8/20 pts</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-2 right-6 hidden lg:block animate-float-delayed">
            <div className="border-border bg-card/90 flex items-center gap-2.5 rounded-2xl border p-3 shadow-xl backdrop-blur-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left text-xs">
                <span className="text-foreground block font-bold">Sprint Burndown</span>
                <span className="text-[10px] font-medium text-indigo-600">On Track • Velocity 100%</span>
              </div>
            </div>
          </div>

          <div className="animate-fade-in-down inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-800 shadow-2xs backdrop-blur-xs dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Capacity-Aware Task Allocation</span>
          </div>

          <h1 className="text-foreground animate-fade-in-up mx-auto mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl sm:leading-tight">
            Precision task assignment & tracking for{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
              high-velocity teams
            </span>
          </h1>

          <p className="text-muted-foreground animate-fade-in-up mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
            Waypoint pairs mathematical, capacity-aware task allocation with fair effort-weighted
            recognition. Balance workloads, prevent circular deadlocks, and motivate engineers
            transparently.
          </p>

          {/* Quick Hero CTAs */}
          <div className="animate-fade-in-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
              <>
                <a
                  href="#demo-accounts"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-98"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Try the Demo (1-Click)</span>
                </a>

                <Link
                  href="/signup"
                  className="border-border bg-card text-foreground hover:bg-muted inline-flex h-11 items-center gap-2 rounded-xl border px-6 text-sm font-semibold shadow-xs transition-colors"
                >
                  <span>Create Free Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-98"
                >
                  <span>Create Free Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/login"
                  className="border-border bg-card text-foreground hover:bg-muted inline-flex h-11 items-center gap-2 rounded-xl border px-6 text-sm font-semibold shadow-xs transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Key Value Badges */}
          <div className="text-muted-foreground mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Effort-weighted scoring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Circular dependency prevention</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Zero-SMTP mock email outbox</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Immutable audit logs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Fast-Track Section */}
      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
        <section id="demo-accounts" className="border-border/60 bg-muted/20 border-y py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Instant Experience</span>
            </div>
            <h2 className="text-foreground mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Try the Demo with Pre-Populated Data
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-xs sm:text-sm">
              Click any persona below to immediately sign in and explore the full live application
              with ~40 tasks, burndown charts, and a populated leaderboard.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Tech Lead Demo */}
            <div className="border-border bg-card relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:border-indigo-400 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 uppercase dark:bg-indigo-950 dark:text-indigo-300">
                    Admin
                  </span>
                  <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-foreground mt-3 text-base font-bold">Alex Rivera</h3>
                <p className="text-muted-foreground text-xs">Tech Lead & Administrator</p>
                <p className="text-muted-foreground/80 mt-2 text-[11px] leading-relaxed">
                  Full permissions: assign tasks, inspect burndown analytics, view security audit
                  logs, and configure scoring rules.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleDemoSignIn("techlead@waypoint.demo", "Tech Lead (Alex Rivera)")
                }
                disabled={!!demoLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {demoLoading === "techlead@waypoint.demo" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Enter as Tech Lead</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Developer Demo */}
            <div className="border-border bg-card relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:border-sky-400 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-700 uppercase dark:bg-sky-950 dark:text-sky-300">
                    Developer
                  </span>
                  <Users2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="text-foreground mt-3 text-base font-bold">Sarah Chen</h3>
                <p className="text-muted-foreground text-xs">Senior Fullstack Engineer</p>
                <p className="text-muted-foreground/80 mt-2 text-[11px] leading-relaxed">
                  Developer permissions: update assigned task statuses, log working time, comment,
                  and compete on the leaderboard podium.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleDemoSignIn("developer@waypoint.demo", "Developer (Sarah Chen)")
                }
                disabled={!!demoLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-sky-700 disabled:opacity-50"
              >
                {demoLoading === "developer@waypoint.demo" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Enter as Developer</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Viewer Demo */}
            <div className="border-border bg-card relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:border-slate-400 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300">
                    Viewer
                  </span>
                  <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-foreground mt-3 text-base font-bold">David Kim</h3>
                <p className="text-muted-foreground text-xs">Stakeholder / Product Manager</p>
                <p className="text-muted-foreground/80 mt-2 text-[11px] leading-relaxed">
                  Read-only view: inspect project progress, roadmap timelines, export monthly
                  CSV/PDF reports without write permissions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDemoSignIn("viewer@waypoint.demo", "Viewer (David Kim)")}
                disabled={!!demoLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {demoLoading === "viewer@waypoint.demo" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Enter as Viewer</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Feature Showcase Interactive Tabs */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Engineered for Precision & Transparency
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-xs sm:text-sm">
              Discover how Waypoint elevates engineering management beyond standard issue trackers.
            </p>
          </div>

          {/* Interactive Feature Switcher */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {[
              { id: "ASSIGNMENT", label: "Smart Assignment", icon: Zap },
              { id: "SCORING", label: "Fair Effort Scoring", icon: Trophy },
              { id: "VIEWS", label: "Unified Views", icon: Kanban },
              { id: "REPORTING", label: "Executive Reporting", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFeatureTab(tab.id as typeof activeFeatureTab)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    activeFeatureTab === tab.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground border"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Showcase Card */}
          <div className="border-border bg-card mt-6 overflow-hidden rounded-3xl border p-6 shadow-xl sm:p-10">
            {activeFeatureTab === "ASSIGNMENT" && (
              <div key="ASSIGNMENT" className="animate-fade-in-up grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Mathematical Matchmaking
                  </div>
                  <h3 className="text-foreground text-2xl font-bold">
                    Capacity-Aware Smart Assignment Suggestions
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                    Waypoint automatically ranks candidate engineers based on skill overlap,
                    real-time workload capacity, and 90-day on-time delivery history. Tech leads see
                    clear plain-language rationale before assigning.
                  </p>
                  <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-4 font-mono text-xs dark:border-indigo-900/40 dark:bg-indigo-950/20">
                    <span className="font-bold text-indigo-950 dark:text-indigo-200">
                      Suitability Formula:
                    </span>
                    <p className="mt-1 text-[11px] text-indigo-800 dark:text-indigo-300">
                      suitability = 0.5 × skillMatch + 0.3 × capacityScore + 0.2 × onTimeHistory
                    </p>
                  </div>
                </div>

                <div className="border-border bg-muted/40 space-y-3 rounded-2xl border p-5">
                  <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                    Top Recommended Engineers
                  </span>
                  <div className="border-border bg-card flex items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        SC
                      </div>
                      <div>
                        <span className="text-foreground block text-xs font-bold">Sarah Chen</span>
                        <span className="text-muted-foreground text-[10px]">
                          98% match • 12/20 open pts
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Best Match
                    </span>
                  </div>
                  <div className="border-border bg-card flex items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        MV
                      </div>
                      <div>
                        <span className="text-foreground block text-xs font-bold">
                          Marcus Vance
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          85% match • 15/20 open pts
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Good Fit
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "SCORING" && (
              <div key="SCORING" className="animate-fade-in-up grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Transparent Gamification
                  </div>
                  <h3 className="text-foreground text-2xl font-bold">
                    Effort-Weighted Points & Monthly Leaderboards
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                    No gaming by cherry-picking trivial tickets. Points scale by complexity and
                    priority, reward on-time delivery with a 1.2x multiplier, and deduct for review
                    bounces. An immutable ledger records every score and reversal.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Critical × 2.0
                    </span>
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      On-Time × 1.2
                    </span>
                    <span className="rounded-lg bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Late × 0.5
                    </span>
                  </div>
                </div>

                <div className="border-border bg-muted/40 space-y-3 rounded-2xl border p-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span className="text-foreground text-xs font-bold">October 2026 Gold MVP</span>
                  </div>
                  <div className="mt-3 inline-block rounded-full bg-amber-100 p-3 text-amber-600 dark:bg-amber-950/80 dark:text-amber-300">
                    <Award className="h-8 w-8" />
                  </div>
                  <h4 className="text-foreground text-sm font-bold">Sarah Chen</h4>
                  <div className="flex justify-center gap-4 font-mono text-xs">
                    <span>42.5 pts</span>
                    <span>•</span>
                    <span className="text-emerald-600">100% On-Time</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "VIEWS" && (
              <div key="VIEWS" className="animate-fade-in-up grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Flexible Execution
                  </div>
                  <h3 className="text-foreground text-2xl font-bold">
                    Kanban, List, Calendar & Timeline Views
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                    Every view stays synchronized in real time. Drag and drop tasks across
                    swimlanes, inspect dependencies, manage subtask checklists, and log time without
                    leaving your flow.
                  </p>
                </div>

                <div className="border-border bg-muted/40 grid grid-cols-2 gap-3 rounded-2xl border p-4 text-xs font-semibold">
                  <div className="border-border bg-card rounded-xl border p-3">
                    <Kanban className="mb-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Kanban Board</span>
                    <p className="text-muted-foreground mt-1 text-[10px] font-normal">
                      Drag status transitions with blocked reasons
                    </p>
                  </div>
                  <div className="border-border bg-card rounded-xl border p-3">
                    <Clock className="mb-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Timeline & Gantt</span>
                    <p className="text-muted-foreground mt-1 text-[10px] font-normal">
                      Visualize milestones and critical paths
                    </p>
                  </div>
                  <div className="border-border bg-card rounded-xl border p-3">
                    <Layers className="mb-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Unified Filters</span>
                    <p className="text-muted-foreground mt-1 text-[10px] font-normal">
                      Save search queries across your team
                    </p>
                  </div>
                  <div className="border-border bg-card rounded-xl border p-3">
                    <Users2 className="mb-2 h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span>Workload Balancer</span>
                    <p className="text-muted-foreground mt-1 text-[10px] font-normal">
                      Prevent developer burnout automatically
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "REPORTING" && (
              <div key="REPORTING" className="animate-fade-in-up grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    Actionable Insights
                  </div>
                  <h3 className="text-foreground text-2xl font-bold">
                    Executive Reports, CSV & PDF Exports
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                    Generate monthly reports per developer and per project. Export RFC-4180
                    compliant CSVs or trigger print-to-PDF with clean formatting and executive
                    sign-off blocks.
                  </p>
                </div>

                <div className="border-border bg-muted/40 space-y-2 rounded-2xl border p-4 text-xs">
                  <div className="border-border bg-card flex justify-between rounded-xl border p-3">
                    <span className="font-semibold">Sprint Burndown</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      On Track
                    </span>
                  </div>
                  <div className="border-border bg-card flex justify-between rounded-xl border p-3">
                    <span className="font-semibold">Bug vs Feature Ratio</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      1 : 4.5
                    </span>
                  </div>
                  <div className="border-border bg-card flex justify-between rounded-xl border p-3">
                    <span className="font-semibold">Audit Trail Events</span>
                    <span className="text-muted-foreground font-mono">100% Logged</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border/60 bg-muted/20 border-t py-12">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-foreground font-bold">Waypoint Engineering</span>
            <span>— Modern Engineering Task Management</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
              <Link href="/demo-outbox" className="hover:text-foreground transition-colors">
                Demo Outbox
              </Link>
            )}
            <Link href="/leaderboard" className="hover:text-foreground transition-colors">
              Leaderboard
            </Link>
            <Link href="/reports" className="hover:text-foreground transition-colors">
              Reports
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
