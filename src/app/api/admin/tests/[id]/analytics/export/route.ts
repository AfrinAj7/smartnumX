import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import {
  generateTestResultsCsv,
  generateQuestionItemAnalysisCsv,
} from "@/server/tests/analytics-service";

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "results";

  try {
    if (type === "questions") {
      const csv = await generateQuestionItemAnalysisCsv(id);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="question_item_analysis_${id}.csv"`,
        },
      });
    }

    // Default: test results & leaderboard
    const csv = await generateTestResultsCsv(id);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="test_results_${id}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

