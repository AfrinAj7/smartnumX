import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { headers } from "next/headers";
import { authMailer } from "@/lib/mail";
import { db } from "@/lib/db";
import { authenticateCredentials } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";

const providers = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      console.log("[AUTH DEBUG] authorize called with credentials email:", credentials?.email);
      let ipAddress = "127.0.0.1";
      try {
        if (req && typeof req === "object" && "headers" in req && req.headers && typeof (req.headers as unknown as { get?: unknown }).get === "function") {
          ipAddress = (req.headers as unknown as { get: (name: string) => string | null }).get("x-real-ip") ||
            (req.headers as unknown as { get: (name: string) => string | null }).get("x-forwarded-for") ||
            "127.0.0.1";
        }
      } catch {
        ipAddress = "127.0.0.1";
      }

      try {
        const authUser = await authenticateCredentials(credentials, ipAddress, {
          repository: new PrismaAuthRepository(db),
          mailer: authMailer,
        });
        console.log("[AUTH DEBUG] authenticateCredentials output:", authUser);
        return authUser;
      } catch (authError) {
        console.error("[AUTH DEBUG] Authorize error:", authError);
        return null;
      }
    },
  }),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "smartnum_dev_secret_key_32_characters_long_min!",
  providers,
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: Number(process.env.SESSION_MAX_AGE_SECONDS ?? 30 * 24 * 60 * 60),
  },
  callbacks: {
    async signIn({ user }) {
      return user.status !== "SUSPENDED" && !user.deletedAt;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role ?? "STUDENT";
        token.status = user.status ?? "ACTIVE";
        token.mustChangePassword = user.mustChangePassword ?? false;
      }
      if (token.sub) {
        const currentUser = await db.user.findFirst({
          where: { id: token.sub, deletedAt: null },
          select: { role: true, status: true, mustChangePassword: true },
        });
        token.role = currentUser?.role ?? "STUDENT";
        token.status = currentUser?.status ?? "SUSPENDED";
        token.mustChangePassword = currentUser?.mustChangePassword ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role =
          token.role === "SUPER_ADMIN" ||
          token.role === "INSTRUCTOR" ||
          token.role === "STUDENT"
            ? token.role
            : "STUDENT";
        session.user.status =
          token.status === "ACTIVE" || token.status === "SUSPENDED"
            ? token.status
            : "ACTIVE";
        session.user.mustChangePassword = token.mustChangePassword === true;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 1. Detect dynamic host from incoming request headers
      let detectedOrigin: string | null = null;
      try {
        const headerList = await headers();
        const host = headerList.get("x-forwarded-host") || headerList.get("host");
        const proto = headerList.get("x-forwarded-proto") || (host && !host.includes("localhost") ? "https" : "http");
        if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
          detectedOrigin = `${proto}://${host}`;
        }
      } catch {
        // headers() not available outside request scope
      }

      // 2. Check configured production URLs (ignoring localhost fallback when detecting production)
      const envAppUrl = process.env.APP_URL && !process.env.APP_URL.includes("localhost") ? process.env.APP_URL : null;
      const envNextAuthUrl = process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost") ? process.env.NEXTAUTH_URL : null;
      const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost") ? process.env.NEXT_PUBLIC_SITE_URL : null;

      const prodBase = detectedOrigin || envAppUrl || envNextAuthUrl || envSiteUrl;
      const base = prodBase || (baseUrl && !baseUrl.includes("localhost") ? baseUrl : null) || baseUrl || "http://localhost:3000";
      const cleanBase = base.replace(/\/$/, "");

      // If url is a relative path (e.g. "/" or "/sign-in")
      if (url && url.startsWith("/")) {
        return `${cleanBase}${url}`;
      }

      // If url is already an absolute URL
      try {
        const parsed = new URL(url);
        // If parsed origin matches cleanBase, allow it
        if (cleanBase && parsed.origin === new URL(cleanBase).origin) {
          return url;
        }
        // If url is on the detected live origin, allow it
        if (detectedOrigin && parsed.origin === new URL(detectedOrigin).origin) {
          return url;
        }
        // If url is on a valid non-localhost domain, allow it
        if (!parsed.origin.includes("localhost") && !parsed.origin.includes("127.0.0.1")) {
          return url;
        }
      } catch {
        // fallback to cleanBase if url is not a valid absolute URL
      }

      return cleanBase;
    },
  },
  trustHost: true,
});