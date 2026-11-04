import { db } from "@/lib/db";
import { getCart } from "@/server/cart/cart-service";
import { ProductType, CouponType } from "@prisma/client";

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  type?: CouponType;
  value?: number;
  discount?: number;
  message: string;
}

export async function validateCoupon(
  code: string,
  userId: string
): Promise<CouponValidationResult> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: "Please provide a coupon code." };
  }

  const coupon = await db.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code." };
  }

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    return { valid: false, message: "This coupon is not active yet." };
  }

  if (coupon.validTo && coupon.validTo < now) {
    return { valid: false, message: "This coupon has expired." };
  }

  if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: "This coupon has reached its maximum usage limit." };
  }

  const cart = await getCart(userId);
  if (!cart || cart.items.length === 0) {
    return { valid: false, message: "Your cart is empty. Add items to apply coupon." };
  }

  if (coupon.minCart !== null && coupon.minCart !== undefined) {
    const minCartValue = Number(coupon.minCart);
    if (cart.total < minCartValue) {
      return {
        valid: false,
        message: `Minimum cart value of ₹${minCartValue.toLocaleString("en-IN")} required to use this coupon.`,
      };
    }
  }

  // Filter items matching applicableTypes and optional courseIds
  const eligibleItems = cart.items.filter((item) => {
    const matchesType =
      coupon.applicableTypes.length === 0 ||
      coupon.applicableTypes.includes(item.productType as ProductType);

    const matchesCourse =
      !coupon.courseIds ||
      coupon.courseIds.length === 0 ||
      coupon.courseIds.includes(item.courseId) ||
      coupon.courseIds.includes(item.slug);

    return matchesType && matchesCourse;
  });

  if (eligibleItems.length === 0) {
    return {
      valid: false,
      message: "This coupon is not applicable to any of the items in your cart.",
    };
  }

  const eligibleAmount = eligibleItems.reduce((acc, curr) => acc + curr.finalPrice, 0);
  let discount = 0;

  if (coupon.type === "PERCENT") {
    const percent = Number(coupon.value);
    discount = Math.round(((eligibleAmount * percent) / 100) * 100) / 100;
  } else {
    // FLAT
    const flat = Number(coupon.value);
    discount = Math.min(flat, eligibleAmount);
  }

  // Cap discount at total cart value
  discount = Math.min(discount, cart.total);
  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    discount,
    message: `Coupon "${coupon.code}" applied! You save ₹${discount.toLocaleString("en-IN")}.`,
  };
}

export async function listAdminCoupons() {
  const coupons = await db.coupon.findMany({
    orderBy: { validFrom: "desc" },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  return coupons.map((c) => ({
    ...c,
    value: Number(c.value),
    minCart: c.minCart ? Number(c.minCart) : null,
  }));
}

export async function createCoupon(input: {
  code: string;
  type: CouponType;
  value: number;
  minCart?: number;
  maxUses?: number;
  validFrom?: Date;
  validTo?: Date;
  applicableTypes?: ProductType[];
}) {
  const code = input.code.trim().toUpperCase();
  const existing = await db.coupon.findUnique({ where: { code } });
  if (existing) {
    throw new Error(`Coupon with code "${code}" already exists.`);
  }

  const created = await db.coupon.create({
    data: {
      code,
      type: input.type,
      value: input.value,
      minCart: input.minCart ? input.minCart : null,
      maxUses: input.maxUses ? input.maxUses : null,
      validFrom: input.validFrom || new Date(),
      validTo: input.validTo || null,
      applicableTypes: input.applicableTypes || [ProductType.COURSE, ProductType.TEST_SERIES],
    },
  });

  return {
    ...created,
    value: Number(created.value),
    minCart: created.minCart ? Number(created.minCart) : null,
  };
}

export async function deleteCoupon(id: string) {
  await db.coupon.delete({ where: { id } });
  return { success: true };
}

