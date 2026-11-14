/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  scoreQuestionResponse,
  calculateTestRanksAndPercentiles,
} from "./scoring-service";
import { QuestionType } from "@prisma/client";

// Mock DB for rank tests
vi.mock("@/lib/db", () => {
  return {
    db: {
      attempt: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

import { db } from "@/lib/db";

describe("Scoring Service (Phase 12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("scoreQuestionResponse - MCQ_SINGLE", () => {
    it("awards full marks for correct option", () => {
      const res = scoreQuestionResponse({
        type: QuestionType.MCQ_SINGLE,
        correct: "B",
        tolerance: null,
        marks: 4,
        negMarks: 1,
        partialMarking: false,
        response: "B",
      });

      expect(res.isAttempted).toBe(true);
      expect(res.isCorrect).toBe(true);
      expect(res.marksAwarded).toBe(4);
    });

    it("deducts negative marks for incorrect option", () => {
      const res = scoreQuestionResponse({
        type: QuestionType.MCQ_SINGLE,
        correct: "B",
        tolerance: null,
        marks: 4,
        negMarks: 1,
        partialMarking: false,
        response: "C",
      });

      expect(res.isAttempted).toBe(true);
      expect(res.isCorrect).toBe(false);
      expect(res.marksAwarded).toBe(-1);
    });

    it("awards 0 marks for unattempted / blank response", () => {
      const res = scoreQuestionResponse({
        type: QuestionType.MCQ_SINGLE,
        correct: "B",
        tolerance: null,
        marks: 4,
        negMarks: 1,
        partialMarking: false,
        response: null,
      });

      expect(res.isAttempted).toBe(false);
      expect(res.isCorrect).toBe(false);
      expect(res.marksAwarded).toBe(0);
    });
  });

  describe("scoreQuestionResponse - MCQ_MULTI (JEE Advanced style)", () => {
    it("awards full marks when all correct options are selected", () => {
      const res = scoreQuestionResponse({
        type: QuestionType.MCQ_MULTI,
        correct: ["A", "C", "D"],
        tolerance: null,
        marks: 4,
        negMarks: 2,
        partialMarking: true,
        response: ["A", "C", "D"],
      });

      expect(res.isCorrect).toBe(true);
      expect(res.marksAwarded).toBe(4);
    });

    it("awards fractional partial marks when partial subset is selected without wrong options", () => {
      // 2 of 4 options chosen -> (4 * 2) / 4 = 2 marks
      const res = scoreQuestionResponse({
        type: QuestionType.MCQ_MULTI,
        correct: ["A", "B", "C", "D"],
        tolerance: null,
        marks: 4,
        negMarks: 2,
        partialMarking: true,
        response: ["A", "C"],
      });

      expect(res.isCorrect).toBe(false);
      expect(res.isPartial).toBe(true);
      expect(res.marksAwarded).toBe(2);
    });

    it("deducts negative marks if even one incorrect option is selected", () => {
      // Correct is A, C; student picked A, B (B is wrong)
      const res = scoreQuestionResponse({
        type: QuestionType.MCQ_MULTI,
        correct: ["A", "C"],
        tolerance: null,
        marks: 4,
        negMarks: 2,
        partialMarking: true,
        response: ["A", "B"],
      });

      expect(res.isCorrect).toBe(false);
      expect(res.marksAwarded).toBe(-2);
    });
  });

  describe("scoreQuestionResponse - NUMERIC", () => {
    it("awards marks when value matches exactly", () => {
      const res = scoreQuestionResponse({
        type: QuestionType.NUMERIC,
        correct: "25.4",
        tolerance: 0,
        marks: 4,
        negMarks: 0,
        partialMarking: false,
        response: "25.4",
      });

      expect(res.isCorrect).toBe(true);
      expect(res.marksAwarded).toBe(4);
    });

    it("awards marks when value falls within specified tolerance range", () => {
      const res = scoreQuestionResponse({
        type: QuestionType.NUMERIC,
        correct: "10.0",
        tolerance: 0.2, // [9.8, 10.2]
        marks: 4,
        negMarks: 1,
        partialMarking: false,
        response: "10.15",
      });

      expect(res.isCorrect).toBe(true);
      expect(res.marksAwarded).toBe(4);
    });

    it("deducts marks when value falls outside tolerance range", () => {
      const res = scoreQuestionResponse({
        type: QuestionType.NUMERIC,
        correct: "10.0",
        tolerance: 0.1,
        marks: 4,
        negMarks: 1,
        partialMarking: false,
        response: "10.5",
      });

      expect(res.isCorrect).toBe(false);
      expect(res.marksAwarded).toBe(-1);
    });
  });

  describe("scoreQuestionResponse - TRUE_FALSE", () => {
    it("scores TRUE/FALSE response correctly", () => {
      const correctRes = scoreQuestionResponse({
        type: QuestionType.TRUE_FALSE,
        correct: "TRUE",
        tolerance: null,
        marks: 2,
        negMarks: 0.5,
        partialMarking: false,
        response: "TRUE",
      });
      expect(correctRes.isCorrect).toBe(true);
      expect(correctRes.marksAwarded).toBe(2);

      const wrongRes = scoreQuestionResponse({
        type: QuestionType.TRUE_FALSE,
        correct: "TRUE",
        tolerance: null,
        marks: 2,
        negMarks: 0.5,
        partialMarking: false,
        response: "FALSE",
      });
      expect(wrongRes.isCorrect).toBe(false);
      expect(wrongRes.marksAwarded).toBe(-0.5);
    });
  });

  describe("calculateTestRanksAndPercentiles", () => {
    it("calculates competitive ranks and percentiles with tie-breaking", async () => {
      // Mock 3 submitted attempts
      vi.mocked(db.attempt.findMany).mockResolvedValue([
        {
          id: "att-1",
          testId: "test-mock-1",
          score: 80 as any,
          incorrectCount: 5,
          submittedAt: new Date("2026-11-08T10:00:00Z"),
          answers: [
            { timeSpentSec: 300, marksAwarded: 40 as any, question: { subject: "Mathematics" } },
            { timeSpentSec: 300, marksAwarded: 40 as any, question: { subject: "Physics" } },
          ],
        },
        {
          id: "att-2",
          testId: "test-mock-1",
          score: 100 as any,
          incorrectCount: 0,
          submittedAt: new Date("2026-11-08T10:05:00Z"),
          answers: [
            { timeSpentSec: 500, marksAwarded: 50 as any, question: { subject: "Mathematics" } },
            { timeSpentSec: 500, marksAwarded: 50 as any, question: { subject: "Physics" } },
          ],
        },
        {
          id: "att-3",
          testId: "test-mock-1",
          score: 80 as any,
          incorrectCount: 2, // Tied on score with att-1, but fewer incorrect -> wins tie-break!
          submittedAt: new Date("2026-11-08T10:02:00Z"),
          answers: [
            { timeSpentSec: 400, marksAwarded: 40 as any, question: { subject: "Mathematics" } },
            { timeSpentSec: 400, marksAwarded: 40 as any, question: { subject: "Physics" } },
          ],
        },
      ] as any);

      vi.mocked(db.attempt.update).mockResolvedValue({} as any);

      await calculateTestRanksAndPercentiles("test-mock-1");

      // Verify Rank 1 went to att-2 (highest score 100)
      expect(db.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-2" },
          data: expect.objectContaining({ rank: 1, percentile: 100 }),
        })
      );

      // Verify Rank 2 went to att-3 (score 80, only 2 incorrect vs 5 incorrect for att-1)
      expect(db.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-3" },
          data: expect.objectContaining({ rank: 2 }),
        })
      );

      // Verify Rank 3 went to att-1
      expect(db.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-1" },
          data: expect.objectContaining({ rank: 3 }),
        })
      );
    });
  });
});

