"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    console.error("Waypoint Runtime Error:", error);
  }, [error]);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4">
      <div className="border-border bg-card flex w-full max-w-lg flex-col items-center rounded-3xl border p-8 text-center shadow-xl sm:p-12">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
          <AlertOctagon className="h-8 w-8" />
        </div>

        <span className="rounded-full bg-rose-100 px-3 py-1 font-mono text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          SYSTEM ERROR
        </span>

        <h1 className="text-foreground mt-4 text-2xl font-black tracking-tight sm:text-3xl">
          Something went wrong
        </h1>

        <p className="text-muted-foreground mt-2 max-w-sm text-xs leading-relaxed sm:text-sm">
          An unexpected error occurred while processing this request. Our telemetry has logged the
          issue.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-98"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/board"
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return to Board</span>
          </Link>
        </div>

        {/* Technical Error Details Drawer */}
        <div className="border-border mt-8 w-full border-t pt-4 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between text-xs font-semibold transition-colors"
          >
            <span>Technical Details {error.digest ? `(${error.digest})` : ""}</span>
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showDetails && (
            <div className="border-border bg-muted/40 mt-3 max-h-48 overflow-x-auto rounded-xl border p-3 font-mono text-[11px] text-rose-600 dark:text-rose-400">
              <p className="font-bold">
                {error.name}: {error.message}
              </p>
              {error.stack && (
                <pre className="text-muted-foreground mt-2 text-[10px] whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
