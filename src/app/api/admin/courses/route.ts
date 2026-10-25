import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import {
  createCourse,
  listAdminCourses,
  listCategories,
  listInstructors,
  ensureDefaultCoursesInDb,
} from "@/server/courses/course-service";
import { CourseStatus } from "@prisma/client";

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

export async function GET(request: Request) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const statusParam = searchParams.get("status");
  const categoryId = searchParams.get("categoryId") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const status =
    statusParam && Object.values(CourseStatus).includes(statusParam as CourseStatus)
      ? (statusParam as CourseStatus)
      : undefined;

  // Sync sample/default marketing courses if DB has none
  await ensureDefaultCoursesInDb();

  const [result, categories, instructors] = await Promise.all([
    listAdminCourses({ search, status, categoryId, page, pageSize }),
    listCategories(),
    listInstructors(),
  ]);

  return NextResponse.json({
    data: result.courses,
    meta: {
      ...result.meta,
      categories,
      instructors,
    },
  });
}

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  try {
    const body = await request.json();
    const ip = request.headers.get("x-forwarded-for") || undefined;
    const course = await createCourse(body, actor.id, ip);

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to create course.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
