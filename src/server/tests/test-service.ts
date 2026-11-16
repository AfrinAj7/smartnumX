import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const testInputSchema = z.object({
  code: z.string().min(2).max(50).trim(),
  title: z.string().min(3).trim(),
  description: z.string().optional().nullable(),
  seriesId: z.string().optional().nullable(),
  type: z.enum(["FULL_MOCK", "CHAPTER", "SECTIONAL", "DIAGNOSTIC"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  durationMin: z.number().int().min(5).max(360).default(180),
  passMarks: z.number().optional().nullable(),
  opensAt: z.string().datetime().optional().nullable(),
  closesAt: z.string().datetime().optional().nullable(),
  lateStartRule: z.enum(["REDUCE_TIME", "FULL_TIME"]).default("REDUCE_TIME"),
  graceSeconds: z.number().int().min(0).max(60).default(10),
  maxAttempts: z.number().int().min(0).default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  requireFullscreen: z.boolean().default(false),
  maxViolations: z.number().int().min(0).default(0),
  resultMode: z.enum(["INSTANT", "AFTER_WINDOW", "MANUAL"]).default("INSTANT"),
  solutionMode: z.enum(["AFTER_SUBMIT", "AFTER_WINDOW", "NEVER"]).default("AFTER_SUBMIT"),
  instructions: z.string().optional().nullable(),
  isFreePreview: z.boolean().default(false),
});

export type TestInput = z.infer<typeof testInputSchema>;

export async function listTests(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  seriesId?: string;
  search?: string;
}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.TestWhereInput = {
    deletedAt: null,
  };

  if (params.status && params.status !== "ALL") {
    where.status = params.status as Prisma.EnumTestStatusFilter;
  }
  if (params.seriesId && params.seriesId !== "ALL") {
    where.seriesId = params.seriesId;
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, tests] = await Promise.all([
    db.test.count({ where }),
    db.test.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        series: { select: { id: true, title: true, slug: true } },
        _count: {
          select: { testQuestions: true, sections: true, attempts: true },
        },
      },
    }),
  ]);

  return {
    tests,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getTestById(id: string) {
  const test = await db.test.findFirst({
    where: { id, deletedAt: null },
    include: {
      series: { select: { id: true, title: true, slug: true, price: true, productType: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          testQuestions: {
            orderBy: { order: "asc" },
            include: {
              question: true,
            },
          },
        },
      },
      testQuestions: {
        where: { sectionId: null },
        orderBy: { order: "asc" },
        include: {
          question: true,
        },
      },
      _count: {
        select: { testQuestions: true, attempts: true, assignments: true },
      },
    },
  });

  return test;
}

export async function createTest(input: unknown) {
  const data = testInputSchema.parse(input);

  const existing = await db.test.findUnique({
    where: { code: data.code },
  });
  if (existing) {
    throw new Error(`A test with code "${data.code}" already exists.`);
  }

  return db.test.create({
    data: {
      code: data.code,
      title: data.title,
      description: data.description,
      seriesId: data.seriesId,
      type: data.type,
      status: data.status,
      durationMin: data.durationMin,
      passMarks: data.passMarks ? new Prisma.Decimal(data.passMarks) : null,
      opensAt: data.opensAt ? new Date(data.opensAt) : null,
      closesAt: data.closesAt ? new Date(data.closesAt) : null,
      lateStartRule: data.lateStartRule,
      graceSeconds: data.graceSeconds,
      maxAttempts: data.maxAttempts,
      shuffleQuestions: data.shuffleQuestions,
      shuffleOptions: data.shuffleOptions,
      requireFullscreen: data.requireFullscreen,
      maxViolations: data.maxViolations,
      resultMode: data.resultMode,
      solutionMode: data.solutionMode,
      instructions: data.instructions,
      isFreePreview: data.isFreePreview,
      totalMarks: new Prisma.Decimal(0),
    },
  });
}

export async function updateTest(id: string, input: unknown) {
  const data = testInputSchema.partial().parse(input);

  const test = await db.test.findUnique({ where: { id } });
  if (!test) throw new Error("Test not found.");

  return db.test.update({
    where: { id },
    data: {
      ...(data.code ? { code: data.code } : {}),
      ...(data.title ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.seriesId !== undefined ? { seriesId: data.seriesId } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.durationMin !== undefined ? { durationMin: data.durationMin } : {}),
      ...(data.passMarks !== undefined
        ? { passMarks: data.passMarks ? new Prisma.Decimal(data.passMarks) : null }
        : {}),
      ...(data.opensAt !== undefined
        ? { opensAt: data.opensAt ? new Date(data.opensAt) : null }
        : {}),
      ...(data.closesAt !== undefined
        ? { closesAt: data.closesAt ? new Date(data.closesAt) : null }
        : {}),
      ...(data.lateStartRule ? { lateStartRule: data.lateStartRule } : {}),
      ...(data.graceSeconds !== undefined ? { graceSeconds: data.graceSeconds } : {}),
      ...(data.maxAttempts !== undefined ? { maxAttempts: data.maxAttempts } : {}),
      ...(data.shuffleQuestions !== undefined ? { shuffleQuestions: data.shuffleQuestions } : {}),
      ...(data.shuffleOptions !== undefined ? { shuffleOptions: data.shuffleOptions } : {}),
      ...(data.requireFullscreen !== undefined ? { requireFullscreen: data.requireFullscreen } : {}),
      ...(data.maxViolations !== undefined ? { maxViolations: data.maxViolations } : {}),
      ...(data.resultMode ? { resultMode: data.resultMode } : {}),
      ...(data.solutionMode ? { solutionMode: data.solutionMode } : {}),
      ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
      ...(data.isFreePreview !== undefined ? { isFreePreview: data.isFreePreview } : {}),
    },
  });
}

export async function deleteTest(id: string) {
  const test = await db.test.findUnique({
    where: { id },
    include: { _count: { select: { attempts: true } } },
  });
  if (!test) throw new Error("Test not found.");

  // Soft delete
  await db.test.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });

  return { ok: true };
}

