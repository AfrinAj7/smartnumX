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

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

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
        // Reset applied coupon on cart change
        setAppliedCoupon(null);
        setCouponError(null);
      }
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  }

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponApplying(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.message || "Invalid or ineligible coupon code.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.code,
          discount: data.discount || 0,
          message: data.message,
        });
        setCouponError(null);
      }
    } catch {
      setCouponError("Could not validate coupon. Please check your connection.");
    } finally {
      setCouponApplying(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  }

  function handleProceedToCheckout() {
    if (appliedCoupon?.code) {
      router.push(`/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}`);
    } else {
      router.push("/checkout");
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "4rem auto", textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem", animation: "spin 1s linear infinite" }}>⏳</div>
        <p style={{ color: "#64748b", fontSize: "1.125rem", fontWeight: 500 }}>
          Loading your learning cart...
        </p>
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "4rem auto",
          textAlign: "center",
          padding: "3rem 1.5rem",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🛒</div>
        <h2 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
          Sign In to Access Your Cart
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.75rem", fontSize: "0.9375rem", lineHeight: 1.6 }}>
          Sign in or create a student account to review your selected courses &amp; test series, apply scholarship vouchers, and complete your enrolment.
        </p>
        <Link
          href="/sign-in?callbackUrl=/cart"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "#ea580c",
            color: "#ffffff",
            padding: "0.875rem 2rem",
            borderRadius: "0.5rem",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 6px -1px rgba(234, 88, 12, 0.25)",
          }}
        >
          <span>Sign In / Create Account</span>
          <span>→</span>
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div
        style={{
          maxWidth: "640px",
          margin: "4rem auto",
          textAlign: "center",
          padding: "3.5rem 1.5rem",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛍️</div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
          Your Cart is Empty
        </h2>
        <p style={{ color: "#64748b", marginBottom: "2rem", fontSize: "0.9375rem", lineHeight: 1.6 }}>
          You haven&apos;t added any tuition programmes or test series packs yet. Choose from our concept-first maths and science curricula or all-India mock exam packages.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/batches"
            style={{
              backgroundColor: "#ea580c",
              color: "#ffffff",
              padding: "0.875rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 6px -1px rgba(234, 88, 12, 0.25)",
            }}
          >
            Explore Courses &amp; Batches →
          </Link>
          <Link
            href="/test-series"
            style={{
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              padding: "0.875rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Explore Test Series (2026-27)
          </Link>
        </div>
      </div>
    );
  }

  const couponDiscount = appliedCoupon?.discount || 0;
  const finalPayable = Math.max(0, cart.total - couponDiscount);

  return (
    <div style={{ maxWidth: "1160px", margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* Header Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: "0.25rem" }}>
          <span>SmartNum Enrolment Desk</span>
          <span>•</span>
          <span style={{ color: "#ea580c" }}>Cart Review</span>
        </div>
        <h1 style={{ fontSize: "2.125rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
          Your Enrolment Cart ({cart.itemCount} {cart.itemCount === 1 ? "Item" : "Items"})
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }} className="cart-layout-grid">
        <style>{`
          @media (min-width: 900px) {
            .cart-layout-grid {
              grid-template-columns: 1fr 380px !important;
            }
          }
        `}</style>

        {/* Left Column: Cart Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {cart.items.map((item) => {
            const isTestSeries = item.productType === "TEST_SERIES";
            const detailHref = isTestSeries ? `/test-series/${item.slug}` : `/batches/${item.slug}`;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#ffffff",
                  padding: "1.5rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: "260px" }}>
                    {/* Icon Box */}
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "0.625rem",
                        backgroundColor: isTestSeries ? "#eff6ff" : "#fff7ed",
                        color: isTestSeries ? "#2563eb" : "#ea580c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.75rem",
                        flexShrink: 0,
                      }}
                    >
                      {isTestSeries ? "📝" : "📐"}
                    </div>

                    <div>
                      {/* Product Type & Badge Row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            backgroundColor: isTestSeries ? "#eff6ff" : "#f1f5f9",
                            color: isTestSeries ? "#1d4ed8" : "#334155",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                          }}
                        >
                          {isTestSeries ? "Test Series" : "Tuition Programme"}
                        </span>

                        {item.mode === "PHYSICAL" && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                            }}
                          >
                            📍 Physical Centre: {item.centreName || "Indirapuram"}
                          </span>
                        )}

                        {item.mode === "ONLINE" && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              backgroundColor: "#ecfdf5",
                              color: "#065f46",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                            }}
                          >
                            💻 Online Interactive
                          </span>
                        )}

                        {item.badge && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              backgroundColor: "#ea580c",
                              color: "#ffffff",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.35rem", lineHeight: 1.35 }}>
                        <Link href={detailHref} style={{ color: "inherit", textDecoration: "none" }}>
                          {item.title}
                        </Link>
                      </h3>

                      {/* Metrics or Inclusions */}
                      <div style={{ fontSize: "0.8125rem", color: "#64748b", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        {isTestSeries ? (
                          <>
                            {item.testCountFull && <span>📊 {item.testCountFull} Full Length Mocks</span>}
                            {item.testCountChapter && <span>📖 {item.testCountChapter} Chapter Drills</span>}
                            {item.validity && <span>⏱️ Valid: {item.validity}</span>}
                          </>
                        ) : (
                          <>
                            {item.targetClass && <span>🎓 Class: {item.targetClass}</span>}
                            {item.mode === "PHYSICAL" && item.seatsLeft !== null && (
                              <span style={{ color: item.seatsLeft <= 5 ? "#dc2626" : "#475569", fontWeight: 600 }}>
                                🪑 {item.seatsLeft} seats remaining
                              </span>
                            )}
                            <span>✨ Video Recordings + Study Notes + Doubt Desk</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0f172a" }}>
                        ₹{item.finalPrice.toLocaleString("en-IN")}
                      </div>
                      {item.discountPrice && item.discountPrice < item.price && (
                        <div style={{ fontSize: "0.8125rem", color: "#94a3b8", textDecoration: "line-through" }}>
                          ₹{item.price.toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.courseId)}
                      disabled={removingId === item.courseId}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "0.25rem 0",
                        textDecoration: "underline",
                      }}
                    >
                      {removingId === item.courseId ? "Removing..." : "Remove Item"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            <Link
              href="/batches"
              style={{
                color: "#2563eb",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              ← Add Tuition Courses
            </Link>
            <Link
              href="/test-series"
              style={{
                color: "#2563eb",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              ← Add Test Series Pack
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon Engine */}
        <div>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              padding: "1.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              position: "sticky",
              top: "100px",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.25rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
              Order Breakdown
            </h2>

            {/* Calculations List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                <span>Subtotal ({cart.itemCount} items):</span>
                <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
              </div>

              {cart.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#16a34a", fontWeight: 600 }}>
                  <span>Course Direct Savings:</span>
                  <span>-₹{cart.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              {appliedCoupon && appliedCoupon.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#16a34a", fontWeight: 700 }}>
                  <span>Coupon Discount ({appliedCoupon.code}):</span>
                  <span>-₹{appliedCoupon.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                <span>Tax / GST:</span>
                <span style={{ color: "#16a34a", fontWeight: 600 }}>Included (₹0 Extra)</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.375rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  borderTop: "2px solid #f1f5f9",
                  paddingTop: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                <span>Total Payable:</span>
                <span style={{ color: "#ea580c" }}>₹{finalPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Coupon Code Input Box */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>
                🏷️ Have a Scholarship or Promo Code?
              </div>

              {appliedCoupon ? (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: "#15803d", fontSize: "0.875rem" }}>
                      ✓ {appliedCoupon.code} Applied
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#166534" }}>{appliedCoupon.message}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="e.g. SMART10, TEST20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.625rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={couponApplying || !couponCode.trim()}
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.625rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: couponApplying ? "wait" : "pointer",
                    }}
                  >
                    {couponApplying ? "..." : "Apply"}
                  </button>
                </form>
              )}

              {couponError && (
                <div style={{ color: "#dc2626", fontSize: "0.75rem", fontWeight: 500, marginTop: "0.5rem" }}>
                  ⚠️ {couponError}
                </div>
              )}
            </div>

            {/* Primary Proceed CTA */}
            <button
              type="button"
              onClick={handleProceedToCheckout}
              style={{
                width: "100%",
                backgroundColor: "#ea580c",
                color: "#ffffff",
                padding: "0.95rem",
                borderRadius: "0.5rem",
                fontWeight: 800,
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(234, 88, 12, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background-color 0.15s ease",
              }}
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </button>

            {/* Trust Markers */}
            <div style={{ marginTop: "1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", fontSize: "0.75rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🔒</span>
                <span>Bank-grade 256-bit encrypted simulated checkout</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>⚡</span>
                <span>Immediate portal activation upon confirmation</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>📞</span>
                <span>Admission helpline: +91 99589 66823</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
