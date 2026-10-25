import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { hasRole, canManageCourse } from "@/lib/rbac";
import {
  getCourseById,
  updateCourse,
  deleteCourse,
  courseSchema,
} from "@/server/courses/course-service";

async function getAdminActor() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  }
  return session.user;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  if (!canManageCourse(actor, course.instructorId)) {
    return NextResponse.json({ error: "Forbidden: You cannot access this course." }, { status: 403 });
  }

  return NextResponse.json({ data: course });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  const existing = await getCourseById(id);
  if (!existing) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  if (!canManageCourse(actor, existing.instructorId)) {
    return NextResponse.json({ error: "Forbidden: You cannot edit this course." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = courseSchema.partial().parse(body);
    const ip = request.headers.get("x-forwarded-for") || undefined;
    const updated = await updateCourse(id, validated, actor.id, ip);

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to update course.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  // Only SUPER_ADMIN can delete courses
  if (actor.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super Admin permission required to delete courses." }, { status: 403 });
  }

  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for") || undefined;

  try {
    await deleteCourse(id, actor.id, ip);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete course.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
