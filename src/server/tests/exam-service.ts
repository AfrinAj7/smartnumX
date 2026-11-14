import { db } from "@/lib/db";
import { Prisma, type Test, AttemptAnswerState, AttemptStatus, EnrollmentStatus, ViolationType } from "@prisma/client";

export interface CheckAccessResult {
  hasAccess: boolean;
  reason?: string;
  test: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    seriesId: string | null;
    type: string;
    status: string;
    durationMin: number;
    totalMarks: number;
    passMarks: number | null;
    lateStartRule: string;
    graceSeconds: number;
    maxAttempts: number;
    isFreePreview: boolean;
    requireFullscreen: boolean;
    maxViolations: number;
    opensAt: Date | null;
    closesAt: Date | null;
    instructions: string | null;
  };
}

/**
 * Checks if a user has access to take a given test.
 */
export async function checkTestAccess(
  userId: string,
  userRole: string,
  testId: string,
): Promise<CheckAccessResult> {
  const test = await db.test.findFirst({
    where: {
      OR: [{ id: testId }, { code: testId }],
      deletedAt: null,
    },
  });

  if (!test) {
    throw new Error("Test not found.");
  }

  // Instructors and Super Admins always have access
  if (userRole === "SUPER_ADMIN" || userRole === "INSTRUCTOR") {
    return { hasAccess: true, test: sanitizeTestMeta(test) };
  }

  // Published status check for students
  if (test.status === "DRAFT") {
    return {
      hasAccess: false,
      reason: "This test is in draft status and not yet open for students.",
      test: sanitizeTestMeta(test),
    };
  }

  // Free preview tests are open to all logged-in students
  if (test.isFreePreview) {
    return { hasAccess: true, test: sanitizeTestMeta(test) };
  }

  // Check direct TestAssignment (ADMIN_GRANT or FREE_PREVIEW)
  const assignment = await db.testAssignment.findFirst({
    where: {
      testId: test.id,
      userId,
      OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
    },
  });
  if (assignment) {
    return { hasAccess: true, test: sanitizeTestMeta(test) };
  }

  // Check Course / Test Series Enrollment
  if (test.seriesId) {
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId,
        courseId: test.seriesId,
        status: EnrollmentStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (enrollment) {
      return { hasAccess: true, test: sanitizeTestMeta(test) };
    }
  }

  return {
    hasAccess: false,
    reason: "You are not enrolled in the test series for this mock test.",
    test: sanitizeTestMeta(test),
  };
}

function sanitizeTestMeta(test: Test) {
  return {
    id: test.id,
    code: test.code,
    title: test.title,
    description: test.description,
    seriesId: test.seriesId,
    type: test.type,
    status: test.status,
    durationMin: test.durationMin,
    totalMarks: Number(test.totalMarks),
    passMarks: test.passMarks ? Number(test.passMarks) : null,
    lateStartRule: test.lateStartRule,
    graceSeconds: test.graceSeconds,
    maxAttempts: test.maxAttempts,
    isFreePreview: test.isFreePreview,
    requireFullscreen: test.requireFullscreen,
    maxViolations: test.maxViolations,
    opensAt: test.opensAt,
    closesAt: test.closesAt,
    instructions: test.instructions,
  };
}

/**
 * Starts a new attempt or resumes an active in-progress attempt.
 */
