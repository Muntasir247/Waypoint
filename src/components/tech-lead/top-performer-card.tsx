/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Trophy, Flame, Sparkles, Award } from "lucide-react";
import type { DashboardMetrics } from "@/features/tech-lead/actions";

interface TopPerformerCardProps {
  topPerformer: DashboardMetrics["topPerformer"];
}

export function TopPerformerCard({ topPerformer }: TopPerformerCardProps) {
  if (!topPerformer) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <Trophy className="h-6 w-6" />
        </div>
        <h4 className="text-foreground mt-3 text-sm font-semibold">Sprint MVP Candidate</h4>
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          Complete tasks to earn story points and claim the top performer recognition spotlight.
        </p>
      </div>
    );
  }

  return (
    <div className="via-card to-card relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 p-6 shadow-xs dark:border-amber-900/40 dark:from-amber-950/20">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <span className="text-foreground text-xs font-semibold tracking-wider uppercase">
              Sprint MVP
            </span>
            <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Leading team velocity</span>
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/80 dark:text-amber-300">
          <Award className="h-3 w-3" />
          Top Contributor
        </span>
      </div>

      <div className="flex items-center gap-3.5 pt-2">
        {topPerformer.avatarUrl ? (
          <img
            src={topPerformer.avatarUrl}
            alt={topPerformer.name}
            className="h-12 w-12 rounded-full border-2 border-amber-300 object-cover shadow-xs dark:border-amber-700"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-500 font-bold text-white shadow-xs dark:border-amber-700">
            {topPerformer.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4 className="text-foreground truncate text-base font-bold tracking-tight">
            {topPerformer.name}
          </h4>
          <p className="text-muted-foreground truncate text-xs">{topPerformer.email}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-amber-200/60 pt-4 dark:border-amber-900/40">
        <div className="rounded-xl bg-amber-500/10 p-3">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Delivered
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-foreground text-2xl font-bold tracking-tight">
              {topPerformer.completedPoints}
            </span>
            <span className="text-muted-foreground text-xs font-medium">pts</span>
          </div>
        </div>

        <div className="rounded-xl bg-amber-500/10 p-3">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            On-Time Rate
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-foreground text-2xl font-bold tracking-tight">
              {topPerformer.onTimeRate}%
            </span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
