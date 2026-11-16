"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface CartItem {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  finalPrice: number;
  productType?: "COURSE" | "TEST_SERIES";
  mode?: "ONLINE" | "PHYSICAL" | "BOTH" | null;
  badge?: string | null;
  validity?: string | null;
  centreName?: string | null;
  testCountFull?: number | null;
  testCountChapter?: number | null;
  seatsLeft?: number | null;
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

export function CheckoutView({
  user,
}: {
  user: { name?: string | null; email?: string | null; phone?: string | null } | null;
}) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("DEMO_UPI");

  // Student Details Form
  const [studentName, setStudentName] = useState(user?.name || "");
  const [studentPhone, setStudentPhone] = useState(user?.phone || "");
  const [studentEmail, setStudentEmail] = useState(user?.email || "");
  const [studentClass, setStudentClass] = useState("Class 10 (Board)");
  const [studentCity, setStudentCity] = useState("Indirapuram, Ghaziabad");

  // Coupon state
  const searchParams = useSearchParams();
  const initialCoupon = searchParams.get("coupon") || "";
  const [couponCode, setCouponCode] = useState(initialCoupon);
  const [couponApplying, setCouponApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failureNotice, setFailureNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      try {
        const res = await fetch("/api/cart");
        if (res.status === 401) {
          router.push("/sign-in?callbackUrl=/checkout");
          return;
        }
        const json = await res.json();
        setCart(json.data);

        // Pre-validate coupon if provided in query param
        if (initialCoupon) {
          try {
            const vRes = await fetch("/api/coupons/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: initialCoupon }),
            });
            const vData = await vRes.json();
            if (vData.valid) {
              setAppliedCoupon({
                code: vData.code,
                discount: vData.discount || 0,
                message: vData.message,
              });
            }
          } catch {
            // ignore initial coupon prefetch failure
          }
        }
      } catch {
        setErrorMessage("Failed to load your cart. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [router, initialCoupon]);

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
        setCouponError(data.message || "Invalid coupon code.");
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
      setCouponError("Could not validate coupon. Please check connection.");
    } finally {
      setCouponApplying(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  }

  async function handleSimulatePayment(simulateSuccess: boolean) {
    if (!cart || cart.items.length === 0) return;

    if (!studentName.trim()) {
      setErrorMessage("Please enter the student's full name.");
      return;
    }
    if (!studentPhone.trim()) {
      setErrorMessage("Please enter a valid contact phone number.");
      return;
    }

    setProcessing(true);
    setErrorMessage(null);
    setFailureNotice(null);

    try {
      // Step 1: Create the pending order from the cart
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCoupon?.code || undefined,
          studentDetails: {
            studentName: studentName.trim(),
            studentPhone: studentPhone.trim(),
            studentEmail: studentEmail.trim() || user?.email || undefined,
            studentClass: studentClass.trim(),
            studentCity: studentCity.trim(),
          },
        }),
      });

      const checkoutJson = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(checkoutJson.error || "Failed to initiate order.");
      }

      const orderId = checkoutJson.data.orderId;

      // Step 2: Process the demo payment
      const paymentRes = await fetch("/api/payments/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          simulateSuccess,
          paymentMethod,
        }),
      });

      const paymentJson = await paymentRes.json();
      if (!paymentRes.ok) {
        throw new Error(paymentJson.error || "Payment simulation failed.");
      }

      if (simulateSuccess) {
        window.dispatchEvent(new Event("smartnum-cart-updated"));
        startTransition(() => {
          router.push(`/orders/${orderId}?status=success`);
        });
      } else {
        setFailureNotice(
          "Payment simulation declined as requested. Your order remains marked as FAILED and can be retried anytime."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during checkout.";
      setErrorMessage(msg);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "4rem auto", textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⏳</div>
        <p style={{ color: "#64748b", fontSize: "1.125rem", fontWeight: 500 }}>
          Preparing your secure enrolment session...
        </p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
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
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🛍️</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
          No Items in Cart for Checkout
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.75rem", fontSize: "0.9375rem" }}>
          Your cart is currently empty. Please select a tuition course or test series package before proceeding.
        </p>
        <Link
          href="/batches"
          style={{
            display: "inline-block",
            backgroundColor: "#ea580c",
            color: "#ffffff",
            padding: "0.75rem 1.75rem",
            borderRadius: "0.5rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Browse Batches &amp; Test Series →
        </Link>
      </div>
    );
  }

  const couponDiscount = appliedCoupon?.discount || 0;
  const finalPayable = Math.max(0, cart.total - couponDiscount);

  return (
    <div style={{ maxWidth: "1160px", margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* Page Title */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: "0.25rem" }}>
          <span>SmartNum Enrolment Desk</span>
          <span>•</span>
          <span style={{ color: "#ea580c" }}>Step 2 of 2: Checkout</span>
        </div>
        <h1 style={{ fontSize: "2.125rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
          Student Enrolment &amp; Payment
        </h1>
        <p style={{ color: "#475569", margin: "0.35rem 0 0", fontSize: "0.9375rem" }}>
          Logged in as: <strong>{user?.name || user?.email}</strong>
        </p>
      </div>

      {failureNotice && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
          ❌ {failureNotice}
        </div>
      )}

      {errorMessage && (
        <div style={{ backgroundColor: "#fff5f5", color: "#c53030", border: "1px solid #feb2b2", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }} className="checkout-layout-grid">
        <style>{`
          @media (min-width: 900px) {
            .checkout-layout-grid {
              grid-template-columns: 1fr 400px !important;
            }
          }
        `}</style>

        {/* Left Column: Student Details + Payment Selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Section 1: Student Information */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.25rem" }}>👤</span>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                1. Student &amp; Academic Details
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="student-form-grid">
              <style>{`
                @media (max-width: 600px) {
                  .student-form-grid {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  WhatsApp / Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  Email Address (Receipt &amp; Access) *
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  Current Target Class
                </label>
                <select
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="Class 9">Class 9 (CBSE / ICSE Tuition)</option>
                  <option value="Class 10 (Board)">Class 10 (Board Focus)</option>
                  <option value="Class 11">Class 11 (Maths &amp; Sciences)</option>
                  <option value="Class 12 (Board)">Class 12 (Board &amp; Entrance)</option>
                  <option value="IIT-JEE Main + Advanced">IIT-JEE (Main + Advanced / Dropper)</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  City / Preferred Study Centre
                </label>
                <input
                  type="text"
                  value={studentCity}
                  onChange={(e) => setStudentCity(e.target.value)}
                  placeholder="Indirapuram Centre, Ghaziabad"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Simulator Mode */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.25rem" }}>💳</span>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                2. Payment Gateway Mode (Simulated Sandbox)
              </h2>
            </div>

            {/* Test Sandbox Badge */}
            <div
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "0.5rem",
                padding: "1rem",
                marginBottom: "1.25rem",
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>ℹ️</span>
              <div style={{ fontSize: "0.875rem", color: "#1e3a8a", lineHeight: 1.5 }}>
                <strong>Cashfree / UPI Sandbox Mode Enabled:</strong> No real bank transactions or card charges are incurred. This tests complete order generation, payment signature processing, and instant student dashboard entitlement unlocking.
              </div>
            </div>

            {/* Simulated Payment Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.5rem",
                  border: paymentMethod === "DEMO_UPI" ? "2px solid #ea580c" : "1px solid #cbd5e1",
                  backgroundColor: paymentMethod === "DEMO_UPI" ? "#fff7ed" : "#ffffff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="DEMO_UPI"
                  checked={paymentMethod === "DEMO_UPI"}
                  onChange={() => setPaymentMethod("DEMO_UPI")}
                />
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem" }}>
                    📱 UPI Instant (GPay / PhonePe / Paytm / BHIM)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Instant virtual VPA verification</div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.5rem",
                  border: paymentMethod === "DEMO_CARD" ? "2px solid #ea580c" : "1px solid #cbd5e1",
                  backgroundColor: paymentMethod === "DEMO_CARD" ? "#fff7ed" : "#ffffff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="DEMO_CARD"
                  checked={paymentMethod === "DEMO_CARD"}
                  onChange={() => setPaymentMethod("DEMO_CARD")}
                />
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem" }}>
                    💳 Credit / Debit Cards (Visa, MasterCard, RuPay)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Simulated 3D-Secure authentication</div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.5rem",
                  border: paymentMethod === "DEMO_NETBANKING" ? "2px solid #ea580c" : "1px solid #cbd5e1",
                  backgroundColor: paymentMethod === "DEMO_NETBANKING" ? "#fff7ed" : "#ffffff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="DEMO_NETBANKING"
                  checked={paymentMethod === "DEMO_NETBANKING"}
                  onChange={() => setPaymentMethod("DEMO_NETBANKING")}
                />
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem" }}>
                    🏦 Net Banking (SBI / HDFC / ICICI / Axis)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Direct simulated banking session</div>
                </div>
              </label>
            </div>

            {/* Simulation Action Triggers */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => handleSimulatePayment(true)}
                disabled={processing}
                style={{
                  width: "100%",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  fontWeight: 800,
                  fontSize: "1.0625rem",
                  border: "none",
                  cursor: processing ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.25)",
                }}
              >
                {processing ? (
                  <span>Processing Enrolment Transaction...</span>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Simulate Payment Success (Pay ₹{finalPayable.toLocaleString("en-IN")})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSimulatePayment(false)}
                disabled={processing}
                style={{
                  width: "100%",
                  backgroundColor: "#ffffff",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: processing ? "wait" : "pointer",
                }}
              >
                Simulate Payment Failure / Bank Decline
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon Engine */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              position: "sticky",
              top: "100px",
            }}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
              Enrolment Summary
            </h2>

            {/* Enrolled Items List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <div>
                    <div style={{ color: "#0f172a", fontWeight: 700 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {item.productType === "TEST_SERIES" ? "📝 Test Series Pack" : `📐 Mode: ${item.mode || "Online"}`}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                    ₹{item.finalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#64748b" }}>
                <span>Subtotal:</span>
                <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
              </div>

              {cart.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#16a34a", fontWeight: 600 }}>
                  <span>Course Discount:</span>
                  <span>-₹{cart.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              {appliedCoupon && appliedCoupon.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#16a34a", fontWeight: 700 }}>
                  <span>Coupon ({appliedCoupon.code}):</span>
                  <span>-₹{appliedCoupon.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#64748b" }}>
                <span>Applicable GST:</span>
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

            {/* Coupon Code Section */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
              {appliedCoupon ? (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "0.5rem",
                    padding: "0.625rem 0.75rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "0.8125rem", color: "#15803d", fontWeight: 700 }}>
                    ✓ {appliedCoupon.code} applied (-₹{appliedCoupon.discount.toLocaleString("en-IN")})
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
                    placeholder="Coupon code (e.g. SMART10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.375rem",
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
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      padding: "0.5rem 0.875rem",
                      borderRadius: "0.375rem",
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

            {/* Trust Assurances */}
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", fontSize: "0.75rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🔒</span>
                <span>Encrypted simulated checkout environment</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>⚡</span>
                <span>Automated enrollment unlock upon completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