export async function startOrResumeAttempt(userId: string, userRole: string, testId: string) {
  const { hasAccess, reason, test } = await checkTestAccess(userId, userRole, testId);
  if (!hasAccess) {
    throw new Error(reason || "Access denied to this test.");
  }

  const now = new Date();

  // Check window timings
  if (test.opensAt && now < test.opensAt) {
    throw new Error(`This test opens on ${test.opensAt.toLocaleString("en-IN")}.`);
  }
  if (test.closesAt && now >= test.closesAt) {
    throw new Error(`The examination window for this test closed on ${test.closesAt.toLocaleString("en-IN")}.`);
  }

  // 1. Check for active in-progress attempt
  const activeAttempt = await db.attempt.findFirst({
    where: {
      userId,
      testId: test.id,
      status: AttemptStatus.IN_PROGRESS,
    },
    include: {
      test: true,
    },
  });

  if (activeAttempt) {
    const graceMs = test.graceSeconds * 1000;
    const isExpired = now.getTime() > activeAttempt.deadlineAt.getTime() + graceMs;

    if (isExpired) {
      // Auto-submit expired attempt
      await db.attempt.update({
        where: { id: activeAttempt.id },
        data: {
          status: AttemptStatus.AUTO_SUBMITTED,
          submittedAt: activeAttempt.deadlineAt,
        },
      });
    } else {
      // Resume valid active attempt
      return {
        attemptId: activeAttempt.id,
        isResume: true,
        deadlineAt: activeAttempt.deadlineAt,
        testId: test.id,
      };
    }
  }

  // 2. Check maximum attempts limit
  const pastAttemptsCount = await db.attempt.count({
    where: {
      userId,
      testId: test.id,
      status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
    },
  });

  if (test.maxAttempts > 0 && pastAttemptsCount >= test.maxAttempts && userRole === "STUDENT") {
    throw new Error(`You have reached the maximum allowed attempts (${test.maxAttempts}) for this test.`);
  }

  // 3. Compute server-authoritative deadline
  const nominalDeadline = new Date(now.getTime() + test.durationMin * 60 * 1000);
  let deadlineAt = nominalDeadline;

  if (test.closesAt) {
    if (test.lateStartRule === "REDUCE_TIME") {
      deadlineAt = new Date(Math.min(nominalDeadline.getTime(), test.closesAt.getTime()));
    } else {
      deadlineAt = nominalDeadline;
    }
  }

  // 4. Fetch all questions in this test to initialize attempt
  const testSections = await db.testSection.findMany({
    where: { testId: test.id },
    orderBy: { order: "asc" },
  });

  const testQuestions = await db.testQuestion.findMany({
    where: { testId: test.id },
    select: { questionId: true, sectionId: true },
  });

  if (testQuestions.length === 0) {
    throw new Error("This test does not have any questions assigned yet.");
  }

  // 5. Create new attempt in transaction
  const attempt = await db.$transaction(async (tx) => {
    const newAttempt = await tx.attempt.create({
      data: {
        testId: test.id,
        userId,
        attemptNo: pastAttemptsCount + 1,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: now,
        deadlineAt,
        seed: Math.floor(Math.random() * 100000) + 1,
        unattemptedCount: testQuestions.length,
      },
    });

    // Initialize section states
    if (testSections.length > 0) {
      await tx.attemptSection.createMany({
        data: testSections.map((sec) => ({
          attemptId: newAttempt.id,
          sectionId: sec.id,
          startedAt: now,
          timeSpentSec: 0,
        })),
      });
    }

    // Initialize answer records for CBT question palette
    await tx.attemptAnswer.createMany({
      data: testQuestions.map((tq) => ({
        attemptId: newAttempt.id,
        questionId: tq.questionId,
        state: AttemptAnswerState.NOT_VISITED,
        timeSpentSec: 0,
      })),
    });

    return newAttempt;
  });

  return {
    attemptId: attempt.id,
    isResume: false,
    deadlineAt: attempt.deadlineAt,
    testId: test.id,
  };
}

/**
 * Returns the active exam bundle: questions (SANITIZED OF ANSWER KEYS),
 * sections, student's saved answers, and remaining countdown seconds.
 */
export async function getAttemptExamBundle(userId: string, attemptId: string) {
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              testQuestions: {
                orderBy: { order: "asc" },
                include: {
                  question: {
                    select: {
                      id: true,
                      code: true,
                      type: true,
                      subject: true,
                      chapter: true,
                      stem: true,
                      stemImage: true,
                      options: true,
                      // CRITICAL: Omit correct, explanation, solutionImage!
                    },
                  },
                },
              },
            },
          },
          testQuestions: {
            where: { sectionId: null },
            orderBy: { order: "asc" },
            include: {
              question: {
                select: {
                  id: true,
                  code: true,
                  type: true,
                  subject: true,
                  chapter: true,
                  stem: true,
                  stemImage: true,
                  options: true,
                },
              },
            },
          },
        },
      },
      answers: true,
      sectionStates: true,
    },
  });

  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  const now = new Date();
  const graceMs = attempt.test.graceSeconds * 1000;
  const remainingSec = Math.max(0, Math.floor((attempt.deadlineAt.getTime() - now.getTime()) / 1000));

  // If time has completely expired including grace period, mark as auto-submitted
  if (attempt.status === AttemptStatus.IN_PROGRESS && now.getTime() > attempt.deadlineAt.getTime() + graceMs) {
    await db.attempt.update({
      where: { id: attempt.id },
      data: {
        status: AttemptStatus.AUTO_SUBMITTED,
        submittedAt: attempt.deadlineAt,
      },
    });
    attempt.status = AttemptStatus.AUTO_SUBMITTED;
  }

  // Build answer lookup map
  const answersMap: Record<
    string,
    { response: Prisma.JsonValue; state: AttemptAnswerState; timeSpentSec: number }
  > = {};
  attempt.answers.forEach((ans) => {
    answersMap[ans.questionId] = {
      response: ans.response,
      state: ans.state,
      timeSpentSec: ans.timeSpentSec,
    };
  });

  // Organize sections and questions
  const sections = attempt.test.sections.map((sec) => ({
    id: sec.id,
    name: sec.name,
    order: sec.order,
    durationMin: sec.durationMin,
    maxToAttempt: sec.maxToAttempt,
    questions: sec.testQuestions.map((tq) => ({
      id: tq.question.id,
      code: tq.question.code,
      type: tq.question.type,
      subject: tq.question.subject,
      chapter: tq.question.chapter,
      stem: tq.question.stem,
      stemImage: tq.question.stemImage,
      options: tq.question.options,
      marks: Number(tq.marks),
      negMarks: Number(tq.negMarks),
      order: tq.order,
      sectionId: sec.id,
    })),
  }));

  // Handle unsectioned questions if any exist
  const unsectionedQuestions = attempt.test.testQuestions.map((tq) => ({
    id: tq.question.id,
    code: tq.question.code,
    type: tq.question.type,
    subject: tq.question.subject,
    chapter: tq.question.chapter,
    stem: tq.question.stem,
    stemImage: tq.question.stemImage,
    options: tq.question.options,
    marks: Number(tq.marks),
    negMarks: Number(tq.negMarks),
    order: tq.order,
    sectionId: null,
  }));

  return {
    attemptId: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    deadlineAt: attempt.deadlineAt,
    remainingSec,
    violationsCount: attempt.violationsCount,
    test: {
      id: attempt.test.id,
      code: attempt.test.code,
      title: attempt.test.title,
      durationMin: attempt.test.durationMin,
      totalMarks: Number(attempt.test.totalMarks),
      requireFullscreen: attempt.test.requireFullscreen,
      maxViolations: attempt.test.maxViolations,
      instructions: attempt.test.instructions,
    },
    sections:
      sections.length > 0
        ? sections
        : [
            {
              id: "default",
              name: "General Section",
              order: 1,
              durationMin: null,
              maxToAttempt: null,
              questions: unsectionedQuestions,
            },
          ],
    answersMap,
  };
}

