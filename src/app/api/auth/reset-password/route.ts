import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authMailer } from "@/lib/mail";
import { db } from "@/lib/db";
import { resetPassword } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";

export async function POST(request: Request) {
  try {
    const reset = await resetPassword(await request.json(), {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });
    if (!reset) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }
    return NextResponse.json({ data: { message: "Password updated. You can now sign in." } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: "Password could not be updated." }, { status: 503 });
  }
}