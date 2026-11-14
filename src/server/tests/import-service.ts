import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import * as xlsx from "xlsx";
import JSZip from "jszip";
import path from "node:path";
import { uploadDirectMedia } from "@/server/media/homepage-upload";

export interface ImportError {
  sheet: string;
  row: number;
  code?: string;
  field: string;
  message: string;
}

export interface ParsedTestRow {
  test_code: string;
  title: string;
  type: "FULL_MOCK" | "CHAPTER" | "SECTIONAL" | "DIAGNOSTIC";
  duration_min: number;
  opens_at?: string;
  closes_at?: string;
  late_start_rule: "REDUCE_TIME" | "FULL_TIME";
  grace_seconds: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  result_mode: "INSTANT" | "AFTER_WINDOW" | "MANUAL";
  solution_mode: "AFTER_SUBMIT" | "AFTER_WINDOW" | "NEVER";
  require_fullscreen: boolean;
  max_violations: number;
  free_preview: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  instructions?: string;
}

export interface ParsedSectionRow {
  test_code: string;
  section: string;
  order: number;
  duration_min?: number;
  attempt_any_n?: number;
}

export interface ParsedQuestionRow {
  rowNumber: number;
  test_code?: string;
  section?: string;
  q_no?: number;
  question_code: string;
  type: "MCQ_SINGLE" | "MCQ_MULTI" | "NUMERIC" | "TRUE_FALSE";
  subject: string;
  chapter?: string;
  topic?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  question_text: string;
  question_image?: string;
  options?: Array<{ id: string; text: string }>;
  correct: Record<string, unknown>;
  marks: number;
  negative_marks: number;
  partial_marking?: boolean;
  explanation?: string;
  solution_image?: string;
  isExisting?: boolean;
  isLocked?: boolean;
  versionAction?: "NEW" | "UPDATE" | "BRANCH";
}

export interface DryRunResult {
  valid: boolean;
  totalQuestions: number;
  validQuestions: number;
  errorCount: number;
  testsCount: number;
  sectionsCount: number;
  errors: ImportError[];
  previewQuestions: ParsedQuestionRow[];
  parsedData: {
    tests: ParsedTestRow[];
    sections: ParsedSectionRow[];
    questions: ParsedQuestionRow[];
  };
}

/**
 * Safely extracts images from uploaded ZIP archive.
 */
export async function extractZipImages(zipBuffer: Buffer): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();
  const zip = await JSZip.loadAsync(zipBuffer);
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];

  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    // Security check: Prevent Zip-Slip attacks
    const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");
    if (normalized.includes("..") || path.isAbsolute(normalized)) {
      throw new Error(`Suspicious path in ZIP: ${relativePath}`);
    }

    const fileName = path.basename(normalized);
    const ext = path.extname(fileName).toLowerCase();
    if (!allowedExtensions.includes(ext)) continue;

    const fileBuffer = await file.async("nodebuffer");
    if (fileBuffer.length > 10 * 1024 * 1024) {
      throw new Error(`Image ${fileName} exceeds the 10MB limit.`);
    }

    // Upload via media service or store locally
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";
    else if (ext === ".svg") mimeType = "image/svg+xml";
    else if (ext === ".gif") mimeType = "image/gif";

    const upload = await uploadDirectMedia(fileBuffer, fileName, mimeType);
    imageMap.set(fileName.toLowerCase(), upload.mediaUrl);
    imageMap.set(relativePath.toLowerCase(), upload.mediaUrl);
  }

  return imageMap;
}

/**
 * Validates Excel or CSV file against Question & Test schemas with a comprehensive Dry-Run report.
 */
