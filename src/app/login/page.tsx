import * as React from "react";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign In | Waypoint",
  description: "Sign in to your Waypoint account",
};

export default function LoginPage() {
  const isGoogleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 w-full max-w-md items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        }
      >
        <LoginForm isGoogleConfigured={isGoogleConfigured} />
      </Suspense>
    </div>
  );
}
