import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { listAdminEnrollments, manualEnrollUser } from "@/server/enrollments/enrollment-service";
import { EnrollmentStatus } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const statusParam = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const status =
    statusParam && Object.values(EnrollmentStatus).includes(statusParam as EnrollmentStatus)
      ? (statusParam as EnrollmentStatus)
      : undefined;

  const result = await listAdminEnrollments({ courseId, search, status, page, pageSize });
  return NextResponse.json({ data: result.enrollments, meta: result.meta });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Super Admin permission required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, courseId, reason, validityDays } = body;
    if (!userId || !courseId) {
      return NextResponse.json({ error: "userId and courseId are required." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || undefined;
    const enrollment = await manualEnrollUser({
      userId,
      courseId,
      actorId: session.user.id,
      reason,
      validityDays: validityDays ? Number(validityDays) : undefined,
      ip,
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enroll user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
