"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WorkloadView } from "@/components/tech-lead/workload-view";
import { getWorkspaceWorkloadAction } from "@/features/tech-lead/actions";
import type { MemberWorkload } from "@/features/tech-lead/actions";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function WorkloadPage() {
  const [workloads, setWorkloads] = React.useState<MemberWorkload[]>([]);
  const [totalTeamCapacity, setTotalTeamCapacity] = React.useState(0);
  const [totalTeamOpenPoints, setTotalTeamOpenPoints] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getWorkspaceWorkloadAction();
      if (res.error) {
        setError(res.error);
        return;
      }
      setWorkloads(res.members);
      setTotalTeamCapacity(res.summary?.totalCapacityPoints ?? 0);
      setTotalTeamOpenPoints(res.summary?.totalAllocatedPoints ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load team workload";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    getWorkspaceWorkloadAction()
      .then((res) => {
        if (!active) return;
        if (res.error) {
          setError(res.error);
          setIsLoading(false);
          return;
        }
        setWorkloads(res.members);
        setTotalTeamCapacity(res.summary?.totalCapacityPoints ?? 0);
        setTotalTeamOpenPoints(res.summary?.totalAllocatedPoints ?? 0);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "Failed to load team workload";
        setError(msg);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
                Engineering Workload & Capacity
              </h1>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Tech Lead View
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Real-time sprint allocations, developer point capacities (20 pts standard), and
              1-click leave rebalancing.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadData()}
              disabled={isLoading}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="border-border flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
          </div>
        ) : (
          <WorkloadView
            workloads={workloads}
            totalTeamCapacity={totalTeamCapacity}
            totalTeamOpenPoints={totalTeamOpenPoints}
            onRefresh={loadData}
          />
        )}
      </div>
    </AppShell>
  );
}
