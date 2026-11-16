import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPublicCourses } from "@/server/courses/course-service";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";
import { CourseCatalogClient } from "@/web-client/components/catalog/CourseCatalogClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maths & Science Batches 2026-27 | SmartNum Indirapuram",
  description:
    "Explore our accredited coaching batches for Classes 9–12, CBSE/ICSE Board Excellence, IIT-JEE Mains & Advanced, and Olympiads with Online & Physical Centre batches in Indirapuram.",
  keywords: [
    "batches Indirapuram",
    "maths batches Indirapuram",
    "science coaching Ghaziabad",
    "class 10 board batch",
    "class 12 board batch",
    "IIT JEE batches Indirapuram",
    "maths olympiad batch",
  ],
};

export default async function BatchesIndexPage() {
  const [content, session, courses] = await Promise.all([
    getHomepageContent(db),
    auth(),
    listPublicCourses(),
  ]);

  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 47774";
  const whatsapp = contact?.whatsapp || "+91 99589 47774";

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
            <h1 className="catalog-title">Maths &amp; Science Batches (2026–27)</h1>
            <p className="catalog-desc">
              Small 15-student batches, Ph.D.-led mathematics, and structured diagnostic feedback. Choose between <strong>Indirapuram Physical Centre</strong> and <strong>Interactive Online</strong> modes.
            </p>
          </div>
        </header>

        {/* Interactive Filterable Catalogue */}
        <CourseCatalogClient courses={courses} basePath="/batches" />

        {/* Bottom Assessment Strip */}
        <section className="catalog-assessment-cta">
          <div className="course-container">
            <div className="assessment-card">
              <div className="assessment-text">
                <span className="assessment-eyebrow">FREE 1-ON-1 DIAGNOSTIC SESSION</span>
                <h2 className="assessment-title">Not sure which batch fits best?</h2>
                <p className="assessment-desc">
                  Book a diagnostic session with our academic director. Tell us your child&rsquo;s grade, their board, and what worries you most about Maths or Science, and we&rsquo;ll guide you to the right pathway.
                </p>
              </div>

              <div className="assessment-actions">
                <Link href="/#book-demo" className="btn-assessment-demo">
                  Book Free Assessment
                </Link>
                <a href={`tel:${phone}`} className="btn-assessment-call">
                  Call Admissions: {phone}
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
