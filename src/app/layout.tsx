import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "sonner";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waypoint-jade-kappa.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Waypoint | Tech Lead Task Assignment & Tracking",
    template: "%s | Waypoint",
  },
  description:
    "A team task assignment and tracking tool built for tech leads who need to assign work to developers and get a project ready on time.",
  keywords: [
    "tech lead",
    "task assignment",
    "sprint tracking",
    "developer workload",
    "smart assignment",
    "engineering velocity",
  ],
  authors: [{ name: "Waypoint Engineering" }],
  creator: "Waypoint",
  publisher: "Waypoint",
  openGraph: {
    title: "Waypoint | Tech Lead Task Assignment & Tracking",
    description:
      "A team task assignment and tracking tool built for tech leads who need to assign work to developers and get a project ready on time.",
    url: appUrl,
    siteName: "Waypoint",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Waypoint | Tech Lead Task Assignment & Tracking",
    description:
      "A team task assignment and tracking tool built for tech leads who need to assign work to developers and get a project ready on time.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900/40 dark:selection:text-indigo-200">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
