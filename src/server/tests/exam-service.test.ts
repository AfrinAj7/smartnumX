/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkTestAccess,
  getAttemptExamBundle,
  logViolation,
  submitExamAttempt,
} from "./exam-service";
import { AttemptStatus, ViolationType } from "@prisma/client";

// Mock DB
vi.mock("@/lib/db", () => {
  return {
    db: {
      test: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      enrollment: {
        findFirst: vi.fn(),
      },
      testAssignment: {
        findFirst: vi.fn(),
      },
      attempt: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      attemptAnswer: {
        upsert: vi.fn(),
        createMany: vi.fn(),
        updateMany: vi.fn(),
      },
      attemptSection: {
        createMany: vi.fn(),
      },
      attemptViolation: {
        create: vi.fn(),
      },
      question: {
        updateMany: vi.fn(),
      },
      testSection: {
        findMany: vi.fn(),
      },
      testQuestion: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

import { db } from "@/lib/db";

describe("Exam Service (Phase 11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkTestAccess", () => {
    it("grants immediate access to SUPER_ADMIN", async () => {
      vi.mocked(db.test.findFirst).mockResolvedValue({
        id: "test-1",
        code: "MOCK-1",
        title: "Mock 1",
        status: "PUBLISHED",
        isFreePreview: false,
        courseId: "course-1",
        durationMin: 180,
        totalMarks: 300,
        passMarks: null,
        lateStartRule: "FULL_TIME",
        graceSeconds: 300,
        maxAttempts: 3,
        requireFullscreen: true,
        maxViolations: 3,
        opensAt: null,
        closesAt: null,
        instructions: "Read carefully",
      } as any);

      const result = await checkTestAccess("admin-1", "SUPER_ADMIN", "test-1");
      expect(result.hasAccess).toBe(true);
      expect(result.test.code).toBe("MOCK-1");
    });

    it("grants access to free preview tests without enrollment", async () => {
      vi.mocked(db.test.findFirst).mockResolvedValue({
        id: "test-free",
        code: "FREE-1",
        title: "Free Diagnostic",
        status: "PUBLISHED",
        isFreePreview: true,
        courseId: "course-1",
        durationMin: 60,
        totalMarks: 100,
        passMarks: 40,
        lateStartRule: "FULL_TIME",
        graceSeconds: 120,
        maxAttempts: 1,
        requireFullscreen: false,
        maxViolations: 0,
        opensAt: null,
        closesAt: null,
        instructions: null,
      } as any);

      const result = await checkTestAccess("student-1", "STUDENT", "test-free");
      expect(result.hasAccess).toBe(true);
    });

    it("denies access if student is not enrolled in the parent course", async () => {
      vi.mocked(db.test.findFirst).mockResolvedValue({
        id: "test-paid",
        code: "JEE-ADV-01",
        title: "JEE Advanced Mock 1",
        status: "PUBLISHED",
        isFreePreview: false,
        courseId: "course-jee",
        durationMin: 180,
        totalMarks: 360,
        passMarks: null,
        lateStartRule: "FULL_TIME",
        graceSeconds: 300,
        maxAttempts: 1,
        requireFullscreen: true,
        maxViolations: 3,
        opensAt: null,
        closesAt: null,
        instructions: null,
      } as any);

      vi.mocked(db.enrollment.findFirst).mockResolvedValue(null);
      vi.mocked(db.testAssignment.findFirst).mockResolvedValue(null);

      const result = await checkTestAccess("student-unpaid", "STUDENT", "test-paid");
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain("not enrolled in the test series");
    });
  });

  describe("getAttemptExamBundle", () => {
    it("sanitizes questions and strips correct answers and explanations", async () => {
      const futureDeadline = new Date(Date.now() + 60 * 60 * 1000);

      vi.mocked(db.attempt.findFirst).mockResolvedValue({
        id: "att-1",
        userId: "student-1",
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        deadlineAt: futureDeadline,
        violationsCount: 0,
        test: {
          id: "test-1",
          code: "JEE-01",
          title: "JEE Mock 1",
          durationMin: 180,
          totalMarks: 300,
          requireFullscreen: true,
          maxViolations: 5,
          instructions: "Test instructions",
          graceSeconds: 120,
          sections: [
            {
              id: "sec-phy",
              name: "Physics",
              order: 1,
              durationMin: null,
              maxToAttempt: null,
              testQuestions: [
                {
                  marks: 4,
                  negMarks: 1,
                  order: 1,
                  question: {
                    id: "q-101",
                    code: "PHY-001",
                    type: "MCQ_SINGLE",
                    subject: "Physics",
                    chapter: "Kinematics",
                    stem: "What is acceleration?",
                    stemImage: null,
                    options: [{ id: "A", text: "Rate of change of velocity" }],
                    // DB query explicitly omits correct & explanation
                  },
                },
              ],
            },
          ],
          testQuestions: [],
        },
        answers: [],
        sectionStates: [],
      } as any);

      const bundle = await getAttemptExamBundle("student-1", "att-1");

      expect(bundle.attemptId).toBe("att-1");
      expect(bundle.sections.length).toBe(1);
      const question = bundle.sections[0].questions[0];

      // Verifications of sanitization
      expect(question.stem).toBe("What is acceleration?");
      expect((question as any).correct).toBeUndefined();
      expect((question as any).explanation).toBeUndefined();
      expect((question as any).solutionImage).toBeUndefined();
    });
  });

  describe("logViolation", () => {
    it("increments violation count and auto-submits when threshold is exceeded", async () => {
      vi.mocked(db.attempt.findFirst).mockResolvedValue({
        id: "att-viol",
        userId: "student-1",
        status: AttemptStatus.IN_PROGRESS,
        test: { maxViolations: 2 },
      } as any);

      vi.mocked(db.attemptViolation.create).mockResolvedValue({} as any);
      vi.mocked(db.attempt.update)
        .mockResolvedValueOnce({ id: "att-viol", violationsCount: 2 } as any)
        .mockResolvedValueOnce({ id: "att-viol", status: AttemptStatus.AUTO_SUBMITTED } as any);

      const res = await logViolation("student-1", "att-viol", ViolationType.TAB_BLUR, "Left window");

      expect(res.autoSubmitted).toBe(true);
      expect(res.violationsCount).toBe(2);
      expect(db.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-viol" },
          data: expect.objectContaining({ status: AttemptStatus.AUTO_SUBMITTED }),
        })
      );
    });
  });

  describe("submitExamAttempt", () => {
    it("submits the attempt and locks questions for immutability", async () => {
      vi.mocked(db.attempt.findFirst).mockResolvedValue({
        id: "att-submit",
        userId: "student-1",
        status: AttemptStatus.IN_PROGRESS,
        test: {
          testQuestions: [{ questionId: "q-1" }, { questionId: "q-2" }],
        },
      } as any);

      vi.mocked(db.attempt.findUnique).mockResolvedValue({
        id: "att-submit",
        testId: "test-1",
        test: { totalMarks: 100, sections: [], testQuestions: [] },
        answers: [],
      } as any);

      vi.mocked(db.attempt.update).mockResolvedValue({} as any);
      vi.mocked(db.question.updateMany).mockResolvedValue({ count: 2 } as any);

      const result = await submitExamAttempt("student-1", "att-submit");

      expect(result.ok).toBe(true);
      expect(db.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-submit" },
          data: expect.objectContaining({ status: AttemptStatus.SUBMITTED }),
        })
      );

      // Verify question locking
      expect(db.question.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["q-1", "q-2"] }, isLocked: false },
        data: { isLocked: true },
      });
    });
  });
});
