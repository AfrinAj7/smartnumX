import { CouponManagementView } from "@/admin/views/CouponManagementView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coupon & Discount Management | SmartNum Admin",
  description: "Create and track promotional codes and scholarship vouchers.",
};

export default function AdminCouponsPage() {
  return <CouponManagementView />;
}

