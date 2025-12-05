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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        // Log activity
        await ActivityLog.create({
          userId: user._id,
          action: 'LOGIN',
          entity: 'SESSION',
          details: 'User logged in',
        });

        return { id: user._id.toString(), name: user.name, email: user.email } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token && (token as any).id) {
        (session.user as any).id = (token as any).id as string;
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
