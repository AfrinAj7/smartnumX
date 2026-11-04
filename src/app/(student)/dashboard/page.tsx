import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listUserEnrollments } from "@/server/enrollments/enrollment-service";
import { listUserOrders } from "@/server/orders/order-service";
import { StudentDashboardView } from "@/web-client/views/StudentDashboardView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Purchases & Learning Portal | SmartNum",
  description: "Access your enrolled academic tuition courses and test series packages.",
};

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const [enrollments, orders] = await Promise.all([
    listUserEnrollments(session.user.id),
    listUserOrders(session.user.id),
  ]);

  return (
    <StudentDashboardView
      user={session.user}
      enrollments={enrollments}
      orders={orders}
    />
  );
}
