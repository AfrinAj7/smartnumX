import { db } from "@/lib/db";
import {
  AssignmentSource,
  AttemptStatus,
  EnrollmentStatus,
  Prisma,
  TestStatus,
} from "@prisma/client";

export interface StudentTestViewItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  durationMin: number;
  totalMarks: number;
  passMarks: number | null;
  isFreePreview: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
  questionsCount: number;
  hasAccess: boolean;
  accessType: "ENROLLED" | "DIRECT_ASSIGNMENT" | "FREE_PREVIEW" | "LOCKED";
  attemptStatus: "NOT_ATTEMPTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
  latestAttemptId: string | null;
  latestScore: number | null;
  bestScore: number | null;
  attemptsCount: number;
  maxAttempts: number;
  canAttempt: boolean;
  lockReason?: string;
}

export interface BulkAssignResult {
  successCount: number;
  failureCount: number;
  successful: Array<{ id: string; email: string; name: string }>;
  failed: Array<{ identifier: string; reason: string }>;
}

/**
 * Assigns a single test to a student directly (ADMIN_GRANT or FREE_PREVIEW).
 */
export async function assignTestToStudent(params: {
  testId: string;
  userId: string;
  source?: AssignmentSource;
  validUntil?: Date | string | null;
  actorId?: string;
  notes?: string;
}) {
  const { testId, userId, source = AssignmentSource.ADMIN_GRANT, validUntil, actorId, notes } = params;

  const test = await db.test.findFirst({
    where: { OR: [{ id: testId }, { code: testId }], deletedAt: null },
  });
  if (!test) {
    throw new Error("Test not found.");
  }

  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) {
    throw new Error("User not found.");
  }

  const parsedValidUntil = validUntil ? new Date(validUntil) : null;

  const assignment = await db.testAssignment.upsert({
    where: {
      testId_userId: {
        testId: test.id,
        userId: user.id,
      },
    },
    update: {
      source,
      validUntil: parsedValidUntil,
      grantedById: actorId || null,
    },
    create: {
      testId: test.id,
      userId: user.id,
      source,
      validUntil: parsedValidUntil,
      grantedById: actorId || null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      test: { select: { id: true, code: true, title: true } },
    },
  });

  if (actorId) {
    await db.auditLog.create({
      data: {
        actorId,
        action: "TEST_ASSIGNMENT_GRANTED",
        entityType: "TestAssignment",
        entityId: assignment.id,
        after: {
          testId: test.id,
          testCode: test.code,
          userId: user.id,
          userEmail: user.email,
          source,
          validUntil: parsedValidUntil,
          notes,
        },
      },
    });
  }

  return assignment;
}

/**
 * Bulk assigns a test to multiple students by emails or user IDs.
 */
export async function bulkAssignTest(params: {
  testId: string;
  identifiers: string[];
  source?: AssignmentSource;
  validUntil?: Date | string | null;
  actorId?: string;
  notes?: string;
}): Promise<BulkAssignResult> {
  const { testId, identifiers, source = AssignmentSource.ADMIN_GRANT, validUntil, actorId, notes } = params;

  const test = await db.test.findFirst({
    where: { OR: [{ id: testId }, { code: testId }], deletedAt: null },
  });
  if (!test) {
    throw new Error("Test not found.");
  }

  const cleanIdentifiers = Array.from(
    new Set(
      identifiers
        .map((i) => i.trim().toLowerCase())
        .filter((i) => i.length > 0)
    )
  );

  if (cleanIdentifiers.length === 0) {
    return { successCount: 0, failureCount: 0, successful: [], failed: [] };
  }

  // Lookup users by id or email
  const users = await db.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { id: { in: cleanIdentifiers } },
        { email: { in: cleanIdentifiers } },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  const userByEmail = new Map<string, (typeof users)[number]>();
  const userById = new Map<string, (typeof users)[number]>();
  for (const u of users) {
    userByEmail.set(u.email.toLowerCase(), u);
    userById.set(u.id, u);
  }

  const successful: Array<{ id: string; email: string; name: string }> = [];
  const failed: Array<{ identifier: string; reason: string }> = [];

  const parsedValidUntil = validUntil ? new Date(validUntil) : null;

  for (const identifier of cleanIdentifiers) {
    const user = userByEmail.get(identifier) || userById.get(identifier);
    if (!user) {
      failed.push({ identifier, reason: "No active user account found with this email or ID." });
      continue;
    }

    try {
      await db.testAssignment.upsert({
        where: {
          testId_userId: {
            testId: test.id,
            userId: user.id,
          },
        },
        update: {
          source,
          validUntil: parsedValidUntil,
          grantedById: actorId || null,
        },
        create: {
          testId: test.id,
          userId: user.id,
          source,
          validUntil: parsedValidUntil,
          grantedById: actorId || null,
        },
      });

      successful.push({ id: user.id, email: user.email, name: user.name || "Student" });
    } catch (err: unknown) {
      failed.push({
        identifier,
        reason: err instanceof Error ? err.message : "Failed to record assignment.",
      });
    }
  }

  if (actorId && successful.length > 0) {
    await db.auditLog.create({
      data: {
        actorId,
        action: "BULK_TEST_ASSIGNMENT_GRANTED",
        entityType: "Test",
        entityId: test.id,
        after: {
          testId: test.id,
          testCode: test.code,
          totalAssigned: successful.length,
          totalFailed: failed.length,
          notes,
        },
      },
    });
  }

  return {
    successCount: successful.length,
    failureCount: failed.length,
    successful,
    failed,
  };
}

