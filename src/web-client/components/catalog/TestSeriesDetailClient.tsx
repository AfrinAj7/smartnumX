 "use client";

import { useState } from "react";
import Link from "next/link";
import { BuyButtons } from "../cart/BuyButtons";

export interface TestSeriesDetailData {
  id: string;
  slug: string;
  title: string;
  description: string;
  badge: string;
  targetClass: string;
  targetExam: string;
  isFree: boolean;
  price: number;
  discountPrice: number | null;
  validity: string;
  testCountFull: number;
  testCountChapter: number;
  sampleTestUrl: string | null;
  features: string[];
  inclusions: string[];
  totalQuestionsCount?: number | null;
  publishedTestsCount?: number;
}

export interface StudentTestViewItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  durationMin: number;
  totalMarks: number;
  passMarks: number | null;
  isFreePreview: boolean;
  opensAt: Date | string | null;
  closesAt: Date | string | null;
  questionsCount: number;
  hasAccess: boolean;
  accessType: "ENROLLED" | "DIRECT_ASSIGNMENT" | "FREE_PREVIEW" | "LOCKED";
  attemptStatus: "NOT_ATTEMPTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
  latestAttemptId: string | null;
  latestScore: number | null;
  bestScore: number | null;
  attemptsCount: number;
  maxAttempts: number;
  canAttempt: boolean;
  lockReason?: string;
}

interface TestSeriesDetailClientProps {
  testSeries: TestSeriesDetailData;
  phone: string;
  whatsapp: string;
  tests?: StudentTestViewItem[];
  isEnrolled?: boolean;
  userLoggedIn?: boolean;
}

