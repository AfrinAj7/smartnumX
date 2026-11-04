import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateCoupon } from "@/server/coupons/coupon-service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { valid: false, message: "Please sign in to apply coupon." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, message: "Coupon code is required." },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to validate coupon.";
    return NextResponse.json({ valid: false, message }, { status: 500 });
  }
}

