"use client";

import * as React from "react";
import { Kanban, List, Calendar, Clock } from "lucide-react";
import { ViewMode } from "./types";

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  totalTasks?: number;
}

export function ViewSwitcher({ currentView, onViewChange, totalTasks }: ViewSwitcherProps) {
  const views: {
    id: ViewMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "kanban", label: "Kanban Board", icon: Kanban },
    { id: "list", label: "List View", icon: List },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "timeline", label: "Timeline", icon: Clock },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="border-border bg-muted/60 flex items-center rounded-xl border p-1 shadow-2xs">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = currentView === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                isActive
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`}
              />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>

      {totalTasks !== undefined && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
          <span>
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </span>
        </div>
      )}
    </div>
  );
}
