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
    await registerUser(await request.json(), {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });
    return NextResponse.json({
      data: { message: "If registration can be completed, check your email for the next step." },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Registration could not be completed. Check email setup and try again." },
      { status: 503 },
    );
  }
}