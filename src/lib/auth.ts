import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/security";
import { env } from "@/env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: string;
  }
}

// Preset demo accounts for zero-friction demonstration
const DEMO_ACCOUNTS: Record<string, { name: string; role: string }> = {
  "techlead@waypoint.demo": { name: "Alex Rivera", role: "ADMIN" },
  "developer@waypoint.demo": { name: "Sarah Chen", role: "DEVELOPER" },
  "viewer@waypoint.demo": { name: "David Kim", role: "VIEWER" },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // Check demo accounts bypass when in Demo Mode
        if (env.NEXT_PUBLIC_DEMO_MODE && DEMO_ACCOUNTS[email]) {
          const demoInfo = DEMO_ACCOUNTS[email];
          try {
            let user = await db.user.findUnique({ where: { email } });

            if (!user) {
              const passwordHash = await hashPassword("demo1234");
              user = await db.user.create({
                data: {
                  email,
                  name: demoInfo.name,
                  passwordHash,
                  emailVerified: new Date(),
                },
              });
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: demoInfo.role,
            };
          } catch {
            // Fallback for offline demo authentication
            return {
              id: `demo-${email.split("@")[0]}`,
              email,
              name: demoInfo.name,
              image: null,
              role: demoInfo.role,
            };
          }
        }

        // Standard user authentication
        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const normalizedEmail = user.email.toLowerCase().trim();

        const existingUser = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          // If the user previously registered with a password, prevent silent account takeover!
          // Direct them to log in with their credentials.
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
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          const dbUser = await db.user.findUnique({
            where: { email: user.email.toLowerCase().trim() },
          });
          if (dbUser) {
            token.id = dbUser.id;
          }
        } else {
          token.id = user.id;
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
});
