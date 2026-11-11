"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, ArrowRight, Loader2, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { registerAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignUpPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [registered, setRegistered] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerAction({
        name,
        email,
        password,
        confirmPassword,
      });

      if (!result.success) {
        toast.error(result.message || "Failed to register.");
      } else {
        setRegistered(true);
        toast.success("Account created! Check Demo Outbox for verification.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
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
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Compass className="h-7 w-7" />
          </div>
          <h1 className="text-foreground mt-4 text-2xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Get started with Waypoint to assign and track engineering work
          </p>
        </div>

        {/* Success Card if registered */}
        {registered ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-foreground mt-3 text-base font-semibold">
              Registration Successful!
            </h2>
            <p className="text-muted-foreground mt-2 text-xs">
              A simulated email verification link has been delivered to the{" "}
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
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Sign Up Form */
          <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="text-foreground block text-xs font-medium">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  className="border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:bg-background mt-1 h-9 w-full rounded-xl border px-3 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-foreground block text-xs font-medium">
                  Work Email
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

              <div>
                <label htmlFor="password" className="text-foreground block text-xs font-medium">
                  Password (min 8 characters, letter & number)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:bg-background mt-1 h-9 w-full rounded-xl border px-3 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-foreground block text-xs font-medium"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
                    <span>Create Account</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Link */}
        <p className="text-muted-foreground text-center text-xs">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
