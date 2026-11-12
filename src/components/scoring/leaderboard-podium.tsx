/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardMember } from "@/features/scoring/schemas";
import { BadgePill } from "./badge-pill";

interface LeaderboardPodiumProps {
  topMembers: LeaderboardMember[];
  onSelectMember: (membershipId: string) => void;
}

export function LeaderboardPodium({ topMembers, onSelectMember }: LeaderboardPodiumProps) {
  if (topMembers.length === 0) return null;

  const first = topMembers[0];
  const second = topMembers[1];
  const third = topMembers[2];

  return (
    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
      {/* Rank 2: Silver */}
      {second ? (
        <div
          onClick={() => onSelectMember(second.membershipId)}
          className="to-card order-2 cursor-pointer rounded-2xl border border-slate-200 bg-gradient-to-t from-slate-100/80 p-5 text-center shadow-xs transition-all hover:border-slate-400 hover:shadow-md md:order-1 dark:border-slate-800 dark:from-slate-900/60"
        >
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 font-bold text-slate-700 shadow-xs dark:bg-slate-800 dark:text-slate-300">
            <Medal className="h-4 w-4" />
          </div>
          <span className="text-muted-foreground mt-2 block text-xs font-bold tracking-wider uppercase">
            2nd Place
          </span>

          <div className="relative mx-auto mt-3 h-16 w-16">
            {second.avatarUrl ? (
              <img
                src={second.avatarUrl}
                alt={second.name}
                className="h-16 w-16 rounded-full border-2 border-slate-300 object-cover shadow-xs dark:border-slate-700"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-600 text-lg font-bold text-white shadow-xs dark:border-slate-700">
                {second.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-xs font-black text-slate-800 dark:bg-slate-700 dark:text-slate-200">
              2
            </span>
          </div>

          <h3 className="text-foreground mt-3 truncate text-base font-bold">{second.name}</h3>
          <p className="text-muted-foreground truncate text-xs">{second.email}</p>

          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span className="text-foreground text-3xl font-black tracking-tight">
              {second.totalPoints}
            </span>
            <span className="text-muted-foreground text-xs font-semibold">pts</span>
          </div>

          <div className="border-border/60 mt-4 flex items-center justify-around border-t pt-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                Tasks
              </span>
              <span className="text-foreground font-bold">{second.tasksCompleted}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                On-Time
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {second.onTimeRate}%
              </span>
            </div>
          </div>

          {second.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {second.badges.slice(0, 2).map((b) => (
                <BadgePill key={b.id} badge={b} size="sm" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="order-2 hidden md:order-1 md:block" />
      )}

      {/* Rank 1: Gold Spotlight */}
      {first && (
        <div
          onClick={() => onSelectMember(first.membershipId)}
          className="via-card to-card order-1 cursor-pointer rounded-2xl border-2 border-amber-300/90 bg-gradient-to-t from-amber-100/50 p-6 text-center shadow-lg transition-all hover:border-amber-400 hover:shadow-xl md:order-2 md:-translate-y-2 dark:border-amber-500/40 dark:from-amber-950/40"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
            <Trophy className="h-5 w-5" />
          </div>
          <span className="text-foreground mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-black tracking-wider text-amber-800 uppercase dark:bg-amber-950 dark:text-amber-300">
            <Award className="h-3.5 w-3.5" />
            1st Place MVP
          </span>

          <div className="relative mx-auto mt-4 h-20 w-20">
            {first.avatarUrl ? (
              <img
                src={first.avatarUrl}
                alt={first.name}
                className="h-20 w-20 rounded-full border-3 border-amber-400 object-cover shadow-md dark:border-amber-500"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-3 border-amber-400 bg-amber-500 text-2xl font-black text-white shadow-md dark:border-amber-500">
                {first.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-amber-950 shadow-md">
              1
            </span>
          </div>

          <h3 className="text-foreground mt-3 truncate text-lg font-bold">{first.name}</h3>
          <p className="text-muted-foreground truncate text-xs">{first.email}</p>

          <div className="mt-4 flex items-baseline justify-center gap-1.5">
            <span className="text-foreground text-4xl font-black tracking-tight">
              {first.totalPoints}
            </span>
            <span className="text-muted-foreground text-sm font-bold">pts</span>
          </div>

          <div className="mt-4 flex items-center justify-around border-t border-amber-200/60 pt-3 text-xs dark:border-amber-900/40">
            <div>
              <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                Tasks
              </span>
              <span className="text-foreground text-sm font-bold">{first.tasksCompleted}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                On-Time
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {first.onTimeRate}%
              </span>
            </div>
          </div>

          {first.badges.length > 0 && (
            <div className="mt-3.5 flex flex-wrap justify-center gap-1">
              {first.badges.map((b) => (
                <BadgePill key={b.id} badge={b} size="sm" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rank 3: Bronze */}
      {third ? (
        <div
          onClick={() => onSelectMember(third.membershipId)}
          className="to-card order-3 cursor-pointer rounded-2xl border border-amber-700/20 bg-gradient-to-t from-amber-900/10 p-5 text-center shadow-xs transition-all hover:border-amber-700/40 hover:shadow-md dark:border-amber-900/30 dark:from-amber-950/20"
        >
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-amber-700/20 font-bold text-amber-800 shadow-xs dark:bg-amber-950/80 dark:text-amber-400">
            <Medal className="h-4 w-4" />
          </div>
          <span className="text-muted-foreground mt-2 block text-xs font-bold tracking-wider uppercase">
            3rd Place
          </span>

          <div className="relative mx-auto mt-3 h-16 w-16">
            {third.avatarUrl ? (
              <img
                src={third.avatarUrl}
                alt={third.name}
                className="h-16 w-16 rounded-full border-2 border-amber-600/40 object-cover shadow-xs dark:border-amber-700"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-600/40 bg-amber-800 text-lg font-bold text-white shadow-xs dark:border-amber-700">
                {third.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-xs font-black text-white shadow-xs">
              3
            </span>
          </div>

          <h3 className="text-foreground mt-3 truncate text-base font-bold">{third.name}</h3>
          <p className="text-muted-foreground truncate text-xs">{third.email}</p>

          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span className="text-foreground text-3xl font-black tracking-tight">
              {third.totalPoints}
            </span>
            <span className="text-muted-foreground text-xs font-semibold">pts</span>
          </div>

          <div className="border-border/60 mt-4 flex items-center justify-around border-t pt-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                Tasks
              </span>
              <span className="text-foreground font-bold">{third.tasksCompleted}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-medium uppercase">
                On-Time
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {third.onTimeRate}%
              </span>
            </div>
          </div>

          {third.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {third.badges.slice(0, 2).map((b) => (
                <BadgePill key={b.id} badge={b} size="sm" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="order-3 hidden md:block" />
      )}
    </div>
  );
}
