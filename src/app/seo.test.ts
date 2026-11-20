import { describe, it, expect } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";
import { metadata } from "./layout";

describe("SEO & Metadata Endpoints (Fix 4)", () => {
  describe("robots.ts metadata route", () => {
    it("configures robots.txt to allow only public pages and disallow private app routes", () => {
      const config = robots();
      expect(config.rules).toBeDefined();

      const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      expect(rules.userAgent).toBe("*");
      expect(rules.allow).toContain("/");
      expect(rules.allow).toContain("/login");
      expect(rules.allow).toContain("/signup");

      expect(rules.disallow).toContain("/api/");
      expect(rules.disallow).toContain("/board");
      expect(rules.disallow).toContain("/team");
      expect(rules.disallow).toContain("/workload");
      expect(rules.disallow).toContain("/audit-log");

      expect(config.sitemap).toContain("/sitemap.xml");
    });
  });

  describe("sitemap.ts metadata route", () => {
    it("generates sitemap with only public routes and valid priorities", () => {
      const items = sitemap();
      expect(items.length).toBeGreaterThanOrEqual(3);

      const urls = items.map((i) => i.url);
      expect(urls.some((u) => u.endsWith("/login"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/signup"))).toBe(true);

      // Verify no authenticated or sensitive routes leak into sitemap
      expect(urls.some((u) => u.includes("/board"))).toBe(false);
      expect(urls.some((u) => u.includes("/api/"))).toBe(false);
      expect(urls.some((u) => u.includes("/audit-log"))).toBe(false);

      // Verify priority ordering
      const rootItem = items.find((i) => !i.url.endsWith("/login") && !i.url.endsWith("/signup"));
      expect(rootItem?.priority).toBe(1.0);
    });
  });

  describe("Root Layout Metadata", () => {
    it("defines metadataBase, OpenGraph, and Twitter tags", () => {
      expect(metadata.metadataBase).toBeDefined();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.description).toBeDefined();
      expect(metadata.openGraph?.siteName).toBe("Waypoint");
      expect(metadata.twitter).toBeDefined();
      expect((metadata.twitter as { card?: string })?.card).toBe("summary_large_image");
    });
  });
});