// Section Management
export async function addSection(testId: string, input: { name: string; durationMin?: number | null; maxToAttempt?: number | null }) {
  const count = await db.testSection.count({ where: { testId } });
  return db.testSection.create({
    data: {
      testId,
      name: input.name.trim(),
      order: count + 1,
      durationMin: input.durationMin || null,
      maxToAttempt: input.maxToAttempt || null,
    },
  });
}

export async function updateSection(sectionId: string, input: { name?: string; durationMin?: number | null; maxToAttempt?: number | null; order?: number }) {
  return db.testSection.update({
    where: { id: sectionId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.durationMin !== undefined ? { durationMin: input.durationMin } : {}),
      ...(input.maxToAttempt !== undefined ? { maxToAttempt: input.maxToAttempt } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
    },
  });
}

export async function deleteSection(sectionId: string) {
  return db.testSection.delete({ where: { id: sectionId } });
}

// Assign / Remove Questions in Test
export async function addQuestionToTest(input: {
  testId: string;
  questionId: string;
  sectionId?: string | null;
  marks?: number;
  negMarks?: number;
}) {
  const marks = input.marks !== undefined ? input.marks : 4;
  const negMarks = input.negMarks !== undefined ? input.negMarks : 1;

  // Get current max order
  const highest = await db.testQuestion.findFirst({
    where: { testId: input.testId, sectionId: input.sectionId || null },
    orderBy: { order: "desc" },
  });
  const nextOrder = (highest?.order ?? 0) + 1;

  const tq = await db.testQuestion.upsert({
    where: {
      testId_questionId: {
        testId: input.testId,
        questionId: input.questionId,
      },
    },
    update: {
      sectionId: input.sectionId || null,
      marks: new Prisma.Decimal(marks),
      negMarks: new Prisma.Decimal(negMarks),
    },
    create: {
      testId: input.testId,
      questionId: input.questionId,
      sectionId: input.sectionId || null,
      order: nextOrder,
      marks: new Prisma.Decimal(marks),
      negMarks: new Prisma.Decimal(negMarks),
    },
  });

  // Re-sum total marks
  await recalculateTotalMarks(input.testId);

  return tq;
}

export async function removeQuestionFromTest(testId: string, questionId: string) {
  await db.testQuestion.delete({
    where: {
      testId_questionId: { testId, questionId },
    },
  });

  await recalculateTotalMarks(testId);
  return { ok: true };
}

export async function updateTestQuestionMarks(input: {
  testId: string;
  questionId: string;
  marks?: number;
  negMarks?: number;
}) {
  const data: Prisma.TestQuestionUpdateInput = {};
  if (input.marks !== undefined) data.marks = new Prisma.Decimal(input.marks);
  if (input.negMarks !== undefined) data.negMarks = new Prisma.Decimal(input.negMarks);

  const updated = await db.testQuestion.update({
    where: {
      testId_questionId: {
        testId: input.testId,
        questionId: input.questionId,
      },
    },
    data,
  });

  await recalculateTotalMarks(input.testId);
  return updated;
}

export async function bulkUpdateMarkingScheme(input: {
  testId: string;
  sectionId?: string | null;
  marks: number;
  negMarks: number;
}) {
  const where: Prisma.TestQuestionWhereInput = {
    testId: input.testId,
  };
  if (input.sectionId) {
    where.sectionId = input.sectionId;
  }

  const result = await db.testQuestion.updateMany({
    where,
    data: {
      marks: new Prisma.Decimal(input.marks),
      negMarks: new Prisma.Decimal(input.negMarks),
    },
  });

  await recalculateTotalMarks(input.testId);
  return result;
}

async function recalculateTotalMarks(testId: string) {
  const allQuestions = await db.testQuestion.findMany({
    where: { testId },
    select: { marks: true },
  });
  const sum = allQuestions.reduce((acc, q) => acc + Number(q.marks), 0);
  await db.test.update({
    where: { id: testId },
    data: { totalMarks: new Prisma.Decimal(sum) },
  });
}