export function TestSeriesDetailClient({
  testSeries,
  phone,
  whatsapp,
  tests = [],
  isEnrolled = false,
  userLoggedIn = false,
}: TestSeriesDetailClientProps) {
  const [samplePreviewOpen, setSamplePreviewOpen] = useState(false);

  const effectivePrice = testSeries.discountPrice ?? testSeries.price;
  const isFree = testSeries.isFree || testSeries.price === 0;

  const discountPct = testSeries.discountPrice && testSeries.discountPrice < testSeries.price
    ? Math.round(((testSeries.price - testSeries.discountPrice) / testSeries.price) * 100)
    : null;

  const firstAvailableTest = tests.find((t) => t.hasAccess) || tests[0] || null;
  const activeAttemptTest = tests.find((t) => t.attemptStatus === "IN_PROGRESS") || null;

  // Mock test schedule items
  const mockSyllabusSchedule = [
    { title: "Mock Test 01 (Diagnostics)", scope: "Core Foundations & Mechanics", timing: "180 Mins · 300 Marks" },
    { title: "Mock Test 02 (Calculus & Functions)", scope: "Differential & Integral Calculus", timing: "180 Mins · 300 Marks" },
    { title: "Mock Test 03 (Algebra & Coordinate Geometry)", scope: "Vectors, 3D, Matrices & Conics", timing: "180 Mins · 300 Marks" },
    { title: "Mock Test 04 (Full Syllabus Simulation 1)", scope: "Complete Combined Curriculum", timing: "180 Mins · 300 Marks" },
    { title: "Mock Test 05 (Full Syllabus Simulation 2)", scope: "High-Yield Multi-Concept Integration", timing: "180 Mins · 300 Marks" },
  ];

  return (
    <>
      {/* 1. HERO & BREADCRUMB */}
      <section className="course-hero-section">
        <div className="course-container">
          {/* Breadcrumb */}
          <nav className="course-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="course-breadcrumb-sep">›</span>
            <Link href="/test-series">Test Series</Link>
            <span className="course-breadcrumb-sep">›</span>
            <span className="course-breadcrumb-current">{testSeries.title}</span>
          </nav>

          <div className="course-hero-grid">
            <div className="course-hero-text">
              <div className="course-badge-row">
                <span className={`course-tag-pill ${isFree ? "free" : ""}`}>
                  {testSeries.badge || (isFree ? "Free Assessment" : "Mock Series")}
                </span>
                <span className="course-category-pill">{testSeries.targetClass}</span>
                <span className="course-category-pill" style={{ background: "#f1f5f9", color: "#334155" }}>
                  {testSeries.targetExam}
                </span>
              </div>

              <h1 className="course-hero-title">{testSeries.title}</h1>
              <p className="course-hero-promise">{testSeries.description}</p>

              {/* Test Metrics Strip */}
              <div className="ts-detail-metrics-grid">
                <div className="metric-card">
                  <span className="metric-card-num">{testSeries.testCountFull}</span>
                  <span className="metric-card-label">Full Length Mocks</span>
                  <span className="metric-card-sub">Exact NTA/Board Pattern</span>
                </div>

                <div className="metric-card">
                  <span className="metric-card-num">{testSeries.testCountChapter}</span>
                  <span className="metric-card-label">Chapter Drills</span>
                  <span className="metric-card-sub">Topic-wise Mastery</span>
                </div>

                <div className="metric-card">
                  <span className="metric-card-num">Rank</span>
                  <span className="metric-card-label">AIR Predictor</span>
                  <span className="metric-card-sub">Real-Time Percentile</span>
                </div>

                <div className="metric-card">
                  <span className="metric-card-num">
                    {testSeries.totalQuestionsCount ? `${testSeries.totalQuestionsCount}+` : "100%"}
                  </span>
                  <span className="metric-card-label">
                    {testSeries.totalQuestionsCount ? "Practice Questions" : "Detailed Solutions"}
                  </span>
                  <span className="metric-card-sub">
                    {testSeries.totalQuestionsCount ? "With Step Solutions" : "Step-by-Step Hints"}
                  </span>
                </div>
              </div>

              {/* Sample Test Preview Button */}
              <div className="sample-test-banner">
                <div className="sample-test-info">
                  <span className="sample-icon">📄</span>
                  <div>
                    <strong>Want to see question difficulty?</strong>
                    <p>Inspect sample questions and our step-by-step evaluation format.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSamplePreviewOpen(!samplePreviewOpen)}
                  className="btn-sample-preview"
                >
                  {samplePreviewOpen ? "Hide Sample Questions" : "Preview Sample Test ↗"}
                </button>
              </div>

              {/* Sample Questions Drawer/Box */}
              {samplePreviewOpen && (
                <div className="sample-questions-box" role="region" aria-label="Sample test questions">
                  <div className="sample-header">
                    <h4>Sample Question Preview · Mathematics (JEE / Board Level)</h4>
                    <span className="sample-chip">Diagnostic Level</span>
                  </div>

                  <div className="sample-question-item">
                    <p className="question-text">
                      <strong>Q1.</strong> If the function f(x) = x³ - 3(a-2)x² + 3ax + 7 has a local minimum at x = 1 and local maximum at x = -1, find the value of the parameter &lsquo;a&rsquo; and classify its roots.
                    </p>
                    <div className="question-options">
                      <span>(A) a = 2</span>
                      <span>(B) a = 1</span>
                      <span className="correct-opt">✓ (C) a = 0 (Evaluated Solution Available)</span>
                      <span>(D) a = -2</span>
                    </div>
                    <div className="solution-preview">
                      <strong>SmartNum Step Explanation:</strong> Differentiating f(x) yields f&apos;(x) = 3x² - 6(a-2)x + 3a. Setting f&apos;(1) = 0 yields 3 - 6(a-2) + 3a = 0 ⇒ 3 - 6a + 12 + 3a = 0 ⇒ 15 - 3a = 0. Detailed video step solution unlocked after enrollment.
                    </div>
                  </div>
                </div>
              )}

              {/* Hero Action Buttons */}
              <div className="course-hero-actions">
                {isEnrolled ? (
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                    {firstAvailableTest ? (
                      <Link
                        href={
                          activeAttemptTest
                            ? `/tests/${activeAttemptTest.id}/attempt/${activeAttemptTest.latestAttemptId}`
                            : `/tests/${firstAvailableTest.id}/instructions`
                        }
                        style={{
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          padding: "0.875rem 2rem",
                          borderRadius: "0.5rem",
                          fontWeight: 800,
                          fontSize: "1rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.3)",
                        }}
                      >
                        <span>{activeAttemptTest ? "Resume Active Test (⏱️ In Progress)" : "Attempt Test Now 🚀"}</span>
                        <span>→</span>
                      </Link>
                    ) : null}

                    <a
                      href="#mock-tests"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        border: "2px solid #cbd5e1",
                        padding: "0.85rem 1.5rem",
                        borderRadius: "0.5rem",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span>View All Papers ({tests.length})</span>
                      <span>↓</span>
                    </a>
                  </div>
                ) : (
                  <BuyButtons
                    slug={testSeries.slug}
                    title={testSeries.title}
                    price={testSeries.price}
                    discountPrice={testSeries.discountPrice}
                    isFree={isFree}
                    layout="row"
                    buyNowLabel={isFree ? "Enroll Free (Attempt Now)" : "Buy Test Series Pack"}
                  />
                )}

                <div className="secondary-hero-links">
                  <a href={`tel:${phone}`} className="btn-course-call">
                    📞 Call Academic Support
                  </a>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hello SmartNum, I am inquiring about ${testSeries.title}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-course-whatsapp"
                  >
                    WhatsApp Support
                  </a>
                </div>
              </div>
            </div>

            {/* Right Sticky Buy Card */}
            <div className="course-hero-visual">
              <div id="pricing-card" className="ts-sticky-buy-box">
                <div className="sticky-box-top">
                  <span className="sticky-box-tag">
                    {isEnrolled ? "ENROLLED STUDENT ACCESS" : "TEST SERIES PACK"}
                  </span>
                  <h3 className="sticky-box-title">{testSeries.title}</h3>
                </div>

                {isEnrolled ? (
                  <div className="sticky-pricing-section" style={{ padding: "1.25rem 0" }}>
                    <div
                      style={{
                        backgroundColor: "#dcfce7",
                        color: "#15803d",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.375rem",
                        fontWeight: 700,
                        fontSize: "0.8125rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <span>✓</span>
                      <span>ACTIVE ENROLMENT CONFIRMED</span>
                    </div>

                    <h4 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
                      Ready to Test Your Preparation?
                    </h4>
                    <p style={{ color: "#475569", fontSize: "0.875rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
                      You have full access to all mock papers in this series with real-time All-India Rank benchmarking.
                    </p>

                    <div className="sticky-validity-meta" style={{ marginBottom: "1.25rem" }}>
                      <span>🗓 Access: <strong>{testSeries.validity || "Full Active Access"}</strong></span>
                      <span>📝 Papers: <strong>{tests.length} Published</strong></span>
                      <span>💻 Mode: <strong>Online CBT Simulation</strong></span>
                    </div>

                    {firstAvailableTest && (
                      <Link
                        href={
                          activeAttemptTest
                            ? `/tests/${activeAttemptTest.id}/attempt/${activeAttemptTest.latestAttemptId}`
                            : `/tests/${firstAvailableTest.id}/instructions`
                        }
                        style={{
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          padding: "0.875rem 1.5rem",
                          borderRadius: "0.5rem",
                          fontWeight: 800,
                          fontSize: "0.9375rem",
                          textDecoration: "none",
                          display: "block",
                          textAlign: "center",
                          marginBottom: "0.75rem",
                          boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.25)",
                        }}
                      >
                        {activeAttemptTest ? "Resume Active Test ⏱️" : "Start Next Mock Test 🚀"}
                      </Link>
                    )}

                    <a
                      href="#mock-tests"
                      style={{
                        backgroundColor: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        textDecoration: "none",
                        display: "block",
                        textAlign: "center",
                      }}
                    >
                      Browse All Papers ({tests.length}) ↓
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="sticky-pricing-section">
                      {isFree ? (
                        <div className="sticky-free-banner">
                          <span className="free-tag-badge">100% FREE</span>
                          <p>Full lifetime access to this diagnostic test series with zero payment required.</p>
                        </div>
                      ) : (
                        <div className="sticky-price-row">
                          <div>
                            <span className="price-label">Pack Price:</span>
                            <div className="amount-row">
                              <span className="price-big">₹{effectivePrice.toLocaleString("en-IN")}</span>
                              {testSeries.discountPrice && testSeries.discountPrice < testSeries.price && (
                                <span className="mrp-strikethrough">₹{testSeries.price.toLocaleString("en-IN")}</span>
                              )}
                            </div>
                          </div>
                          {discountPct && (
                            <span className="discount-pill-green">{discountPct}% OFF</span>
                          )}
                        </div>
                      )}

                      <div className="sticky-validity-meta">
                        <span>🗓 Validity: <strong>{testSeries.validity || "Till Exam Date"}</strong></span>
                        <span>🌐 Language: <strong>English</strong></span>
                        <span>💻 Mode: <strong>Online CBT Simulation</strong></span>
                      </div>
                    </div>

                    <div className="sticky-actions-wrap">
                      <BuyButtons
                        slug={testSeries.slug}
                        title={testSeries.title}
                        price={testSeries.price}
                        discountPrice={testSeries.discountPrice}
                        isFree={isFree}
                        layout="column"
                        buyNowLabel={isFree ? "Enroll Free & Start Test" : "Buy Test Series Now"}
                      />
                    </div>
                  </>
                )}

                {/* Key Features Bullet Points */}
                <div className="sticky-highlights-list">
                  <div className="highlight-item">
                    <span className="highlight-icon">✓</span>
                    <span>Instant evaluation &amp; All-India Rank Predictor</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-icon">✓</span>
                    <span>Topic-wise accuracy &amp; speed heatmap</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-icon">✓</span>
                    <span>Unlimited test re-attempts in practice mode</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-icon">✓</span>
                    <span>Full step-by-step answer key &amp; solutions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RESULT & REPORT ANALYSIS HIGHLIGHTS */}
      <section className="course-section who-for-section">
        <div className="course-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">DIAGNOSTIC ANALYTICS</span>
            <h2 className="section-heading">Detailed Result &amp; Percentile Analysis Features</h2>
            <p className="section-subtext">
              Our CBT engine doesn&rsquo;t just give you a score — it diagnoses where you gained marks, where you lost marks, and how to improve.
            </p>
          </div>

          <div className="analysis-features-grid">
            <div className="analysis-card">
              <span className="card-icon-big">📈</span>
              <h3>All-India Rank &amp; Percentile</h3>
              <p>Compare your raw score against thousands of peer aspirants with benchmark rank estimation.</p>
            </div>

            <div className="analysis-card">
              <span className="card-icon-big">⚡</span>
              <h3>Speed vs. Accuracy Heatmap</h3>
              <p>See exactly which questions took too long and identify where negative marks occurred.</p>
            </div>

            <div className="analysis-card">
              <span className="card-icon-big">🔍</span>
              <h3>Topic-Wise Strength Breakdown</h3>
              <p>Granular classification into Strong, Moderate, and Weak topics so revision is focused.</p>
            </div>

            <div className="analysis-card">
              <span className="card-icon-big">🔄</span>
              <h3>Unproctored Re-Attempt Mode</h3>
              <p>Re-attempt questions you skipped or answered incorrectly in untimed revision mode.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MOCK TEST SCHEDULE & SYLLABUS LIST */}
      <section id="mock-tests" className="course-section curriculum-section">
        <div className="course-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">MOCK PAPERS INCLUDED</span>
            <h2 className="section-heading">Mock Test Schedule &amp; Coverage</h2>
            <p className="section-subtext">
              Each test is crafted by subject matter experts to reflect the exact difficulty, weightage, and latest exam blueprint.
            </p>
          </div>

          {tests && tests.length > 0 ? (
            <div className="ts-schedule-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {tests.map((t, idx) => {
                const typeLabel =
                  t.type === "FULL_MOCK"
                    ? "Full Mock"
                    : t.type === "CHAPTER_TEST"
                    ? "Chapter Drill"
                    : t.type === "SECTIONAL"
                    ? "Sectional"
                    : "Diagnostic Mock";

                return (
                  <div
                    key={t.id}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "0.75rem",
                      border: "1px solid #e2e8f0",
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ flex: "1 1 320px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                          }}
                        >
                          {typeLabel} #{idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                          }}
                        >
                          {t.code}
                        </span>
                        {t.isFreePreview && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                            }}
                          >
                            FREE PREVIEW
                          </span>
                        )}
                        {t.hasAccess ? (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              backgroundColor: "#dcfce7",
                              color: "#15803d",
                            }}
                          >
                            ✓ UNLOCKED
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                            }}
                          >
                            🔒 LOCKED
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem" }}>
                        {t.title}
                      </h3>
                      {t.description && (
                        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 0.5rem", lineHeight: 1.4 }}>
                          {t.description}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: "1rem", fontSize: "0.8125rem", color: "#64748b", flexWrap: "wrap" }}>
                        <span>⏱️ <strong>{t.durationMin} Mins</strong></span>
                        <span>📝 <strong>{t.questionsCount} Questions</strong></span>
                        <span>🎯 <strong>{t.totalMarks} Marks</strong></span>
                        {t.latestScore !== null && (
                          <span style={{ color: "#2563eb", fontWeight: 700 }}>
                            ⭐ Best Score: {t.bestScore}/{t.totalMarks}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      {t.attemptStatus === "IN_PROGRESS" && t.latestAttemptId && (
                        <Link
                          href={`/tests/${t.id}/attempt/${t.latestAttemptId}`}
                          style={{
                            backgroundColor: "#f59e0b",
                            color: "#ffffff",
                            padding: "0.625rem 1.25rem",
                            borderRadius: "0.375rem",
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                        >
                          Resume Test ⏱️
                        </Link>
                      )}

                      {(t.attemptStatus === "SUBMITTED" || t.attemptStatus === "AUTO_SUBMITTED") && t.latestAttemptId && (
                        <>
                          <Link
                            href={`/tests/${t.id}/result/${t.latestAttemptId}`}
                            style={{
                              backgroundColor: "#2563eb",
                              color: "#ffffff",
                              padding: "0.625rem 1rem",
                              borderRadius: "0.375rem",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                              textDecoration: "none",
                            }}
                          >
                            Scorecard 📊
                          </Link>
                          <Link
                            href={`/tests/${t.id}/solutions/${t.latestAttemptId}`}
                            style={{
                              backgroundColor: "#f1f5f9",
                              color: "#334155",
                              border: "1px solid #cbd5e1",
                              padding: "0.625rem 1rem",
                              borderRadius: "0.375rem",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              textDecoration: "none",
                            }}
                          >
                            Solutions 💡
                          </Link>
                          {t.canAttempt && (
                            <Link
                              href={`/tests/${t.id}/instructions`}
                              style={{
                                backgroundColor: "#ffffff",
                                color: "#2563eb",
                                border: "1px solid #2563eb",
                                padding: "0.625rem 1rem",
                                borderRadius: "0.375rem",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                textDecoration: "none",
                              }}
                            >
                              Re-attempt ↺
                            </Link>
                          )}
                        </>
                      )}

                      {t.attemptStatus === "NOT_ATTEMPTED" && (
                        <>
                          {t.hasAccess && t.canAttempt ? (
                            <Link
                              href={`/tests/${t.id}/instructions`}
                              style={{
                                backgroundColor: t.isFreePreview && !isEnrolled ? "#10b981" : "#2563eb",
                                color: "#ffffff",
                                padding: "0.625rem 1.25rem",
                                borderRadius: "0.375rem",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                textDecoration: "none",
                                display: "inline-block",
                              }}
                            >
                              {t.isFreePreview && !isEnrolled ? "Attempt Free Preview 🚀" : "Start Test 🚀"}
                            </Link>
                          ) : t.hasAccess && !t.canAttempt ? (
                            <span
                              style={{
                                fontSize: "0.875rem",
                                color: "#64748b",
                                backgroundColor: "#f1f5f9",
                                padding: "0.5rem 1rem",
                                borderRadius: "0.375rem",
                              }}
                            >
                              {t.lockReason || "Test not accessible"}
                            </span>
                          ) : (
                            <a
                              href={userLoggedIn ? "#pricing-card" : `/sign-in?callbackUrl=/test-series/${testSeries.slug}`}
                              style={{
                                backgroundColor: "#0f172a",
                                color: "#ffffff",
                                padding: "0.625rem 1.25rem",
                                borderRadius: "0.375rem",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                textDecoration: "none",
                                display: "inline-block",
                              }}
                            >
                              {userLoggedIn ? "Enroll to Unlock 🔒" : "Sign In to Unlock 🔒"}
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : isEnrolled ? (
            <div style={{ padding: "3rem 1.5rem", backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px dashed #cbd5e1", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎓</div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                You are Enrolled in this Test Series!
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.875rem", maxWidth: "480px", margin: "0 auto 1.25rem" }}>
                Our academic faculty is currently scheduling upcoming mock papers for this series. All tests will appear here automatically upon release.
              </p>
              <Link
                href="/dashboard"
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.375rem",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Go to Student Portal
              </Link>
            </div>
          ) : (
            <div className="ts-schedule-list">
              {mockSyllabusSchedule.map((item, idx) => (
                <div key={item.title} className="ts-schedule-item">
                  <div className="schedule-left">
                    <span className="schedule-badge">Test 0{idx + 1}</span>
                    <div>
                      <h3 className="schedule-title">{item.title}</h3>
                      <p className="schedule-scope">{item.scope}</p>
                    </div>
                  </div>
                  <div className="schedule-right">
                    <span className="schedule-timing">{item.timing}</span>
                    <span className="schedule-status">Available on Enrollment</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. FAQS & REFUND POLICY */}
      <section className="course-section faq-section">
        <div className="course-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">TEST SERIES FAQS</span>
            <h2 className="section-heading">Frequently Asked Questions</h2>
          </div>

          <div className="course-faq-list">
            <div className="course-faq-item">
              <h3 className="course-faq-question">Can I attempt tests on mobile or tablet?</h3>
              <p className="course-faq-answer">
                Yes! The SmartNum testing platform is fully responsive and works smoothly across mobile phones, tablets, laptops, and desktop computers.
              </p>
            </div>
            <div className="course-faq-item">
              <h3 className="course-faq-question">How soon do I get results after submitting a test?</h3>
              <p className="course-faq-answer">
                Immediately. As soon as you click submit, your raw score, percentile, detailed solution keys, and topic-wise breakdown are generated in real time.
              </p>
            </div>
            <div className="course-faq-item">
              <h3 className="course-faq-question">What is your refund policy for test series?</h3>
              <p className="course-faq-answer">
                Because digital test series grant instant access to proprietary questions, answer keys, and solutions upon payment, test series purchases are non-refundable once any full-length mock has been attempted.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

