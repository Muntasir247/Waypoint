/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { X, Trophy, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { getMemberScoreBreakdownAction } from "@/features/scoring/actions";

interface ScoreBreakdownModalProps {
  membershipId: string | null;
  month: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ScoreBreakdownModal({
  membershipId,
  month,
  isOpen,
  onClose,
}: ScoreBreakdownModalProps) {
  const [data, setData] = React.useState<Awaited<
    ReturnType<typeof getMemberScoreBreakdownAction>
  > | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const currentKey = `${membershipId}:${month}:${isOpen}`;
  const [prevKey, setPrevKey] = React.useState(currentKey);

  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    if (isOpen && membershipId) {
      setIsLoading(true);
      setData(null);
    }
  }

  React.useEffect(() => {
    if (!isOpen || !membershipId) return;

    let active = true;

    getMemberScoreBreakdownAction({ membershipId, month })
      .then((res) => {
        if (!active) return;
        setData(res);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, membershipId, month]);

  if (!isOpen || !membershipId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="border-border bg-card flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border shadow-2xl">
        {/* Modal Header */}
        <div className="border-border flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground text-sm font-bold">
                Transparent Score Breakdown ({month})
              </h3>
              <p className="text-muted-foreground text-xs">
                Immutable audit ledger showing exact mathematical effort calculations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : !data || data.error ? (
            <div className="text-muted-foreground p-8 text-center text-xs">
              {data?.error || "Could not load score events"}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Member Summary Header */}
              <div className="border-border bg-muted/30 flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  {data.member?.avatarUrl ? (
                    <img
                      src={data.member.avatarUrl}
                      alt={data.member.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                      {data.member?.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-foreground text-sm font-bold">{data.member?.name}</h4>
                    <span className="text-muted-foreground text-xs">
                      {data.events.length} ledger events recorded
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                    Total Delivered
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-foreground font-mono text-2xl font-black">
                      {data.totalPoints}
                    </span>
                    <span className="text-muted-foreground text-xs font-bold">pts</span>
                  </div>
                </div>
              </div>

              {/* Formula Blueprint Card */}
              <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-3.5 text-xs text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200">
                <span className="font-bold">Waypoint Scoring Rule:</span>
                <p className="mt-1 leading-relaxed opacity-90">
                  <code className="font-mono">
                    basePoints = estimatePoints × priorityMultiplier
                  </code>
                  <br />
                  <code className="font-mono">
                    finalPoints = basePoints × (1.2 if on-time, 0.5 if late) - (10% × bounces, min
                    50%)
                  </code>
                </p>
              </div>

              {/* Event Ledger List */}
              <div className="space-y-3">
                <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                  Score Event Ledger ({data.events.length})
                </h4>

                {data.events.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-xs italic">
                    No score events recorded for this member in {month}.
                  </p>
                ) : (
                  <div className="divide-border/60 divide-y rounded-xl border">
                    {data.events.map((event) => {
                      const isPositive = event.points >= 0;
                      return (
                        <div key={event.id} className="p-3.5 text-xs">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {isPositive ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <RotateCcw className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                )}
                                <span className="text-foreground font-bold">
                                  {event.task?.title || "Task Completion"}
                                </span>
                              </div>

                              <p className="text-muted-foreground text-[11px] leading-relaxed">
                                {event.reason}
                              </p>
                              <span className="text-muted-foreground/60 text-[10px]">
                                {new Date(event.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="shrink-0 text-right">
                              <span
                                className={`font-mono text-sm font-black ${
                                  isPositive
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {isPositive ? `+${event.points}` : event.points} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-border flex justify-end border-t p-4">
          <button
            type="button"
            onClick={onClose}
            className="border-border bg-card text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
