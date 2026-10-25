import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasRole, canManageCourse } from "@/lib/rbac";
import { getCourseById, updateCourseStatus } from "@/server/courses/course-service";
import { CourseStatus } from "@prisma/client";

const statusSchema = z.object({
  status: z.nativeEnum(CourseStatus),
});

export async function PATCH(
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
  const existing = await getCourseById(id);
  if (!existing) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  if (!canManageCourse(session.user, existing.instructorId)) {
    return NextResponse.json({ error: "Forbidden: You cannot change status for this course." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status } = statusSchema.parse(body);
    const ip = request.headers.get("x-forwarded-for") || undefined;
    const updated = await updateCourseStatus(id, status, session.user.id, ip);

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update course status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
