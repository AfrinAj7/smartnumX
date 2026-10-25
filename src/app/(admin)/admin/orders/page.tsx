import { OrderManagementView } from "@/admin/views/OrderManagementView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders & Demo Payments | SmartNum Admin",
  description: "Monitor and inspect student course transactions and invoices.",
};

export default function AdminOrdersPage() {
  return <OrderManagementView />;
}
