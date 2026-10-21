import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import { authMailer } from "@/lib/mail";
import { changePassword } from "@/server/auth/auth-service";
import { PrismaAuthRepository } from "@/server/auth/prisma-auth-repository";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (
    session.user.status !== "ACTIVE" ||
    !hasRole(session.user, ["SUPER_ADMIN", "INSTRUCTOR", "STUDENT"])
  ) {
    return NextResponse.json({ error: "You cannot change this account password." }, { status: 403 });
  }

  try {
    const changed = await changePassword(session.user.id, await request.json(), {
      repository: new PrismaAuthRepository(db),
      mailer: authMailer,
    });
    if (!changed) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    return NextResponse.json({ data: { message: "Password updated." } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: "Password could not be updated." }, { status: 503 });
  }
}