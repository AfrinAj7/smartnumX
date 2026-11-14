import { db } from "@/lib/db";
import { AttemptStatus, QuestionType, ResultMode, SolutionMode, Prisma, type Question } from "@prisma/client";

export interface QuestionScoringInput {
  type: QuestionType;
  correct: unknown;
  tolerance: number | null;
  marks: number;
  negMarks: number;
  partialMarking: boolean;
  response: unknown;
}

export interface QuestionScoringResult {
  isAttempted: boolean;
  isCorrect: boolean;
  isPartial: boolean;
  marksAwarded: number;
}

/**
 * Pure, deterministic scoring function for individual question responses.
 */
export function scoreQuestionResponse(input: QuestionScoringInput): QuestionScoringResult {
  const { type, correct, tolerance, marks, negMarks, partialMarking, response } = input;

  // 1. Check for unattempted / blank response
  const isBlank =
    response === null ||
    response === undefined ||
    response === "" ||
    (Array.isArray(response) && response.length === 0);

  if (isBlank) {
    return {
      isAttempted: false,
      isCorrect: false,
      isPartial: false,
      marksAwarded: 0,
    };
  }

  // 2. Score according to Question Type
  switch (type) {
    case QuestionType.MCQ_SINGLE: {
      const studentStr = String(response).trim().toUpperCase();
      const correctStr = String(correct).trim().toUpperCase();
      const match = studentStr === correctStr;

      return {
        isAttempted: true,
        isCorrect: match,
        isPartial: false,
        marksAwarded: match ? marks : -Math.abs(negMarks),
      };
    }

    case QuestionType.MCQ_MULTI: {
      // Normalize correct answers array (e.g. ["A", "C"] or "A,C")
      let correctList: string[] = [];
      if (Array.isArray(correct)) {
        correctList = correct.map((x) => String(x).trim().toUpperCase());
      } else if (typeof correct === "string") {
        correctList = correct.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);
      }

      // Normalize student selected options array
      let studentList: string[] = [];
      if (Array.isArray(response)) {
        studentList = response.map((x) => String(x).trim().toUpperCase());
      } else if (typeof response === "string") {
        studentList = response.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);
      }

      const correctSet = new Set(correctList);
      const studentSet = new Set(studentList);

      const correctSelected = studentList.filter((opt) => correctSet.has(opt));
      const wrongSelected = studentList.filter((opt) => !correctSet.has(opt));

      // Any wrong option chosen triggers negative marks
      if (wrongSelected.length > 0) {
        return {
          isAttempted: true,
          isCorrect: false,
          isPartial: false,
          marksAwarded: -Math.abs(negMarks),
        };
      }

      // Exactly all correct options chosen
      if (correctSelected.length === correctSet.size && studentSet.size === correctSet.size) {
        return {
          isAttempted: true,
          isCorrect: true,
          isPartial: false,
          marksAwarded: marks,
        };
      }

      // Partial subset of correct options chosen with partial marking enabled
      if (correctSelected.length > 0 && partialMarking && correctSet.size > 0) {
        const fractionalMarks = Number(((marks * correctSelected.length) / correctSet.size).toFixed(2));
        return {
          isAttempted: true,
          isCorrect: false,
          isPartial: true,
          marksAwarded: fractionalMarks,
        };
      }

      // Incomplete answer without partial marking
      return {
        isAttempted: true,
        isCorrect: false,
        isPartial: false,
        marksAwarded: 0,
      };
    }

    case QuestionType.NUMERIC: {
      const studentNum = parseFloat(String(response).trim());
      if (isNaN(studentNum)) {
        return {
          isAttempted: true,
          isCorrect: false,
          isPartial: false,
          marksAwarded: -Math.abs(negMarks),
        };
      }

      let isWithinTolerance = false;
      if (typeof correct === "object" && correct !== null) {
        if ("min" in correct && "max" in correct) {
          isWithinTolerance =
            studentNum >= Number(correct.min) - 0.00001 &&
            studentNum <= Number(correct.max) + 0.00001;
        } else if ("answer" in correct) {
          const correctNum = parseFloat(String(correct.answer));
          const tol = tolerance !== null && tolerance !== undefined ? Math.abs(Number(tolerance)) : 0.01;
          isWithinTolerance = !isNaN(correctNum) && Math.abs(studentNum - correctNum) <= tol + 0.00001;
        }
      } else {
        const correctNum = parseFloat(String(correct).trim());
        const tol = tolerance !== null && tolerance !== undefined ? Math.abs(Number(tolerance)) : 0;
        isWithinTolerance = !isNaN(correctNum) && Math.abs(studentNum - correctNum) <= tol + 0.00001;
      }

      return {
        isAttempted: true,
        isCorrect: isWithinTolerance,
        isPartial: false,
        marksAwarded: isWithinTolerance ? marks : -Math.abs(negMarks),
      };
    }

    case QuestionType.TRUE_FALSE: {
      const studentBool = String(response).trim().toUpperCase();
      const correctBool = String(correct).trim().toUpperCase();
      const match = studentBool === correctBool;

      return {
        isAttempted: true,
        isCorrect: match,
        isPartial: false,
        marksAwarded: match ? marks : -Math.abs(negMarks),
      };
    }

    default:
      return {
        isAttempted: true,
        isCorrect: false,
        isPartial: false,
        marksAwarded: 0,
      };
  }
}

