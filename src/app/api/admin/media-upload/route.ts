import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import {
  createHomepageMediaUpload,
  hasS3Config,
  uploadDirectMedia,
} from "@/server/media/homepage-upload";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Super Admin permission is required." }, { status: 403 });
  }

  const contentTypeHeader = request.headers.get("content-type") || "";

  // 1. Direct Multipart Form Upload (works with both S3 and local storage)
  if (contentTypeHeader.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file was selected for upload." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadDirectMedia(buffer, file.name, file.type);
      return NextResponse.json({ data: result }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({ error: error.flatten() }, { status: 422 });
      }
      return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 500 });
    }
  }

  // 2. Presigned S3 JSON Upload (when S3 is configured)
  try {
    const body = await request.json();
    if (!hasS3Config()) {
      return NextResponse.json(
        { error: "Media storage is not configured for presigned uploads. Please use direct file upload." },
        { status: 503 },
      );
    }
    const upload = await createHomepageMediaUpload(body);
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