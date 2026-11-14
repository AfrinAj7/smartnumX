import { db } from "@/lib/db";
import { Prisma, type QuestionType } from "@prisma/client";
import { z } from "zod";

export const questionInputSchema = z.object({
  code: z.string().min(2).max(50).trim(),
  type: z.enum(["MCQ_SINGLE", "MCQ_MULTI", "NUMERIC", "TRUE_FALSE"]),
  stem: z.string().min(3).trim(),
  stemImage: z.string().url().optional().nullable(),
  options: z.any().optional().nullable(), // array of { id, text, image? }
  correct: z.any(), // { answer: string | string[] | number, min?: number, max?: number }
  explanation: z.string().optional().nullable(),
  solutionImage: z.string().url().optional().nullable(),
  subject: z.string().min(2).trim(),
  chapter: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().nullable(),
});

export type QuestionInput = z.infer<typeof questionInputSchema>;

export interface QuestionListParams {
  page?: number;
  pageSize?: number;
  subject?: string;
  chapter?: string;
  type?: QuestionType;
  difficulty?: string;
  search?: string;
}

export async function listQuestions(params: QuestionListParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.QuestionWhereInput = {};

  if (params.subject && params.subject !== "ALL") {
    where.subject = params.subject;
  }
  if (params.chapter && params.chapter !== "ALL") {
    where.chapter = params.chapter;
  }
  if (params.type) {
    where.type = params.type;
  }
  if (params.difficulty && params.difficulty !== "ALL") {
    where.difficulty = params.difficulty;
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { stem: { contains: q, mode: "insensitive" } },
      { chapter: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, questions] = await Promise.all([
    db.question.count({ where }),
    db.question.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { testQuestions: true, attemptAnswers: true },
        },
      },
    }),
  ]);

  return {
    questions,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getQuestionById(id: string) {
  return db.question.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      parent: { select: { id: true, code: true, version: true } },
      children: { select: { id: true, code: true, version: true, createdAt: true } },
      testQuestions: {
        include: {
          test: { select: { id: true, code: true, title: true, status: true } },
          section: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { attemptAnswers: true },
      },
    },
  });
}

export async function getQuestionTaxonomy() {
  const questions = await db.question.findMany({
    select: { subject: true, chapter: true, difficulty: true },
    distinct: ["subject", "chapter"],
  });

  const subjects = Array.from(new Set(questions.map((q) => q.subject).filter(Boolean))).sort();
  const chapters = Array.from(new Set(questions.map((q) => q.chapter).filter((c): c is string => Boolean(c)))).sort();

  return { subjects, chapters };
}

export async function createQuestion(input: unknown, actorId: string) {
  const data = questionInputSchema.parse(input);

  const existing = await db.question.findUnique({
    where: { code: data.code },
  });
  if (existing) {
    throw new Error(`A question with code "${data.code}" already exists.`);
  }

  return db.question.create({
    data: {
      code: data.code,
      version: 1,
      type: data.type,
      stem: data.stem,
      stemImage: data.stemImage,
      options: data.options ?? Prisma.JsonNull,
      correct: data.correct,
      explanation: data.explanation,
      solutionImage: data.solutionImage,
      subject: data.subject,
      chapter: data.chapter,
      topic: data.topic,
      difficulty: data.difficulty,
      createdById: actorId,
    },
  });
}

export async function updateQuestion(
  id: string,
  input: unknown,
  actorId: string,
  isSuperAdmin: boolean,
) {
  const data = questionInputSchema.parse(input);
  const current = await db.question.findUnique({
    where: { id },
    include: {
      _count: { select: { attemptAnswers: true } },
    },
  });

  if (!current) {
    throw new Error("Question not found.");
  }

  // Instructor ownership check
  if (!isSuperAdmin && current.createdById && current.createdById !== actorId) {
    throw new Error("You do not have permission to modify questions authored by other instructors.");
  }

  // Immutability rule: If the question has submitted attempts or is marked locked,
  // we must create a new version branch!
  const isUsedInAttempts = current._count.attemptAnswers > 0 || current.isLocked;

  if (isUsedInAttempts) {
    // 1. Ensure current question is marked locked
    if (!current.isLocked) {
      await db.question.update({
        where: { id },
        data: { isLocked: true },
      });
    }

    // 2. Generate a versioned code (e.g. CODE-v2) if code collision occurs
    const newVersion = current.version + 1;
    const versionedCode = `${data.code}-v${newVersion}`;

    // 3. Create branch version
    const newQuestion = await db.question.create({
      data: {
        code: versionedCode,
        version: newVersion,
        parentId: current.id,
        isLocked: false,
        type: data.type,
        stem: data.stem,
        stemImage: data.stemImage,
        options: data.options ?? Prisma.JsonNull,
        correct: data.correct,
        explanation: data.explanation,
        solutionImage: data.solutionImage,
        subject: data.subject,
        chapter: data.chapter,
        topic: data.topic,
        difficulty: data.difficulty,
        createdById: actorId,
      },
    });

    return {
      question: newQuestion,
      isNewVersion: true,
      message: `Question was locked because it has student attempts. A new version (${versionedCode}) was created.`,
    };
  }

  // If unlocked, update in place
  const updated = await db.question.update({
    where: { id },
    data: {
      code: data.code,
      type: data.type,
      stem: data.stem,
      stemImage: data.stemImage,
      options: data.options ?? Prisma.JsonNull,
      correct: data.correct,
      explanation: data.explanation,
      solutionImage: data.solutionImage,
      subject: data.subject,
      chapter: data.chapter,
      topic: data.topic,
      difficulty: data.difficulty,
    },
  });

  return {
    question: updated,
    isNewVersion: false,
    message: "Question updated successfully.",
  };
}

export async function deleteQuestion(id: string, actorId: string, isSuperAdmin: boolean) {
  const current = await db.question.findUnique({
    where: { id },
    include: {
      _count: { select: { attemptAnswers: true, testQuestions: true } },
    },
  });

  if (!current) {
    throw new Error("Question not found.");
  }

  if (!isSuperAdmin && current.createdById && current.createdById !== actorId) {
    throw new Error("You do not have permission to delete this question.");
  }

  if (current._count.attemptAnswers > 0) {
    throw new Error(
      "Cannot delete this question because active student attempts or test records reference it. You can mark it locked instead.",
    );
  }

  if (current._count.testQuestions > 0) {
    throw new Error(
      "This question is currently assigned to one or more tests. Remove it from those tests first.",
    );
  }

  await db.question.delete({ where: { id } });
  return { ok: true };
}
