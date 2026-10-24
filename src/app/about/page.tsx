import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";
import { AboutFAQAccordion, type AboutFAQItem } from "@/web-client/components/marketing/AboutFAQAccordion";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHomepageContent } from "@/server/site-content/homepage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About SmartNum | Maths & Science Coaching in Indirapuram",
  description:
    "SmartNum is a small coaching centre in Indirapuram, Ghaziabad for Classes 10-12. Meet our Ph.D.-led maths teaching and book a free demo.",
  keywords: [
    "maths coaching in Indirapuram",
    "IIT-JEE coaching Ghaziabad",
    "NEET coaching Indirapuram",
    "Class 12 board coaching Indirapuram",
    "small batch coaching Ghaziabad",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About SmartNum | Maths & Science Coaching in Indirapuram",
    description:
      "SmartNum is a small coaching centre in Indirapuram, Ghaziabad for Classes 10-12. Meet our Ph.D.-led maths teaching and book a free demo.",
    url: "/about",
    type: "website",
    locale: "en_IN",
  },
};

const aboutFAQs: AboutFAQItem[] = [
  {
    question: "Where is SmartNum located?",
    answer:
      "SmartNum is located in Indirapuram, Ghaziabad at 04224, ATS Advantage, Ahinsa Khand 1, Indirapuram, Ghaziabad, UP 201014. It is easily accessible with landmark parking and direct road connectivity.",
  },
  {
    question: "Which classes and exams do you teach?",
    answer:
      "We teach Classes 9–12 and prepare students for CBSE, ICSE, and State Board exams, as well as NEET and IIT-JEE (Main & Advanced), plus Olympiads.",
  },
  {
    question: "Who will be teaching my child?",
    answer:
      "Our maths teaching is led by a Ph.D. in Mathematics who is also an Assistant Professor. Our team of Maths and Science tutors works from the Indirapuram centre. You can meet them at the free demo.",
  },
  {
    question: "How big are the batches?",
    answer:
      "We keep batches small (10 to 20 students) so every student can ask questions and get personal attention from the teacher.",
  },
  {
    question: "Do you offer a free demo class?",
    answer:
      "Yes. You can book a free demo session, visit the centre and meet the teacher before deciding.",
  },
  {
    question: "What are one-to-one doubt sessions?",
    answer:
      "They are private sessions with a teacher to clear specific doubts, often before an exam. You bring the questions, and the teacher works through them with you.",
  },
  {
    question: "Do you have recorded lessons?",
    answer:
      "Yes. SmartNum offers self-paced recorded learning paths so students can revise topics after class at their own pace.",
  },
  {
    question: "How will I know how my child is progressing?",
    answer:
      "Through regular tests and progress reports shared with parents, so you can see strengths and the topics that need work.",
  },
  {
    question: "Is the centre safe?",
    answer:
      "The campus is monitored by CCTV and the classrooms are air-conditioned smart classrooms.",
  },
  {
    question: "Do you guarantee marks or ranks?",
    answer:
      "No. We teach carefully and give honest feedback, but we do not promise scores or ranks.",
  },
  {
    question: "Do you teach for IIT-JEE and NEET?",
    answer:
      "Yes, SmartNum offers coaching for IIT-JEE (Main and Advanced) and NEET science fundamentals with deep conceptual rigor.",
  },
  {
    question: "What are the fees and timings?",
    answer:
      "Fees depend on the chosen programme and grade, with flexible evening and weekend batches. Call us or book a free demo for the latest details.",
  },
  {
    question: "How do I enrol?",
    answer:
      "Book a free demo, meet the teacher, choose a batch, and complete admission at the centre.",
  },
  {
    question: "Do you offer online classes?",
    answer:
      "We teach at our Indirapuram centre, with recorded lessons for revision.",
  },
];

