import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { getTestComprehensiveAnalytics } from "@/server/tests/analytics-service";

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

  try {
    const analytics = await getTestComprehensiveAnalytics(id);
    return NextResponse.json({ data: analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load test analytics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

