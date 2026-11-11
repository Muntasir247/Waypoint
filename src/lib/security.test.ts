import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validatePasswordRules,
  generateSecureToken,
  hashToken,
  checkRateLimit,
} from "./security";

describe("Security module", () => {
  it("hashes and verifies passwords correctly", async () => {
    const raw = "SuperSecret123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    const valid = await verifyPassword(raw, hash);
    expect(valid).toBe(true);

    const invalid = await verifyPassword("WrongPassword", hash);
    expect(invalid).toBe(false);
  });

  it("enforces strong password rules", () => {
    expect(validatePasswordRules("short1").isValid).toBe(false);
    expect(validatePasswordRules("alllettersnodigits").isValid).toBe(false);
    expect(validatePasswordRules("1234567890").isValid).toBe(false);
    expect(validatePasswordRules("validPass123").isValid).toBe(true);
  });

  it("generates and hashes tokens deterministically", () => {
    const { token, hashedToken } = generateSecureToken();
    expect(token).toHaveLength(64);
    expect(hashToken(token)).toBe(hashedToken);
  });

  it("limits requests when threshold is exceeded", () => {
    const testKey = "rate_limit_test_" + Date.now();
    for (let i = 0; i < 3; i++) {
      const res = checkRateLimit(testKey, 3, 60);
      expect(res.allowed).toBe(true);
    }
    const blocked = checkRateLimit(testKey, 3, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
