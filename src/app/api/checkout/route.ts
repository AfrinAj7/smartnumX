import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPendingOrder } from "@/server/orders/order-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to proceed to checkout." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const couponCode = body.couponCode as string | undefined;

    const orderResult = await createPendingOrder(session.user.id, couponCode);
    return NextResponse.json({ data: orderResult }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
