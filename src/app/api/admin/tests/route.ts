import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { listTests, createTest } from "@/server/tests/test-service";
import { db } from "@/lib/db";

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

export async function GET(request: Request) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const seriesId = searchParams.get("seriesId") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  try {
    const [result, testSeriesList] = await Promise.all([
      listTests({ status, seriesId, search, page, pageSize }),
      db.course.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true, slug: true, productType: true },
        orderBy: [{ productType: "desc" }, { title: "asc" }],
      }),
    ]);

    return NextResponse.json({
      data: result.tests,
      meta: result.meta,
      testSeries: testSeriesList,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tests.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await getAdminActor();
  if (actor instanceof NextResponse) return actor;

  try {
    const body = await request.json();
    const created = await createTest(body);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", details: error.flatten().fieldErrors },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create test.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

