import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrderById } from "@/server/orders/order-service";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmation | SmartNum",
  description: "View your order details and invoice.",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const [order, content] = await Promise.all([
    getOrderById(id, session.user.role === "SUPER_ADMIN" ? undefined : session.user.id),
    getHomepageContent(db),
  ]);

  if (!order) {
    notFound();
  }

  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 47774";
  const whatsapp = contact?.whatsapp || "+91 99589 47774";

  const firstTestSeriesItem = order.items.find(
    (i) => i.course?.productType === "TEST_SERIES" && i.course.slug
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      <SiteHeader phone={phone} whatsappNumber={whatsapp} user={session.user} />

      <main style={{ flex: 1, padding: "3rem 1.5rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        {/* Success / Status Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "9999px",
              backgroundColor: order.status === "PAID" ? "#dcfce7" : "#fee2e2",
              color: order.status === "PAID" ? "#16a34a" : "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              margin: "0 auto 1rem",
            }}
          >
            {order.status === "PAID" ? "✓" : "!"}
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
            {order.status === "PAID" ? "Enrolment Confirmed!" : `Order Status: ${order.status}`}
          </h1>

          <p style={{ color: "#475569", margin: 0, fontSize: "0.9375rem" }}>
            {order.status === "PAID"
              ? "Your course access is now activated. Welcome to SmartNum!"
              : "This order is currently pending or was simulated as failed."}
          </p>
        </div>

        {/* Invoice Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            padding: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: "1.25rem", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                Invoice Number
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                {order.invoiceNo || order.id}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  backgroundColor: order.status === "PAID" ? "#dcfce7" : "#fee2e2",
                  color: order.status === "PAID" ? "#15803d" : "#b91c1c",
                }}
              >
                {order.status}
              </span>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          {/* Student & Payment Gateway Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>Billed To:</span>
              <strong style={{ color: "#0f172a" }}>{order.user.name || "Student"}</strong>
              <div style={{ color: "#475569" }}>{order.user.email}</div>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block" }}>Payment Method:</span>
              <strong style={{ color: "#0f172a" }}>Demo Simulator</strong>
              {order.gatewayPaymentId && (
                <div style={{ color: "#64748b", fontSize: "0.75rem", fontFamily: "monospace" }}>
                  Ref: {order.gatewayPaymentId}
                </div>
              )}
            </div>
          </div>

          {/* Purchased Items List */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
              Enrolled Programmes &amp; Test Series
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {order.items.map((item) => {
                const isTestSeries = item.course?.productType === "TEST_SERIES";

                return (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.45rem",
                            borderRadius: "0.25rem",
                            backgroundColor: isTestSeries ? "#eff6ff" : "#fff7ed",
                            color: isTestSeries ? "#1d4ed8" : "#c2410c",
                          }}
                        >
                          {isTestSeries ? "Test Series" : "Tuition Programme"}
                        </span>
                        {item.course?.mode === "PHYSICAL" && (
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, backgroundColor: "#fef3c7", color: "#92400e", padding: "0.15rem 0.45rem", borderRadius: "0.25rem" }}>
                            📍 Indirapuram Centre
                          </span>
                        )}
                      </div>

                      <strong style={{ color: "#0f172a", fontSize: "0.9375rem" }}>
                        {item.course?.title || "Academic Programme"}
                      </strong>

                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                        {isTestSeries ? (
                          <>
                            {item.course?.testCountFull && `${item.course.testCountFull} Full Length Mocks · `}
                            {item.course?.testCountChapter && `${item.course.testCountChapter} Chapter Tests · `}
                            {item.course?.validity || "Till Exam 2026-27"}
                          </>
                        ) : (
                          <>
                            {item.course?.targetClass && `Class: ${item.course.targetClass} · `}
                            Full Syllabus Coverage · Live &amp; Recorded Lectures Included
                          </>
                        )}
                      </div>
                    </div>

                    <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Breakdown */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>Subtotal:</span>
              <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: 600 }}>
                <span>Discount Applied:</span>
                <span>-₹{order.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.125rem",
                fontWeight: 800,
                color: "#0f172a",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "0.5rem",
                marginTop: "0.25rem",
              }}
            >
              <span>Total Paid:</span>
              <span style={{ color: "#ea580c" }}>₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {order.status === "PAID" && (
            <>
              {firstTestSeriesItem && firstTestSeriesItem.course && (
                <Link
                  href={`/test-series/${firstTestSeriesItem.course.slug}#mock-tests`}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    padding: "0.875rem 1.75rem",
                    borderRadius: "0.5rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  <span>Attempt Test Series Now 🚀</span>
                  <span>→</span>
                </Link>
              )}

              <Link
                href="/dashboard"
                style={{
                  backgroundColor: "#ea580c",
                  color: "#ffffff",
                  padding: "0.875rem 1.75rem",
                  borderRadius: "0.5rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgba(234, 88, 12, 0.25)",
                }}
              >
                <span>Go to Student Portal</span>
                <span>→</span>
              </Link>
            </>
          )}

          <Link
            href="/batches"
            style={{
              backgroundColor: "#ffffff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              padding: "0.875rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explore More Batches
          </Link>

          <Link
            href="/test-series"
            style={{
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              padding: "0.875rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explore Test Series
          </Link>
        </div>
      </main>

      <SiteFooter contact={contact} />
    </div>
  );
}
