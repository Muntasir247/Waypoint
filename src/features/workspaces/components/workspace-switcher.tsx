"use client";

import * as React from "react";
import { Building2, ChevronDown, Check, Plus, ShieldCheck, Code, Eye } from "lucide-react";
import { switchWorkspaceAction } from "../actions";
import { CreateWorkspaceModal } from "./create-workspace-modal";

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  role: string;
  isActive: boolean;
}

interface WorkspaceSwitcherProps {
  initialWorkspaces?: WorkspaceItem[];
  currentWorkspaceName?: string;
  currentRole?: string;
}

export function WorkspaceSwitcher({
  initialWorkspaces = [],
  currentWorkspaceName,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);

  const workspaces = initialWorkspaces;
  const activeWorkspace = workspaces.find((w) => w.isActive) || workspaces[0];
  const displayName = currentWorkspaceName || activeWorkspace?.name || "Select Workspace";

  const handleSwitch = async (workspaceId: string) => {
    if (workspaceId === activeWorkspace?.id) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      const res = await switchWorkspaceAction(workspaceId);
      if (res.success) {
        window.location.reload();
      }
    } finally {
      setIsSwitching(false);
      setIsOpen(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <ShieldCheck className="h-3 w-3 text-indigo-500" />;
      case "DEVELOPER":
        return <Code className="h-3 w-3 text-sky-500" />;
      default:
        return <Eye className="text-muted-foreground h-3 w-3" />;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSwitching}
          className="border-border bg-muted/50 text-foreground hover:bg-muted flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
        >
          <Building2 className="h-4 w-4 shrink-0 text-indigo-500" />
          <span className="max-w-[140px] truncate font-semibold md:max-w-[180px]">
            {displayName}
          </span>
          <ChevronDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop click away */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <div className="border-border bg-card animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-1.5 w-64 rounded-xl border p-1.5 shadow-lg">
              <div className="text-muted-foreground px-2.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase">
                Workspaces
              </div>

              <div className="space-y-0.5">
                {workspaces.map((ws) => {
                  const isCurrent = ws.isActive || ws.name === displayName;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleSwitch(ws.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                        isCurrent
                          ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate text-left">
                        <Building2
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isCurrent
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        <div className="truncate">
                          <div className="truncate font-medium">{ws.name}</div>
                          <div className="text-muted-foreground flex items-center gap-1 text-[10px] capitalize">
                            {getRoleIcon(ws.role)}
                            <span>{ws.role.toLowerCase()}</span>
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-border my-1 border-t" />

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setCreateModalOpen(true);
                }}
                className="hover:bg-muted text-foreground flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors"
              >
                <Plus className="text-muted-foreground h-3.5 w-3.5" />
                <span>Create New Workspace</span>
              </button>
            </div>
          </>
        )}
      </div>

      <CreateWorkspaceModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </>
  );
}
