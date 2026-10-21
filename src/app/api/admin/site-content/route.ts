import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import { getHomepageContent, saveHomepageContent } from "@/server/site-content/homepage";

async function getSuperAdminError() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Super Admin permission is required." }, { status: 403 });
  }
  return session.user;
}

export async function GET() {
  const actor = await getSuperAdminError();
  if (actor instanceof NextResponse) return actor;
  return NextResponse.json({ data: await getHomepageContent(db) }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function PUT(request: Request) {
  const actor = await getSuperAdminError();
  if (actor instanceof NextResponse) return actor;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1024 * 1024) {
    return NextResponse.json({ error: "Homepage content is larger than the 1 MB limit." }, { status: 413 });
  }

  try {
    const content = await saveHomepageContent(await request.json(), actor.id, db);
    revalidatePath("/");
    return NextResponse.json({ data: content }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: "Homepage content could not be saved." }, { status: 503 });
  }
}