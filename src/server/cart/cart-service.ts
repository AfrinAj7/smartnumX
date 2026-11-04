import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";

export interface CartCalculation {
  items: Array<{
    id: string;
    courseId: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    price: number;
    discountPrice: number | null;
    finalPrice: number;
    categoryName: string | null;
    productType: "COURSE" | "TEST_SERIES";
    mode: "ONLINE" | "PHYSICAL" | "BOTH" | null;
    targetClass: string | null;
    targetExam: string | null;
    badge: string | null;
    validity: string | null;
    seatsLeft: number | null;
    centreName: string | null;
    centreCity: string | null;
    testCountFull: number | null;
    testCountChapter: number | null;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

export async function getCart(userId: string): Promise<CartCalculation> {
  const cartItems = await db.cartItem.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
    include: {
      course: {
        include: {
          category: { select: { name: true } },
          centre: { select: { name: true, city: true } },
        },
      },
    },
  });

  const validItems: CartCalculation["items"] = [];
  let subtotal = 0;
  let total = 0;

  for (const item of cartItems) {
    const course = item.course;
    // Skip if course was soft-deleted or archived
    if (course.deletedAt || course.status === CourseStatus.ARCHIVED) {
      continue;
    }

    const price = Number(course.price);
    const discountPrice = course.discountPrice ? Number(course.discountPrice) : null;
    const finalPrice = discountPrice !== null && discountPrice < price ? discountPrice : price;

    subtotal += price;
    total += finalPrice;

    validItems.push({
      id: item.id,
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      thumbnailUrl: course.thumbnailUrl,
      price,
      discountPrice,
      finalPrice,
      categoryName: course.category?.name || null,
      productType: course.productType as "COURSE" | "TEST_SERIES",
      mode: course.mode,
      targetClass: course.targetClass,
      targetExam: course.targetExam,
      badge: course.badge,
      validity: course.validity,
      seatsLeft: course.seatsLeft,
      centreName: course.centre?.name || null,
      centreCity: course.centre?.city || null,
      testCountFull: course.testCountFull,
      testCountChapter: course.testCountChapter,
    });
  }

  return {
    items: validItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round((subtotal - total) * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount: validItems.length,
  };
}

export async function addToCart(userId: string, courseIdOrSlug: string) {
  // Find course by ID or slug
  const course = await db.course.findFirst({
    where: {
      OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
      deletedAt: null,
    },
  });

  if (!course) {
    throw new Error("Course not found.");
  }

  if (course.status !== CourseStatus.PUBLISHED) {
    throw new Error("This course is currently not available for purchase.");
  }

  // Check if user is already enrolled
  const existingEnrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: course.id,
      },
    },
  });

  if (existingEnrollment && existingEnrollment.status === "ACTIVE") {
    throw new Error("You are already enrolled in this course.");
  }

  // Upsert cart item
  await db.cartItem.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      userId,
      courseId: course.id,
    },
  });

  return getCart(userId);
}

export async function removeFromCart(userId: string, courseId: string) {
  await db.cartItem.deleteMany({
    where: {
      userId,
      OR: [{ courseId }, { course: { slug: courseId } }],
    },
  });

  return getCart(userId);
}

export async function clearCart(userId: string) {
  await db.cartItem.deleteMany({
    where: { userId },
  });

  return { success: true };
}

export async function getCartCount(userId: string): Promise<number> {
  return db.cartItem.count({
    where: {
      userId,
      course: {
        deletedAt: null,
        status: CourseStatus.PUBLISHED,
      },
    },
  });
}
