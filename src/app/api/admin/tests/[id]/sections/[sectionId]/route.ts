import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { updateSection, deleteSection } from "@/server/tests/test-service";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { sectionId } = await params;
  try {
    const body = await request.json();
    const updated = await updateSection(sectionId, body);
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update section.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { sectionId } = await params;
  try {
    await deleteSection(sectionId);
    return NextResponse.json({ ok: true, message: "Section deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete section.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

