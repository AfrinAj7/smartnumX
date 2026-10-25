import { db } from "@/lib/db";
import { OrderStatus, Prisma } from "@prisma/client";
import { getCart } from "@/server/cart/cart-service";

export interface CreateOrderResult {
  orderId: string;
  invoiceNo: string;
  total: number;
  subtotal: number;
  discount: number;
  itemCount: number;
}

function generateInvoiceNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SN-INV-${dateStr}-${randomSuffix}`;
}

export async function createPendingOrder(
  userId: string,
  couponCode?: string
): Promise<CreateOrderResult> {
  const cart = await getCart(userId);
  if (cart.items.length === 0) {
    throw new Error("Your cart is empty. Add courses before checking out.");
  }

  // Calculate pricing
  const subtotal = cart.subtotal;
  let discount = cart.discount;
  let total = cart.total;
  let couponId: string | null = null;

  // Validate coupon if applied
  if (couponCode && couponCode.trim()) {
    const coupon = await db.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() },
    });

    if (coupon) {
      const now = new Date();
      const isValidDate = (!coupon.validFrom || coupon.validFrom <= now) && (!coupon.validTo || coupon.validTo >= now);
      const isUnderLimit = !coupon.maxUses || coupon.usedCount < coupon.maxUses;

      if (isValidDate && isUnderLimit) {
        couponId = coupon.id;
        const couponVal = Number(coupon.value);
        if (coupon.type === "PERCENT") {
          const couponDiscount = Math.round(((total * couponVal) / 100) * 100) / 100;
          discount += couponDiscount;
          total = Math.max(0, total - couponDiscount);
        } else {
          // FLAT discount
          discount += couponVal;
          total = Math.max(0, total - couponVal);
        }
      }
    }
  }

  const invoiceNo = generateInvoiceNumber();

  // Create Order and OrderItems in a transaction
  const order = await db.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(total),
        currency: "INR",
        status: OrderStatus.PENDING,
        gateway: "demo_simulator",
        gatewayOrderId: `DEMO-ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        invoiceNo,
        couponId,
        items: {
          create: cart.items.map((item) => ({
            courseId: item.courseId,
            price: new Prisma.Decimal(item.finalPrice),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return newOrder;
  });

  return {
    orderId: order.id,
    invoiceNo,
    total,
    subtotal,
    discount,
    itemCount: cart.items.length,
  };
}

export async function getOrderById(orderId: string, userId?: string) {
  const where: Prisma.OrderWhereInput = { id: orderId };
  if (userId) {
    where.userId = userId;
  }

  const order = await db.order.findFirst({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
              validityDays: true,
            },
          },
        },
      },
      enrollments: {
        select: {
          id: true,
          courseId: true,
          status: true,
          startedAt: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  };
}

export async function listUserOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
        },
      },
    },
  });

  return orders.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }));
}

export async function listAdminOrders(params: {
  status?: OrderStatus | "ALL";
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {};

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  if (params.search) {
    where.OR = [
      { invoiceNo: { contains: params.search, mode: "insensitive" } },
      { gatewayOrderId: { contains: params.search, mode: "insensitive" } },
      { user: { name: { contains: params.search, mode: "insensitive" } } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    }),
  ]);

  return {
    orders: orders.map((order) => ({
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: Number(order.tax),
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    })),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
