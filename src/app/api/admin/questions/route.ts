import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import {
  listQuestions,
  createQuestion,
  getQuestionTaxonomy,
} from "@/server/tests/question-service";
import type { QuestionType } from "@prisma/client";

async function getAdminActor() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN", "INSTRUCTOR"])) {
    return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  }
  return session.user;
}

export async function GET(request: Request) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject") || undefined;
  const chapter = searchParams.get("chapter") || undefined;
  const type = (searchParams.get("type") as QuestionType) || undefined;
  const difficulty = searchParams.get("difficulty") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  try {
    const [result, taxonomy] = await Promise.all([
      listQuestions({ subject, chapter, type, difficulty, search, page, pageSize }),
      getQuestionTaxonomy(),
    ]);

    return NextResponse.json({
      data: result.questions,
      taxonomy,
      meta: result.meta,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load questions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  try {
    const body = await request.json();
    const created = await createQuestion(body, actor.id);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", details: error.flatten().fieldErrors },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create question.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

