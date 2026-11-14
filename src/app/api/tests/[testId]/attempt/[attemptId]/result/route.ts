import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAttemptResultAnalytics } from "@/server/tests/scoring-service";

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
    const data = await getAttemptResultAnalytics(
      session.user.id,
      session.user.role,
      attemptId,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load result analytics.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

