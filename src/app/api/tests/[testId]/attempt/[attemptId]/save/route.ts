import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveStudentAnswer } from "@/server/tests/exam-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ testId: string; attemptId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { attemptId } = await params;

  try {
    const body = await request.json();
    const result = await saveStudentAnswer(session.user.id, attemptId, body);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save answer.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

