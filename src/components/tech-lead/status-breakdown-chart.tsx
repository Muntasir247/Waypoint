"use client";

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import type { DashboardMetrics } from "@/features/tech-lead/actions";
import { useIsMounted } from "@/lib/use-is-mounted";

interface StatusBreakdownChartProps {
  data: DashboardMetrics["statusBreakdown"];
  totalTasks: number;
}

export function StatusBreakdownChart({ data, totalTasks }: StatusBreakdownChartProps) {
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="border-border bg-card flex h-80 items-center justify-center rounded-2xl border p-6">
        <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (totalTasks === 0 || !data || data.length === 0) {
    return (
      <div className="border-border bg-card flex h-80 flex-col items-center justify-center rounded-2xl border p-6 text-center">
        <PieIcon className="text-muted-foreground/40 mb-3 h-10 w-10" />
        <h4 className="text-foreground text-sm font-semibold">No Tasks Recorded</h4>
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          Create tasks in this project to see live status distributions.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-6 shadow-xs">
      <div className="mb-4">
        <h3 className="text-foreground text-sm font-semibold tracking-tight">Status Breakdown</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Distribution across lifecycle stages ({totalTasks} total tasks)
        </p>
      </div>

      <div className="relative flex h-52 items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="count"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as (typeof data)[0];
                  const percentage =
                    totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
                  return (
                    <div className="border-border bg-popover text-popover-foreground rounded-xl border p-2.5 text-xs shadow-lg">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold">{item.name}:</span>
                        <span>
                          {item.count} tasks ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-foreground text-2xl font-bold tracking-tight">{totalTasks}</span>
          <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
            Total Tasks
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="border-border mt-3 grid grid-cols-2 gap-2 border-t pt-3 sm:grid-cols-3">
        {data.map((item) => (
          <div
            key={item.name}
            className="bg-muted/40 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground truncate font-medium">{item.name}</span>
            </div>
            <span className="text-muted-foreground font-semibold">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
