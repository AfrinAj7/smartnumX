import { describe, it, expect, vi } from "vitest";
import * as xlsx from "xlsx";
import { validateImportFile } from "./import-service";

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    question: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("Bulk Import Service (Phase 10)", () => {
  it("validates valid MCQ and Numerical questions from spreadsheet", async () => {
    // Construct in-memory workbook
    const wb = xlsx.utils.book_new();

    const questionsSheet = xlsx.utils.json_to_sheet([
      {
        question_code: "PHY-TEST-001",
        type: "MCQ_SINGLE",
        subject: "Physics",
        chapter: "Kinematics",
        difficulty: "MEDIUM",
        question_text: "What is the speed of light in vacuum?",
        option_a: "3 x 10^8 m/s",
        option_b: "3 x 10^6 m/s",
        option_c: "3 x 10^4 m/s",
        option_d: "3 x 10^2 m/s",
        correct_answer: "A",
        marks: 4,
        negative_marks: 1,
      },
      {
        question_code: "MAT-TEST-001",
        type: "NUMERIC",
        subject: "Mathematics",
        chapter: "Algebra",
        difficulty: "EASY",
        question_text: "Find the positive root of $x^2 - 16 = 0$.",
        correct_answer: "4",
        numeric_tolerance: "0.01",
        marks: 4,
        negative_marks: 0,
      },
    ]);

    xlsx.utils.book_append_sheet(wb, questionsSheet, "Questions");
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = await validateImportFile(buffer, new Map(), "admin-1", true);

    expect(result.valid).toBe(true);
    expect(result.totalQuestions).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.parsedData.questions[0].correct).toEqual({ answer: "A" });
    expect(result.parsedData.questions[1].correct).toEqual({ answer: 4, min: 3.99, max: 4.01 });
  });

  it("detects errors when question_code or correct_answer is invalid", async () => {
    const wb = xlsx.utils.book_new();

    const questionsSheet = xlsx.utils.json_to_sheet([
      {
        question_code: "", // missing
        type: "MCQ_SINGLE",
        subject: "Chemistry",
        question_text: "Sample chemistry question",
        option_a: "Option A",
        option_b: "Option B",
        correct_answer: "Z", // invalid key
      },
      {
        question_code: "CHM-002",
        type: "NUMERIC",
        subject: "Chemistry",
        question_text: "Sample numeric question",
        correct_answer: "not-a-number", // invalid numeric
      },
    ]);

    xlsx.utils.book_append_sheet(wb, questionsSheet, "Questions");
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = await validateImportFile(buffer, new Map(), "admin-1", true);

    expect(result.valid).toBe(false);
    expect(result.errorCount).toBeGreaterThanOrEqual(3);

    const codeError = result.errors.find((e) => e.field === "question_code");
    expect(codeError).toBeDefined();

    const corrError = result.errors.find((e) => e.field === "correct_answer" && e.row === 2);
    expect(corrError?.message).toContain('Option "Z" is not present');

    const numError = result.errors.find((e) => e.field === "correct_answer" && e.row === 3);
    expect(numError?.message).toContain("Numeric answer must be a valid number");
  });
});

