/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { UserCheck, AlertTriangle, Loader2, X } from "lucide-react";
import { reassignMemberTasksAction } from "@/features/tech-lead/actions";
import type { MemberWorkload } from "@/features/tech-lead/actions";

interface ReassignMemberModalProps {
  sourceMember: MemberWorkload | null;
  allMembers: MemberWorkload[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReassignMemberModal({
  sourceMember,
  allMembers,
  isOpen,
  onClose,
  onSuccess,
}: ReassignMemberModalProps) {
  const [targetMemberId, setTargetMemberId] = React.useState<string>("");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClose = React.useCallback(() => {
    setTargetMemberId("");
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen || !sourceMember) return null;

  const eligibleTargets = allMembers.filter(
    (m) => m.membershipId !== sourceMember.membershipId && m.availability !== "ON_LEAVE",
  );

  const selectedTarget = eligibleTargets.find((m) => m.membershipId === targetMemberId);
  const targetNewPoints = selectedTarget
    ? selectedTarget.openEstimatePoints + sourceMember.openEstimatePoints
    : 0;
  const isTargetOverloaded = targetNewPoints > 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMemberId) {
      setError("Please select a target developer");
      return;
    }

    try {
      setIsPending(true);
      setError(null);
      const res = await reassignMemberTasksAction({
        fromMembershipId: sourceMember.membershipId,
        toMembershipId: targetMemberId,
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      onSuccess();
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reassign tasks";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="border-border bg-card w-full max-w-lg rounded-2xl border p-6 shadow-2xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground text-sm font-bold">
                Reassign Tasks (Leave & Load Rebalancing)
              </h3>
              <p className="text-muted-foreground text-xs">
                Transfer all open work from {sourceMember.name} to another developer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Source Member Snapshot */}
          <div className="border-border bg-muted/30 rounded-xl border p-3">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Departing / Overloaded Developer
            </span>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {sourceMember.avatarUrl ? (
                  <img
                    src={sourceMember.avatarUrl}
                    alt={sourceMember.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {sourceMember.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-foreground text-xs font-bold">{sourceMember.name}</div>
                  <div className="text-muted-foreground text-[11px]">{sourceMember.email}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-foreground text-sm font-bold">
                  {sourceMember.openTasksCount} tasks
                </span>
                <div className="text-muted-foreground text-[11px]">
                  {sourceMember.openEstimatePoints} story pts
                </div>
              </div>
            </div>
          </div>

          {/* Target Member Selector */}
          <div>
            <label className="text-foreground block text-xs font-semibold">
              Select Receiving Developer
            </label>
            <select
              value={targetMemberId}
              onChange={(e) => setTargetMemberId(e.target.value)}
              className="border-border bg-background text-foreground mt-1.5 w-full rounded-xl border px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose active developer --</option>
              {eligibleTargets.map((m) => (
                <option key={m.membershipId} value={m.membershipId}>
                  {m.name} ({m.openEstimatePoints}/20 pts • {m.openTasksCount} tasks)
                </option>
              ))}
            </select>
          </div>

          {/* Impact Capacity Preview */}
          {selectedTarget && (
            <div className="border-border bg-card rounded-xl border p-3.5 shadow-xs">
              <div className="text-foreground flex items-center justify-between text-xs font-semibold">
                <span>Capacity Impact for {selectedTarget.name}:</span>
                <span
                  className={
                    isTargetOverloaded ? "font-bold text-rose-600" : "font-bold text-emerald-600"
                  }
                >
                  {targetNewPoints} / 20 pts ({Math.round((targetNewPoints / 20) * 100)}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full transition-all duration-300 ${
                    isTargetOverloaded
                      ? "bg-rose-500"
                      : targetNewPoints > 14
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (targetNewPoints / 20) * 100)}%` }}
                />
              </div>

              {isTargetOverloaded && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Warning: Receiving this workload will exceed {selectedTarget.name}&apos;s
                    standard 20 pt limit by {targetNewPoints - 20} pts.
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="border-border mt-6 flex items-center justify-end gap-2.5 border-t pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="border-border bg-card text-foreground hover:bg-muted rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !targetMemberId}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Confirm Reassignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
