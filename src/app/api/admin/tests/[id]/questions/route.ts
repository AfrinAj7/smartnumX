import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import {
  addQuestionToTest,
  removeQuestionFromTest,
  updateTestQuestionMarks,
  bulkUpdateMarkingScheme,
} from "@/server/tests/test-service";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    const body = await request.json();
    const result = await addQuestionToTest({
      testId: id,
      questionId: body.questionId,
      sectionId: body.sectionId || null,
      marks: body.marks ? Number(body.marks) : 4,
      negMarks: body.negMarks !== undefined ? Number(body.negMarks) : 1,
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add question to test.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ error: "questionId is required." }, { status: 400 });
    }
    await removeQuestionFromTest(id, questionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove question.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    const body = await request.json();

    if (body.bulk) {
      const marks = body.marks !== undefined ? Number(body.marks) : 4;
      const negMarks = body.negMarks !== undefined ? Number(body.negMarks) : 0;
      const sectionId = body.sectionId || undefined;

      const result = await bulkUpdateMarkingScheme({
        testId: id,
        sectionId,
        marks,
        negMarks,
      });
      return NextResponse.json({ data: result, ok: true });
    }

    if (!body.questionId) {
      return NextResponse.json({ error: "questionId is required for individual update." }, { status: 400 });
    }

    const marks = body.marks !== undefined ? Number(body.marks) : undefined;
    const negMarks = body.negMarks !== undefined ? Number(body.negMarks) : undefined;

    const result = await updateTestQuestionMarks({
      testId: id,
      questionId: body.questionId,
      marks,
      negMarks,
    });
    return NextResponse.json({ data: result, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update marking scheme.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