/**
 * Evaluates and scores an entire attempt inside a database transaction,
 * respecting section choice rules (maxToAttempt) and triggering rank recalculation.
 */
export async function scoreAttempt(attemptId: string) {
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              testQuestions: {
                orderBy: { order: "asc" },
                include: { question: true },
              },
            },
          },
          testQuestions: {
            where: { sectionId: null },
            orderBy: { order: "asc" },
            include: { question: true },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) throw new Error("Attempt not found.");

  // Build lookup of student answers by questionId
  const answersByQuestion: Record<string, { id?: string; response: unknown; timeSpentSec: number }> = {};
  attempt.answers.forEach((ans) => {
    answersByQuestion[ans.questionId] = {
      id: ans.id,
      response: ans.response,
      timeSpentSec: ans.timeSpentSec,
    };
  });

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const answerUpdates: Array<{
    questionId: string;
    isCorrect: boolean;
    marksAwarded: number;
  }> = [];

  // Helper to score an array of TestQuestion records (respecting section maxToAttempt choice rule)
  const processQuestionList = (
    testQuestions: Array<{
      marks: Prisma.Decimal;
      negMarks: Prisma.Decimal;
      partialMarking: boolean;
      order: number;
      question: {
        id: string;
        type: QuestionType;
        correct: unknown;
      };
    }>,
    maxToAttempt: number | null
  ) => {
    let attemptedSoFar = 0;

    for (const tq of testQuestions) {
      const q = tq.question;
      const studentAns = answersByQuestion[q.id];
      const response = studentAns?.response ?? null;

      let tol: number | null = null;
      if (typeof q.correct === "object" && q.correct !== null && "min" in q.correct && "max" in q.correct) {
        tol = Math.abs(Number(q.correct.max) - Number(q.correct.min)) / 2;
      }

      const result = scoreQuestionResponse({
        type: q.type,
        correct: q.correct,
        tolerance: tol,
        marks: Number(tq.marks),
        negMarks: Number(tq.negMarks),
        partialMarking: tq.partialMarking,
        response,
      });

      if (!result.isAttempted) {
        unattemptedCount++;
        answerUpdates.push({
          questionId: q.id,
          isCorrect: false,
          marksAwarded: 0,
        });
        continue;
      }

      // Enforce section choice limit (e.g. "Attempt any 5 of 10")
      if (maxToAttempt !== null && attemptedSoFar >= maxToAttempt) {
        // Exceeded choice limit - question is ignored from scoring
        answerUpdates.push({
          questionId: q.id,
          isCorrect: false,
          marksAwarded: 0,
        });
        continue;
      }

      attemptedSoFar++;
      totalScore += result.marksAwarded;

      if (result.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      answerUpdates.push({
        questionId: q.id,
        isCorrect: result.isCorrect,
        marksAwarded: result.marksAwarded,
      });
    }
  };

  // 1. Process Sectioned Questions
  for (const section of attempt.test.sections) {
    processQuestionList(section.testQuestions, section.maxToAttempt);
  }

  // 2. Process Unsectioned Questions if any exist
  if (attempt.test.testQuestions.length > 0) {
    processQuestionList(attempt.test.testQuestions, null);
  }

  // 3. Persist scores in database transaction
  await db.$transaction(async (tx) => {
    // Update individual answer items
    for (const item of answerUpdates) {
      await tx.attemptAnswer.updateMany({
        where: {
          attemptId,
          questionId: item.questionId,
        },
        data: {
          isCorrect: item.isCorrect,
          marksAwarded: item.marksAwarded,
        },
      });
    }

    // Update attempt totals
    await tx.attempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        totalMarks: attempt.test.totalMarks,
        correctCount,
        incorrectCount,
        unattemptedCount,
      },
    });
  });

  // 4. Recalculate ranks and percentiles across all submitted attempts for this test
  await calculateTestRanksAndPercentiles(attempt.testId);

  return {
    attemptId,
    totalScore,
    correctCount,
    incorrectCount,
    unattemptedCount,
  };
}

