import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const sampleDate = new Date("2026-10-01T00:00:00.000Z");

function requiredAdminPassword() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Set SEED_ADMIN_PASSWORD to a value with at least 12 characters before seeding.");
  }
  return password;
}

async function ensureUser({ email, name, role, passwordHash = null, forcePasswordChange = false }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { email },
      data: {
        name,
        role,
        status: "ACTIVE",
        deletedAt: null,
        ...(passwordHash ? { passwordHash } : {}),
        emailVerified: existing.emailVerified ?? sampleDate,
        mustChangePassword: forcePasswordChange,
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name,
      role,
      status: "ACTIVE",
      emailVerified: sampleDate,
      passwordHash,
      mustChangePassword: forcePasswordChange,
    },
  });
}

async function ensureModule(courseId, title, position) {
  const courseModule = await prisma.module.findFirst({ where: { courseId, title } });
  return courseModule
    ? prisma.module.update({ where: { id: courseModule.id }, data: { position } })
    : prisma.module.create({ data: { courseId, title, position } });
}

async function ensureLesson(moduleId, title, position, body) {
  const lesson = await prisma.lesson.findFirst({ where: { moduleId, title } });
  const data = { moduleId, title, position, type: "TEXT", body, duration: 8 };
  return lesson
    ? prisma.lesson.update({ where: { id: lesson.id }, data })
    : prisma.lesson.create({ data });
}

async function ensureBatch(courseId, instructorId) {
  const existing = await prisma.batch.findFirst({
    where: { courseId, name: "Sample recorded-course cohort" },
  });
  if (existing) return existing;
  return prisma.batch.create({
    data: {
      courseId,
      name: "Sample recorded-course cohort",
      instructorId,
      startDate: sampleDate,
      endDate: new Date("2026-11-12T00:00:00.000Z"),
      capacity: 30,
      mode: "recorded",
      status: "scheduled",
    },
  });
}

