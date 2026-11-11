import { db } from "@/lib/db";
import { EmailProvider, SendEmailOptions } from "./types";

export class MockEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<{ id: string; success: boolean }> {
    const email = await db.mockEmail.create({
      data: {
        to: options.to,
        subject: options.subject,
        body: options.body,
        kind: options.kind,
      },
    });

    return { id: email.id, success: true };
  }

  async sendVerificationEmail(
    to: string,
    verificationUrl: string,
  ): Promise<{ id: string; success: boolean }> {
    const subject = "Verify your email address - Waypoint";
    const body = `
Welcome to Waypoint!

Please verify your email address to complete your account setup.

Click the link below to verify:
${verificationUrl}

This link will expire in 24 hours.

If you did not sign up for Waypoint, you can safely ignore this message.
`.trim();

    return this.sendEmail({
      to,
      subject,
      body,
      kind: "VERIFY_EMAIL",
      actionUrl: verificationUrl,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
  ): Promise<{ id: string; success: boolean }> {
    const subject = "Reset your password - Waypoint";
    const body = `
Hello,

We received a request to reset the password for your Waypoint account.

Click the link below to choose a new password:
${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, you can safely ignore this email.
`.trim();

    return this.sendEmail({
      to,
      subject,
      body,
      kind: "PASSWORD_RESET",
      actionUrl: resetUrl,
    });
  }

  async sendInviteEmail(
    to: string,
    workspaceName: string,
    inviteUrl: string,
    role: string,
  ): Promise<{ id: string; success: boolean }> {
    const subject = `You've been invited to join ${workspaceName} on Waypoint`;
    const body = `
Hello!

You have been invited to join the ${workspaceName} team workspace on Waypoint as a ${role}.

Click the link below to accept the invitation and get started:
${inviteUrl}

This link is single-use and will expire in 7 days.
`.trim();

    return this.sendEmail({
      to,
      subject,
      body,
      kind: "INVITE",
      actionUrl: inviteUrl,
    });
  }
}

export const mockEmailProvider = new MockEmailProvider();
