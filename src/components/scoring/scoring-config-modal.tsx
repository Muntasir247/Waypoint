"use client";

import * as React from "react";
import { X, Settings, Loader2, Check } from "lucide-react";
import {
  getWorkspaceScoringConfigAction,
  updateWorkspaceScoringConfigAction,
} from "@/features/scoring/actions";
import { defaultScoringRules, type ScoringRules } from "@/features/scoring/schemas";

interface ScoringConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ScoringConfigModal({ isOpen, onClose, onSuccess }: ScoringConfigModalProps) {
  const [enabled, setEnabled] = React.useState(true);
  const [rules, setRules] = React.useState<ScoringRules>(defaultScoringRules);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [prevOpen, setPrevOpen] = React.useState(isOpen);

  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setIsLoading(true);
      setError(null);
    }
  }

  React.useEffect(() => {
    if (!isOpen) return;
    let active = true;

    getWorkspaceScoringConfigAction()
      .then((res) => {
        if (!active) return;
        if (res.config) {
          setEnabled(res.config.enabled);
          setRules(res.config.rules);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load config");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);

      const res = await updateWorkspaceScoringConfigAction({
        enabled,
        rules,
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scoring rules");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="border-border bg-card flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground text-sm font-bold">Scoring System Configuration</h3>
              <p className="text-muted-foreground text-xs">
                Admin controls for fair effort-weighted recognition
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Enable Toggle */}
            <div className="border-border bg-muted/30 flex items-center justify-between rounded-xl border p-4">
              <div>
                <span className="text-foreground text-xs font-bold">
                  Enable Gamification & Scoring
                </span>
                <p className="text-muted-foreground text-[11px]">
                  When disabled, points and leaderboards are hidden across the workspace.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="border-border h-4 w-4 cursor-pointer rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Priority Multipliers */}
            <div className="space-y-3">
              <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                Priority Effort Multipliers
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-muted-foreground block text-[11px] font-semibold">
                    Low
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={rules.priorityMultipliers.LOW}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        priorityMultipliers: {
                          ...rules.priorityMultipliers,
                          LOW: parseFloat(e.target.value) || 1.0,
                        },
                      })
                    }
                    className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block text-[11px] font-semibold">
                    Medium
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={rules.priorityMultipliers.MEDIUM}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        priorityMultipliers: {
                          ...rules.priorityMultipliers,
                          MEDIUM: parseFloat(e.target.value) || 1.25,
                        },
                      })
                    }
                    className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block text-[11px] font-semibold">
                    High
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={rules.priorityMultipliers.HIGH}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        priorityMultipliers: {
                          ...rules.priorityMultipliers,
                          HIGH: parseFloat(e.target.value) || 1.5,
                        },
                      })
                    }
                    className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block text-[11px] font-semibold">
                    Critical
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={rules.priorityMultipliers.CRITICAL}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        priorityMultipliers: {
                          ...rules.priorityMultipliers,
                          CRITICAL: parseFloat(e.target.value) || 2.0,
                        },
                      })
                    }
                    className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-2 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Timing Bonuses & Deductions */}
            <div className="space-y-3">
              <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                Timing & Quality Modifiers
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-muted-foreground block text-[11px] font-semibold">
                    On-Time Multiplier (Default 1.2x = +20%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={rules.onTimeMultiplier}
                    onChange={(e) =>
                      setRules({ ...rules, onTimeMultiplier: parseFloat(e.target.value) || 1.2 })
                    }
                    className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block text-[11px] font-semibold">
                    Late Completion Penalty (Default 0.5x = -50%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={rules.lateMultiplier}
                    onChange={(e) =>
                      setRules({ ...rules, lateMultiplier: parseFloat(e.target.value) || 0.5 })
                    }
                    className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block text-[11px] font-semibold">
                    Review Bounce Deduction (Default 0.10 = -10%/bounce)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rules.bounceDeductionPercent}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        bounceDeductionPercent: parseFloat(e.target.value) || 0.1,
                      })
                    }
                    className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block text-[11px] font-semibold">
                    Standard Capacity Limit (Story Pts)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={rules.capacityLimit}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        capacityLimit: parseInt(e.target.value, 10) || 20,
                      })
                    }
                    className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-2 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="border-border flex items-center justify-end gap-2.5 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="border-border bg-card text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
