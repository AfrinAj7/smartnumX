import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authMailer } from "@/lib/mail";
import { db } from "@/lib/db";
import { consumeAccountRequestQuota, requestPasswordReset } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";

export async function POST(request: Request) {
  try {
    const quota = await consumeAccountRequestQuota(
      "forgot-password",
      request.headers.get("x-real-ip") ?? "unknown",
      { repository: new PrismaAuthRepository(db), mailer: authMailer },
    );
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "Too many account requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(quota.retryAfterSeconds) } },
      );
    }
    await requestPasswordReset(await request.json(), {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });
    return NextResponse.json({
      data: { message: "If the account exists, password reset instructions will be sent." },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: "Password reset could not be requested." }, { status: 503 });
  }
}