"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Eye,
  X,
  FileCode2,
  Copy,
  Check,
  Filter,
  ShieldX,
} from "lucide-react";
import { getAuditLogsAction } from "@/features/audit/actions";
import type { FormattedAuditLog } from "@/features/audit/schemas";
import { toast } from "sonner";

export default function AuditLogPage() {
  const [logs, setLogs] = React.useState<FormattedAuditLog[]>([]);
  const [availableActions, setAvailableActions] = React.useState<string[]>([]);
  const [selectedAction, setSelectedAction] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeMetadataLog, setActiveMetadataLog] = React.useState<FormattedAuditLog | null>(null);
  const [copied, setCopied] = React.useState(false);

  const queryKey = `${selectedAction}:${search}`;
  const [prevKey, setPrevKey] = React.useState(queryKey);
  if (prevKey !== queryKey) {
    setPrevKey(queryKey);
    setIsLoading(true);
    setError(null);
  }

  React.useEffect(() => {
    let active = true;

    getAuditLogsAction({
      action: selectedAction,
      search: search.trim() || undefined,
      limit: 100,
    })
      .then((res) => {
        if (!active) return;
        if (res.error) {
          setError(res.error);
        } else {
          setLogs(res.logs);
          setAvailableActions(res.availableActions);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load audit logs");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAction, search]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAuditLogsAction({
        action: selectedAction,
        search: search.trim() || undefined,
        limit: 100,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setLogs(res.logs);
        setAvailableActions(res.availableActions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!activeMetadataLog?.metadata) return;
    navigator.clipboard.writeText(JSON.stringify(activeMetadataLog.metadata, null, 2));
    setCopied(true);
    toast.success("Metadata copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadge = (action: string) => {
    if (action.includes("DELETE") || action.includes("REMOVED")) {
      return (
        <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {action}
        </span>
      );
    }
    if (action.includes("ROLE") || action.includes("UPDATE")) {
      return (
        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          {action}
        </span>
      );
    }
    return (
      <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
        {action}
      </span>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground text-xl font-bold tracking-tight">
                Security Audit Log
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <ShieldAlert className="h-3 w-3 text-indigo-500" />
                Admin Only
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Immutable audit trail recording high-sensitivity administrative actions and deletions
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1.5 self-start rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Access Denied Banner */}
        {error ? (
          <div className="border-border bg-card flex flex-col items-center justify-center rounded-2xl border p-12 text-center shadow-xs">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <ShieldX className="h-6 w-6" />
            </div>
            <h3 className="text-foreground text-sm font-bold">Access Restricted</h3>
            <p className="text-muted-foreground mt-1 max-w-md text-xs">
              {error.includes("Permission denied")
                ? "You need Tech Lead (Admin) permissions to inspect workspace security audit logs."
                : error}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search target, action, or metadata..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground w-full rounded-xl border py-1.5 pr-3 pl-8 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              {/* Action Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-muted-foreground text-xs font-medium">Filter Action:</span>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="border-border bg-background text-foreground rounded-xl border px-3 py-1.5 text-xs font-semibold focus:border-indigo-600 focus:outline-hidden"
                >
                  <option value="ALL">All Actions ({logs.length})</option>
                  {availableActions.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-border bg-muted/40 text-muted-foreground border-b font-medium tracking-wider uppercase">
                    <tr>
                      <th className="py-3 pr-2 pl-5">Timestamp</th>
                      <th className="px-3 py-3">Actor</th>
                      <th className="px-3 py-3">Action</th>
                      <th className="px-3 py-3">Target</th>
                      <th className="py-3 pr-5 pl-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/60 divide-y">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="text-muted-foreground p-8 text-center">
                          Loading audit records...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted-foreground p-8 text-center italic">
                          No audit log records found. Sensitive actions (task deletes, role changes,
                          scoring config updates) will appear here.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                          {/* Timestamp */}
                          <td className="py-3 pr-2 pl-5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Clock className="text-muted-foreground h-3 w-3" />
                              <span className="text-foreground font-mono">
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </td>

                          {/* Actor */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {log.actorImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={log.actorImage}
                                  alt={log.actorName}
                                  className="h-6 w-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                                  {log.actorName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="text-foreground font-semibold">{log.actorName}</span>
                            </div>
                          </td>

                          {/* Action Badge */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            {getActionBadge(log.action)}
                          </td>

                          {/* Target */}
                          <td className="text-foreground px-3 py-3 font-medium">
                            <span className="line-clamp-1">{log.target}</span>
                          </td>

                          {/* Metadata Inspector Trigger */}
                          <td className="py-3 pr-5 pl-3 text-right whitespace-nowrap">
                            {log.metadata ? (
                              <button
                                type="button"
                                onClick={() => setActiveMetadataLog(log)}
                                className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium shadow-2xs transition-colors"
                              >
                                <Eye className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                <span>Inspect</span>
                              </button>
                            ) : (
                              <span className="text-muted-foreground/60 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Metadata Inspector Modal */}
        {activeMetadataLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="border-border bg-card flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border shadow-2xl">
              <div className="border-border flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-foreground text-xs font-bold">
                    Audit Event Payload ({activeMetadataLog.action})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMetadataLog(null)}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <pre className="border-border bg-muted/40 text-foreground overflow-x-auto rounded-xl border p-3 font-mono text-[11px] leading-relaxed">
                  {JSON.stringify(activeMetadataLog.metadata, null, 2)}
                </pre>
              </div>

              <div className="border-border flex items-center justify-between border-t p-3 px-4">
                <span className="text-muted-foreground text-[11px]">
                  Target: {activeMetadataLog.target}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMetadataLog(null)}
                    className="border-border bg-muted/60 text-foreground hover:bg-muted rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
