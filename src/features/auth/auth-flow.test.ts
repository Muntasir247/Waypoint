import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerAction,
  verifyEmailAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "./actions";
import { verifyPassword } from "@/lib/security";

interface MockUser {
  id: string;
  name?: string | null;
  email: string;
  passwordHash?: string | null;
  emailVerified?: Date | null;
}

interface MockToken {
  identifier: string;
  token: string;
  expires: Date;
}

interface MockEmailItem {
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: string;
  createdAt: Date;
}

// In-memory mock database state
const mockDb = {
  users: new Map<string, MockUser>(),
  tokens: new Map<string, MockToken>(),
  emails: [] as MockEmailItem[],
};

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) => {
        return mockDb.users.get(where.email) || null;
      }),
      create: vi.fn(async ({ data }: { data: Omit<MockUser, "id"> }) => {
        const user: MockUser = {
          id: `user_${Date.now()}`,
          ...data,
          emailVerified: data.emailVerified ?? null,
        };
        mockDb.users.set(data.email, user);
        return user;
      }),
      update: vi.fn(
        async ({ where, data }: { where: { email: string }; data: Partial<MockUser> }) => {
          const user = mockDb.users.get(where.email);
          if (user) {
            Object.assign(user, data);
          }
          return user;
        },
      ),
      deleteMany: vi.fn(async () => {
        mockDb.users.clear();
        return { count: 0 };
      }),
    },
    verificationToken: {
      create: vi.fn(async ({ data }: { data: MockToken }) => {
        mockDb.tokens.set(data.token, data);
        return data;
      }),
      findFirst: vi.fn(async ({ where }: { where: { token: string; identifier?: string } }) => {
        const record = mockDb.tokens.get(where.token);
        if (record && (!where.identifier || record.identifier === where.identifier)) {
          return record;
        }
        return null;
      }),
      delete: vi.fn(async ({ where }: { where: { token: string } }) => {
        mockDb.tokens.delete(where.token);
        return {};
      }),
      deleteMany: vi.fn(async ({ where }: { where?: { identifier?: string } }) => {
        if (where?.identifier) {
          for (const [k, v] of mockDb.tokens.entries()) {
            if (v.identifier === where.identifier) {
              mockDb.tokens.delete(k);
            }
          }
        }
        return { count: 0 };
      }),
    },
    mockEmail: {
      create: vi.fn(async ({ data }: { data: Omit<MockEmailItem, "id" | "createdAt"> }) => {
        const email: MockEmailItem = { id: `email_${Date.now()}`, ...data, createdAt: new Date() };
        mockDb.emails.push(email);
        return email;
      }),
      findFirst: vi.fn(async ({ where }: { where: { to: string; kind?: string } }) => {
        return (
          mockDb.emails
            .slice()
            .reverse()
            .find((e) => e.to === where.to && (!where.kind || e.kind === where.kind)) || null
        );
      }),
      findMany: vi.fn(async () => {
        return mockDb.emails.slice().reverse();
      }),
      deleteMany: vi.fn(async () => {
        mockDb.emails = [];
        return { count: 0 };
      }),
    },
  },
}));

describe("End-to-end Auth Flows with Demo Outbox", () => {
  const testEmail = "engineer@acme.com";
  const initialPassword = "StrongPassword123";
  const updatedPassword = "BrandNewPassword456";

  beforeEach(() => {
    mockDb.users.clear();
    mockDb.tokens.clear();
    mockDb.emails = [];
  });

  it("completes full registration -> verification -> password reset flow via Mock Outbox", async () => {
    // 1. Register new user
    const regResult = await registerAction({
      name: "Test Engineer",
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
    });

    expect(regResult.success).toBe(true);

    // Verify user was stored in database
    const user = mockDb.users.get(testEmail);
    expect(user).toBeDefined();
    expect(user?.emailVerified).toBeNull();

    // 2. Verify simulated verification email arrived in Demo Outbox
    expect(mockDb.emails.length).toBeGreaterThan(0);
    const mockEmail = mockDb.emails.find((e) => e.to === testEmail && e.kind === "VERIFY_EMAIL");
    expect(mockEmail).toBeDefined();
    expect(mockEmail?.subject).toContain("Verify your email");

    // Extract token from verification URL
    const tokenMatch = mockEmail?.body.match(/token=([a-f0-9]+)/);
    expect(tokenMatch).not.toBeNull();
    const token = tokenMatch![1];

    // 3. Verify email with token
    const verifyResult = await verifyEmailAction(token, testEmail);
    expect(verifyResult.success).toBe(true);

    const verifiedUser = mockDb.users.get(testEmail);
    expect(verifiedUser?.emailVerified).not.toBeNull();

    // 4. Request password reset
    const resetReqResult = await requestPasswordResetAction({ email: testEmail });
    expect(resetReqResult.success).toBe(true);

    // Verify reset email arrived in Demo Outbox
    const resetEmail = mockDb.emails.find((e) => e.to === testEmail && e.kind === "PASSWORD_RESET");
    expect(resetEmail).toBeDefined();

    const resetTokenMatch = resetEmail?.body.match(/token=([a-f0-9]+)/);
    expect(resetTokenMatch).not.toBeNull();
    const resetToken = resetTokenMatch![1];

    // 5. Submit new password
    const resetResult = await resetPasswordAction({
      token: resetToken,
      password: updatedPassword,
      confirmPassword: updatedPassword,
    });
    expect(resetResult.success).toBe(true);

    // Verify new password hash
    const updatedUser = mockDb.users.get(testEmail);
    const isNewPasswordValid = await verifyPassword(updatedPassword, updatedUser!.passwordHash!);
    expect(isNewPasswordValid).toBe(true);
  });
});
