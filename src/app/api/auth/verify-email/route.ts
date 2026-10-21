import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authMailer } from "@/lib/mail";
import { db } from "@/lib/db";
import { verifyEmail } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  try {
    const verified = await verifyEmail({ token }, {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });
    const destination = verified ? "/sign-in?verified=1" : "/sign-in?error=invalid-verification";
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.redirect(new URL("/sign-in?error=invalid-verification", request.url));
    }
    return NextResponse.redirect(new URL("/sign-in?error=verification-service", request.url));
  }
}