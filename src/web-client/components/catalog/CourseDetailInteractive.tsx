"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BuyButtons } from "../cart/BuyButtons";

export interface CourseDetailData {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  badge: string;
  board: string;
  classLevel: string;
  mode: "ONLINE" | "PHYSICAL" | "BOTH";
  subjects: string[];
  heroTagline: string;
  intro: string;
  price: number;
  discountPrice: number | null;
  seatsTotal: number;
  seatsLeft: number;
  centreName: string;
  centreCity: string;
  centreAddress: string;
  whoFor: string[];
  notFor: string[];
  learn: Array<{ group: string; items: string[] }>;
  howItWorks: Array<{ title: string; description: string }>;
  weekPlan: {
    summary: string;
    schedule: Array<{ days: string; time: string; focus: string }>;
  };
  batchInfo: {
    size: string;
    timing: string;
    startDate: string;
  };
  fee: {
    amount: string;
    installments: string;
  };
  faqs: Array<{ q: string; a: string }>;
  heroImage: string;
}

interface CourseDetailInteractiveProps {
  course: CourseDetailData;
  phone: string;
  whatsapp: string;
}

export function CourseDetailInteractive({
  course,
  phone,
  whatsapp,
}: CourseDetailInteractiveProps) {
  // Option toggle: "ONLINE" | "PHYSICAL"
  const [selectedMode, setSelectedMode] = useState<"ONLINE" | "PHYSICAL">("PHYSICAL");
  const [selectedCentre, setSelectedCentre] = useState<string>("indirapuram");

  const effectivePrice = course.discountPrice ?? course.price;
  const isPhysical = selectedMode === "PHYSICAL";

  return (
    <>
      {/* 1. HERO SECTION WITH MODE TOGGLE */}
      <section className="course-hero-section">
        <div className="course-container">
          {/* Breadcrumb */}
          <nav className="course-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="course-breadcrumb-sep">›</span>
            <Link href="/courses">Courses</Link>
            <span className="course-breadcrumb-sep">›</span>
            <span className="course-breadcrumb-current">{course.shortTitle}</span>
          </nav>

          <div className="course-hero-grid">
            <div className="course-hero-text">
              <div className="course-badge-row">
                <span className="course-tag-pill">{course.badge}</span>
                <span className="course-category-pill">Grade {course.classLevel}</span>
              </div>

              <h1 className="course-hero-title">{course.title}</h1>
              <p className="course-hero-promise">{course.heroTagline}</p>

              {/* DUAL MODE TOGGLE: Online | Physical (Offline) */}
              <div className="course-mode-toggle-card">
                <span className="mode-toggle-label">CHOOSE LEARNING MODE:</span>
                <div className="mode-toggle-switch" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedMode === "PHYSICAL"}
                    onClick={() => setSelectedMode("PHYSICAL")}
                    className={`mode-tab-btn ${selectedMode === "PHYSICAL" ? "is-selected" : ""}`}
                  >
                    <span className="tab-icon">🏫</span>
                    <div className="tab-copy">
                      <strong>Physical Centre Batch</strong>
                      <span>Indirapuram Campus · Small Batch</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedMode === "ONLINE"}
                    onClick={() => setSelectedMode("ONLINE")}
                    className={`mode-tab-btn ${selectedMode === "ONLINE" ? "is-selected" : ""}`}
                  >
                    <span className="tab-icon">💻</span>
                    <div className="tab-copy">
                      <strong>Interactive Online Mode</strong>
                      <span>Live Classes + Full Recordings</span>
                    </div>
                  </button>
                </div>

                {/* Dynamic Mode Details Panel */}
                {isPhysical ? (
                  <div className="mode-details-panel physical-panel">
                    <div className="centre-selector-row">
                      <div className="centre-label-group">
                        <span className="marker-icon">📍</span>
                        <div>
                          <label htmlFor="centre-select" className="centre-select-label">Selected Centre Campus:</label>
                          <select
                            id="centre-select"
                            value={selectedCentre}
                            onChange={(e) => setSelectedCentre(e.target.value)}
                            className="centre-dropdown"
                          >
                            <option value="indirapuram">SmartNum Indirapuram Campus (04224, ATS Advantage)</option>
                          </select>
                        </div>
                      </div>

                      <div className={`seat-urgency-badge ${course.seatsLeft <= 3 ? "is-critical" : ""}`}>
                        <span className="pulse-indicator" />
                        <strong>
                          {course.seatsLeft <= 0
                            ? "Batch Full"
                            : `🔥 Only ${course.seatsLeft} of ${course.seatsTotal || 15} seats remaining`}
                        </strong>
                      </div>
                    </div>

                    <div className="mode-inclusions-grid">
                      <span className="inc-item">✓ Air-conditioned smart classroom</span>
                      <span className="inc-item">✓ Max 15 students per cohort</span>
                      <span className="inc-item">✓ Physical doubt desk &amp; clinic</span>
                      <span className="inc-item">✓ Printed formula &amp; study sheets</span>
                      <span className="inc-item">✓ Monthly parent progress review</span>
                    </div>
                  </div>
                ) : (
                  <div className="mode-details-panel online-panel">
                    <div className="online-banner-row">
                      <span className="online-tag">🚀 WHAT YOU GET ONLINE:</span>
                      <span className="online-sub">Full digital access from anywhere with live interactive doubt sessions</span>
                    </div>
                    <div className="mode-inclusions-grid">
                      <span className="inc-item">✓ Live Interactive Classes with Director</span>
                      <span className="inc-item">✓ Complete HD Video Recording Archive</span>
                      <span className="inc-item">✓ Digital Daily Practice Problems (DPPs)</span>
                      <span className="inc-item">✓ 24/7 Question Doubt Desk Support</span>
                      <span className="inc-item">✓ Online Chapter Tests &amp; Instant Report</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 Quick Facts */}
              <div className="course-quick-facts">
                <div className="quick-fact-item">
                  <span className="fact-label">Grade / Class</span>
                  <strong className="fact-value">{course.classLevel}</strong>
                </div>
                <div className="quick-fact-divider" />
                <div className="quick-fact-item">
                  <span className="fact-label">Board / Scope</span>
                  <strong className="fact-value">{course.board}</strong>
                </div>
                <div className="quick-fact-divider" />
                <div className="quick-fact-item">
                  <span className="fact-label">Batch Start</span>
                  <strong className="fact-value">{course.batchInfo.startDate}</strong>
                </div>
              </div>

              {/* Hero Action Buttons */}
              <div className="course-hero-actions">
                <BuyButtons
                  slug={course.slug}
                  title={course.title}
                  price={course.price}
                  discountPrice={course.discountPrice}
                  isFree={false}
                  selectedMode={selectedMode}
                  seatsLeft={course.seatsLeft}
                  layout="row"
                  buyNowLabel={isPhysical ? "Enrol / Book Centre Seat" : "Buy Online Course"}
                />

                <div className="secondary-hero-links">
                  <Link href="/#book-demo" className="btn-course-demo">
                    Book Free Demo Class →
                  </Link>
                  <a href={`tel:${phone}`} className="btn-course-call">
                    📞 Call Admissions
                  </a>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hello SmartNum, I am interested in ${course.title} (${isPhysical ? "Physical Centre" : "Online Mode"}). Please share details.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-course-whatsapp"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>

            {/* Hero Visual Card / Sticky Buy Box */}
            <div className="course-hero-visual">
              <div className="course-visual-card">
                <div className="course-image-wrap">
                  <Image
                    src={course.heroImage}
                    alt={`${course.shortTitle} classroom learning at SmartNum Indirapuram`}
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="course-hero-img"
                    priority
                  />
                  <div className="course-image-overlay" />
                  <span className="course-live-badge">
                    <span className="live-spark" />
                    Small Batches · Max 15 Students
                  </span>
                </div>

                <div className="course-pricing-highlight">
                  <div className="highlight-price-row">
                    <div>
                      <span className="highlight-fee-label">Tuition Fee:</span>
                      <div className="highlight-amount-row">
                        <span className="highlight-price">₹{effectivePrice.toLocaleString("en-IN")}</span>
                        {course.discountPrice && course.discountPrice < course.price && (
                          <span className="highlight-mrp">₹{course.price.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                    </div>
                    <span className="highlight-discount-pill">
                      {Math.round(((course.price - (course.discountPrice ?? course.price)) / course.price) * 100)}% OFF
                    </span>
                  </div>

                  <div className="highlight-validity-note">
                    <span>🗓 Full Academic Year Access · Instalment options available</span>
                  </div>

                  <div className="highlight-action-slot">
                    <BuyButtons
                      slug={course.slug}
                      title={course.title}
                      price={course.price}
                      discountPrice={course.discountPrice}
                      isFree={false}
                      selectedMode={selectedMode}
                      seatsLeft={course.seatsLeft}
                      layout="column"
                      buyNowLabel={isPhysical ? "Enrol in Centre Batch" : "Buy Online Course"}
                    />
                  </div>
                </div>

                <div className="course-visual-footer">
                  <div className="visual-faculty-tag">
                    <span className="faculty-badge-icon">🎓</span>
                    <div>
                      <strong>Led by Ph.D. Faculty</strong>
                      <p>Academic Director: Dr. Sweta Agrawal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHO THIS IS FOR (AND WHO IT IS NOT FOR) */}
      <section className="course-section who-for-section">
        <div className="course-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">FIT &amp; EXPECTATIONS</span>
            <h2 className="section-heading">Who this course is for (and who it is not for)</h2>
            <p className="section-subtext">
              We believe in complete transparency. We want parents and students to join the batch that fits their learning style and goals.
            </p>
          </div>

          <div className="who-for-grid">
            <div className="who-card ideal-fit">
              <div className="who-card-head">
                <span className="who-card-icon">✓</span>
                <h3>This course is ideal for:</h3>
              </div>
              <ul className="who-list">
                {course.whoFor.map((item, idx) => (
                  <li key={`who-for-${idx}`}>
                    <span className="check-bullet">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="who-card not-fit">
              <div className="who-card-head">
                <span className="who-card-icon not-icon">✕</span>
                <h3>Probably not the right fit for:</h3>
              </div>
              <ul className="who-list not-list">
                {course.notFor.map((item, idx) => (
                  <li key={`not-for-${idx}`}>
                    <span className="cross-bullet">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHAT YOU'LL LEARN */}
      <section className="course-section curriculum-section">
        <div className="course-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">SYLLABUS &amp; CORE TOPICS</span>
            <h2 className="section-heading">What you&rsquo;ll learn in this course</h2>
            <p className="section-subtext">
              Every chapter is built step-by-step from first principles, followed by rigorous problem solving and exam-format question drills.
            </p>
          </div>

          <div className="curriculum-groups-grid">
            {course.learn.map((group, gIdx) => (
              <div key={`learn-group-${gIdx}`} className="curriculum-group-card">
                <div className="group-card-header">
                  <span className="group-num">0{gIdx + 1}</span>
                  <h3 className="group-title">{group.group}</h3>
                </div>
                <ul className="group-items-list">
                  {group.items.map((item, iIdx) => (
                    <li key={`group-item-${gIdx}-${iIdx}`}>
                      <span className="item-bullet" aria-hidden="true">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BATCH TIMINGS & INCLUSIONS */}
      <section className="course-section batches-section">
        <div className="course-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">BATCH SCHEDULE &amp; VENUE</span>
            <h2 className="section-heading">Batch Details &amp; Admissions</h2>
            <p className="section-subtext">
              Enrolments are strictly capped at 15 students per batch to preserve individual faculty attention.
            </p>
          </div>

          <div className="batches-details-grid">
            <div className="batch-info-panel">
              <div className="info-item">
                <span className="info-label">Batch Size:</span>
                <strong className="info-value">{course.batchInfo.size}</strong>
              </div>
              <div className="info-item">
                <span className="info-label">Timings:</span>
                <strong className="info-value">{course.batchInfo.timing}</strong>
              </div>
              <div className="info-item">
                <span className="info-label">Start Date:</span>
                <strong className="info-value">{course.batchInfo.startDate}</strong>
              </div>
              <div className="info-item">
                <span className="info-label">Centre Location:</span>
                <strong className="info-value">04224, ATS Advantage, Indirapuram</strong>
              </div>
              <div className="info-item">
                <span className="info-label">Online Access:</span>
                <strong className="info-value">Included with all Centre Batches</strong>
              </div>
            </div>

            <div className="join-steps-panel">
              <h3 className="join-steps-title">Instant Enrolment &amp; Demo</h3>
              <ol className="join-steps-list">
                <li>
                  <strong>1. Enrol Online:</strong> Click &quot;Buy Now&quot; to reserve your child&apos;s seat securely.
                </li>
                <li>
                  <strong>2. Diagnostic Assessment:</strong> Our academic director meets the student to identify exact strengths.
                </li>
                <li>
                  <strong>3. Attend Class:</strong> Join in-person at our Indirapuram campus or connect live online.
                </li>
              </ol>

              <div className="join-actions">
                <BuyButtons
                  slug={course.slug}
                  title={course.title}
                  price={course.price}
                  discountPrice={course.discountPrice}
                  isFree={false}
                  selectedMode={selectedMode}
                  seatsLeft={course.seatsLeft}
                  layout="row"
                  buyNowLabel={isPhysical ? "Enrol / Book Centre Seat" : "Buy Online Course"}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQS & REFUND POLICY */}
      <section className="course-section faq-section">
        <div className="course-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">COMMON QUESTIONS</span>
            <h2 className="section-heading">Frequently Asked Questions</h2>
            <p className="section-subtext">
              Clear, straightforward answers about our {course.shortTitle} batch in Indirapuram.
            </p>
          </div>

          <div className="course-faq-list">
            {course.faqs.map((faq, fIdx) => (
              <div key={`faq-${fIdx}`} className="course-faq-item">
                <h3 className="course-faq-question">{faq.q}</h3>
                <p className="course-faq-answer">{faq.a}</p>
              </div>
            ))}

            <div className="course-faq-item">
              <h3 className="course-faq-question">What is your refund &amp; satisfaction policy?</h3>
              <p className="course-faq-answer">
                We offer a transparent 7-day initial demo window. If you or your child feel the batch pace is not the right fit within the first week, notify us for a prompt, hassle-free prorated tuition refund.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

