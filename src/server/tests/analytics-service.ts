import { db } from "@/lib/db";
import { AttemptStatus, QuestionType } from "@prisma/client";

export interface QuestionAnalyticsItem {
  id: string;
  code: string;
  type: QuestionType;
  subject: string;
  chapter: string | null;
  stem: string;
  marks: number;
  negMarks: number;
  order: number;
  sectionName: string;
  totalPresented: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracyPct: number; // Facility Index: correct / attempted
  attemptRatePct: number; // attempted / totalPresented
  avgTimeSpentSec: number;
  discriminationIndex: number | null; // (top 27% correct % - bottom 27% correct %)
  optionDistribution: Record<string, number>;
  mostCommonMistake: string | null;
}

export interface TestComprehensiveAnalytics {
  test: {
    id: string;
    code: string;
    title: string;
    type: string;
    durationMin: number;
    totalMarks: number;
    passMarks: number | null;
  };
  overview: {
    totalAttempts: number;
    completedAttempts: number;
    inProgressAttempts: number;
    autoSubmittedAttempts: number;
    completionRatePct: number;
    avgScore: number;
    topperScore: number;
    lowestScore: number;
    medianScore: number;
    stdDeviation: number;
    passRatePct: number | null;
    avgTimeSpentSec: number;
  };
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  subjectBreakdown: Array<{
    subject: string;
    totalQuestions: number;
    avgMarks: number;
    avgAccuracyPct: number;
    avgTimeSpentSec: number;
  }>;
  sectionBreakdown: Array<{
    sectionName: string;
    totalQuestions: number;
    avgMarks: number;
    avgAccuracyPct: number;
    avgTimeSpentSec: number;
  }>;
  questionAnalytics: QuestionAnalyticsItem[];
  integritySummary: {
    attemptsWithViolationsCount: number;
    totalViolationsRecorded: number;
    tabBlurCount: number;
    fullscreenExitCount: number;
    highRiskAttemptsCount: number; // > 3 violations
  };
}

/**
 * Computes complete test-level, section-level, and question-level analytics.
 */
