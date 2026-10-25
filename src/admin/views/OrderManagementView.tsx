"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem {
  id: string;
  invoiceNo: string | null;
  total: number;
  subtotal: number;
  discount: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  gateway: string;
  gatewayPaymentId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  items: Array<{
    id: string;
    price: number;
    course: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
}

export function OrderManagementView() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load orders");
      }
      const json = await res.json();
      setOrders(json.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load orders.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadOrders();
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            E-Commerce &amp; Invoicing
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0.25rem 0 0" }}>
            Orders &amp; Demo Payments
          </h1>
          <p style={{ color: "#475569", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
            Monitor student transactions, inspect verified invoice receipts, and track payment gateway statuses.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "0.875rem 1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "#ffffff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search by invoice #, student name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem 0.875rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.875rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Order List Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            Loading orders list...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            No orders found matching the filter criteria.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Invoice #</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Student</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Courses</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Amount</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Gateway</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem", fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                    {order.invoiceNo || order.id.slice(0, 8)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{order.user.name || "Student"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{order.user.email}</div>
                  </td>
                  <td style={{ padding: "1rem", color: "#334155" }}>
                    {order.items.map((i) => (
                      <div key={i.id} style={{ fontSize: "0.8125rem" }}>
                        • {i.course?.title || "Course"}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      ₹{order.total.toLocaleString("en-IN")}
                    </div>
                    {order.discount > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "#16a34a" }}>
                        -₹{order.discount.toLocaleString("en-IN")} disc
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor:
                          order.status === "PAID"
                            ? "#dcfce7"
                            : order.status === "PENDING"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          order.status === "PAID"
                            ? "#15803d"
                            : order.status === "PENDING"
                            ? "#b45309"
                            : "#b91c1c",
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8125rem" }}>
                    <div>{order.gateway}</div>
                    {order.gatewayPaymentId && (
                      <div style={{ fontFamily: "monospace", fontSize: "0.6875rem" }}>
                        {order.gatewayPaymentId}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <Link
                      href={`/orders/${order.id}`}
                      target="_blank"
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #cbd5e1",
                        color: "#2563eb",
                        textDecoration: "none",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      View Invoice ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
