import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} from "@/server/tests/question-service";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    const question = await getQuestionById(id);
    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    return NextResponse.json({ data: question });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load question.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  const isSuperAdmin = actor.role === "SUPER_ADMIN";

  try {
    const body = await request.json();
    const result = await updateQuestion(id, body, actor.id, isSuperAdmin);
    return NextResponse.json({ data: result.question, message: result.message, isNewVersion: result.isNewVersion });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", details: error.flatten().fieldErrors },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update question.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  const isSuperAdmin = actor.role === "SUPER_ADMIN";

  try {
    await deleteQuestion(id, actor.id, isSuperAdmin);
    return NextResponse.json({ ok: true, message: "Question deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete question.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

