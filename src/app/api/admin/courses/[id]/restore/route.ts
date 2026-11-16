import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole, canManageCourse } from "@/lib/rbac";
import { getCourseById, restoreCourse } from "@/server/courses/course-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getCourseById(id, true);
  if (!existing) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  if (!canManageCourse(session.user, existing.instructorId)) {
    return NextResponse.json({ error: "Forbidden: You cannot restore this course." }, { status: 403 });
  }

  try {
    const ip = request.headers.get("x-forwarded-for") || undefined;
    const restored = await restoreCourse(id, session.user.id, ip);
    return NextResponse.json({ data: restored, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore course.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