export async function getTestComprehensiveAnalytics(testId: string): Promise<TestComprehensiveAnalytics> {
  const test = await db.test.findUnique({
    where: { id: testId },
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
  });

  if (!test) throw new Error("Test not found.");

  // Fetch all attempts for this test
  const attempts = await db.attempt.findMany({
    where: { testId },
    include: {
      answers: true,
      violations: true,
    },
    orderBy: { score: "desc" },
  });

  const completedAttempts = attempts.filter(
    (a) => a.status === AttemptStatus.SUBMITTED || a.status === AttemptStatus.AUTO_SUBMITTED
  );
  const inProgressAttempts = attempts.filter((a) => a.status === AttemptStatus.IN_PROGRESS);
  const autoSubmittedAttempts = attempts.filter((a) => a.status === AttemptStatus.AUTO_SUBMITTED);

  const scores = completedAttempts.map((a) => Number(a.score ?? 0));
  const totalCompleted = completedAttempts.length;

  // Overview metrics
  let avgScore = 0;
  let topperScore = 0;
  let lowestScore = 0;
  let medianScore = 0;
  let stdDeviation = 0;
  let passRatePct: number | null = null;
  let avgTimeSpentSec = 0;

  if (totalCompleted > 0) {
    avgScore = Number((scores.reduce((sum, s) => sum + s, 0) / totalCompleted).toFixed(2));
    topperScore = Math.max(...scores);
    lowestScore = Math.min(...scores);

    // Median
    const sortedScores = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sortedScores.length / 2);
    medianScore =
      sortedScores.length % 2 !== 0
        ? sortedScores[mid]
        : Number(((sortedScores[mid - 1] + sortedScores[mid]) / 2).toFixed(2));

    // Standard deviation
    const variance =
      scores.reduce((acc, val) => acc + Math.pow(val - avgScore, 2), 0) / totalCompleted;
    stdDeviation = Number(Math.sqrt(variance).toFixed(2));

    // Pass rate
    if (test.passMarks !== null) {
      const passMarksNum = Number(test.passMarks);
      const passedCount = scores.filter((s) => s >= passMarksNum).length;
      passRatePct = Number(((passedCount / totalCompleted) * 100).toFixed(1));
    }

    // Average duration spent
    const totalDurationSec = completedAttempts.reduce((acc, a) => {
      if (a.startedAt && a.submittedAt) {
        return acc + Math.floor((a.submittedAt.getTime() - a.startedAt.getTime()) / 1000);
      }
      return acc;
    }, 0);
    avgTimeSpentSec = Math.round(totalDurationSec / totalCompleted);
  }

  // Completion Rate
  const totalStarted = attempts.length;
  const completionRatePct =
    totalStarted > 0 ? Number(((totalCompleted / totalStarted) * 100).toFixed(1)) : 0;

  // Score Distribution Buckets (5 ranges: 0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
  const totalMarksNum = Number(test.totalMarks) || 100;
  const bucketRanges = [
    { label: "0% - 20%", min: 0, max: 0.2 },
    { label: "21% - 40%", min: 0.2, max: 0.4 },
    { label: "41% - 60%", min: 0.4, max: 0.6 },
    { label: "61% - 80%", min: 0.6, max: 0.8 },
    { label: "81% - 100%", min: 0.8, max: 1.01 },
  ];

  const scoreDistribution = bucketRanges.map((bucket) => {
    const count = scores.filter((s) => {
      const ratio = totalMarksNum > 0 ? s / totalMarksNum : 0;
      return ratio >= bucket.min && ratio < bucket.max;
    }).length;

    return {
      range: bucket.label,
      count,
      percentage: totalCompleted > 0 ? Number(((count / totalCompleted) * 100).toFixed(1)) : 0,
    };
  });

  // Flatten questions from sections and unsectioned items
  interface FlatTestQuestion {
    marks: number;
    negMarks: number;
    order: number;
    sectionName: string;
    question: (typeof test.testQuestions)[0]["question"];
  }

  const flatQuestions: FlatTestQuestion[] = [];
  for (const s of test.sections) {
    for (const tq of s.testQuestions) {
      flatQuestions.push({
        marks: Number(tq.marks),
        negMarks: Number(tq.negMarks),
        order: tq.order,
        sectionName: s.name,
        question: tq.question,
      });
    }
  }
  for (const tq of test.testQuestions) {
    flatQuestions.push({
      marks: Number(tq.marks),
      negMarks: Number(tq.negMarks),
      order: tq.order,
      sectionName: "General",
      question: tq.question,
    });
  }

  // Calculate Discrimination Index groupings (Top 27% vs Bottom 27% of completed attempts)
  const top27Count = Math.max(1, Math.round(totalCompleted * 0.27));
  const top27Attempts = completedAttempts.slice(0, top27Count);
  const bottom27Attempts = completedAttempts.slice(-top27Count);

  // Question Analytics aggregation
  const questionAnalytics: QuestionAnalyticsItem[] = flatQuestions.map((item) => {
    const q = item.question;
    const qAnswers = completedAttempts
      .map((att) => att.answers.find((ans) => ans.questionId === q.id))
      .filter(Boolean);

    let attemptedCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let totalTimeSpent = 0;
    const optionDistribution: Record<string, number> = {};

    qAnswers.forEach((ans) => {
      if (!ans) return;
      totalTimeSpent += ans.timeSpentSec || 0;

      const isAttempted =
        ans.response !== null &&
        ans.response !== undefined &&
        ans.response !== "" &&
        !(Array.isArray(ans.response) && ans.response.length === 0);

      if (isAttempted) {
        attemptedCount++;
        if (ans.isCorrect) {
          correctCount++;
        } else {
          incorrectCount++;
        }

        // Tally option distribution
        if (typeof ans.response === "string") {
          const optKey = ans.response.trim().toUpperCase();
          optionDistribution[optKey] = (optionDistribution[optKey] || 0) + 1;
        } else if (Array.isArray(ans.response)) {
          ans.response.forEach((itemVal) => {
            const optKey = String(itemVal).trim().toUpperCase();
            optionDistribution[optKey] = (optionDistribution[optKey] || 0) + 1;
          });
        }
      }
    });

    const unattemptedCount = totalCompleted - attemptedCount;
    const accuracyPct =
      attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(1)) : 0;
    const attemptRatePct =
      totalCompleted > 0 ? Number(((attemptedCount / totalCompleted) * 100).toFixed(1)) : 0;
    const avgQTime = attemptedCount > 0 ? Math.round(totalTimeSpent / attemptedCount) : 0;

    // Determine most common wrong option (mistake)
    let mostCommonMistake: string | null = null;
    let maxDistractorCount = 0;
    const correctStr = String(q.correct).trim().toUpperCase();

    Object.entries(optionDistribution).forEach(([opt, count]) => {
      if (opt !== correctStr && count > maxDistractorCount) {
        maxDistractorCount = count;
        mostCommonMistake = opt;
      }
    });

    // Discrimination Index = (Top Group Accuracy - Bottom Group Accuracy) / 100
    let discriminationIndex: number | null = null;
    if (totalCompleted >= 4 && top27Attempts.length > 0 && bottom27Attempts.length > 0) {
      const topCorrect = top27Attempts.filter((att) => {
        const a = att.answers.find((ans) => ans.questionId === q.id);
        return a?.isCorrect === true;
      }).length;
      const bottomCorrect = bottom27Attempts.filter((att) => {
        const a = att.answers.find((ans) => ans.questionId === q.id);
        return a?.isCorrect === true;
      }).length;

      const topAcc = topCorrect / top27Attempts.length;
      const bottomAcc = bottomCorrect / bottom27Attempts.length;
      discriminationIndex = Number((topAcc - bottomAcc).toFixed(2));
    }

    return {
      id: q.id,
      code: q.code,
      type: q.type,
      subject: q.subject,
      chapter: q.chapter,
      stem: q.stem,
      marks: item.marks,
      negMarks: item.negMarks,
      order: item.order,
      sectionName: item.sectionName,
      totalPresented: totalCompleted,
      attemptedCount,
      correctCount,
      incorrectCount,
      unattemptedCount,
      accuracyPct,
      attemptRatePct,
      avgTimeSpentSec: avgQTime,
      discriminationIndex,
      optionDistribution,
      mostCommonMistake,
    };
  });

  // Subject breakdown
  const subjectGroups: Record<
    string,
    { questionsCount: number; totalMarksScored: number; totalMaxMarks: number; totalTimeSec: number }
  > = {};

  completedAttempts.forEach((att) => {
    att.answers.forEach((ans) => {
      const q = flatQuestions.find((fq) => fq.question.id === ans.questionId);
      if (!q) return;
      const sub = q.question.subject;
      if (!subjectGroups[sub]) {
        subjectGroups[sub] = {
          questionsCount: 0,
          totalMarksScored: 0,
          totalMaxMarks: 0,
          totalTimeSec: 0,
        };
      }
      subjectGroups[sub].totalMarksScored += ans.marksAwarded ? Number(ans.marksAwarded) : 0;
      subjectGroups[sub].totalMaxMarks += q.marks;
      subjectGroups[sub].totalTimeSec += ans.timeSpentSec || 0;
    });
  });

  const subjectBreakdown = Object.entries(subjectGroups).map(([subject, data]) => {
    const qCount = flatQuestions.filter((fq) => fq.question.subject === subject).length;
    const avgMarks =
      totalCompleted > 0 ? Number((data.totalMarksScored / totalCompleted).toFixed(1)) : 0;
    const avgAcc =
      data.totalMaxMarks > 0
        ? Number(((data.totalMarksScored / data.totalMaxMarks) * 100).toFixed(1))
        : 0;
    const avgTime =
      totalCompleted > 0 ? Math.round(data.totalTimeSec / totalCompleted) : 0;

    return {
      subject,
      totalQuestions: qCount,
      avgMarks,
      avgAccuracyPct: Math.max(0, avgAcc),
      avgTimeSpentSec: avgTime,
    };
  });

  // Section breakdown
  const sectionGroups: Record<
    string,
    { questionsCount: number; totalMarksScored: number; totalMaxMarks: number; totalTimeSec: number }
  > = {};

  completedAttempts.forEach((att) => {
    att.answers.forEach((ans) => {
      const q = flatQuestions.find((fq) => fq.question.id === ans.questionId);
      if (!q) return;
      const sec = q.sectionName;
      if (!sectionGroups[sec]) {
        sectionGroups[sec] = {
          questionsCount: 0,
          totalMarksScored: 0,
          totalMaxMarks: 0,
          totalTimeSec: 0,
        };
      }
      sectionGroups[sec].totalMarksScored += ans.marksAwarded ? Number(ans.marksAwarded) : 0;
      sectionGroups[sec].totalMaxMarks += q.marks;
      sectionGroups[sec].totalTimeSec += ans.timeSpentSec || 0;
    });
  });

  const sectionBreakdown = Object.entries(sectionGroups).map(([sectionName, data]) => {
    const qCount = flatQuestions.filter((fq) => fq.sectionName === sectionName).length;
    const avgMarks =
      totalCompleted > 0 ? Number((data.totalMarksScored / totalCompleted).toFixed(1)) : 0;
    const avgAcc =
      data.totalMaxMarks > 0
        ? Number(((data.totalMarksScored / data.totalMaxMarks) * 100).toFixed(1))
        : 0;
    const avgTime =
      totalCompleted > 0 ? Math.round(data.totalTimeSec / totalCompleted) : 0;

    return {
      sectionName,
      totalQuestions: qCount,
      avgMarks,
      avgAccuracyPct: Math.max(0, avgAcc),
      avgTimeSpentSec: avgTime,
    };
  });

  // Integrity summary across all attempts
  let tabBlurCount = 0;
  let fullscreenExitCount = 0;
  let attemptsWithViolationsCount = 0;
  let highRiskAttemptsCount = 0;

  attempts.forEach((att) => {
    const vCount = att.violations.length;
    if (vCount > 0) {
      attemptsWithViolationsCount++;
      if (vCount > 3) highRiskAttemptsCount++;
    }

    att.violations.forEach((v) => {
      if (v.type === "TAB_BLUR") tabBlurCount++;
      else if (v.type === "FULLSCREEN_EXIT") fullscreenExitCount++;
    });
  });

  return {
    test: {
      id: test.id,
      code: test.code,
      title: test.title,
      type: test.type,
      durationMin: test.durationMin,
      totalMarks: Number(test.totalMarks),
      passMarks: test.passMarks ? Number(test.passMarks) : null,
    },
    overview: {
      totalAttempts: attempts.length,
      completedAttempts: totalCompleted,
      inProgressAttempts: inProgressAttempts.length,
      autoSubmittedAttempts: autoSubmittedAttempts.length,
      completionRatePct,
      avgScore,
      topperScore,
      lowestScore,
      medianScore,
      stdDeviation,
      passRatePct,
      avgTimeSpentSec,
    },
    scoreDistribution,
    subjectBreakdown,
    sectionBreakdown,
    questionAnalytics,
    integritySummary: {
      attemptsWithViolationsCount,
      totalViolationsRecorded: tabBlurCount + fullscreenExitCount,
      tabBlurCount,
      fullscreenExitCount,
      highRiskAttemptsCount,
    },
  };
}

