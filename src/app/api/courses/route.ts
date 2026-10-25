import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CourseStatus, Prisma } from "@prisma/client";
import { ensureDefaultCoursesInDb } from "@/server/courses/course-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") || undefined;
  const search = searchParams.get("search") || undefined;

  // Ensure default catalog courses exist in database
  await ensureDefaultCoursesInDb();

  const where: Prisma.CourseWhereInput = {
    status: CourseStatus.PUBLISHED,
    deletedAt: null,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const courses = await db.course.findMany({
    where,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { id: true, name: true, slug: true } },
      instructor: { select: { id: true, name: true } },
      _count: { select: { modules: true } },
    },
  });

  return NextResponse.json({
    data: courses.map((c) => ({
      ...c,
      price: Number(c.price),
      discountPrice: c.discountPrice ? Number(c.discountPrice) : null,
    })),
  });
}
