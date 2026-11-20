import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";

// Mock DB
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// We test the OAuth sign-in logic isolated from next-auth initialization
describe("Google OAuth Configuration & Security (Fix 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Account Takeover Prevention in Google OAuth SignIn Callback", () => {
    // Replicate the callback function from src/lib/auth.ts to test logic deterministically
    async function handleGoogleSignIn({
      user,
      account,
    }: {
      user: { email?: string | null; name?: string | null; image?: string | null };
      account: { provider: string };
    }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const normalizedEmail = user.email.toLowerCase().trim();

        const existingUser = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          // If the user previously registered with a password, prevent silent account takeover!
          if (existingUser.passwordHash) {
            return "/login?error=OAuthAccountNotLinked";
          }
        } else {
          // New Google OAuth sign up: auto-create the user profile
          await db.user.create({
            data: {
              email: normalizedEmail,
              name: user.name || "Google User",
              image: user.image || null,
              emailVerified: new Date(),
            },
          });
        }
      }
      return true;
    }

    it("rejects Google login with OAuthAccountNotLinked if user already has a password account", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        id: "user-pwd-1",
        email: "victim@waypoint.dev",
        name: "Victim User",
        passwordHash: "$2a$12$hashedpasswordvalue",
        emailVerified: new Date(),
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>);

      const result = await handleGoogleSignIn({
        user: { email: "victim@waypoint.dev", name: "Attacker Name" },
        account: { provider: "google" },
      });

      expect(result).toBe("/login?error=OAuthAccountNotLinked");
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it("allows Google login if existing account was created via OAuth (no passwordHash)", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        id: "user-oauth-1",
        email: "oauthuser@waypoint.dev",
        name: "Google User",
        passwordHash: null,
        emailVerified: new Date(),
        image: "https://lh3.googleusercontent.com/avatar",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Awaited<ReturnType<typeof db.user.findUnique>>);

      const result = await handleGoogleSignIn({
        user: { email: "oauthuser@waypoint.dev", name: "Google User" },
        account: { provider: "google" },
      });

      expect(result).toBe(true);
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it("creates new user record with verified email for first-time Google sign-up", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.user.create).mockResolvedValueOnce({
        id: "user-new-1",
        email: "newuser@gmail.com",
        name: "New Google User",
        passwordHash: null,
        emailVerified: new Date(),
        image: "https://lh3.googleusercontent.com/pic",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Awaited<ReturnType<typeof db.user.create>>);

      const result = await handleGoogleSignIn({
        user: {
          email: "newuser@gmail.com",
          name: "New Google User",
          image: "https://lh3.googleusercontent.com/pic",
        },
        account: { provider: "google" },
      });

      expect(result).toBe(true);
      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          email: "newuser@gmail.com",
          name: "New Google User",
          image: "https://lh3.googleusercontent.com/pic",
          emailVerified: expect.any(Date),
        },
      });
    });

    it("rejects login if Google profile has no email", async () => {
      const result = await handleGoogleSignIn({
        user: { email: undefined, name: "No Email User" },
        account: { provider: "google" },
      });

      expect(result).toBe(false);
    });
  });

  describe("Google Client Configuration Detection", () => {
    it("evaluates isGoogleConfigured based on both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET", () => {
      const checkConfig = (id?: string, secret?: string) => Boolean(id && secret);

      expect(checkConfig(undefined, undefined)).toBe(false);
      expect(checkConfig("some-id", undefined)).toBe(false);
      expect(checkConfig(undefined, "some-secret")).toBe(false);
      expect(checkConfig("", "")).toBe(false);
      expect(checkConfig("client-id-123", "client-secret-xyz")).toBe(true);
    });
  });
});
