"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Mail,
  Search,
  ExternalLink,
  Trash2,
  RefreshCw,
  Info,
  Clock,
  ArrowRight,
  Send,
  X,
} from "lucide-react";
import { getMockEmails, clearMockEmails } from "@/features/email/actions";
import { sendWorkspaceDigestsAction } from "@/features/digests/actions";
import { toast } from "sonner";

interface MockEmailRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: string;
  createdAt: Date;
}

export default function DemoOutboxPage() {
  const [emails, setEmails] = React.useState<MockEmailRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState<string>("ALL");
  const [activeEmail, setActiveEmail] = React.useState<MockEmailRecord | null>(null);

  const loadEmails = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMockEmails();
      setEmails(data);
    } catch {
      toast.error("Could not fetch simulated emails.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    getMockEmails()
      .then((data) => {
        if (active) {
          setEmails(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          toast.error("Could not fetch simulated emails.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const [isSimulating, setIsSimulating] = React.useState(false);

  const handleSimulateDigests = async () => {
    setIsSimulating(true);
    try {
      const res = await sendWorkspaceDigestsAction();
      if (res.sentCount > 0) {
        toast.success(`Demo: simulated ${res.sentCount} daily digests, see outbox below.`);
        await loadEmails();
      } else {
        toast.info("No active tasks found for digest generation, or already up to date.");
      }
    } catch {
      toast.error("Failed to simulate digests.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear all mock emails?")) return;
    try {
      await clearMockEmails();
      setEmails([]);
      setActiveEmail(null);
      toast.success("Demo outbox cleared.");
    } catch {
      toast.error("Failed to clear outbox.");
    }
  };

  const filteredEmails = emails.filter((email) => {
    const matchesFilter =
      selectedFilter === "ALL" ||
      (selectedFilter === "VERIFY_EMAIL" && email.kind === "VERIFY_EMAIL") ||
      (selectedFilter === "PASSWORD_RESET" && email.kind === "PASSWORD_RESET") ||
      (selectedFilter === "INVITE" && email.kind === "INVITE") ||
      (selectedFilter === "DIGEST" && email.kind === "DIGEST");

    const matchesSearch =
      email.to.toLowerCase().includes(search.toLowerCase()) ||
      email.subject.toLowerCase().includes(search.toLowerCase()) ||
      email.body.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const extractUrlFromBody = (body: string): string | null => {
    const match = body.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
                Demo Outbox
              </h1>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Simulated Sandbox
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Review and test simulated verification, reset, and invitation emails in real time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateDigests}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs transition-colors hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              <Send className={`h-3.5 w-3.5 ${isSimulating ? "animate-pulse" : ""}`} />
              <span>{isSimulating ? "Simulating..." : "Simulate Daily Digest"}</span>
            </button>
            <button
              type="button"
              onClick={loadEmails}
              disabled={loading}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={emails.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-xs transition-colors hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Outbox</span>
            </button>
          </div>
        </div>

        {/* Informative Portfolio Callout */}
        <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div className="text-xs text-indigo-950 dark:text-indigo-200">
            <strong className="font-semibold">How this works:</strong> Transactional emails in
            Waypoint are intercepted by the <code>MockEmailProvider</code> and recorded in the
            database. Click <strong>Simulate Link</strong> on any email to test email verification
            or password resets directly without needing an SMTP or third-party mailing service.
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: "All Emails", value: "ALL" },
              { label: "Verification", value: "VERIFY_EMAIL" },
              { label: "Password Reset", value: "PASSWORD_RESET" },
              { label: "Invites", value: "INVITE" },
              { label: "Digests", value: "DIGEST" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedFilter(tab.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedFilter === tab.value
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Filter recipient or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-card text-foreground placeholder:text-muted-foreground h-9 w-full rounded-xl border pr-3 pl-9 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Email List */}
        {filteredEmails.length === 0 ? (
          <div className="border-border rounded-2xl border border-dashed p-12 text-center">
            <div className="bg-muted text-muted-foreground mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-foreground mt-4 text-sm font-semibold">Outbox is empty</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Trigger a signup or password reset flow to generate simulated emails here.
            </p>
            <div className="mt-6">
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                <span>Register a Demo Account</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-border border-border bg-card divide-y overflow-hidden rounded-2xl border shadow-xs">
            {filteredEmails.map((item) => {
              const actionUrl = extractUrlFromBody(item.body);
              return (
                <div
                  key={item.id}
                  className="hover:bg-muted/40 flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          item.kind === "VERIFY_EMAIL"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            : item.kind === "PASSWORD_RESET"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : item.kind === "DIGEST"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        }`}
                      >
                        {item.kind.replace("_", " ")}
                      </span>
                      <span className="text-foreground text-xs font-semibold">To: {item.to}</span>
                    </div>
                    <div className="text-foreground text-xs font-medium">{item.subject}</div>
                    <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveEmail(item)}
                      className="border-border bg-card text-foreground hover:bg-muted rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      View Body
                    </button>
                    {actionUrl && (
                      <a
                        href={actionUrl}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
                      >
                        <span>Simulate Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Email Preview Modal */}
        {activeEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="border-border bg-card w-full max-w-lg rounded-2xl border p-6 shadow-xl">
              <div className="border-border flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <Send className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-semibold">{activeEmail.subject}</h3>
                    <p className="text-muted-foreground text-[11px]">Recipient: {activeEmail.to}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEmail(null)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <pre className="border-border bg-muted/40 text-foreground max-h-60 overflow-y-auto rounded-xl border p-4 font-mono text-xs whitespace-pre-wrap">
                  {activeEmail.body}
                </pre>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">
                  Simulated at {new Date(activeEmail.createdAt).toLocaleTimeString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveEmail(null)}
                    className="border-border text-foreground hover:bg-muted rounded-xl border px-3.5 py-1.5 text-xs font-medium"
                  >
                    Close
                  </button>
                  {extractUrlFromBody(activeEmail.body) && (
                    <a
                      href={extractUrlFromBody(activeEmail.body)!}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
