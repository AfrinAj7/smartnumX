import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPublicProductBySlug } from "@/server/courses/course-service";
import { getTestSeriesTestsForStudent } from "@/server/tests/assignment-service";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";
import {
  TestSeriesDetailClient,
  TestSeriesDetailData,
} from "@/web-client/components/catalog/TestSeriesDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return { title: "Test Series Not Found | SmartNum" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartnumx.com";
  const canonicalUrl = `${siteUrl}/test-series/${slug}`;

  return {
    title: `${product.title} | SmartNum Test Series`,
    description: product.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${product.title} | SmartNum Mock Series`,
      description: product.description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function TestSeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, content, session, testsData] = await Promise.all([
    getPublicProductBySlug(slug),
    getHomepageContent(db),
    auth(),
    getTestSeriesTestsForStudent(slug).catch(() => null),
  ]);

  if (!product) {
    notFound();
  }

  // If user is logged in, resolve their specific test access and attempt states
  let userTestsData = testsData;
  if (session?.user?.id) {
    userTestsData = await getTestSeriesTestsForStudent(
      slug,
      session.user.id,
      session.user.role
    ).catch(() => testsData);
  }

  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 47774";
  const whatsapp = contact?.whatsapp || "+91 99589 47774";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartnumx.com";
  const productUrl = `${siteUrl}/test-series/${slug}`;

  const detailData: TestSeriesDetailData = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    badge: product.badge || (product.isFree ? "Free Assessment" : "Mock Series"),
    targetClass: product.targetClass || "Classes 9–12 / JEE",
    targetExam: product.targetExam || "Competitive / Boards",
    isFree: product.isFree || product.price === 0,
    price: product.price,
    discountPrice: product.discountPrice,
    validity: product.validity || "Till Exam Date 2026-27",
    testCountFull: product.testCountFull || 15,
    testCountChapter: product.testCountChapter || 30,
    sampleTestUrl: product.sampleTestUrl || null,
    features: product.features || [],
    inclusions: product.inclusions || [],
    totalQuestionsCount: (product as { totalQuestionsCount?: number | null }).totalQuestionsCount || null,
    publishedTestsCount: (product as { totalTestsCount?: number }).totalTestsCount || 0,
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: product.discountPrice || product.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: productUrl,
    },
  };

  return (
    <div className="test-series-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <SiteHeader phone={phone} whatsappNumber={whatsapp} user={session?.user} />

      <main className="test-series-detail-main">
        <TestSeriesDetailClient
          testSeries={detailData}
          phone={phone}
          whatsapp={whatsapp}
          tests={userTestsData?.tests || []}
          isEnrolled={userTestsData?.course.isEnrolled ?? false}
          userLoggedIn={Boolean(session?.user)}
        />
      </main>

      <MobileFloatingActions phone={phone} whatsappNumber={whatsapp} />
      <SiteFooter contact={contact} />
    </div>
  );
}

