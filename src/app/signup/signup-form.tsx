"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, ArrowRight, Loader2, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { registerAction } from "@/features/auth/actions";

interface SignUpFormProps {
  isGoogleConfigured: boolean;
}

export function SignUpForm({ isGoogleConfigured }: SignUpFormProps) {
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
          <h2 className="text-foreground mt-3 text-base font-semibold">Registration Successful!</h2>
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

          {/* Social OAuth Option */}
          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card text-muted-foreground px-2">or continue with</span>
              </div>
            </div>

            <div className="mt-4">
              {isGoogleConfigured ? (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="border-border bg-card text-foreground hover:bg-muted flex h-9 w-full items-center justify-center gap-2 rounded-xl border px-4 text-xs font-medium shadow-xs transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Google sign-in is not configured on this environment"
                  className="border-border bg-muted/40 text-muted-foreground flex h-9 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border px-4 text-xs font-medium opacity-60 shadow-xs"
                >
                  <svg className="h-4 w-4 opacity-50 grayscale" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google sign-in not configured</span>
                </button>
              )}
            </div>
          </div>
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
  );
}
