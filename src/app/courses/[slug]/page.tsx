import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAllCourseSlugs, getCourse, COURSES } from "@/server/courses";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";
import { AddToCartButton } from "@/web-client/components/cart/AddToCartButton";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getAllCourseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) {
    return { title: "Course Not Found | SmartNum" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartnumx.com";
  const canonicalUrl = `${siteUrl}/courses/${course.slug}`;

  return {
    title: course.seo.title,
    description: course.seo.description,
    keywords: course.seo.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: course.seo.title,
      description: course.seo.description,
      url: canonicalUrl,
      type: "website",
      images: course.seo.ogImage ? [{ url: course.seo.ogImage }] : undefined,
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) {
    notFound();
  }

  const [content, session] = await Promise.all([
    getHomepageContent(db),
    auth(),
  ]);

  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 47774";
  const whatsapp = contact?.whatsapp || contact?.secondaryPhone || "+91 88004 05640";
  const address = contact?.address || "04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014";
  const mapsUrl = contact?.mapsUrl || "https://share.google/8gHRuZQQxRuYAkqVd";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartnumx.com";
  const courseUrl = `${siteUrl}/courses/${course.slug}`;

  // Structured Data Schemas
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.seo.description,
    provider: {
      "@type": "EducationalOrganization",
      name: "SmartNum",
      url: siteUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: "04224, ATS Advantage, Indirapuram",
        addressLocality: "Ghaziabad",
        addressRegion: "Uttar Pradesh",
        postalCode: "201014",
        addressCountry: "IN",
      },
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: course.mode === "online" ? "online" : "onsite",
      courseWorkload: course.weekPlan.summary,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Courses",
        item: `${siteUrl}/courses`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: course.shortTitle,
        item: courseUrl,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: course.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const relatedCourses = COURSES.filter((c) => course.related.includes(c.slug));

  return (
    <div className="course-detail-page">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <SiteHeader
        phone={phone}
        whatsappNumber={whatsapp}
        user={session?.user}
      />

      <main className="course-main-content">
        {/* 1. HERO & BREADCRUMB */}
        <section className="course-hero-section">
          <div className="course-container">
            {/* Breadcrumb */}
            <nav className="course-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className="course-breadcrumb-sep">›</span>
              <Link href="/#course-explorer">Courses</Link>
              <span className="course-breadcrumb-sep">›</span>
              <span className="course-breadcrumb-current">{course.shortTitle}</span>
            </nav>

            <div className="course-hero-grid">
              <div className="course-hero-text">
                <div className="course-badge-row">
                  <span className="course-tag-pill">{course.badge}</span>
                  <span className="course-category-pill">
                    {course.category === "school" ? "School & Board Tuition" : "Competitive Pathway"}
                  </span>
                </div>

                <h1 className="course-hero-title">{course.title}</h1>

                <p className="course-hero-promise">{course.heroTagline}</p>

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
                    <span className="fact-label">Learning Mode</span>
                    <strong className="fact-value">
                      {course.mode === "centre" ? "At Indirapuram Centre" : course.mode === "online" ? "Online Self-Paced" : "Centre + Online"}
                    </strong>
                  </div>
                </div>

                {/* Hero Action Buttons */}
                <div className="course-hero-actions">
                  <AddToCartButton courseSlug={course.slug} courseTitle={course.title} />
                  <Link href="/#book-demo" className="btn-course-demo">
                    Book Free Demo Class →
                  </Link>
                  <a href={`tel:${phone}`} className="btn-course-call">
                    <span aria-hidden="true">📞</span>
                    <span>Call Admissions</span>
                  </a>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hello SmartNum, I am interested in ${course.title}. Please share batch timings and demo details.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-course-whatsapp"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Hero Visual Card */}
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

        {/* 4. HOW THE COURSE WORKS */}
        <section className="course-section works-section">
          <div className="course-container">
            <div className="section-header-centered">
              <span className="section-eyebrow">OUR METHODOLOGY</span>
              <h2 className="section-heading">How the course works</h2>
              <p className="section-subtext">
                Our classrooms are designed around five foundational pillars that ensure consistent, stress-free academic growth.
              </p>
            </div>

            <div className="pillars-grid">
              {course.howItWorks.map((pillar, pIdx) => (
                <div key={`pillar-${pIdx}`} className="pillar-card">
                  <div className="pillar-index">{pIdx + 1}</div>
                  <h3 className="pillar-title">{pillar.title}</h3>
                  <p className="pillar-desc">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. A TYPICAL WEEK */}
        <section className="course-section week-section">
          <div className="course-container">
            <div className="week-plan-card">
              <div className="week-plan-header">
                <div>
                  <span className="section-eyebrow">SCHEDULE &amp; TIMINGS</span>
                  <h2 className="week-plan-title">A typical week in this programme</h2>
                  <p className="week-summary">{course.weekPlan.summary}</p>
                </div>
                <div className="week-batch-tag">
                  <span>Batch Capacity: {course.batchInfo.size}</span>
                </div>
              </div>

              <div className="week-schedule-grid">
                {course.weekPlan.schedule.map((slot, sIdx) => (
                  <div key={`schedule-${sIdx}`} className="schedule-slot-item">
                    <div className="slot-day-col">
                      <span className="slot-days">{slot.days}</span>
                      <span className="slot-time">{slot.time}</span>
                    </div>
                    <div className="slot-focus-col">
                      <strong className="slot-focus-text">{slot.focus}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. WHY SMARTNUM FOR THIS COURSE */}
        <section className="course-section why-section">
          <div className="course-container">
            <div className="why-course-banner">
              <div className="why-banner-content">
                <span className="why-pill">THE SMARTNUM DIFFERENCE</span>
                <h2 className="why-banner-title">Why SmartNum for {course.shortTitle}?</h2>
                <p className="why-banner-text">{course.whySmartnum}</p>

                <div className="why-highlights-row">
                  <div className="why-highlight-item">
                    <span className="highlight-icon">🔬</span>
                    <span>Air-Conditioned Smart Classrooms</span>
                  </div>
                  <div className="why-highlight-item">
                    <span className="highlight-icon">📹</span>
                    <span>Full CCTV Safety in Common Areas</span>
                  </div>
                  <div className="why-highlight-item">
                    <span className="highlight-icon">📍</span>
                    <span>Convenient Indirapuram Centre (ATS Advantage)</span>
                  </div>
                </div>
              </div>

              <div className="why-quote-card">
                <p className="quote-text">
                  &ldquo;A good teacher explains with patience, shows the steps honestly, and never hides behind commercial jargon.&rdquo;
                </p>
                <div className="quote-author">
                  <strong>Dr. Sweta Agrawal</strong>
                  <span>Founder &amp; Academic Director · Ph.D. in Mathematics</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. BATCHES, FEES & HOW TO JOIN */}
        <section className="course-section batches-section">
          <div className="course-container">
            <div className="section-header-centered">
              <span className="section-eyebrow">ADMISSIONS &amp; ENROLMENT</span>
              <h2 className="section-heading">Batches, fees &amp; how to join</h2>
              <p className="section-subtext">
                Transparent enrolment with clear steps and flexible payment options.
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
                  <span className="info-label">Tuition Fee:</span>
                  <strong className="info-value">{course.fee.amount}</strong>
                </div>
                <div className="info-item">
                  <span className="info-label">Instalments:</span>
                  <strong className="info-value">{course.fee.installments}</strong>
                </div>
              </div>

              <div className="join-steps-panel">
                <h3 className="join-steps-title">4 Simple Steps to Enrol</h3>
                <ol className="join-steps-list">
                  <li>
                    <strong>1. Book a Free Demo Class:</strong> Reserve a seat online or call our centre to experience a live lecture.
                  </li>
                  <li>
                    <strong>2. Free Diagnostic Assessment:</strong> Our academic director meets the student to identify exact strengths and gaps.
                  </li>
                  <li>
                    <strong>3. Choose Batch Timing:</strong> Pick a weekday or weekend timing that balances smoothly with school.
                  </li>
                  <li>
                    <strong>4. Confirm Admission:</strong> Complete simple enrolment at our Indirapuram centre or pay securely via Cashfree.
                  </li>
                </ol>

                <div className="join-actions">
                  <Link href="/#book-demo" className="btn-join-primary">
                    Book Free Demo Class →
                  </Link>
                  <a href={`tel:${phone}`} className="btn-join-secondary">
                    Call Admissions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQS SPECIFIC TO THIS COURSE */}
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
            </div>
          </div>
        </section>

        {/* 9. RELATED COURSES */}
        {relatedCourses.length > 0 && (
          <section className="course-section related-section">
            <div className="course-container">
              <div className="section-header-centered">
                <span className="section-eyebrow">EXPLORE MORE PATHWAYS</span>
                <h2 className="section-heading">Related Courses &amp; Programmes</h2>
              </div>

              <div className="related-courses-grid">
                {relatedCourses.map((rel) => (
                  <Link
                    key={`related-${rel.slug}`}
                    href={`/courses/${rel.slug}`}
                    className="related-course-card"
                  >
                    <div className="related-card-top">
                      <span className="related-badge">{rel.badge}</span>
                      <span className="related-class">{rel.classLevel}</span>
                    </div>
                    <h3 className="related-title">{rel.shortTitle}</h3>
                    <p className="related-tagline">{rel.heroTagline}</p>
                    <span className="related-link-arrow">View course details →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 10. SHARED BLOCK: NOT SURE WHICH BATCH FITS? */}
        <section className="course-section assessment-cta-section">
          <div className="course-container">
            <div className="assessment-card">
              <div className="assessment-text">
                <span className="assessment-eyebrow">FREE 1-ON-1 DIAGNOSTIC SESSION</span>
                <h2 className="assessment-title">Not sure which batch fits?</h2>
                <p className="assessment-desc">
                  Book a diagnostic session with our academic director. Tell us your child&rsquo;s class, their board, and what worries you most about Maths or Science, and we&rsquo;ll show you exactly where to start.
                </p>
              </div>

              <div className="assessment-actions">
                <Link href="/#book-demo" className="btn-assessment-demo">
                  Book Free Assessment
                </Link>
                <a href={`tel:${phone}`} className="btn-assessment-call">
                  Call {phone}
                </a>
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    "Hello SmartNum, I want to book a free diagnostic assessment for my child."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-assessment-wa"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 11. SHARED BLOCK: VISIT US */}
        <section className="course-section visit-strip-section">
          <div className="course-container">
            <div className="visit-strip-card">
              <div className="visit-strip-info">
                <span className="visit-pill">VISIT OUR CENTRE</span>
                <h3 className="visit-title">SmartNum Learning Space</h3>
                <p className="visit-address">{address}</p>
                <p className="visit-hours">
                  Centre Hours: <strong>Mon – Sat: 10:00 AM – 7:00 PM</strong> | Sunday: <em>By Appointment</em>
                </p>
              </div>

              <div className="visit-strip-action">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-directions"
                >
                  Get Directions on Maps ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MobileFloatingActions phone={phone} whatsappNumber={whatsapp} />
      <SiteFooter contact={contact} />
    </div>
  );
}
