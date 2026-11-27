"use server";

import { db } from "@/lib/db";
import {
  hashPassword,
  validatePasswordRules,
  generateSecureToken,
  hashToken,
  checkRateLimit,
} from "@/lib/security";
import { emailProvider } from "@/features/email";
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "./schemas";
import { env } from "@/env";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Registers a new user account, creates a verification token,
 * and sends a simulated email to the Demo Outbox.
 */
export async function registerAction(formData: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed. Please check the fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Rate limiting (max 10 registrations per IP/key per hour)
  const rateLimit = checkRateLimit(`register_${normalizedEmail}`, 10, 3600);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many registration attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return {
      success: false,
      message: "An account with this email address already exists.",
    };
  }

  const passwordHash = await hashPassword(password);

  // Create user
  const user = await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
    },
  });

  // Generate secure verification token
  const { token, hashedToken } = generateSecureToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: hashedToken,
      expires,
    },
  });

  // Send simulated verification email
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
  await emailProvider.sendVerificationEmail(normalizedEmail, verifyUrl);

  return {
    success: true,
    message: "Account created successfully! You can now sign in to your workspace.",
    data: { userId: user.id },
  };
}

/**
 * Validates a verification token and marks the user's email as verified.
 */
export async function verifyEmailAction(token: string, email: string): Promise<ActionResult> {
  if (!token || !email) {
    return { success: false, message: "Invalid or missing verification parameters." };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashed = hashToken(token);

  const verificationRecord = await db.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      token: hashed,
    },
  });

  if (!verificationRecord) {
    return { success: false, message: "Verification link is invalid or has already been used." };
  }

  if (new Date() > verificationRecord.expires) {
    // Delete expired token
    await db.verificationToken.delete({
      where: { token: hashed },
    });
    return {
      success: false,
      message: "This verification link has expired. Please request a new one.",
    };
  }

  // Update user as verified
  await db.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  });

  // Consume single-use token
  await db.verificationToken.delete({
    where: { token: hashed },
  });

  return {
    success: true,
    message: "Email verified successfully! You can now sign in.",
  };
}

/**
 * Requests a password reset email for an existing account.
 */
export async function requestPasswordResetAction(formData: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  // Rate limiting (max 5 reset requests per 15 minutes)
  const rateLimit = checkRateLimit(`reset_${normalizedEmail}`, 5, 900);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many password reset requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always return success for security (prevents user enumeration), but only generate token if user exists
  if (user) {
    // Invalidate any previous reset tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: `reset_${normalizedEmail}` },
    });

    const { token, hashedToken } = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.verificationToken.create({
      data: {
        identifier: `reset_${normalizedEmail}`,
        token: hashedToken,
        expires,
      },
    });

    const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
    await emailProvider.sendPasswordResetEmail(normalizedEmail, resetUrl);
  }

  return {
    success: true,
    message:
      process.env.NEXT_PUBLIC_DEMO_MODE === "true"
        ? "If an account exists with that email, a password reset link has been dispatched to the Demo Outbox."
        : "If an account exists with that email, a password reset link has been sent to your email address.",
  };
}

/**
 * Resets a user's password using a valid reset token.
 */
export async function resetPasswordAction(formData: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed. Please check the fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { token, password } = parsed.data;
  const rules = validatePasswordRules(password);
  if (!rules.isValid) {
    return { success: false, message: rules.message };
  }

  const hashed = hashToken(token);
  const tokenRecord = await db.verificationToken.findFirst({
    where: { token: hashed },
  });

  if (!tokenRecord || !tokenRecord.identifier.startsWith("reset_")) {
    return { success: false, message: "Reset token is invalid or has already been used." };
  }

  if (new Date() > tokenRecord.expires) {
    await db.verificationToken.delete({ where: { token: hashed } });
    return { success: false, message: "Reset link has expired. Please request a new one." };
  }

  const normalizedEmail = tokenRecord.identifier.replace("reset_", "");
  const newPasswordHash = await hashPassword(password);

  await db.user.update({
    where: { email: normalizedEmail },
    data: { passwordHash: newPasswordHash },
  });

  // Delete consumed token
  await db.verificationToken.delete({
    where: { token: hashed },
  });

  return {
    success: true,
    message: "Password reset successfully! You can now sign in with your new password.",
  };
}
