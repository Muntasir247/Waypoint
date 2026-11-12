"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  ShieldCheck,
  Code,
  Eye,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { acceptInviteAction } from "../actions";

interface AcceptInviteCardProps {
  invite: {
    id: string;
    email: string;
    role: "ADMIN" | "DEVELOPER" | "VIEWER";
    workspaceName: string;
    workspaceSlug: string;
    inviterName: string;
    isExpired: boolean;
    isAccepted: boolean;
    expiresAt: Date | string;
  };
  isAuthenticated: boolean;
  currentUserEmail?: string | null;
  token: string;
}

export function AcceptInviteCard({
  invite,
  isAuthenticated,
  currentUserEmail,
  token,
}: AcceptInviteCardProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleAccept = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await acceptInviteAction(token);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      }
    } catch {
      setError("An unexpected error occurred while accepting invitation.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <ShieldCheck className="h-4 w-4 text-indigo-600" />;
      case "DEVELOPER":
        return <Code className="h-4 w-4 text-sky-600" />;
      default:
        return <Eye className="h-4 w-4 text-slate-600" />;
    }
  };

  if (invite.isAccepted) {
    return (
      <div className="border-border bg-card text-card-foreground w-full max-w-md rounded-2xl border p-8 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-foreground mt-4 text-lg font-bold">Invitation Already Accepted</h2>
        <p className="text-muted-foreground mt-2 text-xs">
          This invitation to join <strong>{invite.workspaceName}</strong> has already been used.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Go to Workspace
          </Link>
        </div>
      </div>
    );
  }

  if (invite.isExpired) {
    return (
      <div className="border-border bg-card text-card-foreground w-full max-w-md rounded-2xl border p-8 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-foreground mt-4 text-lg font-bold">Invitation Expired</h2>
        <p className="text-muted-foreground mt-2 text-xs">
          This invitation expired on {new Date(invite.expiresAt).toLocaleDateString()}. Please
          request a new invite link from your tech lead.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="border-border bg-muted/40 text-foreground hover:bg-muted inline-flex w-full items-center justify-center rounded-xl border py-2.5 text-xs font-semibold"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-card text-card-foreground w-full max-w-md rounded-2xl border p-8 shadow-xl">
      {/* Brand icon */}
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
          <Compass className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 text-center">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Workspace Invitation
        </span>
        <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight">
          Join {invite.workspaceName}
        </h1>
        <p className="text-muted-foreground mt-2 text-xs">
          <strong>{invite.inviterName}</strong> has invited you to collaborate on engineering
          projects as a <strong>{invite.role.toLowerCase()}</strong>.
        </p>
      </div>

      {/* Role and Target Details */}
      <div className="border-border bg-muted/30 mt-6 space-y-2.5 rounded-xl border p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Invited Email</span>
          <span className="text-foreground font-semibold">{invite.email}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Assigned Role</span>
          <span className="text-foreground inline-flex items-center gap-1 font-semibold capitalize">
            {getRoleIcon(invite.role)}
            <span>{invite.role.toLowerCase()}</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Expires in</span>
          <span className="text-muted-foreground">7 days from creation</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>Joined successfully! Redirecting...</span>
        </div>
      )}

      {/* Action Area */}
      <div className="mt-6 space-y-3">
        {isAuthenticated ? (
          <div>
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading || success}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Joining Workspace...</span>
                </>
              ) : (
                <>
                  <span>Accept & Join Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
            {currentUserEmail && currentUserEmail !== invite.email && (
              <p className="text-muted-foreground mt-2 text-center text-[11px]">
                Signed in as {currentUserEmail}. You will join with your current account.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <Link
              href={`/login?callbackUrl=/invite/${token}&email=${encodeURIComponent(invite.email)}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <span>Sign In to Accept</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/signup?callbackUrl=/invite/${token}&email=${encodeURIComponent(invite.email)}`}
              className="border-border bg-muted/40 text-foreground hover:bg-muted inline-flex w-full items-center justify-center rounded-xl border py-2.5 text-xs font-semibold"
            >
              <span>Create New Account</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
