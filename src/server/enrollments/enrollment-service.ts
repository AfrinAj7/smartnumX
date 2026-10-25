import { db } from "@/lib/db";
import { EnrollmentStatus, EnrollmentSource, Prisma } from "@prisma/client";

export async function listUserEnrollments(userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: {
      userId,
      course: { deletedAt: null },
    },
    orderBy: { startedAt: "desc" },
    include: {
      course: {
        include: {
          category: { select: { name: true } },
          modules: {
            orderBy: { position: "asc" },
            include: {
              lessons: {
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  title: true,
                  duration: true,
                  position: true,
                  type: true,
                },
              },
            },
          },
        },
      },
      progress: true,
      batch: { select: { id: true, name: true, mode: true } },
    },
  });

  return enrollments.map((enr) => {
    // calculate total lessons vs completed lessons
    const allLessons = enr.course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;
    const completedLessons = enr.progress.filter((p) => p.completedAt !== null).length;
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      id: enr.id,
      courseId: enr.courseId,
      status: enr.status,
      startedAt: enr.startedAt,
      expiresAt: enr.expiresAt,
      source: enr.source,
      batch: enr.batch,
      course: {
        id: enr.course.id,
        title: enr.course.title,
        slug: enr.course.slug,
        description: enr.course.description,
        thumbnailUrl: enr.course.thumbnailUrl,
        categoryName: enr.course.category?.name || "General",
        modules: enr.course.modules,
        totalLessons,
      },
      completedLessons,
      progressPct,
    };
  });
}

export async function listAdminEnrollments(params: {
  courseId?: string;
  status?: EnrollmentStatus | "ALL";
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.EnrollmentWhereInput = {};

  if (params.courseId) {
    where.courseId = params.courseId;
  }

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  if (params.search) {
    where.OR = [
      { user: { name: { contains: params.search, mode: "insensitive" } } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
      { course: { title: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [total, enrollments] = await Promise.all([
    db.enrollment.count({ where }),
    db.enrollment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { startedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        course: { select: { id: true, title: true, slug: true } },
        batch: { select: { id: true, name: true } },
        order: { select: { id: true, invoiceNo: true, total: true } },
      },
    }),
  ]);

  return {
    enrollments: enrollments.map((enr) => ({
      ...enr,
      order: enr.order ? { ...enr.order, total: Number(enr.order.total) } : null,
    })),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function manualEnrollUser(params: {
  userId: string;
  courseId: string;
  actorId: string;
  reason?: string;
  validityDays?: number;
  ip?: string;
}) {
  const { userId, courseId, actorId, reason, validityDays, ip } = params;

  let expiresAt: Date | null = null;
  if (validityDays && validityDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);
  }

  const enrollment = await db.enrollment.upsert({
    where: {
      userId_courseId: { userId, courseId },
    },
    update: {
      status: EnrollmentStatus.ACTIVE,
      expiresAt,
      startedAt: new Date(),
      source: EnrollmentSource.MANUAL,
    },
    create: {
      userId,
      courseId,
      source: EnrollmentSource.MANUAL,
      status: EnrollmentStatus.ACTIVE,
      expiresAt,
      startedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      actorId,
      action: "MANUAL_ENROLLMENT_GRANTED",
      entityType: "Enrollment",
      entityId: enrollment.id,
      after: {
        userId,
        courseId,
        reason: reason || "Manual grant by administrator",
        expiresAt,
      },
      ip: ip || null,
    },
  });

  return enrollment;
}
