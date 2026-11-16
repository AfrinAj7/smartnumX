"use client";

import { useState } from "react";
import Link from "next/link";

interface EnrollmentItem {
  id: string;
  courseId: string;
  status: string;
  startedAt: Date | string;
  expiresAt: Date | string | null;
  completedLessons: number;
  progressPct: number;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl: string | null;
    categoryName: string;
    productType: "COURSE" | "TEST_SERIES";
    mode: "ONLINE" | "PHYSICAL" | "BOTH" | null;
    targetClass: string | null;
    targetExam: string | null;
    badge: string | null;
    validity: string | null;
    testCountFull: number | null;
    testCountChapter: number | null;
    sampleTestUrl: string | null;
    centreName: string | null;
    centreCity: string | null;
    totalLessons: number;
  };
}

interface OrderItem {
  id: string;
  invoiceNo: string | null;
  createdAt: Date | string;
  total: number;
  status: string;
  items: Array<{
    course?: {
      title: string;
    } | null;
  }>;
}

export function StudentDashboardView({
  user,
  enrollments,
  orders,
}: {
  user: { name?: string | null; email?: string | null };
  enrollments: EnrollmentItem[];
  orders: OrderItem[];
}) {
  const [filterTab, setFilterTab] = useState<"ALL" | "COURSE" | "TEST_SERIES">("ALL");

  const courseEnrollments = enrollments.filter((e) => e.course.productType === "COURSE");
  const testSeriesEnrollments = enrollments.filter((e) => e.course.productType === "TEST_SERIES");

  const displayedEnrollments =
    filterTab === "COURSE"
      ? courseEnrollments
      : filterTab === "TEST_SERIES"
        ? testSeriesEnrollments
        : enrollments;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Student Greeting Hero */}
      <div
        style={{
          backgroundColor: "#0f172a",
          color: "#ffffff",
          borderRadius: "1rem",
          padding: "2rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#fdba74", fontWeight: 700, marginBottom: "0.5rem" }}>
            <span>SmartNum Learner Portal</span>
            <span>•</span>
            <span>Active Student Space</span>
          </div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#ffffff" }}>
            Welcome back, {user.name || "SmartNum Student"}! 👋
          </h1>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9375rem", maxWidth: "600px", lineHeight: 1.5 }}>
            All your enrolled tuition batches, recorded lectures, diagnostic tests, and all-India mock test series are unified here.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "1rem 1.25rem", borderRadius: "0.75rem", textAlign: "center", minWidth: "100px" }}>
            <div style={{ fontSize: "1.625rem", fontWeight: 800, color: "#ea580c" }}>{enrollments.length}</div>
            <div style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 600 }}>Active Access</div>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "1rem 1.25rem", borderRadius: "0.75rem", textAlign: "center", minWidth: "100px" }}>
            <div style={{ fontSize: "1.625rem", fontWeight: 800, color: "#38bdf8" }}>{courseEnrollments.length}</div>
            <div style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 600 }}>Tuition Courses</div>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "1rem 1.25rem", borderRadius: "0.75rem", textAlign: "center", minWidth: "100px" }}>
            <div style={{ fontSize: "1.625rem", fontWeight: 800, color: "#4ade80" }}>{testSeriesEnrollments.length}</div>
            <div style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 600 }}>Test Series</div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Filter Tabs & Purchases */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              My Purchases &amp; Unlocked Access
            </h2>
            <p style={{ color: "#64748b", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
              Click any programme to resume video lectures, attempt CBT mocks, or view performance analysis.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "#f1f5f9", padding: "0.25rem", borderRadius: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setFilterTab("ALL")}
              style={{
                backgroundColor: filterTab === "ALL" ? "#ffffff" : "transparent",
                color: filterTab === "ALL" ? "#0f172a" : "#64748b",
                fontWeight: 700,
                fontSize: "0.8125rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                boxShadow: filterTab === "ALL" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              All ({enrollments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("COURSE")}
              style={{
                backgroundColor: filterTab === "COURSE" ? "#ffffff" : "transparent",
                color: filterTab === "COURSE" ? "#0f172a" : "#64748b",
                fontWeight: 700,
                fontSize: "0.8125rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                boxShadow: filterTab === "COURSE" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Tuition Courses ({courseEnrollments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("TEST_SERIES")}
              style={{
                backgroundColor: filterTab === "TEST_SERIES" ? "#ffffff" : "transparent",
                color: filterTab === "TEST_SERIES" ? "#0f172a" : "#64748b",
                fontWeight: 700,
                fontSize: "0.8125rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                boxShadow: filterTab === "TEST_SERIES" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Test Series Packs ({testSeriesEnrollments.length})
            </button>
          </div>
        </div>

        {/* Enrolment Cards Grid */}
        {displayedEnrollments.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              padding: "3rem 1.5rem",
              textAlign: "center",
              maxWidth: "600px",
              margin: "1rem auto",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
              {filterTab === "TEST_SERIES" ? "📝" : "📚"}
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              {filterTab === "TEST_SERIES" ? "No Enrolled Test Series Yet" : "No Enrolled Programmes Yet"}
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              {filterTab === "TEST_SERIES"
                ? "Try our Free Diagnostic Mock Test or enroll in full length JEE and Board mock packages."
                : "Explore our small-batch tuition programmes with Ph.D. mentorship and concept-first pedagogy."}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/batches"
                style={{
                  backgroundColor: "#ea580c",
                  color: "#ffffff",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.375rem",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                Browse Batches →
              </Link>
              <Link
                href="/test-series"
                style={{
                  backgroundColor: "#f8fafc",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.375rem",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                Browse Test Series (2026-27)
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
            {displayedEnrollments.map((enr) => {
              const isTestSeries = enr.course.productType === "TEST_SERIES";
              const targetUrl = isTestSeries ? `/test-series/${enr.course.slug}#mock-tests` : `/batches/${enr.course.slug}`;

              return (
                <div
                  key={enr.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.75rem",
                    border: "1px solid #e2e8f0",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div>
                    {/* Top Type / Badge Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            backgroundColor: isTestSeries ? "#eff6ff" : "#fff7ed",
                            color: isTestSeries ? "#1d4ed8" : "#c2410c",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                          }}
                        >
                          {isTestSeries ? "Test Series Pack" : "Tuition Programme"}
                        </span>

                        {enr.course.mode === "PHYSICAL" && (
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
                            📍 {enr.course.centreName || "Indirapuram"}
                          </span>
                        )}

                        {enr.course.badge && (
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
                            {enr.course.badge}
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          backgroundColor: enr.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                          color: enr.status === "ACTIVE" ? "#15803d" : "#b91c1c",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "9999px",
                        }}
                      >
                        {enr.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem", lineHeight: 1.35 }}>
                      <Link href={targetUrl} style={{ color: "inherit", textDecoration: "none" }}>
                        {enr.course.title}
                      </Link>
                    </h3>

                    {/* Description */}
                    <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 1rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {enr.course.description}
                    </p>

                    {/* Metrics / Progress */}
                    {isTestSeries ? (
                      <div style={{ backgroundColor: "#f8fafc", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.75rem", color: "#334155", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Full Length Mock Tests:</span>
                          <strong>{enr.course.testCountFull || 10} Mocks</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Chapter-wise Tests:</span>
                          <strong>{enr.course.testCountChapter || 40} Tests</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                          <span>Analysis Features:</span>
                          <strong>AIR + Percentile + Solutions</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#475569", marginBottom: "0.35rem" }}>
                          <span>Module Progress</span>
                          <strong style={{ color: "#0f172a" }}>{enr.progressPct}%</strong>
                        </div>
                        <div style={{ height: "6px", backgroundColor: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${enr.progressPct}%`,
                              height: "100%",
                              backgroundColor: "#ea580c",
                              borderRadius: "9999px",
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "#64748b", marginTop: "0.25rem" }}>
                          {enr.completedLessons} of {enr.course.totalLessons} lessons completed
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {enr.expiresAt
                        ? `Valid: ${new Date(enr.expiresAt).toLocaleDateString("en-IN")}`
                        : enr.course.validity || "1 Year Access"}
                    </span>

                    <Link
                      href={targetUrl}
                      style={{
                        backgroundColor: isTestSeries ? "#2563eb" : "#ea580c",
                        color: "#ffffff",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <span>{isTestSeries ? "Attempt Tests" : "Continue"}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Orders Strip / Quick History */}
      {orders.length > 0 && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Recent Orders &amp; Receipts
            </h3>
            <Link href="/dashboard/orders" style={{ fontSize: "0.8125rem", color: "#ea580c", fontWeight: 600, textDecoration: "none" }}>
              View All Orders ({orders.length}) →
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Invoice #</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Date</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Enrolled Program</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Amount</th>
                  <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
                  <th style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 3).map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "0.75rem", fontFamily: "monospace", fontWeight: 600 }}>
                      {o.invoiceNo || o.id.slice(0, 8)}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#64748b" }}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#0f172a", fontWeight: 600 }}>
                      {o.items.map((i) => i.course?.title).filter(Boolean).join(", ") || "Enrolment"}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
                      ₹{o.total.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "9999px",
                          backgroundColor: o.status === "PAID" ? "#dcfce7" : "#fee2e2",
                          color: o.status === "PAID" ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <Link href={`/orders/${o.id}`} style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                        View Invoice ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Indirapuram Centre & Academic Support Card */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem" }}>
            📍 SmartNum Learning Centre — Indirapuram
          </div>
          <div style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "0.25rem" }}>
            04224, ATS Advantage, Indirapuram, Ghaziabad, UP · Contact Desk: +91 99589 47774 / +91 88004 05640
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a
            href="https://wa.me/919958966823"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "#22c55e",
              color: "#ffffff",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            WhatsApp Doubt Desk
          </a>
        </div>
      </div>
    </div>
  );
}