/**
 * Calculates competitive ranks and percentiles for all submitted attempts
 * belonging to a test using standardized tie-breaking rules.
 */
export async function calculateTestRanksAndPercentiles(testId: string) {
  // Fetch all completed attempts with their answers and question subjects
  const attempts = await db.attempt.findMany({
    where: {
      testId,
      status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
      score: { not: null },
    },
    include: {
      answers: {
        include: {
          question: { select: { subject: true } },
        },
      },
    },
  });

  if (attempts.length === 0) return;

  // Enrich attempts with subject scores and total time spent for tie-breaking
  const enriched = attempts.map((att) => {
    let mathsScore = 0;
    let physicsScore = 0;
    let chemistryScore = 0;
    let totalTimeSpent = 0;

    att.answers.forEach((ans) => {
      totalTimeSpent += ans.timeSpentSec || 0;
      const sub = ans.question.subject.toLowerCase();
      const marks = ans.marksAwarded ? Number(ans.marksAwarded) : 0;
      if (sub.includes("math")) mathsScore += marks;
      else if (sub.includes("phys")) physicsScore += marks;
      else if (sub.includes("chem")) chemistryScore += marks;
    });

    return {
      attemptId: att.id,
      score: Number(att.score ?? 0),
      incorrectCount: att.incorrectCount,
      mathsScore,
      physicsScore,
      chemistryScore,
      totalTimeSpent,
      submittedAt: att.submittedAt ? att.submittedAt.getTime() : 0,
    };
  });

  // Sort by tie-breaking precedence:
  // 1. Higher total score
  // 2. Fewer negative marks (lower incorrectCount)
  // 3. Higher Maths score
  // 4. Higher Physics score
  // 5. Higher Chemistry score
  // 6. Lower total time spent
  // 7. Earlier submission time
  enriched.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.incorrectCount !== b.incorrectCount) return a.incorrectCount - b.incorrectCount;
    if (b.mathsScore !== a.mathsScore) return b.mathsScore - a.mathsScore;
    if (b.physicsScore !== a.physicsScore) return b.physicsScore - a.physicsScore;
    if (b.chemistryScore !== a.chemistryScore) return b.chemistryScore - a.chemistryScore;
    if (a.totalTimeSpent !== b.totalTimeSpent) return a.totalTimeSpent - b.totalTimeSpent;
    return a.submittedAt - b.submittedAt;
  });

  const totalCandidates = enriched.length;

  // Assign ranks and percentiles
  const updates = enriched.map((item, index) => {
    const rank = index + 1;
    // Standard Percentile formula: ((N - rank) / N) * 100
    const percentile =
      totalCandidates > 1
        ? Number((((totalCandidates - rank) / (totalCandidates - 1)) * 100).toFixed(2))
        : 100.0;

    return {
      attemptId: item.attemptId,
      rank,
      percentile,
    };
  });

  // Batch update ranks and percentiles
  for (const u of updates) {
    await db.attempt.update({
      where: { id: u.attemptId },
      data: {
        rank: u.rank,
        percentile: u.percentile,
      },
    });
  }
}

