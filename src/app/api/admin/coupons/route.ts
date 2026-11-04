import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { listAdminCoupons, createCoupon } from "@/server/coupons/coupon-service";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const coupons = await listAdminCoupons();
  return NextResponse.json({ data: coupons });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const coupon = await createCoupon(body);
    return NextResponse.json({ data: coupon }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create coupon";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

