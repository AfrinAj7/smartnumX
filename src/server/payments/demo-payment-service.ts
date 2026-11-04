import { db } from "@/lib/db";
import { OrderStatus, EnrollmentStatus, EnrollmentSource } from "@prisma/client";
import { clearCart } from "@/server/cart/cart-service";
import { sendOrderReceiptEmail } from "@/lib/mail";

export interface DemoPaymentParams {
  orderId: string;
  userId: string;
  simulateSuccess: boolean; // true = simulate success, false = simulate failure
  paymentMethod?: string; // "DEMO_UPI" | "DEMO_CARD" | "DEMO_NETBANKING"
}

export async function processDemoPayment(params: DemoPaymentParams) {
  const { orderId, userId, simulateSuccess, paymentMethod = "DEMO_UPI" } = params;

  // 1. Fetch the order
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found or does not belong to this user.");
  }

  // Idempotency: if already PAID, return success immediately
  if (order.status === OrderStatus.PAID) {
    return {
      success: true,
      orderId: order.id,
      status: "PAID",
      invoiceNo: order.invoiceNo,
      message: "Order has already been paid and processed.",
    };
  }

  // 2. Handle failure simulation
  if (!simulateSuccess) {
    await db.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FAILED,
      },
    });

    return {
      success: false,
      orderId: order.id,
      status: "FAILED",
      invoiceNo: order.invoiceNo,
      message: "Demo payment was simulated as failed. You can retry from checkout.",
    };
  }

  // 3. Process successful payment in transaction
  const paymentId = `DEMO-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const result = await db.$transaction(async (tx) => {
    // A. Update Order to PAID
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        gatewayPaymentId: paymentId,
      },
    });

    // B. Create Enrollments and handle physical seats for each course item
    const enrollments = [];
    for (const item of order.items) {
      const course = item.course;

      // Decrement physical coaching seats atomically if applicable
      if (course.mode === "PHYSICAL" && course.seatsLeft !== null && course.seatsLeft > 0) {
        await tx.course.update({
          where: { id: course.id },
          data: { seatsLeft: { decrement: 1 } },
        });
      }

      const validityDays = course.validityDays;
      let expiresAt: Date | null = null;
      if (validityDays && validityDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + validityDays);
      }

      // Upsert enrollment so if it somehow exists, it activates
      const enrollment = await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
        update: {
          status: EnrollmentStatus.ACTIVE,
          orderId: order.id,
          expiresAt,
          startedAt: new Date(),
        },
        create: {
          userId,
          courseId: course.id,
          orderId: order.id,
          source: EnrollmentSource.PURCHASE,
          status: EnrollmentStatus.ACTIVE,
          expiresAt,
          startedAt: new Date(),
        },
      });
      enrollments.push(enrollment);
    }

    // C. Increment coupon usedCount if coupon was used
    if (order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // D. Log to AuditLog
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: "DEMO_PAYMENT_COMPLETED",
        entityType: "Order",
        entityId: order.id,
        after: {
          orderId: order.id,
          total: Number(order.total),
          paymentId,
          paymentMethod,
          enrollmentsCreated: enrollments.length,
        },
      },
    });

    return { updatedOrder, enrollments };
  });

  // 4. Clear user's cart now that order is paid
  await clearCart(userId);

  // 5. Send order confirmation email asynchronously
  if (order.user?.email && result.updatedOrder.invoiceNo) {
    const itemTitles = order.items.map((i) => i.course.title);
    sendOrderReceiptEmail({
      to: order.user.email,
      name: order.user.name || "Student",
      invoiceNo: result.updatedOrder.invoiceNo,
      total: Number(order.total),
      items: itemTitles,
      orderId: result.updatedOrder.id,
    }).catch((err) => console.error("[RECEIPT EMAIL ERROR]", err));
  }

  return {
    success: true,
    orderId: result.updatedOrder.id,
    status: "PAID",
    invoiceNo: result.updatedOrder.invoiceNo,
    paymentId,
    enrollmentsCount: result.enrollments.length,
    message: "Demo payment completed successfully! Your courses are now unlocked.",
  };
}
