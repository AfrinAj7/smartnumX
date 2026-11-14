import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAttemptExamBundle } from "@/server/tests/exam-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string; attemptId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { attemptId } = await params;

  try {
    const bundle = await getAttemptExamBundle(session.user.id, attemptId);
    return NextResponse.json({ data: bundle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load exam state.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

