import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listUserEnrollments } from "@/server/enrollments/enrollment-service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const enrollments = await listUserEnrollments(session.user.id);
  return NextResponse.json({ data: enrollments });
}
