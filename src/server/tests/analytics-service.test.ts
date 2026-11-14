/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTestComprehensiveAnalytics,
  generateTestResultsCsv,
  generateQuestionItemAnalysisCsv,
} from "./analytics-service";
import { AttemptStatus, QuestionType } from "@prisma/client";

vi.mock("@/lib/db", () => {
  return {
    db: {
      test: {
        findUnique: vi.fn(),
      },
      attempt: {
        findMany: vi.fn(),
      },
    },
  };
});

import { db } from "@/lib/db";

describe("Analytics Service (Phase 14)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTest = {
    id: "test-1",
    code: "JEE-MOCK-01",
    title: "JEE Main Grand Mock 1",
    type: "FULL_MOCK",
    durationMin: 180,
    totalMarks: 100,
    passMarks: 40,
    sections: [
      {
        id: "sec-1",
        name: "Physics",
        order: 1,
        testQuestions: [
          {
            marks: 4,
            negMarks: 1,
            order: 1,
            question: {
              id: "q-1",
              code: "PHY-01",
              type: QuestionType.MCQ_SINGLE,
              subject: "Physics",
              chapter: "Mechanics",
              stem: "What is acceleration due to gravity?",
              correct: "B",
            },
          },
        ],
      },
    ],
    testQuestions: [],
  };

  const mockAttempts = [
    {
      id: "att-1",
      status: AttemptStatus.SUBMITTED,
      score: 80,
      totalMarks: 100,
      startedAt: new Date("2026-01-01T10:00:00Z"),
      submittedAt: new Date("2026-01-01T12:00:00Z"),
      user: { name: "Alice", email: "alice@test.com", phone: "9999999991" },
      test: { totalMarks: 100 },
      answers: [
        {
          questionId: "q-1",
          response: "B",
          isCorrect: true,
          marksAwarded: 4,
          timeSpentSec: 60,
        },
      ],
      violations: [{ type: "TAB_BLUR" }],
    },
    {
      id: "att-2",
      status: AttemptStatus.SUBMITTED,
      score: 40,
      totalMarks: 100,
      startedAt: new Date("2026-01-01T10:00:00Z"),
      submittedAt: new Date("2026-01-01T12:30:00Z"),
      user: { name: "Bob", email: "bob@test.com", phone: "9999999992" },
      test: { totalMarks: 100 },
      answers: [
        {
          questionId: "q-1",
          response: "C",
          isCorrect: false,
          marksAwarded: -1,
          timeSpentSec: 90,
        },
      ],
      violations: [],
    },
  ];

  describe("getTestComprehensiveAnalytics", () => {
    it("computes overview statistics, pass rate, and score distribution", async () => {
      (db.test.findUnique as any).mockResolvedValue(mockTest);
      (db.attempt.findMany as any).mockResolvedValue(mockAttempts);

      const analytics = await getTestComprehensiveAnalytics("test-1");

      expect(analytics.test.code).toBe("JEE-MOCK-01");
      expect(analytics.overview.completedAttempts).toBe(2);
      expect(analytics.overview.avgScore).toBe(60); // (80 + 40) / 2
      expect(analytics.overview.topperScore).toBe(80);
      expect(analytics.overview.lowestScore).toBe(40);
      expect(analytics.overview.medianScore).toBe(60);
      expect(analytics.overview.passRatePct).toBe(100); // both scored >= 40

      // Integrity summary
      expect(analytics.integritySummary.attemptsWithViolationsCount).toBe(1);
      expect(analytics.integritySummary.tabBlurCount).toBe(1);

      // Question Item Analysis
      expect(analytics.questionAnalytics.length).toBe(1);
      const qItem = analytics.questionAnalytics[0];
      expect(qItem.code).toBe("PHY-01");
      expect(qItem.attemptedCount).toBe(2);
      expect(qItem.correctCount).toBe(1);
      expect(qItem.incorrectCount).toBe(1);
      expect(qItem.accuracyPct).toBe(50); // 1 / 2 = 50%
      expect(qItem.mostCommonMistake).toBe("C");
    });
  });

  describe("generateTestResultsCsv & generateQuestionItemAnalysisCsv", () => {
    it("generates formatted CSV for candidate results", async () => {
      (db.attempt.findMany as any).mockResolvedValue(mockAttempts);

      const csv = await generateTestResultsCsv("test-1");
      expect(csv).toContain("Rank,Student Name,Email");
      expect(csv).toContain('"Alice"');
      expect(csv).toContain('"alice@test.com"');
    });

    it("generates formatted CSV for question analysis", async () => {
      (db.test.findUnique as any).mockResolvedValue(mockTest);
      (db.attempt.findMany as any).mockResolvedValue(mockAttempts);

      const csv = await generateQuestionItemAnalysisCsv("test-1");
      expect(csv).toContain("Question Order,Section,Question Code");
      expect(csv).toContain('"PHY-01"');
      expect(csv).toContain("Mechanics");
    });
  });
});

