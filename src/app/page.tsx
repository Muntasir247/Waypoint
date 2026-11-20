import { auth } from "@/lib/auth";
import { LandingPageView } from "@/components/landing/landing-page-view";
import { AuthenticatedHome } from "@/components/home/authenticated-home";

export const instant = false;

export default async function HomePage() {
  const session = await auth();

  // If user is not logged in, server-render the full landing page content in the initial HTML
  if (!session?.user) {
    return <LandingPageView />;
  }

  // If user is authenticated, render the dashboard view
  return <AuthenticatedHome />;
}
