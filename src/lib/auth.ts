import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
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
      if (url.startsWith("/")) return url;
      try {
        const parsed = new URL(url);
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          return `${parsed.pathname}${parsed.search}`;
        }
        if (parsed.origin === baseUrl) return url;
      } catch {
        // fallback to relative if valid
      }
      return url.startsWith("/") ? url : baseUrl;
    },
  },
  trustHost: true,
});