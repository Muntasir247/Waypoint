import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { verifyCronSecret, validateCronRequest } from "./cron-auth";

describe("Cron Secret Authentication (Fix 1)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("verifyCronSecret", () => {
    it("fails closed when CRON_SECRET is unset", () => {
      delete process.env.CRON_SECRET;
      expect(verifyCronSecret("Bearer my-secret")).toBe(false);
      expect(verifyCronSecret(null)).toBe(false);
    });

    it("rejects when authorization header is missing or empty", () => {
      process.env.CRON_SECRET = "my-secret-123";
      expect(verifyCronSecret(null)).toBe(false);
      expect(verifyCronSecret("")).toBe(false);
    });

    it("rejects when authorization header is wrong", () => {
      process.env.CRON_SECRET = "my-secret-123";
      expect(verifyCronSecret("Bearer wrong-secret")).toBe(false);
      expect(verifyCronSecret("Basic dXNlcjpwYXNz")).toBe(false);
      expect(verifyCronSecret("my-secret-123")).toBe(false);
    });

    it("accepts when authorization header matches Bearer CRON_SECRET", () => {
      process.env.CRON_SECRET = "my-secret-123";
      expect(verifyCronSecret("Bearer my-secret-123")).toBe(true);
    });
  });

  describe("validateCronRequest", () => {
    // Tests: unset secret → 401, wrong secret → 401, correct secret → 200, missing header → 401
    const executeCronRoute = async (req: Request) => {
      const unauthorized = validateCronRequest(req);
      if (unauthorized) return unauthorized;
      return Response.json({ success: true }, { status: 200 });
    };

    it("unset secret -> 401", async () => {
      delete process.env.CRON_SECRET;
      const req = new Request("https://example.com/api/cron/email-digests", {
        headers: { authorization: "Bearer some-token" },
      });
      const res = await executeCronRoute(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("wrong secret -> 401", async () => {
      process.env.CRON_SECRET = "correct-secret";
      const req = new Request("https://example.com/api/cron/monthly-close", {
        headers: { authorization: "Bearer wrong-secret" },
      });
      const res = await executeCronRoute(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("missing header -> 401", async () => {
      process.env.CRON_SECRET = "correct-secret";
      const req = new Request("https://example.com/api/cron/email-digests");
      const res = await executeCronRoute(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("correct secret -> 200", async () => {
      process.env.CRON_SECRET = "correct-secret";
      const req = new Request("https://example.com/api/cron/email-digests", {
        headers: { authorization: "Bearer correct-secret" },
      });
      const res = await executeCronRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
