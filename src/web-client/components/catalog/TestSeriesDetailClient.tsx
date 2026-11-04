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
}

interface TestSeriesDetailClientProps {
  testSeries: TestSeriesDetailData;
  phone: string;
  whatsapp: string;
}

export function TestSeriesDetailClient({
  testSeries,
  phone,
  whatsapp,
}: TestSeriesDetailClientProps) {
  const [samplePreviewOpen, setSamplePreviewOpen] = useState(false);

  const effectivePrice = testSeries.discountPrice ?? testSeries.price;
  const isFree = testSeries.isFree || testSeries.price === 0;

  const discountPct = testSeries.discountPrice && testSeries.discountPrice < testSeries.price
    ? Math.round(((testSeries.price - testSeries.discountPrice) / testSeries.price) * 100)
    : null;

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
                  <span className="metric-card-num">100%</span>
                  <span className="metric-card-label">Detailed Solutions</span>
                  <span className="metric-card-sub">Step-by-Step Hints</span>
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
                <BuyButtons
                  slug={testSeries.slug}
                  title={testSeries.title}
                  price={testSeries.price}
                  discountPrice={testSeries.discountPrice}
                  isFree={isFree}
                  layout="row"
                  buyNowLabel={isFree ? "Enroll Free (Attempt Now)" : "Buy Test Series Pack"}
                />

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
              <div className="ts-sticky-buy-box">
                <div className="sticky-box-top">
                  <span className="sticky-box-tag">TEST SERIES PACK</span>
                  <h3 className="sticky-box-title">{testSeries.title}</h3>
                </div>

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
      <section className="course-section curriculum-section">
        <div className="course-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">MOCK PAPERS INCLUDED</span>
            <h2 className="section-heading">Mock Test Schedule &amp; Coverage</h2>
            <p className="section-subtext">
              Each test is crafted by subject matter experts to reflect the exact difficulty, weightage, and latest exam blueprint.
            </p>
          </div>

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

