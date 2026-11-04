"use client";

import { useEffect, useState, useTransition } from "react";

interface CouponItem {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minCart: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validTo: string | null;
  applicableTypes: string[];
  _count?: { orders: number };
}

export function CouponManagementView() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = useState("10");
  const [minCart, setMinCart] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validTo, setValidTo] = useState("");
  const [applicableType, setApplicableType] = useState<"ALL" | "COURSE" | "TEST_SERIES">("ALL");

  async function loadCoupons() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const json = await res.json();
      if (res.ok) {
        setCoupons(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function handleDelete(id: string, couponCode: string) {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadCoupons();
      }
    } catch {
      // ignore
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value) || 0,
      minCart: minCart ? parseFloat(minCart) : undefined,
      maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      applicableTypes:
        applicableType === "ALL"
          ? ["COURSE", "TEST_SERIES"]
          : [applicableType],
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to create coupon");
        }
        setIsModalOpen(false);
        setCode("");
        loadCoupons();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error creating coupon");
      }
    });
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            Promotion &amp; Scholarships
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0.25rem 0 0" }}>
            Coupons &amp; Discount Vouchers
          </h1>
          <p style={{ color: "#475569", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
            Configure scholarship promotional codes, flat discounts, usage limits, and test series vouchers.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setActionError(null);
          }}
          style={{
            backgroundColor: "#ea580c",
            color: "#ffffff",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(234, 88, 12, 0.25)",
          }}
        >
          + Create New Coupon
        </button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>No coupons created yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Coupon Code</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Discount</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Min Cart</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Usage</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Applicable To</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Expiry</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem", fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                    {c.code}
                  </td>
                  <td style={{ padding: "1rem", color: "#16a34a", fontWeight: 700 }}>
                    {c.type === "PERCENT" ? `${c.value}% OFF` : `₹${c.value} FLAT`}
                  </td>
                  <td style={{ padding: "1rem", color: "#475569" }}>
                    {c.minCart ? `₹${c.minCart.toLocaleString("en-IN")}` : "No minimum"}
                  </td>
                  <td style={{ padding: "1rem", color: "#475569" }}>
                    {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : "used"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", backgroundColor: "#f1f5f9", color: "#334155", fontWeight: 600 }}>
                      {c.applicableTypes.join(", ")}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {c.validTo ? new Date(c.validTo).toLocaleDateString("en-IN") : "No expiry"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              width: "100%",
              maxWidth: "520px",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Create Promotion Coupon
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div style={{ color: "#dc2626", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                ⚠️ {actionError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMART25"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", textTransform: "uppercase", fontWeight: 700 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Discount Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "PERCENT" | "FLAT")}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Value ({type === "PERCENT" ? "%" : "₹"}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Min Cart Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={minCart}
                    onChange={(e) => setMinCart(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Max Uses Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited if blank"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                  Applicable Products
                </label>
                <select
                  value={applicableType}
                  onChange={(e) => setApplicableType(e.target.value as "ALL" | "COURSE" | "TEST_SERIES")}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                >
                  <option value="ALL">Both Courses and Test Series</option>
                  <option value="COURSE">Tuition Courses Only</option>
                  <option value="TEST_SERIES">Test Series Packs Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", border: "none", backgroundColor: "#ea580c", color: "#fff", fontWeight: 700, cursor: isPending ? "wait" : "pointer" }}
                >
                  {isPending ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