export async function validateImportFile(
  fileBuffer: Buffer,
  imageMap: Map<string, string>,
  actorId: string,
  isSuperAdmin: boolean,
): Promise<DryRunResult> {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const errors: ImportError[] = [];

  const parsedTests: ParsedTestRow[] = [];
  const parsedSections: ParsedSectionRow[] = [];
  const parsedQuestions: ParsedQuestionRow[] = [];

  // 1. Process "Tests" sheet if present
  if (workbook.SheetNames.includes("Tests")) {
    const rawTests = xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Tests"]);
    rawTests.forEach((row, idx) => {
      const rowNum = idx + 2;
      const testCode = String(row["test_code"] || "").trim();
      const title = String(row["title"] || "").trim();
      const typeStr = String(row["type"] || "FULL_MOCK").trim().toUpperCase();
      const durationMin = parseInt(String(row["duration_min"] || "180"), 10);

      if (!testCode) {
        errors.push({ sheet: "Tests", row: rowNum, field: "test_code", message: "test_code is required." });
      }
      if (!title) {
        errors.push({ sheet: "Tests", row: rowNum, field: "title", message: "title is required." });
      }

      const validTypes = ["FULL_MOCK", "CHAPTER", "SECTIONAL", "DIAGNOSTIC"];
      if (!validTypes.includes(typeStr)) {
        errors.push({ sheet: "Tests", row: rowNum, field: "type", message: `Invalid test type "${typeStr}". Must be FULL_MOCK, CHAPTER, SECTIONAL, or DIAGNOSTIC.` });
      }

      parsedTests.push({
        test_code: testCode,
        title,
        type: (validTypes.includes(typeStr) ? typeStr : "FULL_MOCK") as ParsedTestRow["type"],
        duration_min: isNaN(durationMin) || durationMin <= 0 ? 180 : durationMin,
        late_start_rule: String(row["late_start_rule"] || "").toUpperCase() === "FULL_TIME" ? "FULL_TIME" : "REDUCE_TIME",
        grace_seconds: parseInt(String(row["grace_seconds"] || "10"), 10) || 10,
        max_attempts: parseInt(String(row["max_attempts (0 = unlimited)"] || row["max_attempts"] || "1"), 10) || 1,
        shuffle_questions: String(row["shuffle_questions"] || "").toUpperCase() === "YES",
        shuffle_options: String(row["shuffle_options"] || "").toUpperCase() === "YES",
        result_mode: "INSTANT",
        solution_mode: "AFTER_SUBMIT",
        require_fullscreen: String(row["require_fullscreen"] || "").toUpperCase() === "YES",
        max_violations: parseInt(String(row["max_violations (0 = off)"] || row["max_violations"] || "0"), 10) || 0,
        free_preview: String(row["free_preview"] || "").toUpperCase() === "YES",
        status: String(row["status"] || "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        instructions: String(row["instructions"] || "").trim() || undefined,
      });
    });
  }

  // 2. Process "Sections" sheet if present
  if (workbook.SheetNames.includes("Sections")) {
    const rawSections = xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Sections"]);
    rawSections.forEach((row, idx) => {
      const rowNum = idx + 2;
      const testCode = String(row["test_code"] || "").trim();
      const secName = String(row["section"] || row["name"] || "").trim();
      const order = parseInt(String(row["order"] || idx + 1), 10);
      const durMin = row["duration_min (blank = shared time)"] || row["duration_min"];
      const attemptAny = row["attempt_any_n (blank = all)"] || row["attempt_any_n"];

      if (!testCode) {
        errors.push({ sheet: "Sections", row: rowNum, field: "test_code", message: "test_code is required for section." });
      }
      if (!secName) {
        errors.push({ sheet: "Sections", row: rowNum, field: "section", message: "section name is required." });
      }

      parsedSections.push({
        test_code: testCode,
        section: secName,
        order: isNaN(order) ? idx + 1 : order,
        duration_min: durMin ? parseInt(String(durMin), 10) : undefined,
        attempt_any_n: attemptAny ? parseInt(String(attemptAny), 10) : undefined,
      });
    });
  }

  // 3. Process "Questions" sheet (or fallback to first sheet if CSV/single-sheet)
  const questionSheetName = workbook.SheetNames.includes("Questions")
    ? "Questions"
    : workbook.SheetNames[0];

  const rawQuestions = xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[questionSheetName]);

  // Pre-fetch all matching question codes from DB to check ownership & immutability
  const questionCodes = rawQuestions
    .map((r) => String(r["question_code"] || "").trim())
    .filter(Boolean);

  const existingDbQuestions = await db.question.findMany({
    where: { code: { in: questionCodes } },
    include: {
      _count: { select: { attemptAnswers: true } },
    },
  });

  const existingMap = new Map(existingDbQuestions.map((q) => [q.code, q]));

  rawQuestions.forEach((row, idx) => {
    const rowNum = idx + 2;
    const qCode = String(row["question_code"] || "").trim();
    const typeStr = String(row["type"] || row["question_type"] || "MCQ_SINGLE").trim().toUpperCase();
    const subject = String(row["subject"] || "").trim();
    const questionText = String(row["question_text"] || row["stem"] || "").trim();
    const testCode = String(row["test_code"] || "").trim() || undefined;
    const sectionName = String(row["section"] || "").trim() || undefined;

    if (!qCode) {
      errors.push({ sheet: questionSheetName, row: rowNum, field: "question_code", message: "question_code is required." });
    }
    if (!subject) {
      errors.push({ sheet: questionSheetName, row: rowNum, code: qCode, field: "subject", message: "subject is required (e.g. Mathematics, Physics, Chemistry)." });
    }
    if (!questionText) {
      errors.push({ sheet: questionSheetName, row: rowNum, code: qCode, field: "question_text", message: "question_text is required." });
    }

    const validQTypes = ["MCQ_SINGLE", "MCQ_MULTI", "NUMERIC", "TRUE_FALSE"];
    if (!validQTypes.includes(typeStr)) {
      errors.push({
        sheet: questionSheetName,
        row: rowNum,
        code: qCode,
        field: "type",
        message: `Invalid question type "${typeStr}". Must be MCQ_SINGLE, MCQ_MULTI, NUMERIC, or TRUE_FALSE.`,
      });
    }

    // Resolve Image if mapped in ZIP
    let qImage = String(row["question_image"] || row["stem_image"] || "").trim() || undefined;
    if (qImage && imageMap.has(qImage.toLowerCase())) {
      qImage = imageMap.get(qImage.toLowerCase());
    }

    let solImage = String(row["solution_image"] || "").trim() || undefined;
    if (solImage && imageMap.has(solImage.toLowerCase())) {
      solImage = imageMap.get(solImage.toLowerCase());
    }

    // Options extraction
    let options: Array<{ id: string; text: string }> | undefined;
    if (typeStr === "MCQ_SINGLE" || typeStr === "MCQ_MULTI") {
      options = [];
      ["a", "b", "c", "d", "e", "f"].forEach((char) => {
        const optVal = String(row[`option_${char}`] || row[`option_${char.toUpperCase()}`] || "").trim();
        if (optVal) {
          options?.push({ id: char.toUpperCase(), text: optVal });
        }
      });

      if (options.length < 2) {
        errors.push({
          sheet: questionSheetName,
          row: rowNum,
          code: qCode,
          field: "options",
          message: `MCQ question requires at least 2 options (option_a and option_b).`,
        });
      }
    } else if (typeStr === "TRUE_FALSE") {
      options = [
        { id: "A", text: String(row["option_a"] || "True").trim() },
        { id: "B", text: String(row["option_b"] || "False").trim() },
      ];
    }

    // Correct Answer parsing & validation
    const rawCorrect = String(row["correct_answer"] || row["correct"] || "").trim();
    let correctObj: Record<string, unknown> = {};

    if (!rawCorrect) {
      errors.push({ sheet: questionSheetName, row: rowNum, code: qCode, field: "correct_answer", message: "correct_answer is required." });
    } else if (typeStr === "MCQ_SINGLE") {
      const char = rawCorrect.toUpperCase();
      if (!options?.some((o) => o.id === char)) {
        errors.push({
          sheet: questionSheetName,
          row: rowNum,
          code: qCode,
          field: "correct_answer",
          message: `Option "${char}" is not present in options list (${options?.map((o) => o.id).join(", ")}).`,
        });
      }
      correctObj = { answer: char };
    } else if (typeStr === "MCQ_MULTI") {
      const keys = rawCorrect
        .toUpperCase()
        .split(/[,;\s]+/)
        .map((k) => k.trim())
        .filter(Boolean);
      const invalid = keys.filter((k) => !options?.some((o) => o.id === k));
      if (invalid.length > 0) {
        errors.push({
          sheet: questionSheetName,
          row: rowNum,
          code: qCode,
          field: "correct_answer",
          message: `Keys [${invalid.join(", ")}] are not in options list.`,
        });
      }
      correctObj = { answer: keys };
    } else if (typeStr === "NUMERIC") {
      const num = parseFloat(rawCorrect);
      if (isNaN(num)) {
        errors.push({ sheet: questionSheetName, row: rowNum, code: qCode, field: "correct_answer", message: `Numeric answer must be a valid number, got "${rawCorrect}".` });
      }
      const tolerance = parseFloat(String(row["numeric_tolerance"] || "0.01")) || 0.01;
      correctObj = {
        answer: num,
        min: num - tolerance,
        max: num + tolerance,
      };
    } else if (typeStr === "TRUE_FALSE") {
      const upper = rawCorrect.toUpperCase();
      const val = upper === "TRUE" || upper === "A" ? "A" : "B";
      correctObj = { answer: val };
    }

    // Check DB ownership & locked status
    const existing = existingMap.get(qCode);
    let versionAction: ParsedQuestionRow["versionAction"] = "NEW";

    if (existing) {
      // Ownership check
      if (!isSuperAdmin && existing.createdById && existing.createdById !== actorId) {
        errors.push({
          sheet: questionSheetName,
          row: rowNum,
          code: qCode,
          field: "question_code",
          message: `Question "${qCode}" belongs to another instructor and cannot be modified.`,
        });
      }

      if (existing._count.attemptAnswers > 0 || existing.isLocked) {
        versionAction = "BRANCH";
      } else {
        versionAction = "UPDATE";
      }
    }

    const marks = parseFloat(String(row["marks"] || "4")) || 4;
    const negMarks = parseFloat(String(row["negative_marks"] || row["neg_marks"] || "1")) || 0;

    parsedQuestions.push({
      rowNumber: rowNum,
      test_code: testCode,
      section: sectionName,
      q_no: parseInt(String(row["q_no"] || idx + 1), 10),
      question_code: qCode,
      type: (validQTypes.includes(typeStr) ? typeStr : "MCQ_SINGLE") as ParsedQuestionRow["type"],
      subject,
      chapter: String(row["chapter"] || "").trim() || undefined,
      topic: String(row["topic"] || "").trim() || undefined,
      difficulty: ["EASY", "MEDIUM", "HARD"].includes(String(row["difficulty"] || "").toUpperCase())
        ? (String(row["difficulty"]).toUpperCase() as "EASY" | "MEDIUM" | "HARD")
        : "MEDIUM",
      question_text: questionText,
      question_image: qImage,
      options,
      correct: correctObj,
      marks,
      negative_marks: negMarks,
      partial_marking: String(row["partial_marking"] || "").toUpperCase() === "YES",
      explanation: String(row["explanation"] || "").trim() || undefined,
      solution_image: solImage,
      isExisting: Boolean(existing),
      isLocked: Boolean(existing?.isLocked || (existing && existing._count.attemptAnswers > 0)),
      versionAction,
    });
  });

  return {
    valid: errors.length === 0,
    totalQuestions: parsedQuestions.length,
    validQuestions: parsedQuestions.length - errors.filter((e) => e.sheet === questionSheetName).length,
    errorCount: errors.length,
    testsCount: parsedTests.length,
    sectionsCount: parsedSections.length,
    errors,
    previewQuestions: parsedQuestions.slice(0, 10),
    parsedData: {
      tests: parsedTests,
      sections: parsedSections,
      questions: parsedQuestions,
    },
  };
}

