import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enrollFreeProduct } from "@/server/courses/course-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please sign in or create a free account to enroll in this test series." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const slug = body.slug || body.courseSlug || body.productId;
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Product slug or ID is required." }, { status: 400 });
    }

    const result = await enrollFreeProduct(session.user.id, slug.trim());
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enroll in free product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

