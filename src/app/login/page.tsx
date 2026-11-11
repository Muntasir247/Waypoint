"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Compass, Sparkles, UserCheck, Shield, Eye, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.success("Welcome back to Waypoint!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, roleName: string) => {
    setDemoLoading(demoEmail);
    try {
      const res = await signIn("credentials", {
        email: demoEmail,
        password: "demo1234",
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        toast.error("Could not sign in with demo account.");
      } else {
        toast.success(`Signed in as ${roleName}!`);
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Demo login failed.");
    } finally {
      setDemoLoading(null);
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
          Sign in to Waypoint
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Precision task assignment & tracking for high-velocity teams
        </p>
      </div>

      {/* Demo Fast-Track Card */}
      <div className="to-card rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 p-4 shadow-xs dark:border-indigo-900/60 dark:from-indigo-950/30">
        <div className="flex items-center gap-1.5 pb-2.5 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Try the Demo (One-Click Sign-in)</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleDemoLogin("techlead@waypoint.demo", "Tech Lead (Admin)")}
            disabled={!!demoLoading}
            className="border-border bg-card flex flex-col items-start rounded-xl border p-2.5 text-left transition-all hover:border-indigo-400 hover:shadow-xs active:scale-98"
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                Admin
              </span>
              <Shield className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <span className="text-foreground mt-1 text-xs font-semibold">Alex Rivera</span>
            <span className="text-muted-foreground text-[10px]">Tech Lead</span>
            {demoLoading === "techlead@waypoint.demo" && (
              <Loader2 className="mt-1.5 h-3 w-3 animate-spin text-indigo-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin("developer@waypoint.demo", "Developer")}
            disabled={!!demoLoading}
            className="border-border bg-card flex flex-col items-start rounded-xl border p-2.5 text-left transition-all hover:border-indigo-400 hover:shadow-xs active:scale-98"
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-sky-600 uppercase dark:text-sky-400">
                Engineer
              </span>
              <UserCheck className="h-3.5 w-3.5 text-sky-500" />
            </div>
            <span className="text-foreground mt-1 text-xs font-semibold">Sarah Chen</span>
            <span className="text-muted-foreground text-[10px]">Fullstack</span>
            {demoLoading === "developer@waypoint.demo" && (
              <Loader2 className="mt-1.5 h-3 w-3 animate-spin text-sky-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin("viewer@waypoint.demo", "Viewer")}
            disabled={!!demoLoading}
            className="border-border bg-card flex flex-col items-start rounded-xl border p-2.5 text-left transition-all hover:border-indigo-400 hover:shadow-xs active:scale-98"
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Viewer
              </span>
              <Eye className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <span className="text-foreground mt-1 text-xs font-semibold">David Kim</span>
            <span className="text-muted-foreground text-[10px]">Stakeholder</span>
            {demoLoading === "viewer@waypoint.demo" && (
              <Loader2 className="mt-1.5 h-3 w-3 animate-spin text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Traditional Credentials Form Card */}
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

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-foreground block text-xs font-medium">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Forgot password?
              </Link>
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
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
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
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
              <span>Google</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <p className="text-muted-foreground text-center text-xs">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Sign up for free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
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
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
