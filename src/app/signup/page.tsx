import * as React from "react";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignUpForm } from "./signup-form";

export const metadata = {
  title: "Create Account | Waypoint",
  description: "Create your Waypoint account",
};

export default function SignUpPage() {
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
        <SignUpForm isGoogleConfigured={isGoogleConfigured} />
      </Suspense>
    </div>
  );
}
