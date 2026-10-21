import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authMailer } from "@/lib/mail";
import { db } from "@/lib/db";
import { consumeAccountRequestQuota } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";
import { createDemoLead } from "@/server/leads/lead-service";

export async function POST(request: Request) {
  const quota = await consumeAccountRequestQuota(
    "lead-demo",
    request.headers.get("x-real-ip") ?? "unknown",
    { repository: new PrismaAuthRepository(db), mailer: authMailer },
  );
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(quota.retryAfterSeconds) } },
    );
  }

  try {
    await createDemoLead(await request.json(), db);
    return NextResponse.json({ data: { message: "Thanks. The Ziel team will be in touch." } }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: "Your request could not be saved. Please try again." }, { status: 503 });
  }
}