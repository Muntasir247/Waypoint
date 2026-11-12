"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Trophy, Calendar, RotateCw, Settings, AlertCircle } from "lucide-react";
import { getLeaderboardAction, recomputeMonthlyResultsAction } from "@/features/scoring/actions";
import type { LeaderboardMember } from "@/features/scoring/schemas";
import { LeaderboardPodium } from "@/components/scoring/leaderboard-podium";
import { LeaderboardTable } from "@/components/scoring/leaderboard-table";
import { ScoreBreakdownModal } from "@/components/scoring/score-breakdown-modal";
import { ScoringConfigModal } from "@/components/scoring/scoring-config-modal";

export default function LeaderboardPage() {
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [members, setMembers] = React.useState<LeaderboardMember[]>([]);
  const [availableMonths, setAvailableMonths] = React.useState<string[]>([]);
  const [isCurrentMonth, setIsCurrentMonth] = React.useState(true);
  const [scoringEnabled, setScoringEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRecomputing, setIsRecomputing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Modals state
  const [breakdownMemberId, setBreakdownMemberId] = React.useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);

  const loadData = React.useCallback(async (month?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getLeaderboardAction({ month });
      if (res.error) {
        setError(res.error);
        return;
      }
      setSelectedMonth(res.month);
      setMembers(res.members);
      setAvailableMonths(res.availableMonths);
      setIsCurrentMonth(res.isCurrentMonth);
      setScoringEnabled(res.scoringEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    getLeaderboardAction()
      .then((res) => {
        if (!active) return;
        if (res.error) {
          setError(res.error);
          setIsLoading(false);
          return;
        }
        setSelectedMonth(res.month);
        setMembers(res.members);
        setAvailableMonths(res.availableMonths);
        setIsCurrentMonth(res.isCurrentMonth);
        setScoringEnabled(res.scoringEnabled);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRecompute = async () => {
    try {
      setIsRecomputing(true);
      setError(null);
      const res = await recomputeMonthlyResultsAction({ month: selectedMonth });
      if (res.error) {
        setError(res.error);
        return;
      }
      await loadData(selectedMonth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recompute scores");
    } finally {
      setIsRecomputing(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
                Engineering Leaderboard & Recognition
              </h1>
              {isCurrentMonth ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live Cycle
                </span>
              ) : (
                <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  Closed Results
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Effort-weighted recognition based on story points delivered, on-time rate, and code
              quality.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <div className="border-border bg-card flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 shadow-2xs">
              <Calendar className="text-muted-foreground h-3.5 w-3.5" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  loadData(e.target.value);
                }}
                className="text-foreground bg-transparent text-xs font-semibold focus:outline-hidden"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m === availableMonths[0] ? `${m} (Current Live)` : m}
                  </option>
                ))}
              </select>
            </div>

            {/* Recompute Scores Button */}
            <button
              type="button"
              disabled={isRecomputing || isLoading}
              onClick={handleRecompute}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRecomputing ? "animate-spin" : ""}`} />
              <span>{isRecomputing ? "Recomputing..." : "Recompute Scores"}</span>
            </button>

            {/* Config Rules Button */}
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-indigo-500" />
              <span>Scoring Rules</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="border-border flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!scoringEnabled ? (
          <div className="border-border bg-card flex h-80 flex-col items-center justify-center rounded-2xl border p-8 text-center shadow-xs">
            <Trophy className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <h3 className="text-foreground text-base font-bold">Gamification & Scoring Disabled</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
              Scoring is currently turned off for this workspace in settings. An administrator can
              re-enable it at any time.
            </p>
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Configure Scoring</span>
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top 3 Podium Highlights */}
            {members.length > 0 && (
              <LeaderboardPodium
                topMembers={members.slice(0, 3)}
                onSelectMember={(id) => setBreakdownMemberId(id)}
              />
            )}

            {/* Main Rankings Table */}
            <LeaderboardTable members={members} onSelectMember={(id) => setBreakdownMemberId(id)} />
          </div>
        )}

        {/* Score Breakdown Modal */}
        <ScoreBreakdownModal
          membershipId={breakdownMemberId}
          month={selectedMonth}
          isOpen={Boolean(breakdownMemberId)}
          onClose={() => setBreakdownMemberId(null)}
        />

        {/* Admin Scoring Config Modal */}
        <ScoringConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onSuccess={() => loadData(selectedMonth)}
        />
      </div>
    </AppShell>
  );
}
