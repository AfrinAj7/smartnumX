"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  finalPrice: number;
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
  user: { name?: string | null; email?: string | null } | null;
}) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("DEMO_UPI");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failureNotice, setFailureNotice] = useState<string | null>(null);
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
      } catch {
        setErrorMessage("Failed to load your cart.");
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [router]);

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const code = couponCode.trim().toUpperCase();
    if (code === "SAMPLE10") {
      const discountVal = cart ? Math.round(((cart.total * 10) / 100) * 100) / 100 : 0;
      setCouponDiscount(discountVal);
      setCouponApplied("SAMPLE10 (10% Off)");
      setErrorMessage(null);
    } else if (code === "SAMPLE250") {
      setCouponDiscount(250);
      setCouponApplied("SAMPLE250 (₹250 Flat Off)");
      setErrorMessage(null);
    } else {
      setErrorMessage("Coupon code is not valid or expired.");
    }
  }

  async function handleSimulatePayment(simulateSuccess: boolean) {
    if (!cart || cart.items.length === 0) return;
    setProcessing(true);
    setErrorMessage(null);
    setFailureNotice(null);

    try {
      // Step 1: Create the pending order from the cart
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponApplied ? couponCode.trim() : undefined }),
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
        // Dispatches event to update header cart count
        window.dispatchEvent(new Event("smartnum-cart-updated"));
        // Redirect to order success page
        router.push(`/orders/${orderId}?status=success`);
      } else {
        setFailureNotice("Payment simulation was declined or failed as requested. Your order remains marked as FAILED and you may retry anytime.");
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
        <p style={{ color: "#64748b", fontSize: "1.125rem" }}>Preparing your checkout session...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
          No Items to Checkout
        </h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>
          Your course cart is empty. Please select a course before proceeding to checkout.
        </p>
        <Link
          href="/courses"
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
          View Course Catalog →
        </Link>
      </div>
    );
  }

  const finalPayable = Math.max(0, cart.total - couponDiscount);

  return (
    <div style={{ maxWidth: "1100px", margin: "2rem auto", padding: "0 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Secure Enrolment
        </span>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0 0" }}>
          Checkout &amp; Demo Payment
        </h1>
        <p style={{ color: "#475569", margin: "0.25rem 0 0" }}>
          Enrolling student: <strong>{user?.name || user?.email}</strong>
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
          @media (min-width: 860px) {
            .checkout-layout-grid {
              grid-template-columns: 1fr 380px !important;
            }
          }
        `}</style>

        {/* Left Column: Payment Simulator */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Test Mode Banner */}
          <div
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "0.75rem",
              padding: "1.25rem",
              display: "flex",
              gap: "0.875rem",
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>ℹ️</span>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e40af", margin: "0 0 0.25rem" }}>
                Test Mode — Demo Payment Gateway Simulator
              </h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#1e3a8a", lineHeight: 1.5 }}>
                No real credit/debit card is required and no real currency is deducted. This simulator verifies complete order processing, automated enrollment creation, and course unlocking on the student dashboard.
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Select Simulated Payment Method
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.5rem",
                  border: paymentMethod === "DEMO_UPI" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  backgroundColor: paymentMethod === "DEMO_UPI" ? "#f8fafc" : "#ffffff",
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
                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9375rem" }}>
                    📱 UPI (GPay / PhonePe / Paytm / BHIM)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Instant virtual VPA auto-approval</div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.5rem",
                  border: paymentMethod === "DEMO_CARD" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  backgroundColor: paymentMethod === "DEMO_CARD" ? "#f8fafc" : "#ffffff",
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
                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9375rem" }}>
                    💳 Test Credit / Debit Card (Visa, RuPay, Mastercard)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Simulated 3DS test challenge token</div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.5rem",
                  border: paymentMethod === "DEMO_NETBANKING" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  backgroundColor: paymentMethod === "DEMO_NETBANKING" ? "#f8fafc" : "#ffffff",
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
                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9375rem" }}>
                    🏦 Net Banking (SBI / HDFC / ICICI / Axis)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Mock institutional bank gateway</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Execute Simulated Transaction
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.25rem" }}>
              Choose whether to test a successful order completion or simulate an intentional gateway error:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => handleSimulatePayment(true)}
                disabled={processing}
                style={{
                  width: "100%",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  padding: "0.875rem 1.25rem",
                  borderRadius: "0.5rem",
                  fontWeight: 700,
                  fontSize: "1rem",
                  border: "none",
                  cursor: processing ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 2px 4px rgba(22, 163, 74, 0.25)",
                }}
              >
                {processing ? (
                  <span>Processing Demo Transaction...</span>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Simulate Successful Payment (Instant Unlock ₹{finalPayable.toLocaleString("en-IN")})</span>
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
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: processing ? "wait" : "pointer",
                }}
              >
                Simulate Payment Failure / Decline
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Summary Box */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
              Enrolment Summary
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "#334155", fontWeight: 500, flex: 1, paddingRight: "0.5rem" }}>
                    {item.title}
                  </span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
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

              {couponDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#16a34a", fontWeight: 600 }}>
                  <span>Coupon ({couponApplied}):</span>
                  <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}

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
                <span>Total:</span>
                <span style={{ color: "#ea580c" }}>₹{finalPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Coupon Code Section */}
            <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
              <input
                type="text"
                placeholder="Coupon code (e.g. SAMPLE10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  textTransform: "uppercase",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
