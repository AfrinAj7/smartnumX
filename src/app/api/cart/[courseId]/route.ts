import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { removeFromCart } from "@/server/cart/cart-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { courseId } = await params;
  try {
    const cart = await removeFromCart(session.user.id, courseId);
    return NextResponse.json({ data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove course from cart.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
