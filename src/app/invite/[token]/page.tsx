import { auth } from "@/lib/auth";
import { getInviteDetails } from "@/features/invites/actions";
import { AcceptInviteCard } from "@/features/invites/components/accept-invite-card";
import { DemoBanner } from "@/components/demo-banner";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export const instant = false;

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();
  const res = await getInviteDetails(token);

  if (!res.success || !res.invite) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <DemoBanner />
        <div className="border-border bg-card text-card-foreground w-full max-w-md rounded-2xl border p-8 text-center shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-foreground mt-4 text-lg font-bold">Invalid Invitation</h2>
          <p className="text-muted-foreground mt-2 text-xs">
            {res.error || "The invitation link is invalid or no longer exists."}
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="fixed top-0 right-0 left-0 z-50">
        <DemoBanner />
      </div>
      <div className="flex w-full justify-center py-12">
        <AcceptInviteCard
          invite={res.invite as any}
          isAuthenticated={Boolean(session?.user)}
          currentUserEmail={session?.user?.email}
          token={token}
        />
      </div>
    </div>
  );
}