/**
 * Saves or updates a student's answer response in the database.
 */
export async function saveStudentAnswer(
  userId: string,
  attemptId: string,
  input: {
    questionId: string;
    response: Prisma.InputJsonValue;
    state: AttemptAnswerState;
    timeSpentSec?: number;
  },
) {
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, userId },
    include: { test: { select: { graceSeconds: true } } },
  });

  if (!attempt) throw new Error("Attempt not found.");

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error("This attempt is no longer active.");
  }

  const now = new Date();
  const graceMs = attempt.test.graceSeconds * 1000;
  if (now.getTime() > attempt.deadlineAt.getTime() + graceMs) {
    await db.attempt.update({
      where: { id: attempt.id },
      data: { status: AttemptStatus.AUTO_SUBMITTED, submittedAt: attempt.deadlineAt },
    });
    throw new Error("EXAM_TIME_EXPIRED");
  }

  // Update or insert AttemptAnswer
  await db.attemptAnswer.upsert({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId: input.questionId,
      },
    },
    update: {
      response: input.response !== undefined ? input.response : undefined,
      state: input.state,
      timeSpentSec: input.timeSpentSec ? { increment: input.timeSpentSec } : undefined,
      answeredAt: now,
    },
    create: {
      attemptId,
      questionId: input.questionId,
      response: input.response,
      state: input.state,
      timeSpentSec: input.timeSpentSec || 0,
      answeredAt: now,
    },
  });

  return { ok: true };
}

/**
 * Records integrity violations (tab switch, fullscreen exit).
 */
export async function logViolation(
  userId: string,
  attemptId: string,
  type: ViolationType,
  details?: string,
) {
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, userId },
    include: { test: true },
  });

  if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) {
    return { ok: false };
  }

  await db.attemptViolation.create({
    data: {
      attemptId,
      type,
      details,
    },
  });

  const updated = await db.attempt.update({
    where: { id: attemptId },
    data: { violationsCount: { increment: 1 } },
  });

  // Check violation limit
  if (attempt.test.maxViolations > 0 && updated.violationsCount >= attempt.test.maxViolations) {
    await db.attempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.AUTO_SUBMITTED,
        submittedAt: new Date(),
      },
    });
    return { autoSubmitted: true, violationsCount: updated.violationsCount };
  }

  return { autoSubmitted: false, violationsCount: updated.violationsCount };
}

/**
 * Finalizes and submits the attempt.
 */
export async function submitExamAttempt(userId: string, attemptId: string) {
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      test: {
        include: {
          testQuestions: { select: { questionId: true } },
        },
      },
    },
  });

  if (!attempt) throw new Error("Attempt not found.");

  if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.AUTO_SUBMITTED) {
    return { ok: true, alreadySubmitted: true, attemptId };
  }

  const now = new Date();

  // Mark attempt submitted
  await db.attempt.update({
    where: { id: attemptId },
    data: {
      status: AttemptStatus.SUBMITTED,
      submittedAt: now,
    },
  });

  // Immutability: Lock all questions used in this submitted test
  const questionIds = attempt.test.testQuestions.map((tq) => tq.questionId);
  if (questionIds.length > 0) {
    await db.question.updateMany({
      where: { id: { in: questionIds }, isLocked: false },
      data: { isLocked: true },
    });
  }

  // Automatic evaluation and scoring of student answers
  try {
    const { scoreAttempt } = await import("./scoring-service");
    await scoreAttempt(attemptId);
  } catch (err) {
    console.error("Error during attempt scoring evaluation:", err);
  }

  return { ok: true, attemptId, submittedAt: now };
}

