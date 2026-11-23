import { auth } from "@/lib/auth";
import { LandingPageView } from "@/components/landing/landing-page-view";
import { AuthenticatedHome } from "@/components/home/authenticated-home";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const instant = false;

export default async function HomePage() {
  const session = await auth();

  // If user is not logged in, server-render the full landing page content in the initial HTML
  if (!session?.user) {
    return <LandingPageView />;
  }

  // Ensure workspace is initialized for authenticated user
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    redirect("/workspaces/new");
  }

  // If user is authenticated, render the dashboard view
  return <AuthenticatedHome />;
}
