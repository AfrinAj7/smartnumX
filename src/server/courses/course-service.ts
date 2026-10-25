import { db } from "@/lib/db";
import { CourseStatus, Prisma } from "@prisma/client";
import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
  instructorId: z.string().trim().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  validityDays: z.coerce.number().int().min(1).optional().nullable(),
  minAttendancePct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  requireFullProgress: z.boolean().default(true),
  certificateEnabled: z.boolean().default(true),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
  featured: z.boolean().default(false),
});

export type CourseInput = z.infer<typeof courseSchema>;

export interface CourseListFilters {
  status?: CourseStatus | "ALL";
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listAdminCourses(filters: CourseListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.CourseWhereInput = {
    deletedAt: null,
  };

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, courses] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        instructor: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            orderItems: true,
          },
        },
      },
    }),
  ]);

  return {
    courses: courses.map((course) => ({
      ...course,
      price: Number(course.price),
      discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
    })),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getCourseById(id: string) {
  const course = await db.course.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      instructor: { select: { id: true, name: true, email: true } },
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
        },
      },
      batches: {
        orderBy: { startDate: "desc" },
      },
      _count: {
        select: {
          enrollments: true,
          orderItems: true,
        },
      },
    },
  });

  if (!course) return null;

  return {
    ...course,
    price: Number(course.price),
    discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
  };
}

export async function getCourseBySlug(slug: string, preview: boolean = false) {
  const where: Prisma.CourseWhereInput = {
    slug,
    deletedAt: null,
  };

  if (!preview) {
    where.status = CourseStatus.PUBLISHED;
  }

  const course = await db.course.findFirst({
    where,
    include: {
      category: true,
      instructor: { select: { id: true, name: true, image: true } },
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
              isPreview: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!course) return null;

  return {
    ...course,
    price: Number(course.price),
    discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
  };
}

export async function createCourse(input: CourseInput, actorId: string, ip?: string) {
  const validated = courseSchema.parse(input);

  const existingSlug = await db.course.findUnique({
    where: { slug: validated.slug },
  });

  if (existingSlug && !existingSlug.deletedAt) {
    throw new Error(`A course with slug "${validated.slug}" already exists.`);
  }

  const course = await db.course.create({
    data: {
      title: validated.title,
      slug: validated.slug,
      description: validated.description,
      thumbnailUrl: validated.thumbnailUrl || null,
      categoryId: validated.categoryId || null,
      instructorId: validated.instructorId || null,
      price: new Prisma.Decimal(validated.price),
      discountPrice: validated.discountPrice != null ? new Prisma.Decimal(validated.discountPrice) : null,
      validityDays: validated.validityDays ?? null,
      minAttendancePct: validated.minAttendancePct ?? null,
      requireFullProgress: validated.requireFullProgress,
      certificateEnabled: validated.certificateEnabled,
      status: validated.status,
      featured: validated.featured,
    },
  });

  await db.auditLog.create({
    data: {
      actorId,
      action: "COURSE_CREATED",
      entityType: "Course",
      entityId: course.id,
      after: JSON.parse(JSON.stringify(course)),
      ip: ip || null,
    },
  });

  return {
    ...course,
    price: Number(course.price),
    discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
  };
}

export async function updateCourse(id: string, input: Partial<CourseInput>, actorId: string, ip?: string) {
  const existing = await db.course.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new Error("Course not found");
  }

  if (input.slug && input.slug !== existing.slug) {
    const slugInUse = await db.course.findFirst({
      where: { slug: input.slug, id: { not: id }, deletedAt: null },
    });
    if (slugInUse) {
      throw new Error(`A course with slug "${input.slug}" already exists.`);
    }
  }

  const updateData: Prisma.CourseUpdateInput = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl || null;
  if (input.categoryId !== undefined) {
    updateData.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
  }
  if (input.instructorId !== undefined) {
    updateData.instructor = input.instructorId ? { connect: { id: input.instructorId } } : { disconnect: true };
  }
  if (input.price !== undefined) updateData.price = new Prisma.Decimal(input.price);
  if (input.discountPrice !== undefined) {
    updateData.discountPrice = input.discountPrice != null ? new Prisma.Decimal(input.discountPrice) : null;
  }
  if (input.validityDays !== undefined) updateData.validityDays = input.validityDays;
  if (input.minAttendancePct !== undefined) updateData.minAttendancePct = input.minAttendancePct;
  if (input.requireFullProgress !== undefined) updateData.requireFullProgress = input.requireFullProgress;
  if (input.certificateEnabled !== undefined) updateData.certificateEnabled = input.certificateEnabled;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.featured !== undefined) updateData.featured = input.featured;

  const updated = await db.course.update({
    where: { id },
    data: updateData,
  });

  await db.auditLog.create({
    data: {
      actorId,
      action: "COURSE_UPDATED",
      entityType: "Course",
      entityId: id,
      before: JSON.parse(JSON.stringify(existing)),
      after: JSON.parse(JSON.stringify(updated)),
      ip: ip || null,
    },
  });

  return {
    ...updated,
    price: Number(updated.price),
    discountPrice: updated.discountPrice ? Number(updated.discountPrice) : null,
  };
}

