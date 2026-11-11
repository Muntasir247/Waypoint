export type EmailKind = "VERIFY_EMAIL" | "PASSWORD_RESET" | "INVITE" | "DIGEST";

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  kind: EmailKind;
  actionUrl?: string;
}

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<{ id: string; success: boolean }>;
  sendVerificationEmail(
    to: string,
    verificationUrl: string,
  ): Promise<{ id: string; success: boolean }>;
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<{ id: string; success: boolean }>;
  sendInviteEmail(
    to: string,
    workspaceName: string,
    inviteUrl: string,
    role: string,
  ): Promise<{ id: string; success: boolean }>;
}
