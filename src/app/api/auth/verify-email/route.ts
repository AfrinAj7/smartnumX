import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authMailer } from "@/lib/mail";
import { db } from "@/lib/db";
import { verifyEmail } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";

function getSafeRedirectUrl(request: Request, destination: string): URL {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    return new URL(destination, `${proto}://${host}`);
  }
  return new URL(destination, request.url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim();
  const email = url.searchParams.get("email")?.trim();
  const token = url.searchParams.get("token")?.trim();

  if (!code && !token) {
    return NextResponse.redirect(getSafeRedirectUrl(request, "/sign-in?error=missing-verification"));
  }

  try {
    const payload = code && email ? { code, email } : { token: token || code || "", ...(email ? { email } : {}) };
    const verified = await verifyEmail(payload, {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });
    const destination = verified ? "/sign-in?verified=1" : "/sign-in?error=invalid-verification";
    return NextResponse.redirect(getSafeRedirectUrl(request, destination));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.redirect(getSafeRedirectUrl(request, "/sign-in?error=invalid-verification"));
    }
    return NextResponse.redirect(getSafeRedirectUrl(request, "/sign-in?error=verification-service"));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const verified = await verifyEmail(body, {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });

    if (!verified) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired verification code." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Email verified successfully! You can now sign in.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid 6-digit verification code." },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Verification could not be processed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