/**
 * Revokes a student's direct test assignment.
 */
export async function revokeTestAssignment(params: {
  testId: string;
  userId: string;
  actorId?: string;
  reason?: string;
}) {
  const { testId, userId, actorId, reason } = params;

  const assignment = await db.testAssignment.findFirst({
    where: {
      test: { OR: [{ id: testId }, { code: testId }] },
      userId,
    },
  });

  if (!assignment) {
    throw new Error("No direct assignment found for this student and test.");
  }

  await db.testAssignment.delete({
    where: { id: assignment.id },
  });

  if (actorId) {
    await db.auditLog.create({
      data: {
        actorId,
        action: "TEST_ASSIGNMENT_REVOKED",
        entityType: "TestAssignment",
        entityId: assignment.id,
        after: {
          testId,
          userId,
          reason: reason || "Direct assignment revoked by administrator",
        },
      },
    });
  }

  return { success: true };
}

/**
 * Lists all direct assignments for a given test.
 */
export async function listTestAssignments(params: {
  testId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const test = await db.test.findFirst({
    where: { OR: [{ id: params.testId }, { code: params.testId }], deletedAt: null },
    select: { id: true, code: true, title: true },
  });

  if (!test) {
    throw new Error("Test not found.");
  }

  const where: Prisma.TestAssignmentWhereInput = {
    testId: test.id,
  };

  if (params.search) {
    where.user = {
      OR: [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
      ],
    };
  }

  const [total, assignments] = await Promise.all([
    db.testAssignment.count({ where }),
    db.testAssignment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  // Retrieve user attempt summary for each assigned student
  const userIds = assignments.map((a) => a.userId);
  const attempts = await db.attempt.findMany({
    where: {
      testId: test.id,
      userId: { in: userIds },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      userId: true,
      status: true,
      score: true,
      startedAt: true,
      submittedAt: true,
    },
  });

  const attemptsByUser = new Map<string, typeof attempts>();
  for (const att of attempts) {
    const list = attemptsByUser.get(att.userId) || [];
    list.push(att);
    attemptsByUser.set(att.userId, list);
  }

  const enrichedAssignments = assignments.map((a) => {
    const userAttempts = attemptsByUser.get(a.userId) || [];
    const submittedAttempts = userAttempts.filter(
      (att) => att.status === AttemptStatus.SUBMITTED || att.status === AttemptStatus.AUTO_SUBMITTED
    );
    const bestScore = submittedAttempts.length > 0
      ? Math.max(...submittedAttempts.map((att) => Number(att.score || 0)))
      : null;

    const latestAttempt = userAttempts[0] || null;

    return {
      id: a.id,
      testId: a.testId,
      userId: a.userId,
      user: a.user,
      source: a.source,
      validUntil: a.validUntil,
      createdAt: a.createdAt,
      attemptsCount: userAttempts.length,
      latestAttempt: latestAttempt
        ? {
            id: latestAttempt.id,
            status: latestAttempt.status,
            totalScore: latestAttempt.score ? Number(latestAttempt.score) : null,
            startedAt: latestAttempt.startedAt,
            submittedAt: latestAttempt.submittedAt,
          }
        : null,
      bestScore,
    };
  });

  return {
    test,
    assignments: enrichedAssignments,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Retrieves all published tests for a test series (course), enriched with the user's
 * access status, attempt history, and actionable buttons.
 */
export async function getTestSeriesTestsForStudent(
  seriesIdOrSlug: string,
  userId?: string,
  userRole?: string
): Promise<{
  course: {
    id: string;
    slug: string;
    title: string;
    productType: string;
    isEnrolled: boolean;
  };
  tests: StudentTestViewItem[];
}> {
  const course = await db.course.findFirst({
    where: {
      OR: [{ id: seriesIdOrSlug }, { slug: seriesIdOrSlug }],
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      productType: true,
    },
  });

  if (!course) {
    throw new Error("Test series not found.");
  }

  // 1. Check if user is enrolled
  let isEnrolled = false;
  if (userId) {
    if (userRole === "SUPER_ADMIN" || userRole === "INSTRUCTOR") {
      isEnrolled = true;
    } else {
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId,
          courseId: course.id,
          status: EnrollmentStatus.ACTIVE,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      isEnrolled = Boolean(enrollment);
    }
  }

  // 2. Fetch all published tests in this series
  const tests = await db.test.findMany({
    where: {
      seriesId: course.id,
      status: TestStatus.PUBLISHED,
      deletedAt: null,
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: { testQuestions: true },
      },
    },
  });

  // 3. If student is logged in, fetch direct assignments and attempts
  let directAssignmentsMap = new Set<string>();
  const attemptsMap = new Map<string, Array<{
    id: string;
    status: AttemptStatus;
    score: Prisma.Decimal | null;
    startedAt: Date;
    submittedAt: Date | null;
  }>>();

  if (userId) {
    const testIds = tests.map((t) => t.id);

    const [directAssignments, userAttempts] = await Promise.all([
      db.testAssignment.findMany({
        where: {
          userId,
          testId: { in: testIds },
          OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
        },
        select: { testId: true },
      }),
      db.attempt.findMany({
        where: {
          userId,
          testId: { in: testIds },
        },
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          testId: true,
          status: true,
          score: true,
          startedAt: true,
          submittedAt: true,
        },
      }),
    ]);

    directAssignmentsMap = new Set(directAssignments.map((a) => a.testId));

    for (const att of userAttempts) {
      const list = attemptsMap.get(att.testId) || [];
      list.push(att);
      attemptsMap.set(att.testId, list);
    }
  }

  const now = new Date();

  // 4. Transform tests into StudentTestViewItem
  const testItems: StudentTestViewItem[] = tests.map((t) => {
    const userAttempts = userId ? attemptsMap.get(t.id) || [] : [];
    const submittedAttempts = userAttempts.filter(
      (a) => a.status === AttemptStatus.SUBMITTED || a.status === AttemptStatus.AUTO_SUBMITTED
    );
    const activeAttempt = userAttempts.find((a) => a.status === AttemptStatus.IN_PROGRESS);

    // Determine access
    let hasAccess = false;
    let accessType: StudentTestViewItem["accessType"] = "LOCKED";
    let lockReason: string | undefined = "Enroll in this test series to unlock this mock paper.";

    if (userRole === "SUPER_ADMIN" || userRole === "INSTRUCTOR") {
      hasAccess = true;
      accessType = "ENROLLED";
      lockReason = undefined;
    } else if (isEnrolled) {
      hasAccess = true;
      accessType = "ENROLLED";
      lockReason = undefined;
    } else if (directAssignmentsMap.has(t.id)) {
      hasAccess = true;
      accessType = "DIRECT_ASSIGNMENT";
      lockReason = undefined;
    } else if (t.isFreePreview) {
      hasAccess = true;
      accessType = "FREE_PREVIEW";
      lockReason = undefined;
    }

    // Determine attempt status
    let attemptStatus: StudentTestViewItem["attemptStatus"] = "NOT_ATTEMPTED";
    let latestAttemptId: string | null = null;
    let latestScore: number | null = null;
    let bestScore: number | null = null;

    if (activeAttempt) {
      attemptStatus = "IN_PROGRESS";
      latestAttemptId = activeAttempt.id;
    } else if (submittedAttempts.length > 0) {
      const latest = submittedAttempts[0];
      attemptStatus = latest.status === AttemptStatus.AUTO_SUBMITTED ? "AUTO_SUBMITTED" : "SUBMITTED";
      latestAttemptId = latest.id;
      latestScore = latest.score ? Number(latest.score) : null;
      bestScore = Math.max(...submittedAttempts.map((a) => Number(a.score || 0)));
    }

    // Can attempt check
    let canAttempt = hasAccess;
    if (hasAccess) {
      if (t.opensAt && now < t.opensAt) {
        canAttempt = false;
        lockReason = `This test opens on ${t.opensAt.toLocaleDateString("en-IN")}.`;
      } else if (t.closesAt && now > t.closesAt) {
        canAttempt = false;
        lockReason = `This examination window closed on ${t.closesAt.toLocaleDateString("en-IN")}.`;
      } else if (t.maxAttempts > 0 && submittedAttempts.length >= t.maxAttempts && !activeAttempt) {
        canAttempt = false;
        lockReason = `Maximum attempts limit (${t.maxAttempts}) reached.`;
      }
    }

    return {
      id: t.id,
      code: t.code,
      title: t.title,
      description: t.description,
      type: t.type,
      durationMin: t.durationMin,
      totalMarks: Number(t.totalMarks),
      passMarks: t.passMarks ? Number(t.passMarks) : null,
      isFreePreview: t.isFreePreview,
      opensAt: t.opensAt,
      closesAt: t.closesAt,
      questionsCount: t._count.testQuestions,
      hasAccess,
      accessType,
      attemptStatus,
      latestAttemptId,
      latestScore,
      bestScore,
      attemptsCount: userAttempts.length,
      maxAttempts: t.maxAttempts,
      canAttempt,
      lockReason,
    };
  });

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      productType: course.productType,
      isEnrolled,
    },
    tests: testItems,
  };
}