/**
 * Returns student performance report, topic strengths/weaknesses,
 * and comparative analytics against batch average and topper.
 */
export async function getAttemptResultAnalytics(
  userId: string,
  userRole: string,
  attemptId: string
) {
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              testQuestions: {
                orderBy: { order: "asc" },
                include: { question: true },
              },
            },
          },
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!attempt) throw new Error("Attempt not found.");

  // Access check: User must own the attempt or be an Admin/Instructor
  const isOwner = attempt.userId === userId;
  const isPrivileged = userRole === "SUPER_ADMIN" || userRole === "INSTRUCTOR";
  if (!isOwner && !isPrivileged) {
    throw new Error("Access denied to view this result.");
  }

  // Result visibility rule according to ResultMode
  const now = new Date();
  if (!isPrivileged && attempt.test.resultMode === ResultMode.AFTER_WINDOW) {
    if (attempt.test.closesAt && now < attempt.test.closesAt) {
      return {
        isResultAvailable: false,
        reason: `Results will be published after the exam window closes on ${attempt.test.closesAt.toLocaleString("en-IN")}.`,
        test: {
          id: attempt.test.id,
          code: attempt.test.code,
          title: attempt.test.title,
        },
      };
    }
  }

  if (!isPrivileged && attempt.test.resultMode === ResultMode.MANUAL) {
    return {
      isResultAvailable: false,
      reason: "Results will be published soon by the administrator.",
      test: {
        id: attempt.test.id,
        code: attempt.test.code,
        title: attempt.test.title,
      },
    };
  }

  // Comparative benchmarks: Topper & Average across all submitted attempts
  const allAttempts = await db.attempt.findMany({
    where: {
      testId: attempt.testId,
      status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
      score: { not: null },
    },
    select: { score: true },
  });

  const scores = allAttempts.map((a) => Number(a.score ?? 0));
  const topperScore = scores.length > 0 ? Math.max(...scores) : Number(attempt.score ?? 0);
  const averageScore =
    scores.length > 0
      ? Number((scores.reduce((sum, val) => sum + val, 0) / scores.length).toFixed(1))
      : Number(attempt.score ?? 0);

  // Subject-wise Breakdown
  const subjectMap: Record<
    string,
    {
      subject: string;
      totalQuestions: number;
      attempted: number;
      correct: number;
      incorrect: number;
      marksScored: number;
      maxMarks: number;
      timeSpentSec: number;
    }
  > = {};

  // Chapter / Topic Breakdown for Strong & Weak analysis
  const chapterMap: Record<
    string,
    {
      chapter: string;
      subject: string;
      total: number;
      correct: number;
      incorrect: number;
    }
  > = {};

  let totalTimeSpentSec = 0;

  // Process answers
  attempt.answers.forEach((ans) => {
    const q = ans.question;
    const sub = q.subject || "General";
    const ch = q.chapter || "General";
    const time = ans.timeSpentSec || 0;
    const marks = ans.marksAwarded ? Number(ans.marksAwarded) : 0;
    totalTimeSpentSec += time;

    // Subject accumulator
    if (!subjectMap[sub]) {
      subjectMap[sub] = {
        subject: sub,
        totalQuestions: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        marksScored: 0,
        maxMarks: 0,
        timeSpentSec: 0,
      };
    }

    subjectMap[sub].totalQuestions++;
    subjectMap[sub].maxMarks += 4; // default base marks
    subjectMap[sub].timeSpentSec += time;
    subjectMap[sub].marksScored += marks;

    if (ans.state === "ANSWERED" || ans.state === "ANSWERED_MARKED") {
      subjectMap[sub].attempted++;
      if (ans.isCorrect) {
        subjectMap[sub].correct++;
      } else {
        subjectMap[sub].incorrect++;
      }
    }

    // Chapter accumulator
    if (!chapterMap[ch]) {
      chapterMap[ch] = {
        chapter: ch,
        subject: sub,
        total: 0,
        correct: 0,
        incorrect: 0,
      };
    }
    chapterMap[ch].total++;
    if (ans.isCorrect) chapterMap[ch].correct++;
    else if (ans.state === "ANSWERED" || ans.state === "ANSWERED_MARKED") {
      chapterMap[ch].incorrect++;
    }
  });

  const subjectBreakdown = Object.values(subjectMap).map((s) => ({
    ...s,
    accuracyPct: s.attempted > 0 ? Number(((s.correct / s.attempted) * 100).toFixed(1)) : 0,
  }));

  // Identify Strong Topics (>= 70% accuracy) and Weak Topics (< 50% accuracy)
  const strongTopics: Array<{ chapter: string; subject: string; accuracyPct: number }> = [];
  const weakTopics: Array<{ chapter: string; subject: string; accuracyPct: number }> = [];

  Object.values(chapterMap).forEach((ch) => {
    const attemptedInChapter = ch.correct + ch.incorrect;
    if (attemptedInChapter > 0) {
      const acc = Number(((ch.correct / attemptedInChapter) * 100).toFixed(1));
      if (acc >= 70) {
        strongTopics.push({ chapter: ch.chapter, subject: ch.subject, accuracyPct: acc });
      } else if (acc < 50) {
        weakTopics.push({ chapter: ch.chapter, subject: ch.subject, accuracyPct: acc });
      }
    }
  });

  const totalAttempted = attempt.correctCount + attempt.incorrectCount;
  const overallAccuracy =
    totalAttempted > 0 ? Number(((attempt.correctCount / totalAttempted) * 100).toFixed(1)) : 0;

  const scoreNum = Number(attempt.score ?? 0);
  const totalMarksNum = Number(attempt.totalMarks ?? attempt.test.totalMarks);
  const percentage =
    totalMarksNum > 0 ? Number(((scoreNum / totalMarksNum) * 100).toFixed(1)) : 0;

  const isPassed =
    attempt.test.passMarks !== null ? scoreNum >= Number(attempt.test.passMarks) : null;

  return {
    isResultAvailable: true,
    attempt: {
      id: attempt.id,
      attemptNo: attempt.attemptNo,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: scoreNum,
      totalMarks: totalMarksNum,
      percentage,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unattemptedCount: attempt.unattemptedCount,
      accuracyPct: overallAccuracy,
      rank: attempt.rank,
      percentile: attempt.percentile ? Number(attempt.percentile) : null,
      totalCandidates: allAttempts.length,
      totalTimeSpentSec,
      isPassed,
      passMarks: attempt.test.passMarks ? Number(attempt.test.passMarks) : null,
    },
    test: {
      id: attempt.test.id,
      code: attempt.test.code,
      title: attempt.test.title,
      type: attempt.test.type,
      solutionMode: attempt.test.solutionMode,
      durationMin: attempt.test.durationMin,
    },
    benchmarks: {
      topperScore,
      averageScore,
      totalAttempts: allAttempts.length,
    },
    subjectBreakdown,
    strongTopics,
    weakTopics,
  };
}

