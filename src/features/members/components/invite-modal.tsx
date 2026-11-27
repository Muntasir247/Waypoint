"use client";

import * as React from "react";
import { UserPlus, X, Copy, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { createInviteAction } from "@/features/invites/actions";

interface InviteModalProps {
  isOpen: boolean;
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteModal({
  isOpen,
  workspaceId,
  workspaceName,
  onClose,
  onSuccess,
}: InviteModalProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"ADMIN" | "DEVELOPER" | "VIEWER">("DEVELOPER");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdInviteUrl, setCreatedInviteUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createInviteAction({
        workspaceId,
        email,
        role,
      });

      if (res.error) {
        setError(res.error);
      } else if (res.inviteUrl) {
        setCreatedInviteUrl(res.inviteUrl);
        onSuccess?.();
      }
    } catch {
      setError("Failed to create invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdInviteUrl) {
      navigator.clipboard.writeText(createdInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setEmail("");
    setRole("DEVELOPER");
    setCreatedInviteUrl(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="border-border bg-card text-card-foreground animate-in fade-in-0 zoom-in-95 w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-foreground text-base font-semibold">Invite to {workspaceName}</h3>
              <p className="text-muted-foreground text-xs">
                Send an invite link to onboard a new member
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {createdInviteUrl ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Invitation Sent & Generated!</span>
              </div>
              <p className="mt-1 text-xs">
                A simulated email has been dispatched to <strong>{email}</strong> (viewable in the
                Demo Outbox). You can also copy and share this link directly:
              </p>
            </div>

            <div>
              <label className="text-foreground text-xs font-semibold">Shareable Invite Link</label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdInviteUrl}
                  className="border-border bg-muted/40 text-foreground h-10 flex-1 rounded-xl border px-3 font-mono text-xs select-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 active:scale-98"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-muted-foreground mt-1.5 text-[11px]">
                This link expires in 7 days and is single-use.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-foreground text-xs font-semibold">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:bg-background mt-1.5 h-10 w-full rounded-xl border px-3.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-foreground text-xs font-semibold">Assign Role</label>
              <div className="mt-2 grid grid-cols-3 gap-2.5">
                {(["DEVELOPER", "ADMIN", "VIEWER"] as const).map((r) => {
                  const isSelected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 dark:bg-indigo-950/50 dark:text-indigo-200"
                          : "border-border bg-muted/20 text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-xs font-bold capitalize">{r.toLowerCase()}</span>
                      <span className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
                        {r === "ADMIN" && "Full management & scoring"}
                        {r === "DEVELOPER" && "Status & task updates"}
                        {r === "VIEWER" && "Read-only workspace access"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    Demo Mode: An invitation will be registered and recorded into the{" "}
                    <strong>Demo Outbox</strong> with full simulation.
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-indigo-100/70 bg-indigo-50/40 p-3 text-xs text-indigo-900 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    An invitation link with 7-day validity will be generated and ready to copy.
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={loading}
                className="border-border bg-muted/50 text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating Invite...</span>
                  </>
                ) : (
                  <span>Send Invitation</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
