"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: number;
  discountPrice: number | null;
  finalPrice: number;
  categoryName: string | null;
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

export function CartView() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  async function loadCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        setUnauthenticated(true);
        setCart(null);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load cart");
      }
      const json = await res.json();
      setCart(json.data);
      setUnauthenticated(false);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function handleRemove(courseId: string) {
    setRemovingId(courseId);
    try {
      const res = await fetch(`/api/cart/${courseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
        window.dispatchEvent(new Event("smartnum-cart-updated"));
      }
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "4rem auto", textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "#64748b", fontSize: "1.125rem" }}>Loading your course cart...</p>
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "2.5rem 1.5rem", backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
          Sign In to View Your Cart
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>
          Please sign in or create an account to view courses in your cart and complete checkout.
        </p>
        <Link
          href="/sign-in?callbackUrl=/cart"
          style={{
            display: "inline-block",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign In / Register →
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🛍️</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
          Your Cart is Empty
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>
          Explore our concept-first maths and science tuition programmes and competitive batches.
        </p>
        <Link
          href="/courses"
          style={{
            display: "inline-block",
            backgroundColor: "#ea580c",
            color: "#ffffff",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Explore Courses &amp; Batches →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "2rem auto", padding: "0 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Checkout &amp; Enrolment
        </span>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0 0" }}>
          Your Course Cart ({cart.itemCount})
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }} className="cart-layout-grid">
        <style>{`
          @media (min-width: 860px) {
            .cart-layout-grid {
              grid-template-columns: 1fr 360px !important;
            }
          }
        `}</style>

        {/* Left Column: Item List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {cart.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#ffffff",
                padding: "1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #e2e8f0",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flex: 1, minWidth: "240px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "0.5rem",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                  }}
                >
                  📐
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                    }}
                  >
                    {item.categoryName || "Academic Tuition"}
                  </span>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0.25rem 0" }}>
                    <Link href={`/courses/${item.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {item.title}
                    </Link>
                  </h3>
                  <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                    Small batch · Ph.D.-led mentorship · Diagnostic testing
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a" }}>
                    ₹{item.finalPrice.toLocaleString("en-IN")}
                  </div>
                  {item.discountPrice && item.discountPrice < item.price && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", textDecoration: "line-through" }}>
                      ₹{item.price.toLocaleString("en-IN")}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.courseId)}
                  disabled={removingId === item.courseId}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#dc2626",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "0.5rem",
                  }}
                >
                  {removingId === item.courseId ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "1rem" }}>
            <Link
              href="/courses"
              style={{
                color: "#2563eb",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              ← Continue browsing other courses
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
              Order Summary
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                <span>Course Subtotal:</span>
                <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
              </div>

              {cart.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#16a34a", fontWeight: 600 }}>
                  <span>SmartNum Direct Savings:</span>
                  <span>-₹{cart.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                <span>Applicable GST:</span>
                <span>Included (0%)</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "0.75rem",
                  marginTop: "0.25rem",
                }}
              >
                <span>Total Payable:</span>
                <span style={{ color: "#ea580c" }}>₹{cart.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/checkout")}
              style={{
                width: "100%",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "0.875rem",
                borderRadius: "0.5rem",
                fontWeight: 700,
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </button>

            <div style={{ marginTop: "1.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", fontSize: "0.75rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🔒</span>
                <span>Demo payment gateway ready for instant course unlocking.</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>⚡</span>
                <span>Instant access granted to student dashboard upon confirmation.</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>📞</span>
                <span>Have questions? Call counselor: +91 99589 47774</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
