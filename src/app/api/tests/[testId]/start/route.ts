import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startOrResumeAttempt } from "@/server/tests/exam-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { testId } = await params;

  try {
    const result = await startOrResumeAttempt(session.user.id, session.user.role, testId);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start test attempt.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

