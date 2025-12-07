import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import ActivityLog from "@/models/ActivityLog";

// Ensure NEXTAUTH_URL is set in serverless environments (Netlify/Vercel) if missing
(() => {
  if (!process.env.NEXTAUTH_URL) {
    const fromNetlify = process.env.URL || process.env.DEPLOY_PRIME_URL; // Netlify
    const fromVercel = process.env.VERCEL_URL; // Vercel (domain only)
    const raw = fromNetlify || fromVercel;
    if (raw) {
      const url = raw.startsWith("http") ? raw : `https://${raw}`;
      process.env.NEXTAUTH_URL = url;
    }
  }
})();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "dev_secret_change_me",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials, req) {
        console.log("[Auth] Raw credentials:", JSON.stringify({ ...credentials, password: '***' }));

        if (!credentials?.email || !credentials?.password) return null;
        await connectToDatabase();

        // Check for duplicates
        const allUsers = await User.find({ email: credentials.email.toLowerCase().trim() });
        console.log("[Auth] Users found count:", allUsers.length);
        allUsers.forEach(u => console.log(`[Auth] User ${u._id}: 2FA=${u.twoFactorEnabled}`));

        // Select passwordHash and twoFactorSecret explicitly
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() })
          .select('+passwordHash +twoFactorSecret');

        console.log("[Auth] DB URI:", process.env.MONGODB_URI?.substring(0, 20) + "...");
        console.log("[Auth] DB Name:", process.env.MONGODB_DB);
        console.log("[Auth] User found:", user ? {
          id: user._id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled
        } : "null");

        if (!user) {
          console.log("[Auth] User not found");
          return null;
        }

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) {
          console.log("[Auth] Password mismatch");
          return null;
        }

        // 2FA Check
        if (user.twoFactorEnabled) {
          console.log("[Auth] 2FA enabled, checking code");

          // Handle case where code might be the string "undefined"
          const hasCode = credentials.code && credentials.code !== "undefined";

          if (!hasCode) {
            console.log("[Auth] No code provided (or undefined), requesting 2FA");
            throw new Error("2FA_REQUIRED");
          }

          const { verifyTwoFactorCode } = await import("@/lib/twoFactor");
          const isValid = verifyTwoFactorCode(credentials.code, user.twoFactorSecret);

          if (!isValid) {
            console.log("[Auth] Invalid 2FA code");
            throw new Error("INVALID_CODE");
          }
        }

        // Create Session
        const sessionId = crypto.randomUUID();
        const userAgent = req?.headers?.["user-agent"] || "Unknown Device";
        const ip = req?.headers?.["x-forwarded-for"] || "Unknown IP";

        await User.updateOne(
          { _id: user._id },
          {
            $push: {
              sessions: {
                sessionId,
                userAgent,
                ip,
                lastActive: new Date()
              }
            }
          }
        );

        // Log activity
        await ActivityLog.create({
          userId: user._id,
          action: 'LOGIN',
          entity: 'SESSION',
          details: 'User logged in',
        });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          sessionId
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.sessionId = (user as any).sessionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token && (token as any).id) {
        (session.user as any).id = (token as any).id as string;
        (session.user as any).sessionId = (token as any).sessionId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        return u.toString();
      } catch {
        return baseUrl;
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