/**
 * Executes the bulk import into Database, creating Questions, Tests, Sections, and TestQuestion mappings.
 */
export async function executeImport(
  data: DryRunResult["parsedData"],
  fileName: string,
  fileSize: number,
  actorId: string,
) {
  // Record ImportJob
  const importJob = await db.importJob.create({
    data: {
      createdById: actorId,
      fileName,
      fileSize,
      status: "PROCESSING",
      totalRows: data.questions.length,
      successCount: 0,
      errorCount: 0,
    },
  });

  const createdTestMap = new Map<string, string>(); // code -> id
  const createdSectionMap = new Map<string, string>(); // "testId:secName" -> sectionId

  // 1. Create or Update Tests
  for (const t of data.tests) {
    const upsertedTest = await db.test.upsert({
      where: { code: t.test_code },
      update: {
        title: t.title,
        type: t.type,
        durationMin: t.duration_min,
        lateStartRule: t.late_start_rule,
        graceSeconds: t.grace_seconds,
        maxAttempts: t.max_attempts,
        shuffleQuestions: t.shuffle_questions,
        shuffleOptions: t.shuffle_options,
        requireFullscreen: t.require_fullscreen,
        maxViolations: t.max_violations,
        isFreePreview: t.free_preview,
        status: t.status,
        instructions: t.instructions,
      },
      create: {
        code: t.test_code,
        title: t.title,
        type: t.type,
        durationMin: t.duration_min,
        lateStartRule: t.late_start_rule,
        graceSeconds: t.grace_seconds,
        maxAttempts: t.max_attempts,
        shuffleQuestions: t.shuffle_questions,
        shuffleOptions: t.shuffle_options,
        requireFullscreen: t.require_fullscreen,
        maxViolations: t.max_violations,
        isFreePreview: t.free_preview,
        status: t.status,
        instructions: t.instructions,
        totalMarks: new Prisma.Decimal(0),
      },
    });
    createdTestMap.set(t.test_code, upsertedTest.id);
  }

  // 2. Create Sections
  for (const s of data.sections) {
    let testId = createdTestMap.get(s.test_code);
    if (!testId) {
      const existing = await db.test.findUnique({ where: { code: s.test_code } });
      if (existing) {
        testId = existing.id;
        createdTestMap.set(s.test_code, existing.id);
      }
    }

    if (testId) {
      let sec = await db.testSection.findFirst({
        where: { testId, name: s.section },
      });
      if (!sec) {
        sec = await db.testSection.create({
          data: {
            testId,
            name: s.section,
            order: s.order,
            durationMin: s.duration_min || null,
            maxToAttempt: s.attempt_any_n || null,
          },
        });
      }
      createdSectionMap.set(`${testId}:${s.section}`, sec.id);
    }
  }

  // 3. Create or Branch Questions & Map to Tests
  let successCount = 0;
  const affectedTestIds = new Set<string>();

  for (const q of data.questions) {
    let questionRecord;

    if (q.versionAction === "BRANCH") {
      // Fetch current version to branch
      const current = await db.question.findUnique({ where: { code: q.question_code } });
      const nextVersion = (current?.version ?? 1) + 1;
      const branchCode = `${q.question_code}-v${nextVersion}`;

      questionRecord = await db.question.create({
        data: {
          code: branchCode,
          version: nextVersion,
          parentId: current?.id || null,
          isLocked: false,
          type: q.type,
          subject: q.subject,
          chapter: q.chapter,
          topic: q.topic,
          difficulty: q.difficulty,
          stem: q.question_text,
          stemImage: q.question_image,
          options: q.options ? q.options : Prisma.JsonNull,
          correct: q.correct as Prisma.InputJsonValue,
          explanation: q.explanation,
          solutionImage: q.solution_image,
          createdById: actorId,
        },
      });
    } else {
      questionRecord = await db.question.upsert({
        where: { code: q.question_code },
        update: {
          type: q.type,
          subject: q.subject,
          chapter: q.chapter,
          topic: q.topic,
          difficulty: q.difficulty,
          stem: q.question_text,
          stemImage: q.question_image,
          options: q.options ? q.options : Prisma.JsonNull,
          correct: q.correct as Prisma.InputJsonValue,
          explanation: q.explanation,
          solutionImage: q.solution_image,
        },
        create: {
          code: q.question_code,
          version: 1,
          type: q.type,
          subject: q.subject,
          chapter: q.chapter,
          topic: q.topic,
          difficulty: q.difficulty,
          stem: q.question_text,
          stemImage: q.question_image,
          options: q.options ? q.options : Prisma.JsonNull,
          correct: q.correct as Prisma.InputJsonValue,
          explanation: q.explanation,
          solutionImage: q.solution_image,
          createdById: actorId,
        },
      });
    }

    successCount++;

    // Assign to Test & Section if specified
    if (q.test_code) {
      let testId = createdTestMap.get(q.test_code);
      if (!testId) {
        const foundTest = await db.test.findUnique({ where: { code: q.test_code } });
        if (foundTest) {
          testId = foundTest.id;
          createdTestMap.set(q.test_code, testId);
        }
      }

      if (testId) {
        affectedTestIds.add(testId);
        let sectionId: string | undefined;

        if (q.section) {
          sectionId = createdSectionMap.get(`${testId}:${q.section}`);
          if (!sectionId) {
            // Auto create section if not exists
            const autoSec = await db.testSection.create({
              data: {
                testId,
                name: q.section,
                order: 1,
              },
            });
            sectionId = autoSec.id;
            createdSectionMap.set(`${testId}:${q.section}`, autoSec.id);
          }
        }

        await db.testQuestion.upsert({
          where: {
            testId_questionId: {
              testId,
              questionId: questionRecord.id,
            },
          },
          update: {
            sectionId: sectionId || null,
            marks: new Prisma.Decimal(q.marks),
            negMarks: new Prisma.Decimal(q.negative_marks),
            order: q.q_no || 1,
            partialMarking: q.partial_marking || false,
          },
          create: {
            testId,
            questionId: questionRecord.id,
            sectionId: sectionId || null,
            marks: new Prisma.Decimal(q.marks),
            negMarks: new Prisma.Decimal(q.negative_marks),
            order: q.q_no || 1,
            partialMarking: q.partial_marking || false,
          },
        });
      }
    }
  }

  // Recalculate marks for affected tests
  for (const testId of affectedTestIds) {
    const allQ = await db.testQuestion.findMany({
      where: { testId },
      select: { marks: true },
    });
    const sum = allQ.reduce((acc, item) => acc + Number(item.marks), 0);
    await db.test.update({
      where: { id: testId },
      data: { totalMarks: new Prisma.Decimal(sum) },
    });
  }

  // Finalize ImportJob
  await db.importJob.update({
    where: { id: importJob.id },
    data: {
      status: "COMPLETED",
      successCount,
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    jobId: importJob.id,
    importedQuestions: successCount,
    testsAffected: affectedTestIds.size,
  };
}
