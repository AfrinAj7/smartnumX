import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { reevaluateTest } from "@/server/tests/reevaluation-service";

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
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;

  try {
    const body = await request.json();
    const { questionId, action, newCorrect, reason } = body;

    if (!questionId || !action) {
      return NextResponse.json(
        { error: "questionId and action are required." },
        { status: 400 }
      );
    }

    const result = await reevaluateTest({
      testId: id,
      actorId: actor.id,
      questionId,
      action,
      newCorrect,
      reason,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to re-evaluate test.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

