"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingDown } from "lucide-react";
import type { DashboardMetrics } from "@/features/tech-lead/actions";
import { useIsMounted } from "@/lib/use-is-mounted";

interface BurndownChartProps {
  data: DashboardMetrics["burndown"];
  sprintName?: string;
  totalPoints?: number;
}

export function BurndownChart({
  data,
  sprintName = "Active Sprint",
  totalPoints = 0,
}: BurndownChartProps) {
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="border-border bg-card flex h-80 items-center justify-center rounded-2xl border p-6">
        <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="border-border bg-card flex h-80 flex-col items-center justify-center rounded-2xl border p-6 text-center">
        <TrendingDown className="text-muted-foreground/40 mb-3 h-10 w-10" />
        <h4 className="text-foreground text-sm font-semibold">No Burndown Data</h4>
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          Start a sprint and assign estimate points to tasks to generate a live burndown curve.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-6 shadow-xs">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-foreground text-sm font-semibold tracking-tight">
              Sprint Burndown
            </h3>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {sprintName}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Tracking ideal vs actual remaining effort ({totalPoints} total story pts)
          </p>
        </div>

        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span className="font-medium">Actual Remaining</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-dashed border-slate-400 bg-slate-200 dark:bg-slate-700" />
            <span className="font-medium">Ideal Guideline</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/60" />
            <XAxis
              dataKey="day"
              stroke="currentColor"
              className="text-muted-foreground text-[11px]"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="currentColor"
              className="text-muted-foreground text-[11px]"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="border-border bg-popover text-popover-foreground rounded-xl border p-3 text-xs shadow-lg">
                      <div className="font-semibold">{label}</div>
                      <div className="mt-2 space-y-1">
                        {payload.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-semibold">{entry.value} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="ideal"
              name="Ideal Guideline"
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Remaining"
              stroke="#6366f1"
              strokeWidth={2.5}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff" }}
              dot={{ r: 3, fill: "#6366f1" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