/**
 * Returns question-by-question review with student's responses,
 * verified answer keys, and step-by-step mathematical explanations.
 */
export async function getAttemptSolutions(
  userId: string,
  userRole: string,
  attemptId: string
) {
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              testQuestions: {
                orderBy: { order: "asc" },
                include: { question: true },
              },
            },
          },
          testQuestions: {
            where: { sectionId: null },
            orderBy: { order: "asc" },
            include: { question: true },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt) throw new Error("Attempt not found.");

  const isOwner = attempt.userId === userId;
  const isPrivileged = userRole === "SUPER_ADMIN" || userRole === "INSTRUCTOR";
  if (!isOwner && !isPrivileged) {
    throw new Error("Access denied to view solutions.");
  }

  // Solution visibility check
  const now = new Date();
  if (!isPrivileged && attempt.test.solutionMode === SolutionMode.NEVER) {
    return {
      isSolutionsAvailable: false,
      reason: "Solutions are not enabled for this test.",
      test: { id: attempt.test.id, title: attempt.test.title },
      questions: [],
    };
  }

  if (!isPrivileged && attempt.test.solutionMode === SolutionMode.AFTER_WINDOW) {
    if (attempt.test.closesAt && now < attempt.test.closesAt) {
      return {
        isSolutionsAvailable: false,
        reason: `Detailed solutions will unlock after the examination window closes on ${attempt.test.closesAt.toLocaleString("en-IN")}.`,
        test: { id: attempt.test.id, title: attempt.test.title },
        questions: [],
      };
    }
  }

  // Build answer lookup map
  const answersMap: Record<
    string,
    {
      response: unknown;
      isCorrect: boolean | null;
      marksAwarded: number | null;
      timeSpentSec: number;
    }
  > = {};

  attempt.answers.forEach((ans) => {
    answersMap[ans.questionId] = {
      response: ans.response,
      isCorrect: ans.isCorrect,
      marksAwarded: ans.marksAwarded ? Number(ans.marksAwarded) : null,
      timeSpentSec: ans.timeSpentSec,
    };
  });

  // Map questions across sections
  const questions: Array<{
    id: string;
    code: string;
    type: string;
    subject: string;
    chapter: string | null;
    stem: string;
    stemImage: string | null;
    options: unknown;
    correct: unknown;
    tolerance: number | null;
    explanation: string | null;
    solutionImage: string | null;
    marks: number;
    negMarks: number;
    order: number;
    sectionName: string;
    studentResponse: unknown;
    isCorrect: boolean;
    isAttempted: boolean;
    marksAwarded: number;
    timeSpentSec: number;
  }> = [];

  const mapQuestion = (
    tq: {
      marks: Prisma.Decimal;
      negMarks: Prisma.Decimal;
      order: number;
      sectionId?: string | null;
      question: Question;
    },
    sectionName?: string
  ) => {
    const q = tq.question;
    const ans = answersMap[q.id];

    questions.push({
      id: q.id,
      code: q.code,
      type: q.type,
      subject: q.subject,
      chapter: q.chapter,
      stem: q.stem,
      stemImage: q.stemImage,
      options: q.options,
      correct: q.correct,
      tolerance:
        typeof q.correct === "object" && q.correct && "min" in q.correct && "max" in q.correct
          ? Math.abs(Number(q.correct.max) - Number(q.correct.min)) / 2
          : null,
      explanation: q.explanation,
      solutionImage: q.solutionImage,
      marks: Number(tq.marks),
      negMarks: Number(tq.negMarks),
      order: tq.order,
      sectionName: sectionName || "General",
      studentResponse: ans?.response ?? null,
      isCorrect: ans?.isCorrect ?? false,
      isAttempted: ans?.response !== null && ans?.response !== undefined && ans?.response !== "",
      marksAwarded: ans?.marksAwarded ?? 0,
      timeSpentSec: ans?.timeSpentSec ?? 0,
    });
  };

  for (const sec of attempt.test.sections) {
    sec.testQuestions.forEach((tq) => mapQuestion(tq, sec.name));
  }

  attempt.test.testQuestions.forEach((tq) => mapQuestion(tq, "General"));

  return {
    isSolutionsAvailable: true,
    test: {
      id: attempt.test.id,
      code: attempt.test.code,
      title: attempt.test.title,
    },
    attempt: {
      id: attempt.id,
      score: Number(attempt.score ?? 0),
      totalMarks: Number(attempt.totalMarks ?? attempt.test.totalMarks),
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unattemptedCount: attempt.unattemptedCount,
    },
    questions,
  };
}

