import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { extractZipImages, validateImportFile } from "@/server/tests/import-service";

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

  const isSuperAdmin = actor.role === "SUPER_ADMIN";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const zipFile = formData.get("imagesZip") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No Excel/CSV file was provided." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let imageMap = new Map<string, string>();

    if (zipFile) {
      const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
      imageMap = await extractZipImages(zipBuffer);
    }

    const dryRunResult = await validateImportFile(
      fileBuffer,
      imageMap,
      actor.id,
      isSuperAdmin,
    );

    return NextResponse.json({
      data: dryRunResult,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse import file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

