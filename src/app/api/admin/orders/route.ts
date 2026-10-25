import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { listAdminOrders } from "@/server/orders/order-service";
import { OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.status !== "ACTIVE" || !hasRole(session.user, ["SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Super Admin permission required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const statusParam = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const status =
    statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

  const result = await listAdminOrders({ search, status, page, pageSize });
  return NextResponse.json({ data: result.orders, meta: result.meta });
}
