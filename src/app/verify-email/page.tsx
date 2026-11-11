"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Compass, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { verifyEmailAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = React.useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const handleVerify = React.useCallback(async () => {
    if (!token || !email) {
      setStatus("error");
      setErrorMessage("Verification link is missing required parameters.");
      return;
    }

    setStatus("verifying");
    try {
      const result = await verifyEmailAction(token, email);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Failed to verify email.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("An unexpected verification error occurred.");
    }
  }, [token, email]);

  React.useEffect(() => {
    if (!token || !email) {
      return;
    }

    let active = true;
    verifyEmailAction(token, email)
      .then((result) => {
        if (!active) return;
        if (result.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(result.message || "Failed to verify email.");
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setErrorMessage("An unexpected verification error occurred.");
      });

    return () => {
      active = false;
    };
  }, [token, email]);

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
        <Compass className="h-7 w-7" />
      </div>

      {status === "verifying" && (
        <div className="border-border bg-card rounded-2xl border p-8 shadow-xs">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <h2 className="text-foreground mt-4 text-base font-semibold">Verifying your email...</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Confirming your security token with Waypoint
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-foreground mt-4 text-lg font-bold">Email Verified!</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Your email address ({email}) has been successfully verified.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-foreground mt-4 text-lg font-bold">Verification Failed</h2>
          <p className="text-muted-foreground mt-1 text-xs">{errorMessage}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/demo-outbox"
              className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
            >
              Check Demo Outbox
            </Link>
            <Link
              href="/login"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex h-9 w-full items-center justify-center rounded-xl border px-4 text-xs font-semibold shadow-xs transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      )}

      {status === "idle" && (
        <div className="border-border bg-card rounded-2xl border p-8 shadow-xs">
          <h2 className="text-foreground text-base font-semibold">Verify Your Email Address</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Click below to complete verification for {email || "your account"}.
          </p>
          <button
            onClick={handleVerify}
            className="mt-6 inline-flex h-9 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
          >
            Verify Email Now
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <React.Suspense
        fallback={
          <div className="flex h-64 w-full max-w-md items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        }
      >
        <VerifyEmailContent />
      </React.Suspense>
    </div>
  );
}
