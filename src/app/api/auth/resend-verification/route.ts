import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authMailer } from "@/lib/mail";
import { db } from "@/lib/db";
import { resendVerificationCode } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await resendVerificationCode(body, {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[RESEND-VERIFICATION ERROR]", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Could not resend verification code.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