/**
 * Generates CSV string for full candidate results and leaderboard.
 */
export async function generateTestResultsCsv(testId: string): Promise<string> {
  const attempts = await db.attempt.findMany({
    where: {
      testId,
      status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] },
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      test: { select: { totalMarks: true } },
      violations: true,
    },
    orderBy: [{ score: "desc" }, { correctCount: "desc" }, { submittedAt: "asc" }],
  });

  const headers = [
    "Rank",
    "Student Name",
    "Email",
    "Phone",
    "Status",
    "Score",
    "Total Marks",
    "Percentage",
    "Percentile",
    "Correct Count",
    "Incorrect Count",
    "Unattempted Count",
    "Violations Count",
    "Time Taken (Minutes)",
    "Started At",
    "Submitted At",
  ];

  const rows = attempts.map((att, index) => {
    const rank = att.rank ?? index + 1;
    const name = `"${(att.user.name || "Student").replace(/"/g, '""')}"`;
    const email = `"${(att.user.email || "").replace(/"/g, '""')}"`;
    const phone = `"${(att.user.phone || "").replace(/"/g, '""')}"`;
    const status = att.status;
    const score = Number(att.score ?? 0);
    const totalMarks = Number(att.totalMarks ?? att.test.totalMarks);
    const percentage = totalMarks > 0 ? ((score / totalMarks) * 100).toFixed(2) : "0.00";
    const percentile = att.percentile ? Number(att.percentile).toFixed(2) : "N/A";
    const correct = att.correctCount;
    const incorrect = att.incorrectCount;
    const unattempted = att.unattemptedCount;
    const violations = att.violations.length;

    let timeTakenMin = 0;
    if (att.startedAt && att.submittedAt) {
      timeTakenMin = Math.round((att.submittedAt.getTime() - att.startedAt.getTime()) / 60000);
    }

    const startedAt = att.startedAt.toISOString();
    const submittedAt = att.submittedAt ? att.submittedAt.toISOString() : "";

    return [
      rank,
      name,
      email,
      phone,
      status,
      score,
      totalMarks,
      percentage,
      percentile,
      correct,
      incorrect,
      unattempted,
      violations,
      timeTakenMin,
      startedAt,
      submittedAt,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generates CSV string for question item analysis.
 */
export async function generateQuestionItemAnalysisCsv(testId: string): Promise<string> {
  const analytics = await getTestComprehensiveAnalytics(testId);

  const headers = [
    "Question Order",
    "Section",
    "Question Code",
    "Subject",
    "Chapter",
    "Type",
    "Marks",
    "Neg Marks",
    "Total Presented",
    "Attempted Count",
    "Correct Count",
    "Incorrect Count",
    "Unattempted Count",
    "Accuracy (% Facility Index)",
    "Attempt Rate (%)",
    "Average Time (Sec)",
    "Discrimination Index",
    "Most Common Mistake",
  ];

  const rows = analytics.questionAnalytics.map((q) => {
    return [
      q.order,
      `"${q.sectionName.replace(/"/g, '""')}"`,
      `"${q.code.replace(/"/g, '""')}"`,
      `"${q.subject.replace(/"/g, '""')}"`,
      `"${(q.chapter || "General").replace(/"/g, '""')}"`,
      q.type,
      q.marks,
      q.negMarks,
      q.totalPresented,
      q.attemptedCount,
      q.correctCount,
      q.incorrectCount,
      q.unattemptedCount,
      q.accuracyPct,
      q.attemptRatePct,
      q.avgTimeSpentSec,
      q.discriminationIndex !== null ? q.discriminationIndex : "N/A",
      q.mostCommonMistake ? `"${q.mostCommonMistake.replace(/"/g, '""')}"` : "None",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

