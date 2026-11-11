import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with cost factor 12.
 * Chosen for cross-platform portability without native C++ compilation dependencies.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validates password rules:
 * - Minimum 8 characters
 * - Must include at least one letter and one number
 */
export function validatePasswordRules(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number." };
  }
  return { isValid: true };
}

/**
 * Generates an unguessable 32-byte hex token for email links,
 * and a SHA-256 hash of that token to store in the database.
 */
export function generateSecureToken(): { token: string; hashedToken: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  return { token, hashedToken };
}

/**
 * Hashes a token using SHA-256 before database lookup.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ----------------------------------------------------
// In-Memory Rate Limiter
// ----------------------------------------------------

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Enforces in-memory rate limiting per key (e.g., ip + action).
 * Returns true if allowed, false if limit exceeded.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 60 * 15,
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
}

/**
 * Clears expired records from the rate limiter store.
 */
export function cleanupRateLimiter(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}
