"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, ArrowRight, Loader2, CheckCircle2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await requestPasswordResetAction({ email });
      if (result.success) {
        setSubmitted(true);
        toast.success("Reset link simulated in Demo Outbox!");
      } else {
        toast.error(result.message || "Failed to process request.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Compass className="h-7 w-7" />
          </div>
          <h1 className="text-foreground mt-4 text-2xl font-bold tracking-tight">
            Reset your password
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Enter your email address and we&apos;ll send you a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 text-center shadow-xs dark:border-indigo-900/60 dark:bg-indigo-950/30">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-foreground mt-3 text-base font-semibold">Check Demo Outbox</h2>
            <p className="text-muted-foreground mt-2 text-xs">
              A simulated password reset email has been generated and dispatched to the{" "}
              <strong>Demo Outbox</strong>.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/demo-outbox"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Open Demo Outbox</span>
              </Link>
              <Link
                href="/login"
                className="border-border bg-card text-foreground hover:bg-muted inline-flex h-9 items-center justify-center rounded-xl border px-4 text-xs font-semibold shadow-xs transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-foreground block text-xs font-medium">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@acme.com"
                  required
                  className="border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:bg-background mt-1 h-9 w-full rounded-xl border px-3 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
