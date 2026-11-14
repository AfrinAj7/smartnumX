/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reevaluateTest,
  resetStudentAttempt,
  listTestAttempts,
} from "./reevaluation-service";
import { AttemptStatus, QuestionType } from "@prisma/client";

// Mock DB
vi.mock("@/lib/db", () => {
  return {
    db: {
      test: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      question: {
        update: vi.fn(),
      },
      attempt: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      attemptAnswer: {
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      attemptSection: {
        deleteMany: vi.fn(),
      },
      attemptViolation: {
        deleteMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((fn: any) => {
        if (typeof fn === "function") {
          return fn({
            attemptAnswer: { update: vi.fn() },
            attempt: { update: vi.fn() },
          });
        }
        return Promise.all(fn);
      }),
    },
  };
});

// Mock calculateTestRanksAndPercentiles
vi.mock("./scoring-service", async () => {
  const actual = await vi.importActual<any>("./scoring-service");
  return {
    ...actual,
    calculateTestRanksAndPercentiles: vi.fn().mockResolvedValue(undefined),
  };
});

import { db } from "@/lib/db";
import { calculateTestRanksAndPercentiles } from "./scoring-service";

describe("Re-evaluation Service (Phase 14)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reevaluateTest", () => {
    it("throws error if reason is too short", async () => {
      await expect(
        reevaluateTest({
          testId: "test-1",
          actorId: "admin-1",
          questionId: "q-1",
          action: "KEY_CHANGE",
          newCorrect: "B",
          reason: "bad",
        })
      ).rejects.toThrow("valid reason");
    });

    it("successfully re-evaluates KEY_CHANGE from A to B", async () => {
      (db.test.findUnique as any).mockResolvedValue({
        id: "test-1",
        totalMarks: 100,
        sections: [
          {
            testQuestions: [
              {
                marks: 4,
                negMarks: 1,
                partialMarking: false,
                questionId: "q-1",
                question: {
                  id: "q-1",
                  type: QuestionType.MCQ_SINGLE,
                  correct: "A",
                },
              },
            ],
          },
        ],
        testQuestions: [],
      });

      // Two student attempts: Student 1 chose B (was wrong, now correct), Student 2 chose A (was correct, now wrong)
      (db.attempt.findMany as any).mockResolvedValue([
        {
          id: "att-1",
          score: 0,
          correctCount: 0,
          incorrectCount: 1,
          unattemptedCount: 0,
          answers: [
            {
              id: "ans-1",
              questionId: "q-1",
              response: "B",
              isCorrect: false,
              marksAwarded: -1,
            },
          ],
        },
        {
          id: "att-2",
          score: 10,
          correctCount: 1,
          incorrectCount: 0,
          unattemptedCount: 0,
          answers: [
            {
              id: "ans-2",
              questionId: "q-1",
              response: "A",
              isCorrect: true,
              marksAwarded: 4,
            },
          ],
        },
      ]);

      (db.question.update as any).mockResolvedValue({});
      (db.auditLog.create as any).mockResolvedValue({});

      const result = await reevaluateTest({
        testId: "test-1",
        actorId: "admin-1",
        questionId: "q-1",
        action: "KEY_CHANGE",
        newCorrect: "B",
        reason: "Typo in official answer key, option B is correct",
      });

      expect(result.ok).toBe(true);
      expect(result.attemptsReevaluated).toBe(2);
      expect(result.scoreIncreasedCount).toBe(1); // Student 1 gained +5 marks (-1 to +4)
      expect(result.scoreDecreasedCount).toBe(1); // Student 2 lost -5 marks (+4 to -1)
      expect(db.question.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: { correct: "B" },
      });
      expect(calculateTestRanksAndPercentiles).toHaveBeenCalledWith("test-1");
      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it("successfully awards BONUS_MARKS_ALL to all candidates", async () => {
      (db.test.findUnique as any).mockResolvedValue({
        id: "test-1",
        totalMarks: 100,
        sections: [
          {
            testQuestions: [
              {
                marks: 4,
                negMarks: 1,
                partialMarking: false,
                questionId: "q-ambiguous",
                question: {
                  id: "q-ambiguous",
                  type: QuestionType.MCQ_SINGLE,
                  correct: "A",
                },
              },
            ],
          },
        ],
        testQuestions: [],
      });

      (db.attempt.findMany as any).mockResolvedValue([
        {
          id: "att-1",
          score: 0,
          correctCount: 0,
          incorrectCount: 1,
          unattemptedCount: 0,
          answers: [
            {
              id: "ans-1",
              questionId: "q-ambiguous",
              response: "D",
              isCorrect: false,
              marksAwarded: -1,
            },
          ],
        },
      ]);

      const result = await reevaluateTest({
        testId: "test-1",
        actorId: "admin-1",
        questionId: "q-ambiguous",
        action: "BONUS_MARKS_ALL",
        reason: "Question had ambiguous wording, full marks to all",
      });

      expect(result.ok).toBe(true);
      expect(result.scoreIncreasedCount).toBe(1);
    });

    it("successfully re-evaluates DROP_QUESTION and adjusts totalMarks", async () => {
      (db.test.findUnique as any).mockResolvedValue({
        id: "test-1",
        totalMarks: 100,
        sections: [
          {
            testQuestions: [
              {
                marks: 4,
                negMarks: 1,
                partialMarking: false,
                questionId: "q-err",
                question: {
                  id: "q-err",
                  type: QuestionType.NUMERIC,
                  correct: 42,
                },
              },
            ],
          },
        ],
        testQuestions: [],
      });

      (db.attempt.findMany as any).mockResolvedValue([
        {
          id: "att-1",
          score: 10,
          correctCount: 1,
          incorrectCount: 0,
          unattemptedCount: 0,
          answers: [
            {
              id: "ans-1",
              questionId: "q-err",
              response: "42",
              isCorrect: true,
              marksAwarded: 4,
            },
          ],
        },
      ]);

      (db.test.update as any).mockResolvedValue({});

      const result = await reevaluateTest({
        testId: "test-1",
        actorId: "admin-1",
        questionId: "q-err",
        action: "DROP_QUESTION",
        reason: "Invalid question, dropped from evaluation",
      });

      expect(result.ok).toBe(true);
      expect(db.test.update).toHaveBeenCalledWith({
        where: { id: "test-1" },
        data: { totalMarks: 96 },
      });
    });
  });

  describe("resetStudentAttempt", () => {
    it("ALLOW_REATTEMPT deletes attempt records and recalculates ranks", async () => {
      (db.attempt.findUnique as any).mockResolvedValue({
        id: "att-stuck",
        testId: "test-1",
        score: 10,
        user: { email: "student@example.com" },
        test: { durationMin: 180 },
      });

      (db.attemptAnswer.deleteMany as any).mockResolvedValue({});
      (db.attemptSection.deleteMany as any).mockResolvedValue({});
      (db.attemptViolation.deleteMany as any).mockResolvedValue({});
      (db.attempt.delete as any).mockResolvedValue({});

      const res = await resetStudentAttempt({
        attemptId: "att-stuck",
        actorId: "admin-1",
        action: "ALLOW_REATTEMPT",
        reason: "Browser crashed, student allowed fresh start",
      });

      expect(res.ok).toBe(true);
      expect(db.attempt.delete).toHaveBeenCalledWith({ where: { id: "att-stuck" } });
      expect(calculateTestRanksAndPercentiles).toHaveBeenCalledWith("test-1");
      expect(db.auditLog.create).toHaveBeenCalled();
    });

    it("REOPEN_IN_PROGRESS extends deadline and sets status", async () => {
      const past = new Date(Date.now() - 3600000);
      (db.attempt.findUnique as any).mockResolvedValue({
        id: "att-closed",
        testId: "test-1",
        status: AttemptStatus.AUTO_SUBMITTED,
        deadlineAt: past,
        user: { email: "student@example.com" },
        test: { durationMin: 180 },
      });

      (db.attempt.update as any).mockResolvedValue({});

      const res = await resetStudentAttempt({
        attemptId: "att-closed",
        actorId: "admin-1",
        action: "REOPEN_IN_PROGRESS",
        extraMinutes: 20,
        reason: "Power outage at exam center",
      });

      expect(res.ok).toBe(true);
      expect(db.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-closed" },
          data: expect.objectContaining({
            status: AttemptStatus.IN_PROGRESS,
            submittedAt: null,
          }),
        })
      );
    });
  });

  describe("listTestAttempts", () => {
    it("returns paginated attempts with violation counts", async () => {
      (db.attempt.findMany as any).mockResolvedValue([
        {
          id: "att-1",
          userId: "user-1",
          user: { id: "user-1", name: "Aarav", email: "aarav@test.com", phone: null },
          attemptNo: 1,
          status: AttemptStatus.SUBMITTED,
          startedAt: new Date(),
          deadlineAt: new Date(),
          submittedAt: new Date(),
          score: 85,
          totalMarks: 100,
          rank: 1,
          percentile: 99.5,
          correctCount: 20,
          incorrectCount: 2,
          unattemptedCount: 3,
          violationsCount: 2,
          violations: [
            { id: "v-1", type: "TAB_BLUR", timestamp: new Date(), details: null },
            { id: "v-2", type: "FULLSCREEN_EXIT", timestamp: new Date(), details: null },
          ],
          extraTimeMin: 0,
        },
      ]);
      (db.attempt.count as any).mockResolvedValue(1);

      const result = await listTestAttempts({
        testId: "test-1",
        page: 1,
        pageSize: 10,
      });

      expect(result.attempts.length).toBe(1);
      expect(result.attempts[0].violationsCount).toBe(2);
      expect(result.meta.total).toBe(1);
    });
  });
});