async function main() {
  const adminPasswordHash = await hash(requiredAdminPassword(), 12);
  const superAdmin = await ensureUser({
    email: process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || "admin@example.com",
    name: "SmartNum Super Admin",
    role: "SUPER_ADMIN",
    passwordHash: adminPasswordHash,
    forcePasswordChange: true,
  });
  const samplePassword = process.env.SEED_SAMPLE_PASSWORD;
  const samplePasswordHash = samplePassword ? await hash(samplePassword, 12) : null;
  const instructor = await ensureUser({
    email: "instructor@example.com",
    name: "Sample Instructor",
    role: "INSTRUCTOR",
    passwordHash: samplePasswordHash,
  });
  const students = await Promise.all(
    Array.from({ length: 5 }, (_, index) => ensureUser({
      email: `student${index + 1}@example.com`,
      name: `Sample Student ${index + 1}`,
      role: "STUDENT",
      passwordHash: samplePasswordHash,
    })),
  );

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "school-mathematics" },
      update: { name: "School Mathematics" },
      create: { name: "School Mathematics", slug: "school-mathematics" },
    }),
    prisma.category.upsert({
      where: { slug: "competitive-foundations" },
      update: { name: "Competitive Foundations" },
      create: { name: "Competitive Foundations", slug: "competitive-foundations" },
    }),
  ]);

  const courseSpecs = [
    { title: "Algebra Essentials", slug: "sample-algebra-essentials", categoryId: categories[0].id, price: "1499.00" },
    { title: "Geometry Foundations", slug: "sample-geometry-foundations", categoryId: categories[0].id, price: "1799.00" },
    { title: "Problem-Solving Foundations", slug: "sample-problem-solving-foundations", categoryId: categories[1].id, price: "2199.00" },
  ];
  const courses = await Promise.all(courseSpecs.map((spec) => prisma.course.upsert({
    where: { slug: spec.slug },
    update: {
      title: spec.title,
      categoryId: spec.categoryId,
      instructorId: instructor.id,
      price: spec.price,
      status: "DRAFT",
    },
    create: {
      ...spec,
      description: "[SAMPLE CONTENT] Replace this draft description before publishing.",
      instructorId: instructor.id,
      status: "DRAFT",
    },
  })));

  for (const [courseIndex, course] of courses.entries()) {
    const courseModule = await ensureModule(course.id, "Sample introduction", 0);
    await ensureLesson(
      courseModule.id,
      "Getting started",
      0,
      `[SAMPLE CONTENT] Draft lesson ${courseIndex + 1}. Replace this content before publishing.`,
    );
  }

  const couponSpecs = [
    { code: "SAMPLE10", type: "PERCENT", value: "10.00" },
    { code: "SAMPLE250", type: "FLAT", value: "250.00" },
  ];
  for (const coupon of couponSpecs) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { type: coupon.type, value: coupon.value, validFrom: sampleDate },
      create: { ...coupon, validFrom: sampleDate, courseIds: [] },
    });
  }

  const batch = await ensureBatch(courses[0].id, instructor.id);
  for (const [index, student] of students.entries()) {
    const course = courses[0];
    const invoiceNo = `SAMPLE-${String(index + 1).padStart(4, "0")}`;
    const order = await prisma.order.upsert({
      where: { invoiceNo },
      update: {},
      create: {
        userId: student.id,
        subtotal: course.price,
        total: course.price,
        status: "PAID",
        gateway: "seed-sample",
        invoiceNo,
        items: { create: { courseId: course.id, price: course.price } },
      },
    });
    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
      update: { status: "ACTIVE", orderId: order.id, batchId: batch.id },
      create: {
        userId: student.id,
        courseId: course.id,
        orderId: order.id,
        batchId: batch.id,
        source: "MANUAL",
      },
    });
    const courseModule = await prisma.module.findFirst({ where: { courseId: course.id } });
    const lesson = courseModule
      ? await prisma.lesson.findFirst({ where: { moduleId: courseModule.id } })
      : null;
    if (lesson) {
      await prisma.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
        update: { lastPositionSec: 0 },
        create: { enrollmentId: enrollment.id, lessonId: lesson.id },
      });
    }
  }

  for (let index = 0; index < 6; index += 1) {
    const startsAt = new Date(sampleDate.getTime() + index * 24 * 60 * 60 * 1000);
    const title = `Sample session ${index + 1}`;
    const existing = await prisma.classSession.findFirst({ where: { batchId: batch.id, title } });
    const classSession = existing
      ? await prisma.classSession.update({ where: { id: existing.id }, data: { startsAt } })
      : await prisma.classSession.create({
          data: {
            batchId: batch.id,
            title,
            startsAt,
            endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
          },
        });
    for (const student of students) {
      await prisma.attendance.upsert({
        where: { sessionId_userId: { sessionId: classSession.id, userId: student.id } },
        update: {},
        create: {
          sessionId: classSession.id,
          userId: student.id,
          source: "MANUAL",
          status: "PRESENT",
          markedById: instructor.id,
        },
      });
    }
  }

  const announcements = [
    "[SAMPLE] Welcome to SmartNum",
    "[SAMPLE] Study plan update",
    "[SAMPLE] New practice material",
  ];
  for (const title of announcements) {
    const existing = await prisma.announcement.findFirst({
      where: { authorId: superAdmin.id, title },
    });
    if (!existing) {
      await prisma.announcement.create({
        data: {
          title,
          body: "[SAMPLE ANNOUNCEMENT] Replace this draft with approved course information.",
          authorId: superAdmin.id,
          status: "PUBLISHED",
          publishAt: sampleDate,
        },
      });
    }
  }

  const settingValue = { certificateAttendancePct: 75, lessonWatchThresholdPct: 80 };
  await prisma.setting.upsert({
    where: { key: "attendance.defaults" },
    update: { value: settingValue },
    create: { key: "attendance.defaults", value: settingValue },
  });

  console.info("Sample seed data is ready. Draft courses and sample content are not published.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });