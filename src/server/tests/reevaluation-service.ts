import { db } from "@/lib/db";
import { AttemptStatus, QuestionType, Prisma } from "@prisma/client";
import { calculateTestRanksAndPercentiles, scoreQuestionResponse } from "./scoring-service";

export type ReevaluateAction =
  | "KEY_CHANGE"
  | "ACCEPT_MULTIPLE"
  | "BONUS_MARKS_ALL"
  | "DROP_QUESTION";

export interface ReevaluateInput {
  testId: string;
  actorId: string;
  questionId: string;
  action: ReevaluateAction;
  newCorrect?: unknown; // string or array for KEY_CHANGE / ACCEPT_MULTIPLE
  reason: string;
}

export interface ReevaluateResult {
  ok: boolean;
  testId: string;
  questionId: string;
  action: ReevaluateAction;
  attemptsReevaluated: number;
  scoreIncreasedCount: number;
  scoreDecreasedCount: number;
  scoreUnchangedCount: number;
  avgScoreDelta: number;
}

/**
 * Executes a server-side re-evaluation of all submitted attempts for a test
 * when an answer key is amended, multiple options are accepted, bonus marks
 * are awarded, or a faulty question is dropped.
 */
export async function reevaluateTest(input: ReevaluateInput): Promise<ReevaluateResult> {
  const { testId, actorId, questionId, action, newCorrect, reason } = input;

  if (!reason || reason.trim().length < 5) {
    throw new Error("A valid reason (minimum 5 characters) is required for re-evaluation audit logs.");
  }

  // 1. Fetch test and verify question exists in this test
  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      sections: {
        include: {
          testQuestions: {
            where: { questionId },
            include: { question: true },
          },
        },
      },
      testQuestions: {
        where: { questionId },
        include: { question: true },
      },
    },
  });

  if (!test) throw new Error("Test not found.");

  // Locate the target test question item
  const sectionTQ = test.sections.flatMap((s) => s.testQuestions)[0];
  const directTQ = test.testQuestions[0];
  const targetTQ = sectionTQ || directTQ;

  if (!targetTQ) {
    throw new Error("Target question is not part of this test.");
  }

  const oldQuestion = targetTQ.question;
  const questionMarks = Number(targetTQ.marks);
  const questionNegMarks = Number(targetTQ.negMarks);

  // 2. Prepare new answer key representation & update Question record if key change
  let updatedCorrect = oldQuestion.correct;
  if (action === "KEY_CHANGE") {
    if (!newCorrect) throw new Error("New correct answer is required for KEY_CHANGE.");
    updatedCorrect = newCorrect;
    await db.question.update({
      where: { id: questionId },
      data: { correct: newCorrect as Prisma.InputJsonValue },
    });
  } else if (action === "ACCEPT_MULTIPLE") {
    if (!newCorrect) throw new Error("Accepted options list is required for ACCEPT_MULTIPLE.");
    let mergedList: string[] = [];
    if (Array.isArray(newCorrect)) {
      mergedList = newCorrect.map(String);
    } else if (typeof newCorrect === "string") {
      mergedList = newCorrect.split(",").map((s) => s.trim().toUpperCase());
    }
    updatedCorrect = mergedList;
    await db.question.update({
      where: { id: questionId },
      data: { correct: mergedList as Prisma.InputJsonValue },
    });
  }

  // 3. Fetch all completed attempts that need re-evaluation
  const attempts = await db.attempt.findMany({
    where: {
      testId,
      status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
    },
    include: {
      answers: {
        where: { questionId },
      },
    },
    orderBy: { startedAt: "asc" },
  });

  let scoreIncreasedCount = 0;
  let scoreDecreasedCount = 0;
  let scoreUnchangedCount = 0;
  let totalDeltaSum = 0;

  // 4. Process in chunks of 50 to avoid connection timeouts or excessive memory on shared hosting
  const CHUNK_SIZE = 50;
  for (let i = 0; i < attempts.length; i += CHUNK_SIZE) {
    const chunk = attempts.slice(i, i + CHUNK_SIZE);

    await db.$transaction(async (tx) => {
      for (const att of chunk) {
        const studentAns = att.answers[0];
        const oldScore = Number(att.score ?? 0);
        const prevMarksAwarded = studentAns?.marksAwarded ? Number(studentAns.marksAwarded) : 0;
        const prevIsCorrect = studentAns?.isCorrect ?? false;

        let newMarksAwarded = 0;
        let newIsCorrect = false;

        if (action === "BONUS_MARKS_ALL") {
          // Award full positive marks to all students
          newMarksAwarded = questionMarks;
          newIsCorrect = true;
        } else if (action === "DROP_QUESTION") {
          // Dropped question: 0 marks awarded, no penalties
          newMarksAwarded = 0;
          newIsCorrect = false;
        } else if (action === "KEY_CHANGE" || action === "ACCEPT_MULTIPLE") {
          const resp = studentAns?.response ?? null;
          let tol: number | null = null;
          if (
            typeof updatedCorrect === "object" &&
            updatedCorrect !== null &&
            "min" in updatedCorrect &&
            "max" in updatedCorrect
          ) {
            tol =
              Math.abs(
                Number((updatedCorrect as { max: unknown }).max) -
                  Number((updatedCorrect as { min: unknown }).min)
              ) / 2;
          }

          // If ACCEPT_MULTIPLE for single-choice: student answer matches ANY in accepted list
          if (action === "ACCEPT_MULTIPLE" && oldQuestion.type === QuestionType.MCQ_SINGLE) {
            const acceptedSet = new Set(
              Array.isArray(updatedCorrect)
                ? (updatedCorrect as string[]).map((x) => String(x).trim().toUpperCase())
                : [String(updatedCorrect).trim().toUpperCase()]
            );
            const studentChoice = resp ? String(resp).trim().toUpperCase() : null;

            if (!studentChoice) {
              newMarksAwarded = 0;
              newIsCorrect = false;
            } else if (acceptedSet.has(studentChoice)) {
              newMarksAwarded = questionMarks;
              newIsCorrect = true;
            } else {
              newMarksAwarded = -Math.abs(questionNegMarks);
              newIsCorrect = false;
            }
          } else {
            const res = scoreQuestionResponse({
              type: oldQuestion.type,
              correct: updatedCorrect,
              tolerance: tol,
              marks: questionMarks,
              negMarks: questionNegMarks,
              partialMarking: targetTQ.partialMarking,
              response: resp,
            });

            newMarksAwarded = res.marksAwarded;
            newIsCorrect = res.isCorrect;
          }
        }

        // Calculate score delta
        const scoreDelta = newMarksAwarded - prevMarksAwarded;
        const newTotalScore = oldScore + scoreDelta;

        // Recalculate counts
        let newCorrectCount = att.correctCount;
        let newIncorrectCount = att.incorrectCount;
        let newUnattemptedCount = att.unattemptedCount;

        if (prevIsCorrect !== newIsCorrect) {
          if (newIsCorrect) {
            newCorrectCount++;
            if (prevMarksAwarded < 0) newIncorrectCount = Math.max(0, newIncorrectCount - 1);
            else if (prevMarksAwarded === 0 && studentAns?.response) {
              newIncorrectCount = Math.max(0, newIncorrectCount - 1);
            }
          } else {
            newCorrectCount = Math.max(0, newCorrectCount - 1);
            if (newMarksAwarded < 0) newIncorrectCount++;
          }
        }

        if (action === "DROP_QUESTION") {
          // If dropped, question does not count towards correct or incorrect
          if (prevIsCorrect) newCorrectCount = Math.max(0, newCorrectCount - 1);
          if (prevMarksAwarded < 0) newIncorrectCount = Math.max(0, newIncorrectCount - 1);
          newUnattemptedCount++;
        }

        // Update answer record
        if (studentAns) {
          await tx.attemptAnswer.update({
            where: { id: studentAns.id },
            data: {
              isCorrect: newIsCorrect,
              marksAwarded: newMarksAwarded,
            },
          });
        }

        // Update attempt totals
        await tx.attempt.update({
          where: { id: att.id },
          data: {
            score: newTotalScore,
            correctCount: newCorrectCount,
            incorrectCount: newIncorrectCount,
            unattemptedCount: newUnattemptedCount,
          },
        });

        // Track stats
        if (scoreDelta > 0) scoreIncreasedCount++;
        else if (scoreDelta < 0) scoreDecreasedCount++;
        else scoreUnchangedCount++;
        totalDeltaSum += scoreDelta;
      }
    });
  }

  // 5. If question was DROPPED, update Test total marks
  if (action === "DROP_QUESTION") {
    const newTotalMarks = Math.max(0, Number(test.totalMarks) - questionMarks);
    await db.test.update({
      where: { id: testId },
      data: { totalMarks: newTotalMarks },
    });
  }

  // 6. Recalculate test competitive ranks & percentiles across all attempts
  await calculateTestRanksAndPercentiles(testId);

  // 7. Record detailed audit log entry
  await db.auditLog.create({
    data: {
      actorId,
      action: "TEST_REEVALUATE",
      entityType: "Test",
      entityId: testId,
      before: {
        questionId,
        action,
        oldCorrect: oldQuestion.correct,
      },
      after: {
        action,
        newCorrect: updatedCorrect,
        reason,
        attemptsCount: attempts.length,
        scoreIncreasedCount,
        scoreDecreasedCount,
      },
    },
  });

  const avgScoreDelta =
    attempts.length > 0 ? Number((totalDeltaSum / attempts.length).toFixed(2)) : 0;

  return {
    ok: true,
    testId,
    questionId,
    action,
    attemptsReevaluated: attempts.length,
    scoreIncreasedCount,
    scoreDecreasedCount,
    scoreUnchangedCount,
    avgScoreDelta,
  };
}

/**
 * Resets or reopens a student's attempt to allow fresh test completion
 * or add extra compensatory time in case of technical issues.
 */
export async function resetStudentAttempt(input: {
  attemptId: string;
  actorId: string;
  action: "ALLOW_REATTEMPT" | "REOPEN_IN_PROGRESS" | "ADD_TIME";
  extraMinutes?: number;
  reason: string;
}) {
  const { attemptId, actorId, action, extraMinutes, reason } = input;

  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      test: { select: { id: true, title: true, durationMin: true } },
    },
  });

  if (!attempt) throw new Error("Attempt not found.");

  const now = new Date();

  if (action === "ALLOW_REATTEMPT") {
    // Delete attempt answers and remove attempt so student can start cleanly
    await db.$transaction([
      db.attemptAnswer.deleteMany({ where: { attemptId } }),
      db.attemptSection.deleteMany({ where: { attemptId } }),
      db.attemptViolation.deleteMany({ where: { attemptId } }),
      db.attempt.delete({ where: { id: attemptId } }),
    ]);

    // Recalculate ranks for remaining attempts
    await calculateTestRanksAndPercentiles(attempt.testId);

    // Audit log
    await db.auditLog.create({
      data: {
        actorId,
        action: "ATTEMPT_RESET_REATTEMPT",
        entityType: "Attempt",
        entityId: attemptId,
        before: { studentEmail: attempt.user.email, score: Number(attempt.score) },
        after: { action: "ALLOW_REATTEMPT", reason },
      },
    });

    return { ok: true, message: "Attempt cleared. Student can now re-attempt the test." };
  }

  if (action === "REOPEN_IN_PROGRESS") {
    const addMinutes = Number(extraMinutes) || 15;
    const newDeadline = new Date(now.getTime() + addMinutes * 60 * 1000);

    await db.attempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.IN_PROGRESS,
        submittedAt: null,
        deadlineAt: newDeadline,
        extraTimeMin: { increment: addMinutes },
      },
    });

    await db.auditLog.create({
      data: {
        actorId,
        action: "ATTEMPT_REOPEN",
        entityType: "Attempt",
        entityId: attemptId,
        before: { status: attempt.status, deadlineAt: attempt.deadlineAt },
        after: { status: AttemptStatus.IN_PROGRESS, newDeadline, addMinutes, reason },
      },
    });

    return {
      ok: true,
      message: `Attempt reopened in-progress. Added ${addMinutes} compensatory minutes.`,
    };
  }

  if (action === "ADD_TIME") {
    const addMinutes = Number(extraMinutes) || 10;
    const currentDeadline = attempt.deadlineAt > now ? attempt.deadlineAt : now;
    const newDeadline = new Date(currentDeadline.getTime() + addMinutes * 60 * 1000);

    await db.attempt.update({
      where: { id: attemptId },
      data: {
        deadlineAt: newDeadline,
        extraTimeMin: { increment: addMinutes },
      },
    });

    await db.auditLog.create({
      data: {
        actorId,
        action: "ATTEMPT_ADD_TIME",
        entityType: "Attempt",
        entityId: attemptId,
        before: { deadlineAt: attempt.deadlineAt },
        after: { newDeadline, addMinutes, reason },
      },
    });

    return { ok: true, message: `Added ${addMinutes} minutes to student attempt.` };
  }

  throw new Error("Invalid reset action.");
}

/**
 * Lists paginated student attempts for a test with detailed integrity records.
 */
export async function listTestAttempts(input: {
  testId: string;
  page?: number;
  pageSize?: number;
  status?: string;
  violationsOnly?: boolean;
  search?: string;
}) {
  const { testId, page = 1, pageSize = 20, status, violationsOnly, search } = input;
  const skip = (page - 1) * pageSize;

  const whereClause: Prisma.AttemptWhereInput = {
    testId,
    ...(status && status !== "ALL" ? { status: status as AttemptStatus } : {}),
    ...(violationsOnly ? { violationsCount: { gt: 0 } } : {}),
    ...(search
      ? {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [attempts, total] = await Promise.all([
    db.attempt.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        violations: {
          orderBy: { timestamp: "desc" },
        },
      },
      orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
      skip,
      take: pageSize,
    }),
    db.attempt.count({ where: whereClause }),
  ]);

  return {
    attempts: attempts.map((a) => ({
      id: a.id,
      userId: a.userId,
      user: a.user,
      attemptNo: a.attemptNo,
      status: a.status,
      startedAt: a.startedAt,
      deadlineAt: a.deadlineAt,
      submittedAt: a.submittedAt,
      score: a.score !== null ? Number(a.score) : null,
      totalMarks: a.totalMarks !== null ? Number(a.totalMarks) : null,
      rank: a.rank,
      percentile: a.percentile !== null ? Number(a.percentile) : null,
      correctCount: a.correctCount,
      incorrectCount: a.incorrectCount,
      unattemptedCount: a.unattemptedCount,
      violationsCount: a.violationsCount || a.violations.length,
      violations: a.violations,
      extraTimeMin: a.extraTimeMin,
    })),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