export default async function AboutPage() {
  const [content, session] = await Promise.all([getHomepageContent(db), auth()]);

  const contactPhone = content.contact.phone || "+91 99589 47774";
  const contactEmail = content.contact.email || "gosmartnum@gmail.com";
  const whatsappNumber = content.contact.whatsapp || "+91 99589 47774";

  const navUser = session?.user
    ? {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    }
    : null;

  // Structured Data Schema (EducationalOrganization + Person + FAQPage)
  const schemaStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": "https://smartnumx.com/#organization",
        name: "SmartNum",
        alternateName: "SmartNumX",
        url: "https://smartnumx.com",
        description:
          "Maths and Science coaching centre in Indirapuram, Ghaziabad for Classes 9–12, Board exams, IIT-JEE, NEET, and Olympiads.",
        address: {
          "@type": "PostalAddress",
          streetAddress: "04224, ATS Advantage, Ahinsa Khand 1",
          addressLocality: "Indirapuram, Ghaziabad",
          addressRegion: "Uttar Pradesh",
          postalCode: "201014",
          addressCountry: "IN",
        },
        telephone: contactPhone,
        email: contactEmail,
      },
      {
        "@type": "Person",
        "@id": "https://smartnumx.com/#founder",
        name: "Dr. Sweta Agrawal",
        alternateName: "Shweta Agarwal",
        jobTitle: "Assistant Professor of Mathematics & Founder",
        alumniOf: "Ph.D. in Mathematics",
        worksFor: {
          "@type": "EducationalOrganization",
          name: "SmartNum",
        },
        knowsAbout: [
          "Mathematics",
          "Statistics",
          "Reliability theory",
          "IIT-JEE Mathematics",
          "Pedagogy",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://smartnumx.com/about#faq",
        mainEntity: aboutFAQs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="site-home about-page-root">
      <SiteHeader phone={contactPhone} whatsappNumber={whatsappNumber} user={navUser} />

      {/* Internal Jump Nav Bar */}
      <nav className="about-internal-nav-bar" aria-label="About page sub-navigation">
        <div className="about-nav-inner">
          <span className="about-nav-label">About SmartNum Guide</span>
          <div className="about-nav-links">
            <Link className="about-nav-chip" href="/#course-explorer">Programmes</Link>
            <a className="about-nav-chip" href="#founder">Teachers &amp; Founder</a>
            <a className="about-nav-chip" href="#how-we-teach">How We Teach</a>
            <a className="about-nav-chip" href="#our-space">Campus &amp; Space</a>
            <a className="about-nav-chip" href="/#book-demo">Book a Demo</a>
            <a className="about-nav-chip" href="#faq">FAQs</a>
            <Link className="about-nav-chip" href="/#contact">Contact</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaStructuredData).replace(/</g, "\\u003c"),
          }}
        />

        {/* 1. HERO SECTION */}
        <section className="about-hero-section" aria-labelledby="about-hero-title">
          <div className="about-hero-container">
            <div className="about-hero-copy">
              <div className="about-eyebrow-row">
                <span className="about-eyebrow-dash" aria-hidden="true" />
                <span className="about-eyebrow-text">About SmartNum</span>
              </div>

              <h1 id="about-hero-title" className="about-hero-heading">
                Think it through <span className="highlight-gold">clearly.</span>
              </h1>

              <p className="about-hero-intro">
                SmartNum is a small learning space in Indirapuram, Ghaziabad. We teach Classes 10–12 and prepare students for Board exams, NEET and IIT-JEE, in batches small enough that every student is known by name.
              </p>

              <div className="about-hero-cta-row">
                <a className="button-orange-primary" href="/#book-demo">
                  Book a free demo <span className="btn-arrow" aria-hidden="true">→</span>
                </a>
                <a className="about-scroll-link" href="#founder">
                  Meet the teacher <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>

            <div className="about-hero-visual">
              <div className="about-hero-image-card">
                <Image
                  src="/images/editorial/about-classroom-main.jpg"
                  alt="Students in a small-batch maths class at SmartNum, Indirapuram"
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="editorial-photo"
                  priority
                />
                <div className="about-photo-vignette" />
              </div>

              {/* Looping chip */}
              <div className="about-hero-loop-badge">
                <Image
                  src="/images/editorial/about-whiteboard-loop.gif"
                  alt="Hand writing step-by-step solution on whiteboard"
                  width={110}
                  height={74}
                  className="about-loop-gif"
                  unoptimized
                />
                <span className="about-loop-label">
                  <span className="loop-pulse-dot" aria-hidden="true" />
                  Whiteboard Working
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. WHY WE STARTED SMARTNUM */}
        <section className="about-why-section" aria-labelledby="why-started-title">
          <div className="about-section-container">
            <div className="about-why-grid">
              <div className="about-why-content">
                <span className="section-subkicker">Founding Philosophy</span>
                <h2 id="why-started-title" className="about-section-h2">
                  Why we started SmartNum
                </h2>

                <p className="about-prose-p">
                  Most students don&apos;t struggle with maths because they&apos;re &ldquo;not maths people&rdquo;. They struggle because a step got skipped somewhere, usually years ago, and nobody had the time to go back for it.
                </p>

                <p className="about-prose-p">
                  SmartNum is built around going back for it. We keep batches small (10–20 students) so questions get asked out loud. We use class time for understanding, not racing through the syllabus. And when something still doesn&apos;t click, there&apos;s a one-to-one session with a teacher who sits next to you and works through it.
                </p>

                <p className="about-prose-p founding-note">
                  Founded by <strong>Dr. Sweta Agrawal</strong> in Indirapuram, Ghaziabad, SmartNum was built to combine rigorous academic methods with modern clarity, creating an encouraging sanctuary where learners rediscover analytical confidence.
                </p>
              </div>

              <div className="about-why-image-wrap">
                <figure className="about-why-figure">
                  <Image
                    src="/images/editorial/about-doubt-session.jpg"
                    alt="Teacher and student side by side working through a maths problem over a notebook"
                    fill
                    sizes="(max-width: 900px) 100vw, 480px"
                    className="editorial-photo"
                  />
                  <figcaption className="about-handwriting-caption">
                    Doubt desk · Working through skipped steps together
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* 3. WHAT WE OFFER (SmartNumX Ethos & Pillars) */}
        <section className="about-what-we-offer-section" aria-labelledby="what-we-offer-title">
          <div className="about-section-container">
            <div className="about-centered-header">
              <span className="section-subkicker">SmartNumX Platform</span>
              <h2 id="what-we-offer-title" className="about-section-h2">
                What We Offer
              </h2>
              <p className="about-header-desc">
                <em>Learn Smart. Think Sharp. Excel Beyond.</em> An innovative EdTech approach dedicated to conceptual understanding, logical thinking, and practical problem-solving.
              </p>
            </div>

            <div className="what-we-offer-grid">
              <div className="offer-card">
                <div className="offer-icon-wrapper" aria-hidden="true">💡</div>
                <h3>Concept-Based Learning</h3>
                <p>Simple, intuitive explanations that clarify the &ldquo;why&rdquo; behind formulas before memorizing procedures.</p>
              </div>

              <div className="offer-card">
                <div className="offer-icon-wrapper" aria-hidden="true">📐</div>
                <h3>Mathematics &amp; Logical Reasoning</h3>
                <p>Systematically strengthening analytical problem-solving, speed, and numerical intuition for boards and entrance exams.</p>
              </div>

              <div className="offer-card">
                <div className="offer-icon-wrapper" aria-hidden="true">📝</div>
                <h3>Practice &amp; Assessments</h3>
                <p>Targeted chapter drills, past-year paper practice, and timely diagnostic feedback that build exam-day accuracy.</p>
              </div>

              <div className="offer-card">
                <div className="offer-icon-wrapper" aria-hidden="true">💻</div>
                <h3>Digital Learning</h3>
                <p>Flexible, student-friendly recorded modules for self-paced revision anytime you want to revisit a challenging topic.</p>
              </div>
            </div>

            {/* Mission Statement Banner */}
            <div className="offer-mission-banner">
              <div className="mission-text-wrap">
                <span className="mission-tagline">Our Mission</span>
                <span className="mission-quote">
                  &ldquo;Empower every student to Learn Better, Think Smarter &amp; Achieve More.&rdquo;
                </span>
              </div>
              <div className="mission-action-btn">
                <a className="button-orange-primary" href="/#book-demo">
                  Experience a Class →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 4. MEET YOUR TEACHER (FOUNDER BIO) */}
        <section className="about-founder-section" id="founder" aria-labelledby="founder-title">
          <div className="about-section-container">
            <div className="about-founder-grid">
              <div className="about-founder-card">
                <div className="founder-portrait-frame">
                  <Image
                    src="/images/editorial/Confident Mathematics Teacher Portrait.png"
                    alt="Portrait of Dr. Sweta Agrawal in classroom environment"
                    fill
                    sizes="(max-width: 900px) 100vw, 420px"
                    className="editorial-photo"
                  />
                  <div className="washi-tape-detail" aria-hidden="true">
                    Faculty Lead
                  </div>
                </div>

                <div className="founder-card-caption">
                  <span className="caption-handwriting">
                    &ldquo;Try it your way first, then we&apos;ll compare.&rdquo;
                  </span>
                  <strong className="founder-name">Dr. Sweta Agrawal</strong>
                  <span className="founder-credentials">
                    Ph.D. in Mathematics · Assistant Professor of Mathematics · Founder &amp; Lead Mentor
                  </span>
                </div>

                {/* Clean Facts Strip (No emojis as instructed) */}
                <div className="founder-facts-strip">
                  <span className="fact-pill">
                    <span className="fact-dot" aria-hidden="true" />
                    Ph.D., Mathematics
                  </span>
                  <span className="fact-pill">
                    <span className="fact-dot" aria-hidden="true" />
                    Assistant Professor
                  </span>
                  <span className="fact-pill">
                    <span className="fact-dot" aria-hidden="true" />
                    Research: Statistics &amp; Reliability
                  </span>
                  <span className="fact-pill">
                    <span className="fact-dot" aria-hidden="true" />
                    International Collaborations
                  </span>
                  <span className="fact-pill">
                    <span className="fact-dot" aria-hidden="true" />
                    Teaches at SmartNum, Indirapuram
                  </span>
                </div>
              </div>

              <div className="about-founder-bio">
                <span className="section-subkicker">Academic Mentorship</span>
                <h2 id="founder-title" className="about-section-h2">
                  Maths taught by someone who still finds it exciting
                </h2>

                <div className="bio-paragraphs">
                  <p>
                    I&apos;m Sweta, and I teach mathematics because I&apos;ve never managed to stop being curious about it.
                  </p>
                  <p>
                    I have a Ph.D. in Mathematics and I work as an Assistant Professor. My research sits where statistics meets reliability: how do you judge whether something will keep working, and how sure can you really be about that? It sounds far from a Class 12 classroom, but it trains the same habit I try to pass on to every student. Ask what is actually being claimed. Then check it properly.
                  </p>
                  <p>
                    Research taught me patience. Hard problems rarely give in the first time, and that&apos;s normal, not a sign that you&apos;re bad at maths. Teaching taught me the other half. A good explanation starts from where the student is confused, not from where the textbook happens to begin.
                  </p>
                  <p>
                    Along the way I&apos;ve worked with mathematicians from different countries and backgrounds. What stayed with me is how differently people think about the same problem, and how often the &ldquo;wrong&rdquo; first attempt turns into the best explanation. I bring that into my classes. Try it your way first, then we&apos;ll compare.
                  </p>
                  <p>
                    I also care about the person behind the marks. I mentor students on how to study, not just what to study, because a calm mind solves more problems than a stressed one.
                  </p>
                  <p className="bio-closing">
                    I&apos;m grateful to the teachers, colleagues and students who shaped this path. Now I&apos;m happy to help you find your own way through maths.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. HOW WE TEACH */}
        <section className="about-how-section" id="how-we-teach" aria-labelledby="how-teach-title">
          <div className="about-section-container">
            <div className="about-centered-header">
              <span className="section-subkicker">Pedagogy</span>
              <h2 id="how-teach-title" className="about-section-h2">
                Small room, clear explanations, no rush
              </h2>
              <p className="about-header-desc">
                Everything at SmartNum is designed around giving students the time, space, and individual support to master core principles.
              </p>
            </div>

            <div className="about-how-grid">
              <div className="how-card">
                <span className="how-num">01</span>
                <h3>Small batches (10–20 students)</h3>
                <p>Enough students for good discussion, few enough that nobody hides at the back. Current batch size: 10–20 students.</p>
              </div>

              <div className="how-card">
                <span className="how-num">02</span>
                <h3>Class time for understanding</h3>
                <p>We explain the idea first, then practise it until it holds.</p>
              </div>

              <div className="how-card">
                <span className="how-num">03</span>
                <h3>Recorded lessons for revision</h3>
                <p>Missed a point? Watch it again at your own pace, after class.</p>
              </div>

              <div className="how-card">
                <span className="how-num">04</span>
                <h3>One-to-one doubt sessions</h3>
                <p>Sit with a teacher and fix the exact step that&apos;s stuck.</p>
              </div>

              <div className="how-card">
                <span className="how-num">05</span>
                <h3>Regular tests</h3>
                <p>Short, frequent tests that show what to work on next.</p>
              </div>

              <div className="how-card">
                <span className="how-num">06</span>
                <h3>Study material we choose with care</h3>
                <p>Notes and practice sets picked for the syllabus, not just printed in bulk.</p>
              </div>

              <div className="how-card how-card-featured">
                <span className="how-num">07</span>
                <h3>Progress reports for parents</h3>
                <p>A clear, honest picture of how the student is doing, shared regularly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. OUR SPACE IN INDIRAPURAM */}
        <section className="about-space-section" id="our-space" aria-labelledby="space-title">
          <div className="about-section-container">
            <div className="about-space-layout">
              <div className="about-space-text">
                <span className="section-subkicker">Campus &amp; Facilities</span>
                <h2 id="space-title" className="about-section-h2">
                  A calm, safe place to think
                </h2>
                <p className="about-prose-p">
                  The centre has air-conditioned smart classrooms and CCTV monitoring across the campus, so parents can feel at ease and students can concentrate.
                </p>

                <div className="space-address-box">
                  <strong>SmartNum Learning Centre</strong>
                  <p>04224, ATS Advantage, Ahinsa Khand 1, Indirapuram, Ghaziabad, UP 201014</p>
                  <span className="space-meta">Air-conditioned smart classrooms · 24/7 CCTV safety · Landmark visitor parking</span>
                </div>

                <div className="space-actions">
                  <a
                    className="button-orange-primary"
                    href={content.contact.mapsUrl || "https://share.google/8gHRuZQQxRuYAkqVd"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get directions <span className="btn-arrow" aria-hidden="true">↗</span>
                  </a>
                  <a className="button-soft-outline" href="/#book-demo">
                    Schedule a campus visit
                  </a>
                </div>
              </div>

              <div className="about-space-gallery">
                <div className="space-gallery-main">
                  <Image
                    src="/images/editorial/class2.webp"
                    alt="Smart classroom interior at SmartNum Indirapuram"
                    fill
                    sizes="(max-width: 900px) 100vw, 420px"
                    className="editorial-photo"
                  />
                  <span className="gallery-tag">Smart Classroom</span>
                </div>
                <div className="space-gallery-sub">
                  <div className="space-sub-item">
                    <Image
                      src="/images/why-smartnum-tutor.jpg"
                      alt="1-on-1 doubt clearing desk at SmartNum"
                      fill
                      sizes="(max-width: 900px) 50vw, 200px"
                      className="editorial-photo"
                    />
                    <span className="gallery-tag">Doubt Desk</span>
                  </div>
                  <div className="space-sub-item">
                    <Image
                      src="/images/editorial/class1.webp"
                      alt="Students collaborative learning zone"
                      fill
                      sizes="(max-width: 900px) 50vw, 200px"
                      className="editorial-photo"
                    />
                    <span className="gallery-tag">Focused Environment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. WHO WE TEACH & WHAT WE PROMISE */}
        <section className="about-scope-section" aria-labelledby="scope-title">
          <div className="about-section-container">
            <div className="scope-split-card">
              <div className="scope-col">
                <h2 id="scope-title" className="scope-h2">Who we teach</h2>
                <ul className="scope-list">
                  <li><strong>Classes 10–12 &amp; Class 9:</strong> Targeted coaching for CBSE, ICSE / ISC, and State Boards</li>
                  <li><strong>Board Exams:</strong> Thorough concept-building, step-by-step problem practice, and test series</li>
                  <li><strong>IIT-JEE Main &amp; Advanced:</strong> Concept-first teaching, rigorous problem practice, and mock reviews</li>
                  <li><strong>NEET:</strong> Analytical fundamentals in physics, chemistry, and mathematical foundations</li>
                  <li><strong>Foundation &amp; Olympiads:</strong> IOQM, PRMO, and school Olympiad problem-solving</li>
                </ul>
              </div>

              <div className="promise-col">
                <span className="section-subkicker promise-kicker">Ethical Commitment</span>
                <h3 className="promise-h3">What we promise, and what we don&apos;t</h3>
                <p className="promise-text">
                  We promise honest teaching, small batches, and clear feedback. We don&apos;t promise marks or ranks, because nobody honestly can. We only publish feedback that parents have agreed to share.
                </p>
                <div className="promise-badge">
                  <span className="badge-shield" aria-hidden="true">🛡️</span>
                  <span>Zero inflated marketing claims · 100% verified student feedback</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ SECTION (14 QUESTIONS) */}
        <section className="about-faq-section" id="faq" aria-labelledby="about-faq-title">
          <div className="about-section-container">
            <div className="about-centered-header">
              <span className="section-subkicker">Frequently Asked Questions</span>
              <h2 id="about-faq-title" className="about-section-h2">
                Frequently asked questions
              </h2>
              <p className="about-header-desc">
                Everything you need to know about SmartNum coaching, faculty, demo sessions, and location.
              </p>
            </div>

            <div className="about-faq-wrapper">
              <AboutFAQAccordion items={aboutFAQs} />
            </div>
          </div>
        </section>

        {/* 9. FINAL CALL TO ACTION */}
        <section className="about-final-cta" aria-labelledby="final-cta-title">
          <div className="about-section-container">
            <div className="final-cta-box">
              <h2 id="final-cta-title" className="final-cta-h2">
                Come and sit in a class first
              </h2>
              <p className="final-cta-desc">
                The best way to decide is to see it. Book a free demo session, meet the teacher, and ask anything you like.
              </p>
              <div className="final-cta-actions">
                <a className="button-orange-primary" href="/#book-demo">
                  Book a free demo <span className="btn-arrow" aria-hidden="true">→</span>
                </a>
                <a className="button-call-outline" href={`tel:${contactPhone.replace(/\s+/g, "")}`}>
                  Call us: {contactPhone}
                </a>
              </div>
              <p className="final-cta-note">
                ✓ No payment needed. Just visit and see how we teach.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        phone={contactPhone}
        email={contactEmail}
        whatsappNumber={whatsappNumber}
        contact={content.contact}
      />
      <MobileFloatingActions phone={contactPhone} whatsappNumber={whatsappNumber} />
    </div>
  );
}
