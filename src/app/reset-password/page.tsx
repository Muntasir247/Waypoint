"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordInput } from "@/components/ui/password-input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing password reset token in URL.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordAction({
        token,
        password,
        confirmPassword,
      });

      if (!result.success) {
        toast.error(result.message || "Failed to reset password.");
      } else {
        setSuccess(true);
        toast.success("Password reset successfully!");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="text-foreground mt-4 text-2xl font-bold tracking-tight">Set new password</h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Choose a strong password with at least 8 characters, a letter and a number
        </p>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-foreground mt-3 text-base font-semibold">Password Reset Complete!</h2>
          <p className="text-muted-foreground mt-2 text-xs">
            Your password has been securely updated. You can now log in.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
            >
              Sign In Now
            </button>
          </div>
        </div>
      ) : (
        <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
          {!token && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              Warning: No reset token found in URL. Please click the reset link from the Demo
              Outbox.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="text-foreground block text-xs font-medium">
                New Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-foreground block text-xs font-medium"
              >
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="mt-1"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Reset Password</span>
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
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          Cancel and return to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <ResetPasswordForm />
      </React.Suspense>
    </div>
  );
}
