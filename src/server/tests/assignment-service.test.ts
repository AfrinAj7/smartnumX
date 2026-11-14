/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  assignTestToStudent,
  bulkAssignTest,
  revokeTestAssignment,
  getTestSeriesTestsForStudent,
} from "./assignment-service";
import { AssignmentSource, AttemptStatus, TestStatus } from "@prisma/client";

// Mock DB
vi.mock("@/lib/db", () => {
  return {
    db: {
      test: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      course: {
        findFirst: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      testAssignment: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      enrollment: {
        findFirst: vi.fn(),
      },
      attempt: {
        findMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
  };
});

import { db } from "@/lib/db";

describe("Assignment Service (Phase 13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("assignTestToStudent", () => {
    it("should create or update a direct test assignment and log to auditLog", async () => {
      (db.test.findFirst as any).mockResolvedValue({
        id: "test-123",
        code: "MOCK-01",
        title: "JEE Mock 1",
      });
      (db.user.findFirst as any).mockResolvedValue({
        id: "user-456",
        email: "student@test.com",
      });
      (db.testAssignment.upsert as any).mockResolvedValue({
        id: "assign-1",
        testId: "test-123",
        userId: "user-456",
        source: AssignmentSource.ADMIN_GRANT,
        validUntil: null,
      });

      const res = await assignTestToStudent({
        testId: "test-123",
        userId: "user-456",
        actorId: "admin-1",
        notes: "Scholarship student",
      });

      expect(res.id).toBe("assign-1");
      expect(db.testAssignment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { testId_userId: { testId: "test-123", userId: "user-456" } },
          create: expect.objectContaining({
            testId: "test-123",
            userId: "user-456",
            source: AssignmentSource.ADMIN_GRANT,
          }),
        })
      );
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "TEST_ASSIGNMENT_GRANTED",
            entityType: "TestAssignment",
          }),
        })
      );
    });

    it("should throw error if test does not exist", async () => {
      (db.test.findFirst as any).mockResolvedValue(null);

      await expect(
        assignTestToStudent({ testId: "non-existent", userId: "user-1" })
      ).rejects.toThrow("Test not found");
    });
  });

  describe("bulkAssignTest", () => {
    it("should assign all matching users by email and track failed users", async () => {
      (db.test.findFirst as any).mockResolvedValue({
        id: "test-100",
        code: "MOCK-100",
        title: "Chemistry Drill",
      });
      (db.user.findMany as any).mockResolvedValue([
        { id: "u-1", email: "alpha@test.com", name: "Alpha" },
        { id: "u-2", email: "beta@test.com", name: "Beta" },
      ]);
      (db.testAssignment.upsert as any).mockResolvedValue({ id: "mock-assign" });

      const res = await bulkAssignTest({
        testId: "test-100",
        identifiers: ["alpha@test.com", "beta@test.com", "gamma-not-found@test.com"],
        actorId: "super-admin",
      });

      expect(res.successCount).toBe(2);
      expect(res.failureCount).toBe(1);
      expect(res.failed[0].identifier).toBe("gamma-not-found@test.com");
      expect(db.testAssignment.upsert).toHaveBeenCalledTimes(2);
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "BULK_TEST_ASSIGNMENT_GRANTED",
          }),
        })
      );
    });
  });

  describe("revokeTestAssignment", () => {
    it("should delete assignment and write audit record", async () => {
      (db.testAssignment.findFirst as any).mockResolvedValue({
        id: "assign-del-1",
        testId: "test-1",
        userId: "u-1",
      });
      (db.testAssignment.delete as any).mockResolvedValue({ id: "assign-del-1" });

      const res = await revokeTestAssignment({
        testId: "test-1",
        userId: "u-1",
        actorId: "admin-1",
        reason: "Trial expired",
      });

      expect(res.success).toBe(true);
      expect(db.testAssignment.delete).toHaveBeenCalledWith({
        where: { id: "assign-del-1" },
      });
      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "TEST_ASSIGNMENT_REVOKED",
          }),
        })
      );
    });
  });

  describe("getTestSeriesTestsForStudent (Entitlement Engine)", () => {
    it("should mark tests UNLOCKED for enrolled student and surface attempts", async () => {
      (db.course.findFirst as any).mockResolvedValue({
        id: "course-jee",
        slug: "jee-test-series-2026",
        title: "JEE 2026 Mock Series",
        productType: "TEST_SERIES",
      });
      (db.enrollment.findFirst as any).mockResolvedValue({
        id: "enr-1",
        courseId: "course-jee",
        status: "ACTIVE",
      });
      (db.test.findMany as any).mockResolvedValue([
        {
          id: "t-1",
          code: "MOCK-1",
          title: "Full Mock 1",
          type: "FULL_MOCK",
          status: TestStatus.PUBLISHED,
          durationMin: 180,
          totalMarks: 300,
          passMarks: 120,
          isFreePreview: false,
          opensAt: null,
          closesAt: null,
          maxAttempts: 2,
          _count: { testQuestions: 75 },
        },
      ]);
      (db.testAssignment.findMany as any).mockResolvedValue([]);
      (db.attempt.findMany as any).mockResolvedValue([
        {
          id: "att-1",
          testId: "t-1",
          status: AttemptStatus.SUBMITTED,
          score: 245,
          startedAt: new Date(),
          submittedAt: new Date(),
        },
      ]);

      const res = await getTestSeriesTestsForStudent("jee-test-series-2026", "student-user", "STUDENT");

      expect(res.course.isEnrolled).toBe(true);
      expect(res.tests.length).toBe(1);
      const testItem = res.tests[0];
      expect(testItem.hasAccess).toBe(true);
      expect(testItem.accessType).toBe("ENROLLED");
      expect(testItem.attemptStatus).toBe("SUBMITTED");
      expect(testItem.bestScore).toBe(245);
      expect(testItem.canAttempt).toBe(true); // 1 done, 2 allowed
    });

    it("should allow FREE_PREVIEW test for unenrolled student while locking regular tests", async () => {
      (db.course.findFirst as any).mockResolvedValue({
        id: "course-jee",
        slug: "jee-test-series-2026",
        title: "JEE 2026 Mock Series",
        productType: "TEST_SERIES",
      });
      (db.enrollment.findFirst as any).mockResolvedValue(null);
      (db.test.findMany as any).mockResolvedValue([
        {
          id: "t-free",
          code: "FREE-01",
          title: "Diagnostic Test (Free)",
          type: "FULL_MOCK",
          status: TestStatus.PUBLISHED,
          durationMin: 90,
          totalMarks: 100,
          passMarks: 40,
          isFreePreview: true,
          opensAt: null,
          closesAt: null,
          maxAttempts: 1,
          _count: { testQuestions: 25 },
        },
        {
          id: "t-paid",
          code: "FULL-02",
          title: "Advanced Simulation 2",
          type: "FULL_MOCK",
          status: TestStatus.PUBLISHED,
          durationMin: 180,
          totalMarks: 300,
          passMarks: 120,
          isFreePreview: false,
          opensAt: null,
          closesAt: null,
          maxAttempts: 1,
          _count: { testQuestions: 75 },
        },
      ]);
      (db.testAssignment.findMany as any).mockResolvedValue([]);
      (db.attempt.findMany as any).mockResolvedValue([]);

      const res = await getTestSeriesTestsForStudent("jee-test-series-2026", "guest-user", "STUDENT");

      expect(res.course.isEnrolled).toBe(false);
      expect(res.tests.length).toBe(2);

      const freeTest = res.tests.find((t) => t.id === "t-free")!;
      expect(freeTest.hasAccess).toBe(true);
      expect(freeTest.accessType).toBe("FREE_PREVIEW");

      const paidTest = res.tests.find((t) => t.id === "t-paid")!;
      expect(paidTest.hasAccess).toBe(false);
      expect(paidTest.accessType).toBe("LOCKED");
      expect(paidTest.canAttempt).toBe(false);
    });

    it("should recognize direct assignment for unenrolled student", async () => {
      (db.course.findFirst as any).mockResolvedValue({
        id: "course-1",
        slug: "series-1",
        title: "Series 1",
        productType: "TEST_SERIES",
      });
      (db.enrollment.findFirst as any).mockResolvedValue(null);
      (db.test.findMany as any).mockResolvedValue([
        {
          id: "t-assigned",
          code: "SPECIAL-01",
          title: "Special Paper",
          type: "FULL_MOCK",
          status: TestStatus.PUBLISHED,
          durationMin: 60,
          totalMarks: 100,
          passMarks: 50,
          isFreePreview: false,
          opensAt: null,
          closesAt: null,
          maxAttempts: 1,
          _count: { testQuestions: 30 },
        },
      ]);
      (db.testAssignment.findMany as any).mockResolvedValue([{ testId: "t-assigned" }]);
      (db.attempt.findMany as any).mockResolvedValue([]);

      const res = await getTestSeriesTestsForStudent("series-1", "student-granted", "STUDENT");

      const assignedTest = res.tests[0];
      expect(assignedTest.hasAccess).toBe(true);
      expect(assignedTest.accessType).toBe("DIRECT_ASSIGNMENT");
      expect(assignedTest.canAttempt).toBe(true);
    });
  });
});

