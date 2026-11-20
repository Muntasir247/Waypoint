import crypto from "crypto";

/**
 * Validates the Authorization header of incoming Vercel Cron requests.
 * Fails closed: rejects if CRON_SECRET is unset, if header is missing, or if header does not match.
 * Uses constant-time comparison via SHA-256 digests and crypto.timingSafeEqual to prevent timing attacks.
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) {
    return false;
  }

  const expectedHeader = `Bearer ${cronSecret}`;

  // Use SHA-256 digests so buffers always have identical length (32 bytes),
  // preventing length leakage and avoiding RangeError in crypto.timingSafeEqual.
  const authBuffer = crypto.createHash("sha256").update(authHeader).digest();
  const expectedBuffer = crypto.createHash("sha256").update(expectedHeader).digest();

  return crypto.timingSafeEqual(authBuffer, expectedBuffer);
}

/**
 * Validates incoming cron HTTP request.
 * Returns a 401 Response if unauthorized, or null if authorized.
 */
export function validateCronRequest(req: Request): Response | null {
  const authHeader = req.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
