/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import {
  Users2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp,
  Flame,
  ExternalLink,
} from "lucide-react";
import type { MemberWorkload } from "@/features/tech-lead/actions";
import { ReassignMemberModal } from "@/components/tech-lead/reassign-member-modal";
import { BulkActionsToolbar } from "@/components/tech-lead/bulk-actions-toolbar";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";

interface WorkloadViewProps {
  workloads: MemberWorkload[];
  totalTeamCapacity: number;
  totalTeamOpenPoints: number;
  onRefresh: () => void;
}

export function WorkloadView({
  workloads,
  totalTeamCapacity,
  totalTeamOpenPoints,
  onRefresh,
}: WorkloadViewProps) {
  const [expandedMemberIds, setExpandedMemberIds] = React.useState<Record<string, boolean>>({});
  const [reassignSource, setReassignSource] = React.useState<MemberWorkload | null>(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);

  const toggleExpand = (memberId: string) => {
    setExpandedMemberIds((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const teamUtilization =
    totalTeamCapacity > 0 ? Math.round((totalTeamOpenPoints / totalTeamCapacity) * 100) : 0;
  const overloadedCount = workloads.filter((w) => w.isOverloaded).length;

  const memberOptions = workloads.map((w) => ({
    id: w.membershipId,
    name: w.name,
    email: w.email,
    avatarUrl: w.avatarUrl,
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Team Members */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Engineers
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold tracking-tight">
              {workloads.length}
            </span>
            <span className="text-muted-foreground text-xs font-medium">active developers</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">Capacity limit: 20 pts / developer</p>
        </div>

        {/* Card 2: Total Open Points */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Open Story Points
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold tracking-tight">
              {totalTeamOpenPoints}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              / {totalTeamCapacity} pts team pool
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">Total committed sprint effort</p>
        </div>

        {/* Card 3: Team Utilization */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Team Utilization
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-foreground text-2xl font-bold tracking-tight">
              {teamUtilization}%
            </span>
            <span
              className={`text-xs font-medium ${
                teamUtilization > 100
                  ? "text-rose-600 dark:text-rose-400"
                  : teamUtilization > 75
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {teamUtilization > 100 ? "Overcommitted" : "Balanced"}
            </span>
          </div>
          <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={`h-full transition-all duration-300 ${
                teamUtilization > 100
                  ? "bg-rose-500"
                  : teamUtilization > 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, teamUtilization)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Overloaded Alerts */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Overload Warnings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                overloadedCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}
            >
              {overloadedCount}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              members exceeding limit
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {overloadedCount > 0
              ? "Rebalance tasks to prevent burnout"
              : "All members within limits"}
          </p>
        </div>
      </div>

      {/* Member Cards List */}
      <div className="space-y-4">
        {workloads.map((workload) => {
          const isExpanded = !!expandedMemberIds[workload.membershipId];
          const capacityPercent = workload.capacityPercent;

          return (
            <div
              key={workload.membershipId}
              className={`border-border bg-card card-interactive rounded-2xl border shadow-xs transition-all duration-200 ${
                workload.isOverloaded
                  ? "border-rose-300 shadow-rose-500/5 dark:border-rose-900/60"
                  : "hover:border-indigo-400/50 hover:shadow-md dark:hover:border-indigo-500/40"
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                {/* Left: Avatar, Name, Skills */}
                <div className="flex items-start gap-3.5">
                  {workload.avatarUrl ? (
                    <img
                      src={workload.avatarUrl}
                      alt={workload.name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-xs">
                      {workload.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-foreground text-sm font-bold">{workload.name}</h4>
                      <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-semibold">
                        {workload.role}
                      </span>
                      {workload.availability === "ON_LEAVE" && (
                        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          On Leave
                        </span>
                      )}
                      {workload.availability === "OVERLOADED" && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Overloaded
                        </span>
                      )}
                      {workload.isOverloaded && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                          <AlertTriangle className="h-3 w-3" />
                          Over Capacity (+{workload.openEstimatePoints -
                            workload.capacityLimit}{" "}
                          pts)
                        </span>
                      )}
                    </div>

                    <div className="text-muted-foreground text-xs">{workload.email}</div>

                    {/* Skill Tags */}
                    {workload.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {workload.skills.map((skill: { name: string; level: number }) => (
                          <span
                            key={skill.name}
                            className="bg-muted/70 text-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
                          >
                            <span>{skill.name}</span>
                            <span className="text-muted-foreground text-[10px]">
                              (L{skill.level})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Capacity Bar and Actions */}
                <div className="flex min-w-[260px] flex-col gap-3 sm:items-end">
                  <div className="w-full space-y-1.5 sm:max-w-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        {workload.openTasksCount} active tasks
                      </span>
                      <span
                        className={`font-bold ${
                          workload.isOverloaded
                            ? "text-rose-600 dark:text-rose-400"
                            : capacityPercent > 70
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                        }`}
                      >
                        {workload.openEstimatePoints} / {workload.capacityLimit} pts (
                        {capacityPercent}%)
                      </span>
                    </div>

                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full transition-all duration-700 ease-out ${
                          workload.isOverloaded
                            ? "animate-pulse bg-rose-500"
                            : capacityPercent > 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, capacityPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {workload.openTasksCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setReassignSource(workload)}
                        className="hover:bg-muted text-foreground border-border inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Reassign All</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpand(workload.membershipId)}
                      className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors"
                    >
                      <span>{isExpanded ? "Hide Tasks" : "View Tasks"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Assigned Tasks Table */}
              {isExpanded && (
                <div className="border-border bg-muted/20 border-t px-5 py-4">
                  {workload.tasks.length === 0 ? (
                    <p className="text-muted-foreground text-xs italic">
                      No active tasks currently assigned to this developer.
                    </p>
                  ) : (
                    <div className="divide-border/60 divide-y">
                      {workload.tasks.map((task: MemberWorkload["tasks"][0]) => {
                        const isSelected = selectedTaskIds.includes(task.id);
                        return (
                          <div
                            key={task.id}
                            className="hover:bg-muted/40 flex items-center justify-between rounded-lg px-2 py-2.5 text-xs transition-colors"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTaskSelection(task.id)}
                                className="border-border h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <div
                                onClick={() => setSelectedTaskId(task.id)}
                                className="text-foreground cursor-pointer truncate font-medium hover:underline"
                              >
                                {task.title}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-semibold">
                                {task.status.replace("_", " ")}
                              </span>
                              <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-semibold">
                                {task.priority}
                              </span>
                              <span className="text-foreground font-semibold">
                                {task.estimatePoints ?? 0} pts
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedTaskId(task.id)}
                                className="text-muted-foreground hover:text-foreground p-1"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reassign Member Modal */}
      <ReassignMemberModal
        sourceMember={reassignSource}
        allMembers={workloads}
        isOpen={!!reassignSource}
        onClose={() => setReassignSource(null)}
        onSuccess={() => {
          onRefresh();
          setSelectedTaskIds([]);
        }}
      />

      {/* Bulk Actions Floating Toolbar */}
      <BulkActionsToolbar
        selectedTaskIds={selectedTaskIds}
        onClearSelection={() => setSelectedTaskIds([])}
        members={memberOptions}
        onSuccess={() => {
          onRefresh();
          setSelectedTaskIds([]);
        }}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => onRefresh()}
      />
    </div>
  );
}
