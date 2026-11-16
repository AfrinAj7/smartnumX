import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAllCourseSlugs, getCourse, COURSES } from "@/server/courses";
import { getPublicProductBySlug } from "@/server/courses/course-service";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";
import { CourseDetailInteractive, CourseDetailData } from "@/web-client/components/catalog/CourseDetailInteractive";

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
  const [course, dbProduct] = await Promise.all([
    getCourse(slug),
    getPublicProductBySlug(slug),
  ]);

  const title = dbProduct?.title || course?.title;
  if (!title) {
    return { title: "Batch Not Found | SmartNum" };
  }

  const desc = dbProduct?.description || course?.seo.description || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartnumx.com";
  const canonicalUrl = `${siteUrl}/batches/${slug}`;

  return {
    title: `${title} | SmartNum Indirapuram Batches`,
    description: desc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | SmartNum Batches`,
      description: desc,
      url: canonicalUrl,
      type: "website",
      images: course?.seo.ogImage ? [{ url: course.seo.ogImage }] : undefined,
    },
  };
}

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [staticCourse, dbProduct, content, session] = await Promise.all([
    getCourse(slug),
    getPublicProductBySlug(slug),
    getHomepageContent(db),
    auth(),
  ]);

  if (!staticCourse && !dbProduct) {
    notFound();
  }

  const contact = content.contact;
  const phone = contact?.phone || "+91 99589 66823";
  const whatsapp = contact?.whatsapp;
  const address = contact?.address || "04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014";
  const mapsUrl = contact?.mapsUrl || "https://share.google/8gHRuZQQxRuYAkqVd";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartnumx.com";
  const batchUrl = `${siteUrl}/batches/${slug}`;

  // Merged Data Model
  const courseDetail: CourseDetailData = {
    id: dbProduct?.id || slug,
    slug,
    title: dbProduct?.title || staticCourse?.title || "Academic Batch",
    shortTitle: staticCourse?.shortTitle || dbProduct?.title || "Batch",
    category: staticCourse?.category || "school",
    badge: dbProduct?.badge || staticCourse?.badge || "Active Batch",
    board: dbProduct?.targetExam || staticCourse?.board || "CBSE & ICSE",
    classLevel: dbProduct?.targetClass || staticCourse?.classLevel || "Class 9-12",
    mode: (dbProduct?.mode as "ONLINE" | "PHYSICAL" | "BOTH") || "BOTH",
    subjects: staticCourse?.subjects || ["Mathematics", "Science"],
    heroTagline: staticCourse?.heroTagline || dbProduct?.description || "",
    intro: staticCourse?.intro || dbProduct?.description || "",
    price: dbProduct ? dbProduct.price : 18000,
    discountPrice: dbProduct ? dbProduct.discountPrice : 14499,
    seatsTotal: dbProduct?.seatsTotal || 15,
    seatsLeft: dbProduct?.seatsLeft ?? 4,
    centreName: dbProduct?.centre?.name || "SmartNum Indirapuram Campus",
    centreCity: dbProduct?.centre?.city || "Indirapuram, Ghaziabad",
    centreAddress: dbProduct?.centre?.address || address,
    whoFor: staticCourse?.whoFor || [
      "Students seeking rigorous concept-first understanding from first principles.",
      "Learners who want small batches with zero hesitation to ask doubts.",
      "Parents desiring transparent fortnightly progress reports.",
    ],
    notFor: staticCourse?.notFor || [
      "Students looking for passive lecture recordings without committing to regular practice sets.",
    ],
    learn: staticCourse?.learn || [
      {
        group: "Core Academic Foundations",
        items: [
          "Complete line-by-line concept breakdown from first principles.",
          "Exemplar and multi-step problem solving presentation coaching.",
          "Regular diagnostic testing with personalized weakness remediation.",
        ],
      },
    ],
    howItWorks: staticCourse?.howItWorks || [],
    weekPlan: staticCourse?.weekPlan || {
      summary: "3 days per week · 90-minute structured sessions",
      schedule: [
        { days: "Mon / Wed / Fri", time: "5:30 PM - 7:00 PM", focus: "Theory & Practice Drills" },
        { days: "Saturday", time: "4:00 PM - 6:00 PM", focus: "Doubt Clinic & Testing" },
      ],
    },
    batchInfo: staticCourse?.batchInfo || {
      size: "Max 15 Students",
      timing: "Evening batches (4:30 PM & 6:15 PM slots)",
      startDate: dbProduct?.startDate ? new Date(dbProduct.startDate).toLocaleDateString("en-IN") : "Rolling Admission",
    },
    fee: staticCourse?.fee || {
      amount: `₹${(dbProduct?.discountPrice || dbProduct?.price || 14499).toLocaleString("en-IN")}`,
      installments: "2 or 3 convenient instalments available",
    },
    faqs: staticCourse?.faqs || [
      {
        q: "What is the batch size at Indirapuram Centre?",
        a: "We strictly limit classroom cohorts to 15 students to guarantee individual attention by our senior Ph.D. faculty.",
      },
      {
        q: "Do students get access to recordings if they miss a class?",
        a: "Yes! Every single live lecture is recorded in high definition and accessible inside the student portal 24/7.",
      },
    ],
    heroImage: staticCourse?.heroImage || "/images/courses/maths-hero.jpg",
  };

  // Structured Data Schemas
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: courseDetail.title,
    description: courseDetail.heroTagline,
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
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Batches", item: `${siteUrl}/batches` },
      { "@type": "ListItem", position: 3, name: courseDetail.shortTitle, item: batchUrl },
    ],
  };

  const relatedCourses = COURSES.filter((c) => staticCourse?.related?.includes(c.slug) || c.slug !== slug).slice(0, 3);

  return (
    <div className="course-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <SiteHeader phone={phone} whatsappNumber={whatsapp} user={session?.user} />

      <main className="course-main-content">
        <CourseDetailInteractive
          course={courseDetail}
          phone={phone}
          whatsapp={whatsapp}
        />

        {/* RELATED BATCHES */}
        {relatedCourses.length > 0 && (
          <section className="course-section related-section">
            <div className="course-container">
              <div className="section-header-centered">
                <span className="section-eyebrow">EXPLORE MORE PATHWAYS</span>
                <h2 className="section-heading">Related Academic Batches</h2>
              </div>

              <div className="related-courses-grid">
                {relatedCourses.map((rel) => (
                  <Link
                    key={`related-${rel.slug}`}
                    href={`/batches/${rel.slug}`}
                    className="related-course-card"
                  >
                    <div className="related-card-top">
                      <span className="related-badge">{rel.badge}</span>
                      <span className="related-class">{rel.classLevel}</span>
                    </div>
                    <h3 className="related-title">{rel.shortTitle}</h3>
                    <p className="related-tagline">{rel.heroTagline}</p>
                    <span className="related-link-arrow">View batch details →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SHARED BLOCK: VISIT US */}
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
