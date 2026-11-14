import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import {
  listTestAssignments,
  bulkAssignTest,
  revokeTestAssignment,
} from "@/server/tests/assignment-service";
import { AssignmentSource } from "@prisma/client";

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
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

  try {
    const result = await listTestAssignments({
      testId: id,
      search,
      page,
      pageSize,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load test assignments.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
    const { identifiers, userIds, emails, validUntil, source, notes } = body;

    const list: string[] = [];
    if (Array.isArray(identifiers)) list.push(...identifiers);
    if (Array.isArray(userIds)) list.push(...userIds);
    if (Array.isArray(emails)) list.push(...emails);
    if (typeof body.email === "string") list.push(body.email);
    if (typeof body.userId === "string") list.push(body.userId);

    if (list.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one student email or user ID to assign." },
        { status: 400 }
      );
    }

    const assignmentSource =
      source === "FREE_PREVIEW" ? AssignmentSource.FREE_PREVIEW : AssignmentSource.ADMIN_GRANT;

    const result = await bulkAssignTest({
      testId: id,
      identifiers: list,
      source: assignmentSource,
      validUntil,
      actorId: actor.id,
      notes,
    });

    return NextResponse.json({
      data: result,
      message: `Assigned ${result.successCount} student(s) successfully.${
        result.failureCount > 0 ? ` (${result.failureCount} failed)` : ""
      }`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign test.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { id } = await params;
  try {
    const body = await request.json();
    const { userId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: "Student userId is required to revoke assignment." }, { status: 400 });
    }

    await revokeTestAssignment({
      testId: id,
      userId,
      actorId: actor.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: "Direct test assignment revoked successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to revoke assignment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

