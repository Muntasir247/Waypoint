import { EmailProvider } from "./types";
import { mockEmailProvider } from "./mock-provider";

// For demo and local development, mockEmailProvider is used.
// A real Resend/SendGrid/SMTP provider can be plugged in here without touching feature code.
export const emailProvider: EmailProvider = mockEmailProvider;

export * from "./types";
export * from "./mock-provider";
