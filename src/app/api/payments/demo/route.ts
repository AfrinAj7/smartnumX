import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processDemoPayment } from "@/server/payments/demo-payment-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, simulateSuccess = true, paymentMethod = "DEMO_UPI" } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    const result = await processDemoPayment({
      orderId,
      userId: session.user.id,
      simulateSuccess: Boolean(simulateSuccess),
      paymentMethod,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment processing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
