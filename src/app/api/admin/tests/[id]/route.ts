import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { getTestById, updateTest, deleteTest } from "@/server/tests/test-service";

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    const test = await getTestById(id);
    if (!test) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }
    return NextResponse.json({ data: test });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load test.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await updateTest(id, body);
    return NextResponse.json({ data: updated, message: "Test updated successfully." });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", details: error.flatten().fieldErrors },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update test.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    await deleteTest(id);
    return NextResponse.json({ ok: true, message: "Test archived successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete test.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

