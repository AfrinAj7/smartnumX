import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { createHomepageMediaUpload } from "@/server/media/homepage-upload";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Super Admin permission is required." }, { status: 403 });
  }

  try {
    const upload = await createHomepageMediaUpload(await request.json());
    return NextResponse.json({ data: upload }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: "Media storage is unavailable or not configured." }, { status: 503 });
  }
}