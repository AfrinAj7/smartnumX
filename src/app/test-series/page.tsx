import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPublicTestSeries } from "@/server/courses/course-service";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";
import { TestSeriesCatalogClient } from "@/web-client/components/catalog/TestSeriesCatalogClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Test Series (Latest 2026-27) | SmartNum Mock Exams",
  description:
    "Prepare with high-yield full length mock tests, chapter topic tests, all-India rank predictors, and step-by-step video solutions for IIT-JEE Main, Advanced, and CBSE/ICSE Board exams.",
  keywords: [
    "IIT JEE mock tests",
    "JEE Main mock series",
    "Class 10 board test series",
    "Class 12 board sample papers",
    "online mock test series",
    "free diagnostic test SmartNum",
  ],
};

export default async function TestSeriesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; free?: string }>;
}) {
  const { category, free } = await searchParams;

  const [content, session, allTestSeries] = await Promise.all([
    getHomepageContent(db),
    auth(),
    listPublicTestSeries(),
  ]);

  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 47774";
  const whatsapp = contact?.whatsapp || "+91 99589 47774";

  return (
    <div className="test-series-index-page">
      <SiteHeader phone={phone} whatsappNumber={whatsapp} user={session?.user} />

      <main className="test-series-main">
        {/* Header Hero */}
        <header className="test-series-hero">
          <div className="course-container">
            <span className="catalog-kicker">SMARTNUM BENCHMARK ASSESSMENTS</span>
            <h1 className="catalog-title">Test Series (Latest 2026-27)</h1>
            <p className="catalog-desc">
              National exam-simulation interface, instant All-India Rank (AIR) prediction, topic-wise accuracy analytics, and step-by-step answers for JEE &amp; Board Excellence.
            </p>
          </div>
        </header>

        {/* Filterable Catalog Client */}
        <TestSeriesCatalogClient
          testSeries={allTestSeries}
          initialCategory={category}
          initialFreeOnly={free === "true"}
        />

        {/* Free Assessment Banner */}
        <section className="catalog-assessment-cta">
          <div className="course-container">
            <div className="assessment-card">
              <div className="assessment-text">
                <span className="assessment-eyebrow">PRACTICE &amp; DIAGNOSTIC</span>
                <h2 className="assessment-title">Take a Free Practice Mock Today</h2>
                <p className="assessment-desc">
                  Experience our full CBT exam environment with instant evaluation, detailed step-by-step solutions, and performance breakdown.
                </p>
              </div>

              <div className="assessment-actions">
                <Link href="/test-series?free=true" className="btn-assessment-demo">
                  Explore Free Test Series →
                </Link>
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
