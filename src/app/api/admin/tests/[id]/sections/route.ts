import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { addSection } from "@/server/tests/test-service";

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
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    const body = await request.json();
    const section = await addSection(id, body);
    return NextResponse.json({ data: section }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add section.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

