import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

describe("HTTP Security Headers Configuration (Fix 2)", () => {
  it("defines headers function in next.config.ts for all routes", async () => {
    expect(nextConfig.headers).toBeDefined();
    if (!nextConfig.headers) return;

    const routes = await nextConfig.headers();
    const globalRoute = routes.find((r) => r.source === "/:path*");
    expect(globalRoute).toBeDefined();

    const headers = globalRoute?.headers || [];
    const headerMap = Object.fromEntries(headers.map((h) => [h.key, h.value]));

    // Required headers
    expect(headerMap["X-Content-Type-Options"]).toBe("nosniff");
    expect(headerMap["X-Frame-Options"]).toBe("DENY");
    expect(headerMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headerMap["Permissions-Policy"]).toContain("camera=()");
    expect(headerMap["Permissions-Policy"]).toContain("microphone=()");
    expect(headerMap["Permissions-Policy"]).toContain("geolocation=()");
    expect(headerMap["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );

    // Report-Only CSP
    expect(headerMap["Content-Security-Policy-Report-Only"]).toBeDefined();
    const csp = headerMap["Content-Security-Policy-Report-Only"];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("https://*.public.blob.vercel-storage.com");
    expect(csp).toContain("https://lh3.googleusercontent.com");
    expect(csp).toContain("https://accounts.google.com");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
