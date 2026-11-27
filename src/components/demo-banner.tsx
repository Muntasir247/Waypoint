"use client";

import * as React from "react";
import { Info, X } from "lucide-react";

const STORAGE_KEY = "waypoint_demo_banner_dismissed";

export function DemoBanner() {
  const [isDismissed, setIsDismissed] = React.useState(false);

  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const dismissedInSession = isClient ? sessionStorage.getItem(STORAGE_KEY) === "true" : false;

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setIsDismissed(true);
  };

  if (
    process.env.NEXT_PUBLIC_DEMO_MODE !== "true" ||
    !isClient ||
    dismissedInSession ||
    isDismissed
  ) {
    return null;
  }

  return (
    <div
      role="status"
      className="relative flex items-center justify-between border-b border-indigo-200 bg-indigo-50/90 px-4 py-2 text-xs font-medium text-indigo-950 backdrop-blur-sm dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
          <Info className="h-3.5 w-3.5" />
        </span>
        <span>
          <strong className="font-semibold">Demo Showcase:</strong> Emails and invites are
          simulated. View generated messages in the{" "}
          <a
            href="/demo-outbox"
            className="underline underline-offset-2 transition-colors hover:text-indigo-600 dark:hover:text-white"
          >
            Demo Outbox
          </a>
          .
        </span>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss demo banner"
        className="rounded-md p-1 text-indigo-500 transition-colors hover:bg-indigo-100 hover:text-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/60 dark:hover:text-indigo-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
