/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Search, ExternalLink } from "lucide-react";
import type { LeaderboardMember } from "@/features/scoring/schemas";
import { BadgePill } from "./badge-pill";

interface LeaderboardTableProps {
  members: LeaderboardMember[];
  onSelectMember: (membershipId: string) => void;
}

export function LeaderboardTable({ members, onSelectMember }: LeaderboardTableProps) {
  const [search, setSearch] = React.useState("");

  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [members, search]);

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs">
      {/* Table Header Controls */}
      <div className="border-border flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-foreground text-sm font-bold">Team Member Rankings</h3>
          <p className="text-muted-foreground text-xs">
            Fair effort-weighted scoring based on task estimates, priority, on-time delivery &
            review quality
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-background text-foreground w-full rounded-xl border py-1.5 pr-3 pl-8 text-xs focus:border-indigo-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Rankings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground border-border border-b font-medium tracking-wider uppercase">
            <tr>
              <th className="w-14 py-3 pr-2 pl-5">Rank</th>
              <th className="px-3 py-3">Developer</th>
              <th className="px-3 py-3 text-right">Weighted Points</th>
              <th className="px-3 py-3 text-center">Tasks Done</th>
              <th className="px-3 py-3 text-center">On-Time Rate</th>
              <th className="px-3 py-3">Badges</th>
              <th className="py-3 pr-5 pl-3 text-right">Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground p-8 text-center italic">
                  No members found matching &quot;{search}&quot;.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                return (
                  <tr
                    key={member.membershipId}
                    onClick={() => onSelectMember(member.membershipId)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3 pr-2 pl-5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                          member.rank === 1
                            ? "bg-amber-400 text-amber-950 shadow-xs"
                            : member.rank === 2
                              ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                              : member.rank === 3
                                ? "bg-amber-700 text-white"
                                : "text-muted-foreground bg-muted font-medium"
                        }`}
                      >
                        {member.rank}
                      </div>
                    </td>

                    {/* Developer Name & Avatar */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground font-bold">{member.name}</span>
                            <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[9px] font-semibold">
                              {member.role}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-[11px]">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Weighted Points */}
                    <td className="px-3 py-3 text-right">
                      <span className="text-foreground font-mono text-base font-bold">
                        {member.totalPoints}
                      </span>
                      <span className="text-muted-foreground ml-1 text-xs">pts</span>
                    </td>

                    {/* Completed Tasks */}
                    <td className="text-foreground px-3 py-3 text-center font-semibold">
                      {member.tasksCompleted}
                    </td>

                    {/* On-Time Rate */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          member.onTimeRate >= 90
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : member.onTimeRate >= 75
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                        }`}
                      >
                        {member.onTimeRate}%
                      </span>
                    </td>

                    {/* Badges */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {member.badges.length === 0 ? (
                          <span className="text-muted-foreground text-[11px] italic">
                            No badges yet
                          </span>
                        ) : (
                          member.badges.map((b) => <BadgePill key={b.id} badge={b} size="sm" />)
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 pr-5 pl-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMember(member.membershipId);
                        }}
                        className="hover:bg-muted text-foreground border-border inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-2xs transition-colors"
                      >
                        <span>Ledger</span>
                        <ExternalLink className="text-muted-foreground h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
