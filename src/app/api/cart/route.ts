import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCart, addToCart, clearCart } from "@/server/cart/cart-service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const cart = await getCart(session.user.id);
  return NextResponse.json({ data: cart });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to add courses to your cart." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const courseId = body.courseId || body.courseSlug;
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ error: "courseId is required." }, { status: 400 });
    }

    const cart = await addToCart(session.user.id, courseId.trim());
    return NextResponse.json({ data: cart }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add course to cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await clearCart(session.user.id);
  return NextResponse.json({ success: true, data: { items: [], subtotal: 0, discount: 0, total: 0, itemCount: 0 } });
}
