"use client";

import * as React from "react";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Rocket,
  RefreshCw,
  FolderGit2,
} from "lucide-react";
import type { DashboardMetrics } from "@/features/tech-lead/actions";
import { getProjectDashboardAction } from "@/features/tech-lead/actions";
import { BurndownChart } from "@/components/tech-lead/burndown-chart";
import { StatusBreakdownChart } from "@/components/tech-lead/status-breakdown-chart";
import { TopPerformerCard } from "@/components/tech-lead/top-performer-card";
import { OverdueBlockedAlerts } from "@/components/tech-lead/overdue-blocked-alerts";
import { UpcomingDeadlines } from "@/components/tech-lead/upcoming-deadlines";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";

interface ProjectDashboardViewProps {
  initialMetrics?: DashboardMetrics | null;
  projectId?: string;
  projectName?: string;
}

export function ProjectDashboardView({
  initialMetrics,
  projectId,
  projectName = "All Projects",
}: ProjectDashboardViewProps) {
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(initialMetrics || null);
  const [isLoading, setIsLoading] = React.useState(!initialMetrics);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getProjectDashboardAction(projectId);
      if (res.dashboard) {
        setMetrics(res.dashboard);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    if (initialMetrics) return;
    let active = true;
    getProjectDashboardAction(projectId)
      .then((res) => {
        if (!active) return;
        if (res.dashboard) {
          setMetrics(res.dashboard);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load dashboard metrics:", err);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId, initialMetrics]);

  if (isLoading && !metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="border-border bg-card flex h-80 flex-col items-center justify-center rounded-2xl border p-6 text-center">
        <FolderGit2 className="text-muted-foreground/40 mb-3 h-10 w-10" />
        <h4 className="text-foreground text-sm font-semibold">No Metrics Available</h4>
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          Select an active project or add tasks to view real-time engineering metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Completion Percentage */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Completion Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold tracking-tight">
              {metrics.completionPercentage}%
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              {metrics.completedPoints} / {metrics.totalPoints} pts
            </span>
          </div>
          <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${metrics.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Active Tasks */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Active Tasks
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold tracking-tight">
              {metrics.totalTasks - metrics.completedTasks}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              / {metrics.totalTasks} total
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {metrics.remainingPoints} story pts remaining
          </p>
        </div>

        {/* Metric 3: Active Sprints */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Sprint Status
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Rocket className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold tracking-tight">Active</span>
            <span className="truncate text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {projectName}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Tracking burndown against cycle target
          </p>
        </div>

        {/* Metric 4: Attention Required */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Alerts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                metrics.overdueTasks.length + metrics.blockedTasks.length > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              }`}
            >
              {metrics.overdueTasks.length + metrics.blockedTasks.length}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              ({metrics.overdueTasks.length} overdue, {metrics.blockedTasks.length} blocked)
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">Immediate tech lead action</p>
        </div>
      </div>

      {/* Overdue and Blocked Alerts Banner */}
      <OverdueBlockedAlerts
        overdueTasks={metrics.overdueTasks}
        blockedTasks={metrics.blockedTasks}
        onSelectTask={(id) => setSelectedTaskId(id)}
        onRefresh={loadData}
      />

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Burndown Chart (2 cols) */}
        <div className="lg:col-span-2">
          <BurndownChart
            data={metrics.burndown}
            sprintName={projectName}
            totalPoints={metrics.totalPoints}
          />
        </div>

        {/* Top Performer Card (1 col) */}
        <div className="flex flex-col gap-6">
          <TopPerformerCard topPerformer={metrics.topPerformer} />
          <UpcomingDeadlines
            upcomingTasks={metrics.upcomingDueTasks}
            onSelectTask={(id) => setSelectedTaskId(id)}
          />
        </div>
      </div>

      {/* Status Breakdown Donut Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatusBreakdownChart data={metrics.statusBreakdown} totalTasks={metrics.totalTasks} />

        {/* Tech Lead Velocity & Insights Note */}
        <div className="border-border bg-card flex flex-col justify-between rounded-2xl border p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-foreground text-sm font-semibold">Tech Lead Quality Insights</h3>
            </div>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Waypoint continuously monitors task bounce rates, overdue slippages, and developer
              workload balance. Story points are weighted based on task complexity and on-time
              delivery history.
            </p>

            <div className="mt-4 space-y-2.5">
              <div className="bg-muted/30 flex items-center justify-between rounded-xl p-2.5 text-xs">
                <span className="text-muted-foreground font-medium">Standard Capacity per Dev</span>
                <span className="text-foreground font-bold">20 Story Points</span>
              </div>
              <div className="bg-muted/30 flex items-center justify-between rounded-xl p-2.5 text-xs">
                <span className="text-muted-foreground font-medium">Smart Assignment Model</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Active (Skill Match + Capacity + Velocity)
                </span>
              </div>
              <div className="bg-muted/30 flex items-center justify-between rounded-xl p-2.5 text-xs">
                <span className="text-muted-foreground font-medium">
                  Overdue Penalty Multiplier
                </span>
                <span className="text-foreground font-bold">0.5x Base Points</span>
              </div>
            </div>
          </div>

          <div className="border-border text-muted-foreground mt-4 flex items-center justify-between border-t pt-4 text-xs">
            <span>Last updated just now</span>
            <button
              type="button"
              onClick={loadData}
              className="hover:text-foreground inline-flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={loadData}
      />
    </div>
  );
}
