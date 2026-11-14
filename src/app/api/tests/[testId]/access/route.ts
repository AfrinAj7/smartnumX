import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkTestAccess } from "@/server/tests/exam-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { testId } = await params;

  try {
    const access = await checkTestAccess(session.user.id, session.user.role, testId);
    return NextResponse.json({ data: access });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error checking access.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

