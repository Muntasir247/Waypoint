"use client";

import * as React from "react";
import { Flame, ShieldAlert, Award, Zap, Trophy } from "lucide-react";
import type { BadgeItem } from "@/features/scoring/schemas";

interface BadgePillProps {
  badge: BadgeItem;
  size?: "sm" | "md";
}

export function BadgePill({ badge, size = "sm" }: BadgePillProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const getBadgeStyle = (key: string) => {
    switch (key) {
      case "STREAK_5":
        return {
          bg: "bg-amber-100 dark:bg-amber-950/80",
          text: "text-amber-800 dark:text-amber-300",
          border: "border-amber-200 dark:border-amber-800",
          icon: <Flame className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
        };
      case "BUG_SQUASHER":
        return {
          bg: "bg-rose-100 dark:bg-rose-950/80",
          text: "text-rose-800 dark:text-rose-300",
          border: "border-rose-200 dark:border-rose-800",
          icon: <ShieldAlert className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
        };
      case "REVIEWER_CHOICE":
        return {
          bg: "bg-violet-100 dark:bg-violet-950/80",
          text: "text-violet-800 dark:text-violet-300",
          border: "border-violet-200 dark:border-violet-800",
          icon: <Award className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
        };
      case "WORKHORSE":
        return {
          bg: "bg-indigo-100 dark:bg-indigo-950/80",
          text: "text-indigo-800 dark:text-indigo-300",
          border: "border-indigo-200 dark:border-indigo-800",
          icon: <Zap className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
        };
      default:
        return {
          bg: "bg-muted",
          text: "text-foreground",
          border: "border-border",
          icon: <Trophy className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
        };
    }
  };

  const style = getBadgeStyle(badge.key);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold transition-transform hover:scale-105 ${
          size === "sm" ? "text-[10px]" : "text-xs"
        } ${style.bg} ${style.text} ${style.border}`}
      >
        {style.icon}
        <span>{badge.name}</span>
      </span>

      {showTooltip && (
        <div className="border-border bg-popover text-popover-foreground absolute bottom-full left-1/2 z-50 mb-1.5 w-48 -translate-x-1/2 rounded-xl border p-2 text-center text-[11px] shadow-xl">
          <div className="font-bold">{badge.name}</div>
          <div className="text-muted-foreground mt-0.5">{badge.description}</div>
        </div>
      )}
    </div>
  );
}
