import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { COURSES } from "@/server/courses";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maths & Science Courses in Indirapuram | SmartNum",
  description:
    "Explore our 8 specialized coaching programmes for Classes 9–12, CBSE/ICSE Board Excellence, IIT-JEE Mains & Advanced, and Olympiads in Indirapuram.",
  keywords: [
    "maths coaching Indirapuram",
    "science coaching Ghaziabad",
    "class 10 board coaching",
    "class 12 board coaching",
    "IIT JEE coaching Indirapuram",
    "maths olympiad Indirapuram",
  ],
};

export default async function CoursesIndexPage() {
  const [content, session] = await Promise.all([
    getHomepageContent(db),
    auth(),
  ]);

  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 47774";
  const whatsapp = contact?.whatsapp || "+91 99589 47774";

  const schoolCourses = COURSES.filter((c) => c.category === "school");
  const competitiveCourses = COURSES.filter((c) => c.category === "competitive");

  return (
    <div className="courses-index-page">
      <SiteHeader
        phone={phone}
        whatsappNumber={whatsapp}
        user={session?.user}
      />

      <main className="courses-index-main">
        {/* Header Hero */}
        <header className="courses-catalog-hero">
          <div className="course-container">
            <span className="catalog-kicker">SMARTNUM ACADEMIC PATHWAYS</span>
            <h1 className="catalog-title">Maths &amp; Science Courses in Indirapuram</h1>
            <p className="catalog-desc">
              Small batches, Ph.D.-led mathematics, and structured diagnostic feedback. Choose the programme tailored to your child&rsquo;s grade, board, and academic goals.
            </p>
          </div>
        </header>

        {/* Section 1: School & Board Tuition */}
        <section className="catalog-section">
          <div className="course-container">
            <div className="catalog-group-header">
              <span className="catalog-group-pill">GRADES 9–12 FOUNDATION</span>
              <h2 className="catalog-group-title">School &amp; Board Tuition (CBSE &amp; ICSE)</h2>
              <p className="catalog-group-desc">
                Clear conceptual understanding and disciplined step-by-step problem presentation that builds genuine confidence and high board exam scores.
              </p>
            </div>

            <div className="catalog-grid">
              {schoolCourses.map((c) => (
                <div key={c.slug} className="catalog-card">
                  <div className="catalog-card-badge-row">
                    <span className="catalog-badge">{c.badge}</span>
                    <span className="catalog-class">{c.classLevel}</span>
                  </div>
                  <h3 className="catalog-card-title">{c.shortTitle}</h3>
                  <p className="catalog-card-tagline">{c.heroTagline}</p>

                  <div className="catalog-card-meta">
                    <span className="meta-bullet">▸ {c.board}</span>
                    <span className="meta-bullet">▸ {c.mode === "centre" ? "Centre Batch" : "Online Mode"}</span>
                    <span className="meta-bullet">▸ Max 15 Students</span>
                  </div>

                  <Link href={`/courses/${c.slug}`} className="btn-explore-course">
                    View Course Details &amp; Timings →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Competitive Pathways */}
        <section className="catalog-section alt-bg">
          <div className="course-container">
            <div className="catalog-group-header">
              <span className="catalog-group-pill competitive">COMPETITIVE EXCELLENCE</span>
              <h2 className="catalog-group-title">Competitive Pathways, Olympiads &amp; Online</h2>
              <p className="catalog-group-desc">
                Intensive problem solving, non-routine challenges, and Ph.D.-led mathematical mentorship for JEE, Olympiad, and self-paced aspirants.
              </p>
            </div>

            <div className="catalog-grid">
              {competitiveCourses.map((c) => (
                <div key={c.slug} className="catalog-card">
                  <div className="catalog-card-badge-row">
                    <span className="catalog-badge">{c.badge}</span>
                    <span className="catalog-class">{c.classLevel}</span>
                  </div>
                  <h3 className="catalog-card-title">{c.shortTitle}</h3>
                  <p className="catalog-card-tagline">{c.heroTagline}</p>

                  <div className="catalog-card-meta">
                    <span className="meta-bullet">▸ {c.board}</span>
                    <span className="meta-bullet">▸ {c.mode === "centre" ? "Indirapuram Centre" : "Online 24/7"}</span>
                    <span className="meta-bullet">▸ Small Mentorship Circles</span>
                  </div>

                  <Link href={`/courses/${c.slug}`} className="btn-explore-course">
                    View Course Details &amp; Timings →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shared Bottom CTA */}
        <section className="catalog-assessment-cta">
          <div className="course-container">
            <div className="assessment-card">
              <div className="assessment-text">
                <span className="assessment-eyebrow">FREE 1-ON-1 DIAGNOSTIC SESSION</span>
                <h2 className="assessment-title">Not sure which batch fits your child?</h2>
                <p className="assessment-desc">
                  Book a diagnostic session with our academic director. Tell us your child&rsquo;s grade, board, and learning concerns, and we will guide you to the ideal batch.
                </p>
              </div>

              <div className="assessment-actions">
                <Link href="/#book-demo" className="btn-assessment-demo">
                  Book Free Assessment
                </Link>
                <a href={`tel:${phone}`} className="btn-assessment-call">
                  Call {phone}
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
