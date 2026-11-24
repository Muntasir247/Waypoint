"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUserAndWorkspace, updateWorkspaceAction } from "@/features/workspaces/actions";
import {
  getWorkspaceScoringConfigAction,
  updateWorkspaceScoringConfigAction,
} from "@/features/scoring/actions";
import { defaultScoringRules, type ScoringRules } from "@/features/scoring/schemas";
import {
  Building2,
  ShieldCheck,
  Award,
  Bell,
  AlertTriangle,
  Save,
  CheckCircle2,
  Loader2,
  Lock,
  Download,
  Info,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [workspaceSlug, setWorkspaceSlug] = React.useState("");
  const [createdDate, setCreatedDate] = React.useState("");
  const [allowDeveloperCreateTasks, setAllowDeveloperCreateTasks] = React.useState(false);

  // Scoring config state
  const [scoringEnabled, setScoringEnabled] = React.useState(true);
  const [rules, setRules] = React.useState<ScoringRules>(defaultScoringRules);

  // Notifications state
  const [dailyDigestEnabled, setDailyDigestEnabled] = React.useState(true);
  const [blockerAlertsEnabled, setBlockerAlertsEnabled] = React.useState(true);

  // Mini calculator sandbox
  const [calcPoints, setCalcPoints] = React.useState(5);
  const [calcPriority, setCalcPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">(
    "HIGH",
  );
  const [calcOnTime, setCalcOnTime] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        const { workspace, membership } = await getCurrentUserAndWorkspace();
        if (workspace && membership) {
          setWorkspaceId(workspace.id);
          setWorkspaceName(workspace.name);
          setWorkspaceSlug(workspace.slug);
          setCreatedDate(new Date(workspace.createdAt).toLocaleDateString());
          setAllowDeveloperCreateTasks(workspace.allowDeveloperCreateTasks);
          setIsAdmin(membership.role === "ADMIN");

          const scoreRes = await getWorkspaceScoringConfigAction();
          if (scoreRes.config) {
            setScoringEnabled(scoreRes.config.enabled);
            setRules(scoreRes.config.rules);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error("Only workspace admins can modify settings.");
      return;
    }

    setSaving(true);
    try {
      // 1. Update Workspace info & developer task creation permission
      const wsRes = await updateWorkspaceAction({
        workspaceId,
        name: workspaceName,
        allowDeveloperCreateTasks,
      });

      if (wsRes.error) {
        toast.error(wsRes.error);
        setSaving(false);
        return;
      }

      // 2. Update Scoring configuration
      const scoreRes = await updateWorkspaceScoringConfigAction({
        enabled: scoringEnabled,
        rules,
      });

      if (scoreRes.error) {
        toast.error(scoreRes.error);
        setSaving(false);
        return;
      }

      toast.success("Workspace settings and governance updated successfully!");
    } catch {
      toast.error("An unexpected error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  // Preview score calculation
  const priorityMult = rules.priorityMultipliers[calcPriority] ?? 1.5;
  const timingMult = calcOnTime ? rules.onTimeMultiplier : rules.lateMultiplier;
  const previewScore = Math.round(calcPoints * priorityMult * timingMult * 10) / 10;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
        {/* Header & Breadcrumbs */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
              <span>Workspaces</span>
              <span>/</span>
              <span className="text-foreground">{workspaceName || "Workspace"}</span>
              <span>/</span>
              <span className="text-primary font-semibold">Settings</span>
            </div>
            <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight">
              Workspace Settings & Governance
            </h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Manage organization identity, task creation permissions, scoring rules, and
              safeguards.
            </p>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Changes</span>
            </button>
          ) : (
            <div className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs">
              <Lock className="h-3.5 w-3.5" />
              <span>Read-only (Admin only)</span>
            </div>
          )}
        </div>

        {/* Section 1: Workspace Profile & Identity */}
        <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-base font-semibold">
                Workspace Profile & Identity
              </h2>
              <p className="text-muted-foreground text-xs">
                Basic information about your engineering workspace.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="text-foreground block text-xs font-medium">Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={!isAdmin}
                className="border-border bg-background text-foreground focus:ring-primary mt-1.5 block w-full rounded-xl border px-3 py-2 text-xs focus:ring-2 focus:outline-hidden disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-foreground block text-xs font-medium">URL Slug</label>
              <div className="border-border bg-muted/40 text-muted-foreground mt-1.5 flex items-center rounded-xl border px-3 py-2 font-mono text-xs">
                <span>waypoint.dev/workspaces/</span>
                <span className="text-foreground font-semibold">{workspaceSlug}</span>
              </div>
            </div>

            <div>
              <label className="text-foreground block text-xs font-medium">Created On</label>
              <div className="text-muted-foreground mt-1.5 text-xs font-medium">
                {createdDate || "Active Workspace"}
              </div>
            </div>

            <div>
              <label className="text-foreground block text-xs font-medium">Sprint Cadence</label>
              <div className="text-muted-foreground mt-1.5 text-xs">
                Bi-weekly sprint iterations • Automatic burndown tracking
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Permissions & Task Governance */}
        <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-base font-semibold">
                Permissions & Task Governance
              </h2>
              <p className="text-muted-foreground text-xs">
                Define task authoring policies and assignment guardrails across roles.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="border-border flex items-center justify-between rounded-xl border p-4">
              <div className="pr-4">
                <span className="text-foreground block text-xs font-semibold">
                  Allow Developers to create tasks
                </span>
                <span className="text-muted-foreground block text-xs">
                  When enabled, individual contributors can author tasks directly. When disabled,
                  only Tech Leads (Admins) can create tasks.
                </span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={allowDeveloperCreateTasks}
                  onChange={(e) => setAllowDeveloperCreateTasks(e.target.checked)}
                  disabled={!isAdmin}
                  className="peer sr-only"
                />
                <div className="peer-focus:ring-primary/25 bg-muted peer h-6 w-11 rounded-full peer-checked:bg-indigo-600 peer-disabled:opacity-50 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className="border-border flex items-center justify-between rounded-xl border p-4">
              <div className="pr-4">
                <span className="text-foreground block text-xs font-semibold">
                  Strict Assignee Capacity Limits (20 Points)
                </span>
                <span className="text-muted-foreground block text-xs">
                  Warns Tech Leads when assigning work to developers at or exceeding their maximum
                  sprint capacity threshold.
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Scoring & Contribution Ledger Configuration */}
        <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-foreground text-base font-semibold">
                  Contribution Scoring & Recognition
                </h2>
                <p className="text-muted-foreground text-xs">
                  Transparent mathematical formula calculating sprint points upon task completion.
                </p>
              </div>
            </div>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={scoringEnabled}
                onChange={(e) => setScoringEnabled(e.target.checked)}
                disabled={!isAdmin}
                className="peer sr-only"
              />
              <div className="peer-focus:ring-primary/25 bg-muted peer h-6 w-11 rounded-full peer-checked:bg-indigo-600 peer-disabled:opacity-50 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          {scoringEnabled ? (
            <div className="mt-6 space-y-6">
              {/* Priority Multipliers */}
              <div>
                <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  Priority Multipliers (Base Points)
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                    <div
                      key={p}
                      className="border-border bg-background rounded-xl border p-3 text-center"
                    >
                      <span className="text-muted-foreground block text-[10px] font-bold tracking-wider">
                        {p}
                      </span>
                      <span className="text-foreground mt-1 block font-mono text-base font-bold">
                        {rules.priorityMultipliers[p]}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing & Bounce Adjustments */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="border-border bg-background rounded-xl border p-3.5">
                  <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    On-Time Bonus
                  </span>
                  <span className="text-foreground mt-1 block font-mono text-xl font-bold">
                    +{Math.round((rules.onTimeMultiplier - 1) * 100)}% ({rules.onTimeMultiplier}x)
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-[11px]">
                    Applied if completed on or before due date
                  </span>
                </div>

                <div className="border-border bg-background rounded-xl border p-3.5">
                  <span className="block text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Late Delivery Penalty
                  </span>
                  <span className="text-foreground mt-1 block font-mono text-xl font-bold">
                    {rules.lateMultiplier}x
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-[11px]">
                    Applied if completed after due date
                  </span>
                </div>

                <div className="border-border bg-background rounded-xl border p-3.5">
                  <span className="block text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Review Bounce Deduction
                  </span>
                  <span className="text-foreground mt-1 block font-mono text-xl font-bold">
                    -{Math.round(rules.bounceDeductionPercent * 100)}% / bounce
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-[11px]">
                    Max -{Math.round(rules.maxBounceDeductionPercent * 100)}% deduction floor
                  </span>
                </div>
              </div>

              {/* Live Calculator Sandbox */}
              <div className="border-border bg-muted/30 rounded-xl border p-4">
                <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                  <Info className="h-4 w-4 text-indigo-500" />
                  <span>Live Score Formula Sandbox</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground">Points:</label>
                    <select
                      value={calcPoints}
                      onChange={(e) => setCalcPoints(Number(e.target.value))}
                      className="border-border bg-background rounded-lg border px-2 py-1 font-mono"
                    >
                      {[1, 2, 3, 5, 8].map((pts) => (
                        <option key={pts} value={pts}>
                          {pts} pts
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground">Priority:</label>
                    <select
                      value={calcPriority}
                      onChange={(e) =>
                        setCalcPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
                      }
                      className="border-border bg-background rounded-lg border px-2 py-1 font-mono"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground">Delivery:</label>
                    <button
                      type="button"
                      onClick={() => setCalcOnTime(!calcOnTime)}
                      className={`rounded-lg px-2 py-1 font-medium transition-colors ${
                        calcOnTime
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {calcOnTime ? "On-Time (+20%)" : "Late (0.5x)"}
                    </button>
                  </div>

                  <div className="ml-auto flex items-center gap-2 font-semibold">
                    <span className="text-muted-foreground">Result:</span>
                    <span
                      key={previewScore}
                      className="animate-scale-in inline-block rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-sm font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    >
                      {previewScore} points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/40 text-muted-foreground mt-4 rounded-xl p-4 text-xs">
              Contribution scoring is currently disabled for this workspace. Tasks will not generate
              score events.
            </div>
          )}
        </div>

        {/* Section 4: Notifications & Outbox Preferences */}
        <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-base font-semibold">Notifications & Digests</h2>
              <p className="text-muted-foreground text-xs">
                Configure automated communications and simulation triggers.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="border-border flex items-center justify-between rounded-xl border p-4">
              <div className="pr-4">
                <span className="text-foreground block text-xs font-semibold">
                  Daily Engineering Standup Digest
                </span>
                <span className="text-muted-foreground block text-xs">
                  Automated morning digest outlining assigned tickets, overdue items, and blocked
                  dependencies.
                </span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={dailyDigestEnabled}
                  onChange={(e) => setDailyDigestEnabled(e.target.checked)}
                  disabled={!isAdmin}
                  className="peer sr-only"
                />
                <div className="peer-focus:ring-primary/25 bg-muted peer h-6 w-11 rounded-full peer-checked:bg-indigo-600 peer-disabled:opacity-50 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>

            <div className="border-border flex items-center justify-between rounded-xl border p-4">
              <div className="pr-4">
                <span className="text-foreground block text-xs font-semibold">
                  Critical Overdue & Blocker Alerts
                </span>
                <span className="text-muted-foreground block text-xs">
                  Immediate alerts dispatched to Tech Leads when tasks are marked as BLOCKED or
                  exceed due dates.
                </span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={blockerAlertsEnabled}
                  onChange={(e) => setBlockerAlertsEnabled(e.target.checked)}
                  disabled={!isAdmin}
                  className="peer sr-only"
                />
                <div className="peer-focus:ring-primary/25 bg-muted peer h-6 w-11 rounded-full peer-checked:bg-indigo-600 peer-disabled:opacity-50 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Danger Zone */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/20 p-6 dark:border-rose-900/30 dark:bg-rose-950/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-base font-semibold">Danger Zone</h2>
              <p className="text-muted-foreground text-xs">
                Irreversible actions and workspace export controls.
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-rose-200/60 dark:divide-rose-900/40">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-foreground block text-xs font-semibold">
                  Export Workspace Data
                </span>
                <span className="text-muted-foreground block text-xs">
                  Download monthly executive summaries, burndown metrics, and score ledgers as CSV
                  or PDF.
                </span>
              </div>
              <Link
                href="/reports"
                className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Go to Reports</span>
              </Link>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-foreground block text-xs font-semibold">
                  Delete Workspace
                </span>
                <span className="text-muted-foreground block text-xs">
                  Permanently delete this workspace and all associated projects, tasks, and sprint
                  histories.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  toast.error(
                    "Demo safeguard: Deletion of the primary demo workspace is locked to protect live demo evaluation.",
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-98"
              >
                <span>Delete Workspace...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
