import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://waypoint-jade-kappa.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
      disallow: [
        "/api/",
        "/board",
        "/my-tasks",
        "/team",
        "/projects",
        "/reports",
        "/settings",
        "/workload",
        "/leaderboard",
        "/audit-log",
        "/profile",
        "/workspaces",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
