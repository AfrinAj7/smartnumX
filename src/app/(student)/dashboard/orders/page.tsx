import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listUserOrders } from "@/server/orders/order-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order History | SmartNum Learner Space",
  description: "View past orders, invoices, and payment receipts.",
};

export default async function StudentOrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard/orders");
  }

  const orders = await listUserOrders(session.user.id);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Billing &amp; Receipts
        </span>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0 0" }}>
          Order &amp; Payment History ({orders.length})
        </h1>
        <p style={{ color: "#475569", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
          Inspect receipts and download simulated invoices for completed course transactions.
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#64748b", margin: 0 }}>No orders found for this account.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Invoice #</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Courses</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Amount</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem", fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                    {order.invoiceNo || order.id.slice(0, 8)}
                  </td>
                  <td style={{ padding: "1rem", color: "#475569" }}>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "1rem", color: "#334155" }}>
                    {order.items.map((i) => i.course?.title || "Course").join(", ")}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 700, color: "#0f172a" }}>
                    ₹{order.total.toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: order.status === "PAID" ? "#dcfce7" : "#fee2e2",
                        color: order.status === "PAID" ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <Link
                      href={`/orders/${order.id}`}
                      style={{
                        color: "#2563eb",
                        fontWeight: 600,
                        textDecoration: "none",
                        fontSize: "0.8125rem",
                      }}
                    >
                      View Invoice ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
