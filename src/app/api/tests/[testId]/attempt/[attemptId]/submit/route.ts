import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitExamAttempt } from "@/server/tests/exam-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ testId: string; attemptId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { attemptId } = await params;

  try {
    const result = await submitExamAttempt(session.user.id, attemptId);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit exam attempt.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

