import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authMailer } from "@/lib/mail";
import { db } from "@/lib/db";
import { consumeAccountRequestQuota, registerUser } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";

export async function POST(request: Request) {
  try {
    const quota = await consumeAccountRequestQuota(
      "register",
      request.headers.get("x-real-ip") ?? "unknown",
      { repository: new PrismaAuthRepository(db), mailer: authMailer },
    );
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "Too many account requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(quota.retryAfterSeconds) } },
      );
    }
    const body = await request.json();
    await registerUser(body, {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });
    return NextResponse.json({
      data: {
        message: "Kindly verify your account. A link to verify your account has been sent on your registered email.",
        email: body.email,
      },
    });
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Registration could not be completed.";
    return NextResponse.json(
      { error: { message } },
      { status: 503 },
    );
  }
}