export async function updateCourseStatus(id: string, status: CourseStatus, actorId: string, ip?: string) {
  const existing = await db.course.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new Error("Course not found");
  }

  const updated = await db.course.update({
    where: { id },
    data: { status },
  });

  await db.auditLog.create({
    data: {
      actorId,
      action: `COURSE_STATUS_${status}`,
      entityType: "Course",
      entityId: id,
      before: { status: existing.status },
      after: { status: updated.status },
      ip: ip || null,
    },
  });

  return {
    ...updated,
    price: Number(updated.price),
    discountPrice: updated.discountPrice ? Number(updated.discountPrice) : null,
  };
}

export async function deleteCourse(id: string, actorId: string, ip?: string) {
  const existing = await db.course.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: {
        select: {
          enrollments: true,
          orderItems: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Course not found");
  }

  // Soft delete to protect financial/enrollment history
  const updated = await db.course.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: CourseStatus.ARCHIVED,
    },
  });

  await db.auditLog.create({
    data: {
      actorId,
      action: "COURSE_DELETED",
      entityType: "Course",
      entityId: id,
      before: JSON.parse(JSON.stringify(existing)),
      after: { deletedAt: updated.deletedAt, status: updated.status },
      ip: ip || null,
    },
  });

  return { success: true };
}

export async function listCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function listInstructors() {
  return db.user.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "INSTRUCTOR"] },
      status: "ACTIVE",
      deletedAt: null,
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

export async function ensureDefaultCoursesInDb() {
  const count = await db.course.count({ where: { deletedAt: null } });
  if (count > 0) return { created: 0, existing: count };

  let category = await db.category.findFirst({ where: { slug: "school-mathematics" } });
  if (!category) {
    category = await db.category.create({
      data: { name: "School Mathematics", slug: "school-mathematics" },
    });
  }

  let competitiveCategory = await db.category.findFirst({ where: { slug: "competitive-mathematics" } });
  if (!competitiveCategory) {
    competitiveCategory = await db.category.create({
      data: { name: "Competitive Excellence", slug: "competitive-mathematics" },
    });
  }

  const defaultCourses = [
    {
      title: "Class 9 Maths & Science Tuition in Indirapuram",
      slug: "class-9-maths-science-tuition",
      description: "Comprehensive, concept-first coaching for Class 9 students in Indirapuram. Small batches ensure every student asks doubts openly, with regular testing and continuous progress reports for parents.",
      price: 1499.00,
      discountPrice: 1299.00,
      categoryId: category.id,
      status: CourseStatus.PUBLISHED,
      featured: true,
    },
    {
      title: "Class 10 Board Excellence Programme",
      slug: "class-10-board-excellence",
      description: "Rigorous CBSE & ICSE Class 10 board preparation in Indirapuram. Master NCERT exemplars, past 10-year board questions, and step-by-step answering techniques.",
      price: 1999.00,
      discountPrice: 1699.00,
      categoryId: category.id,
      status: CourseStatus.PUBLISHED,
      featured: true,
    },
    {
      title: "Class 11 Maths & Science Foundation & Boards",
      slug: "class-11-foundation-and-boards",
      description: "Bridging the critical Class 10 to 11 transition. Deep calculus, coordinate geometry, mechanics, and physical chemistry foundations.",
      price: 2499.00,
      discountPrice: 2199.00,
      categoryId: category.id,
      status: CourseStatus.PUBLISHED,
      featured: false,
    },
    {
      title: "Class 12 Board Excellence & Pre-Board Intensive",
      slug: "class-12-board-excellence",
      description: "Targeting 95%+ in Class 12 Boards. Full syllabus coverage, chapter test series, and dedicated answer presentation workshops.",
      price: 2999.00,
      discountPrice: 2599.00,
      categoryId: category.id,
      status: CourseStatus.PUBLISHED,
      featured: true,
    },
    {
      title: "IIT-JEE Mains & Advanced Mathematics Preparation",
      slug: "iit-jee-mains-preparation",
      description: "High-yield problem solving, deep conceptual insight, and diagnostic mock test series led by Ph.D. faculty.",
      price: 3999.00,
      discountPrice: 3499.00,
      categoryId: competitiveCategory.id,
      status: CourseStatus.PUBLISHED,
      featured: true,
    },
    {
      title: "Online Maths & Science Recorded Course",
      slug: "online-recorded-courses",
      description: "Learn Maths and Science online at your own pace with SmartNum's recorded modules, notes, and tests. Start with a free sample lesson.",
      price: 999.00,
      discountPrice: 799.00,
      categoryId: category.id,
      status: CourseStatus.PUBLISHED,
      featured: false,
    },
  ];

  let created = 0;
  for (const c of defaultCourses) {
    const exists = await db.course.findUnique({ where: { slug: c.slug } });
    if (!exists) {
      await db.course.create({
        data: {
          ...c,
          price: new Prisma.Decimal(c.price),
          discountPrice: c.discountPrice ? new Prisma.Decimal(c.discountPrice) : null,
          validityDays: 365,
          requireFullProgress: true,
          certificateEnabled: true,
        },
      });
      created++;
    }
  }

  return { created, existing: count };
}
