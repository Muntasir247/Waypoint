/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Calendar,
  Download,
  Printer,
  Zap,
  CheckSquare,
  Clock,
  Bug,
  RefreshCw,
  FolderGit2,
  Users,
  TrendingUp,
} from "lucide-react";
import { getMonthlyReportAction } from "@/features/reports/actions";
import type { ReportSummary } from "@/features/reports/schemas";
import { downloadReportCSV } from "@/features/reports/csv-export";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

export default function ReportsPage() {
  const [summary, setSummary] = React.useState<ReportSummary | null>(null);
  const [availableMonths, setAvailableMonths] = React.useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [availableMembers, setAvailableMembers] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [selectedProject, setSelectedProject] = React.useState<string>("");
  const [selectedMember, setSelectedMember] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"DEVELOPERS" | "PROJECTS">("DEVELOPERS");

  const queryKey = `${selectedMonth}:${selectedProject}:${selectedMember}`;
  const [prevKey, setPrevKey] = React.useState(queryKey);
  if (prevKey !== queryKey) {
    setPrevKey(queryKey);
    setIsLoading(true);
  }

  React.useEffect(() => {
    let active = true;

    getMonthlyReportAction({
      month: selectedMonth || undefined,
      projectId: selectedProject || undefined,
      membershipId: selectedMember || undefined,
    })
      .then((res) => {
        if (!active) return;
        if (res.summary) {
          setSummary(res.summary);
          if (!selectedMonth) {
            setSelectedMonth(res.summary.month);
          }
        }
        if (res.availableMonths.length > 0) {
          setAvailableMonths((prev) => (prev.length === 0 ? res.availableMonths : prev));
        }
        setAvailableProjects(res.availableProjects);
        setAvailableMembers(res.availableMembers);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        toast.error("Failed to load monthly report data.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMonth, selectedProject, selectedMember]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const res = await getMonthlyReportAction({
        month: selectedMonth || undefined,
        projectId: selectedProject || undefined,
        membershipId: selectedMember || undefined,
      });

      if (res.summary) {
        setSummary(res.summary);
      }
      setAvailableProjects(res.availableProjects);
      setAvailableMembers(res.availableMembers);
    } catch {
      toast.error("Failed to load monthly report data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!summary) return;
    downloadReportCSV(summary);
    toast.success("CSV report downloaded.");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Print-Only Header */}
        <div className="hidden print:mb-6 print:block">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h1 className="text-2xl font-black text-black">
                Waypoint Monthly Engineering Report
              </h1>
              <p className="mt-1 text-xs text-neutral-600">
                Report Period: {summary?.month || "Current"}
                {summary?.generatedAt ? ` • Generated ${summary.generatedAt}` : ""}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold">CONFIDENTIAL</span>
            </div>
          </div>
        </div>

        {/* Interactive Screen Header (Hidden on Print) */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-xl font-bold tracking-tight">
                Executive Reports
              </h1>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                Monthly Performance
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Delivery velocity, developer performance scorecards, and project health metrics
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!summary || isLoading}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              disabled={!summary || isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Hidden on Print) */}
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-2xl border p-4 shadow-xs print:hidden">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs font-medium">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-border bg-background text-foreground rounded-xl border px-3 py-1.5 text-xs font-semibold focus:border-indigo-600 focus:outline-hidden"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-border hidden h-4 w-px sm:block" />

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <FolderGit2 className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs font-medium">Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border-border bg-background text-foreground rounded-xl border px-3 py-1.5 text-xs font-medium focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="">All Projects ({availableProjects.length})</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-border hidden h-4 w-px sm:block" />

          {/* Member Filter */}
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs font-medium">Developer:</span>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="border-border bg-background text-foreground rounded-xl border px-3 py-1.5 text-xs font-medium focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="">All Developers ({availableMembers.length})</option>
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="text-muted-foreground hover:text-foreground ml-auto p-1.5 transition-colors"
            title="Refresh Report"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Executive KPI Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Card 1: Delivered Points */}
            <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold">Total Delivered</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-foreground font-mono text-2xl font-bold">
                  {summary.totalDeliveredPoints}
                </span>
                <span className="text-muted-foreground text-xs font-semibold">pts</span>
              </div>
              <span className="text-muted-foreground/80 mt-1 block text-[11px]">
                Weighted effort delivered
              </span>
            </div>

            {/* Card 2: Tasks Completed */}
            <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold">Tasks Completed</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-foreground font-mono text-2xl font-bold">
                  {summary.totalTasksCompleted}
                </span>
                <span className="text-muted-foreground text-xs font-semibold">tasks</span>
              </div>
              <span className="text-muted-foreground/80 mt-1 block text-[11px]">
                Reached DONE this cycle
              </span>
            </div>

            {/* Card 3: On-Time Rate */}
            <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold">On-Time Rate</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-foreground font-mono text-2xl font-bold">
                  {summary.overallOnTimeRate}%
                </span>
              </div>
              <span className="text-muted-foreground/80 mt-1 block text-[11px]">
                Completed on or before due date
              </span>
            </div>

            {/* Card 4: Open Bugs */}
            <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold">Open Bugs</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <Bug className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-foreground font-mono text-2xl font-bold">
                  {summary.openBugsCount}
                </span>
                <span className="text-muted-foreground text-xs font-semibold">items</span>
              </div>
              <span className="text-muted-foreground/80 mt-1 block text-[11px]">
                Unresolved bug labels in workspace
              </span>
            </div>
          </div>
        )}

        {/* Weekly Velocity Trend Chart */}
        {summary && summary.velocityTrend && summary.velocityTrend.length > 0 && (
          <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-foreground text-sm font-bold">Monthly Velocity Distribution</h3>
                <p className="text-muted-foreground text-xs">
                  Estimated points and task throughput delivered per week
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-4 w-4" />
                <span>Weekly Cadence</span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.velocityTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="label"
                    fontSize={11}
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <YAxis fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card, #1e293b)",
                      borderColor: "var(--color-border, #334155)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="points"
                    name="Delivered Points"
                    fill="#6366F1"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="tasksCount"
                    name="Tasks Done"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Hidden on Print) */}
        <div className="border-border bg-muted/20 flex border-b px-2 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("DEVELOPERS")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "DEVELOPERS"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            Developer Performance ({summary?.developerReports.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PROJECTS")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "PROJECTS"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            Project Progress ({summary?.projectReports.length || 0})
          </button>
        </div>

        {/* Tab 1: Developer Performance Breakdown */}
        {(!activeTab || activeTab === "DEVELOPERS") && summary && (
          <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs print:border-black print:shadow-none">
            <div className="border-border flex items-center justify-between border-b p-4 print:border-black">
              <div>
                <h3 className="text-foreground text-sm font-bold print:text-black">
                  Developer Performance Scorecard
                </h3>
                <p className="text-muted-foreground text-xs print:text-neutral-600">
                  Fair effort evaluation, on-time delivery percentages, and critical resolution
                  rates
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-border bg-muted/40 text-muted-foreground border-b font-medium tracking-wider uppercase print:border-black print:text-black">
                  <tr>
                    <th className="py-3 pr-2 pl-5">Developer</th>
                    <th className="px-3 py-3 text-right">Delivered Points</th>
                    <th className="px-3 py-3 text-center">Tasks Done</th>
                    <th className="px-3 py-3 text-center">On-Time Rate</th>
                    <th className="px-3 py-3 text-center">Late Tasks</th>
                    <th className="px-3 py-3 text-center">Critical Solved</th>
                    <th className="py-3 pr-5 pl-3 text-right">Avg Pts / Task</th>
                  </tr>
                </thead>
                <tbody className="divide-border/60 divide-y print:divide-neutral-300">
                  {summary.developerReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-muted-foreground p-8 text-center italic">
                        No developer completion records found for this period.
                      </td>
                    </tr>
                  ) : (
                    summary.developerReports.map((dev) => (
                      <tr key={dev.membershipId} className="hover:bg-muted/40 transition-colors">
                        {/* Developer Info */}
                        <td className="py-3 pr-2 pl-5">
                          <div className="flex items-center gap-2.5">
                            {dev.avatarUrl ? (
                              <img
                                src={dev.avatarUrl}
                                alt={dev.name}
                                className="h-7 w-7 rounded-full object-cover print:hidden"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white print:border print:bg-white print:text-black">
                                {dev.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="text-foreground block font-bold print:text-black">
                                {dev.name}
                              </span>
                              <span className="text-muted-foreground text-[10px] print:text-neutral-600">
                                {dev.role}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Total Points */}
                        <td className="px-3 py-3 text-right">
                          <span className="text-foreground font-mono font-bold print:text-black">
                            {dev.totalPoints} pts
                          </span>
                        </td>

                        {/* Tasks Done */}
                        <td className="px-3 py-3 text-center font-medium">{dev.tasksCompleted}</td>

                        {/* On-Time Rate */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                              dev.onTimeRate >= 80
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 print:bg-transparent print:text-black"
                                : dev.onTimeRate >= 50
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 print:bg-transparent print:text-black"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 print:bg-transparent print:text-black"
                            }`}
                          >
                            {dev.onTimeRate}%
                          </span>
                        </td>

                        {/* Late Tasks */}
                        <td className="text-muted-foreground px-3 py-3 text-center print:text-black">
                          {dev.lateTasks}
                        </td>

                        {/* Critical Solved */}
                        <td className="px-3 py-3 text-center">
                          {dev.criticalTasksDone > 0 ? (
                            <span className="font-semibold text-rose-600 dark:text-rose-400 print:text-black">
                              {dev.criticalTasksDone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>

                        {/* Avg Pts / Task */}
                        <td className="text-muted-foreground py-3 pr-5 pl-3 text-right font-mono print:text-black">
                          {dev.pointsPerTask}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Project Health Breakdown */}
        {activeTab === "PROJECTS" && summary && (
          <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs print:border-black print:shadow-none">
            <div className="border-border flex items-center justify-between border-b p-4 print:border-black">
              <div>
                <h3 className="text-foreground text-sm font-bold print:text-black">
                  Project Delivery Health
                </h3>
                <p className="text-muted-foreground text-xs print:text-neutral-600">
                  Throughput, completion percentages, and open defect volume by project
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-border bg-muted/40 text-muted-foreground border-b font-medium tracking-wider uppercase print:border-black print:text-black">
                  <tr>
                    <th className="py-3 pr-2 pl-5">Project Name</th>
                    <th className="px-3 py-3 text-center">Total Tasks</th>
                    <th className="px-3 py-3 text-center">Completed</th>
                    <th className="px-3 py-3 text-center">Progress</th>
                    <th className="px-3 py-3 text-right">Points Delivered</th>
                    <th className="py-3 pr-5 pl-3 text-center">Open Defects</th>
                  </tr>
                </thead>
                <tbody className="divide-border/60 divide-y print:divide-neutral-300">
                  {summary.projectReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-muted-foreground p-8 text-center italic">
                        No projects found in this workspace.
                      </td>
                    </tr>
                  ) : (
                    summary.projectReports.map((proj) => (
                      <tr key={proj.projectId} className="hover:bg-muted/40 transition-colors">
                        <td className="text-foreground py-3 pr-2 pl-5 font-bold print:text-black">
                          {proj.projectName}
                        </td>
                        <td className="px-3 py-3 text-center">{proj.totalTasks}</td>
                        <td className="px-3 py-3 text-center">{proj.completedTasks}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="bg-muted h-2 w-20 overflow-hidden rounded-full print:border">
                              <div
                                className="h-full rounded-full bg-indigo-600 print:bg-black"
                                style={{ width: `${proj.completionRate}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-semibold">
                              {proj.completionRate}%
                            </span>
                          </div>
                        </td>
                        <td className="text-foreground px-3 py-3 text-right font-mono font-bold print:text-black">
                          {proj.totalPointsDelivered} pts
                        </td>
                        <td className="py-3 pr-5 pl-3 text-center">
                          {proj.openBugsCount > 0 ? (
                            <span className="rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 print:bg-transparent print:text-black">
                              {proj.openBugsCount} bugs
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 print:text-black">
                              Clean
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Print-Only Signature & Summary Footer */}
        <div className="hidden print:mt-12 print:block print:border-t print:pt-6">
          <div className="flex justify-between text-xs text-neutral-600">
            <div>
              <p>Generated by Waypoint Engineering Suite</p>
              <p className="mt-1">https://waypoint.dev</p>
            </div>
            <div className="text-right">
              <p>Approved By: __________________________</p>
              <p className="mt-1">Date: __________________________</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
