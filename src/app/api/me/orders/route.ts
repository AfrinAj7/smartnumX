import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listUserOrders } from "@/server/orders/order-service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const orders = await listUserOrders(session.user.id);
  return NextResponse.json({ data: orders });
}
