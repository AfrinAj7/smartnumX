import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { executeImport } from "@/server/tests/import-service";

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

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  try {
    const body = await request.json();
    const { parsedData, fileName, fileSize } = body;

    if (!parsedData || !parsedData.questions || !Array.isArray(parsedData.questions)) {
      return NextResponse.json({ error: "Invalid import data payload." }, { status: 400 });
    }

    const result = await executeImport(
      parsedData,
      fileName || "bulk-import.xlsx",
      fileSize || 0,
      actor.id,
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute import.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

