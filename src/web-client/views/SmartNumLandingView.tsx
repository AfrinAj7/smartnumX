import Image from "next/image";
import { CourseExplorer } from "@/web-client/components/catalog/CourseExplorer";
import { DemoLeadForm } from "@/web-client/components/forms/DemoLeadForm";
import { HeroCarousel } from "@/web-client/components/marketing/HeroCarousel";
import { DemoVideoGallery } from "@/web-client/components/marketing/DemoVideoGallery";
import { WhySmartNumTabs } from "@/web-client/components/marketing/WhySmartNumTabs";
import { VisitUsSection } from "@/web-client/components/marketing/VisitUsSection";
import { AboutSmartNumSection } from "@/web-client/components/marketing/AboutSmartNumSection";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { TestimonialsCarousel } from "@/web-client/components/marketing/TestimonialsCarousel";
import { FacultyCarousel } from "@/web-client/components/marketing/FacultyCarousel";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";
import { ScrollRevealProvider } from "@/web-client/components/animation/ScrollRevealProvider";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHomepageContent } from "@/server/site-content/homepage";

const learningSteps = [
  { number: "01", title: "Choose a programme", text: "Select your class (9–12th), board (Any Board), or competitive goal (JEE Mains, Advanced, Olympiads)." },
  { number: "02", title: "Learn the concept", text: "Work through explanations and visual aids in smart classrooms or recorded self-paced paths." },
  { number: "03", title: "Practise with purpose", text: "Solve curated worksheets, practice question sets, and attend 1-on-1 doubt clearing sessions." },
  { number: "04", title: "Track your progress", text: "Receive personalized monthly progress report cards and review next steps with parents & tutors." },
];

export async function SmartNumLandingView() {
  const [content, session] = await Promise.all([
    getHomepageContent(db),
    auth(),
  ]);
  const questions = content.faqs.filter((faq) => faq.published);
  const contactPhone = content.contact.phone || process.env.NEXT_PUBLIC_SITE_PHONE || "+91 99589 47774";
  const whatsappNumber = content.contact.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+91 99589 47774";

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  const navUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null;

  return (
    <div className="site-home">
      <SiteHeader phone={contactPhone} whatsappNumber={whatsappNumber} user={navUser} />
      <ScrollRevealProvider>
        <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c") }} />

        {/* Hero Carousel */}
        <HeroCarousel slides={content.heroSlides} />

        {/* Trust Strip / Metrics Counters */}
        <section className="trust-strip" aria-label="SmartNum statistics and reach">
          {content.metrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </section>

        {/* How It Works Steps */}
        <section className="steps-section section-wrap" id="how-it-works" aria-labelledby="steps-title">
          <div className="steps-header-row">
            <div className="section-heading">
              <span className="section-kicker">A clear place to start</span>
              <h2 id="steps-title">Shaping analytical minds, one step at a time.</h2>
              <p>Make room for questions, worked examples and practice that helps a learner see the thinking behind a solution.</p>
            </div>
            <div className="steps-character-wrap">
              <Image
                src="/images/smartnum images.gif"
                alt="SmartNum Student Character"
                width={360}
                height={280}
                className="steps-character-image"
                unoptimized
              />
            </div>
          </div>
          <div className="steps-grid">
            {learningSteps.map((step) => (
              <article className="step-item" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Why SmartNum Tabs / Accordion */}
        <section className="features-section why-dark-section" id="why-smartnum" aria-labelledby="why-title">
          <div className="section-wrap why-section-inner">
            <div className="why-sidebar-tag" aria-hidden="true">
              <span className="why-vertical-title">WHY SMARTNUM?</span>
            </div>

            <div className="why-main-content">
              <div className="why-header-area">
                <div className="why-eyebrow-wrap">
                  <span className="why-gold-dash" aria-hidden="true" />
                  <span className="why-eyebrow-text">ACADEMIC EXCELLENCE</span>
                </div>
                <h2 id="why-title" className="why-headline">
                  Make the method clear, <span className="why-gold-highlight">then practise it.</span>
                </h2>
                <p className="why-subheadline">
                  Visual worked examples, dedicated faculty guidance, and structured problem breakdown so students understand why formulas work.
                </p>
              </div>

              <WhySmartNumTabs />
            </div>
          </div>
        </section>

        {/* Course Explorer / Academic Programmes */}
        <section className="explore-section" id="course-explorer" aria-labelledby="explore-title">
          <div className="section-wrap explore-container">
            <div className="explore-header-center">
              <div className="explore-kicker-wrap">
                <span className="explore-kicker-dash" aria-hidden="true" />
                <span className="explore-kicker-text">ACADEMIC PROGRAMMES</span>
              </div>
              <h2 id="explore-title" className="explore-headline">
                Find your next step in mathematics
              </h2>
              <p className="explore-subheadline">
                Programmes for Classes 9 to 12, any board, from first principles to JEE and Olympiad problems.
              </p>
            </div>
            <CourseExplorer />
          </div>
        </section>

        {/* Programme Cards / SmartNum Offerings */}
        <section className="programmes-strip" aria-labelledby="programmes-title">
          <div className="section-wrap">
            <div className="section-heading offerings-heading-row">
              <div className="offerings-heading-copy">
                <span className="section-kicker">— SMARTNUM OFFERINGS</span>
                <h2 id="programmes-title" className="offerings-headline">
                  Choose a path that matches <span className="highlight-blue">your goal.</span>
                </h2>
              </div>
            </div>

            <div className="programme-card-grid">
              {content.programs.filter((program) => program.enabled).map((program, index) => (
                <article className={`programme-card-hero card-theme-${index % 6}`} key={program.title}>
                  {program.imageUrl && (
                    <Image
                      className="programme-card-bg-img"
                      src={program.imageUrl}
                      alt={program.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized
                    />
                  )}

                  <div className="card-top-row">
                    <span className="programme-pill-badge">{program.badge || "PROGRAMME"}</span>
                  </div>

                  <div className="card-body-content">
                    <h3>{program.title}</h3>
                    <p>{program.description}</p>
                  </div>

                  <div className="card-bottom-row">
                    <a className="button-explore-pill" href="#book-demo">
                      Explore Programme <span className="btn-arrow-icon" aria-hidden="true">➔</span>
                    </a>
                    {program.offerBadge && (
                      <span className="offer-badge-float">
                        <span className="offer-gift-icon" aria-hidden="true">🎁</span>
                        {program.offerBadge}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Curricula Cards */}
        <section className="curriculum-section section-wrap" aria-labelledby="curriculum-title">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-kicker">Curricula</span>
              <h2 id="curriculum-title">Board-specific support, clearly explained.</h2>
            </div>
            <p>Targeted syllabus alignment for Any Board including CBSE, ICSE / ISC, State Boards, and IGCSE / IB.</p>
          </div>
          <div className="curriculum-card-grid">
            {content.curricula.filter((curriculum) => curriculum.enabled).map((curriculum) => (
              <article className="curriculum-card" key={curriculum.title}>
                {curriculum.imageUrl ? (
                  <div className="curriculum-image">
                    <Image src={curriculum.imageUrl} alt={curriculum.altText || `${curriculum.title} curriculum`} fill sizes="(max-width: 700px) 90vw, 25vw" unoptimized />
                  </div>
                ) : (
                  <div className="curriculum-image curriculum-image-empty">
                    <span>{curriculum.title}</span>
                  </div>
                )}
                <div className="curriculum-card-body">
                  {curriculum.badge && <span className="curriculum-badge">{curriculum.badge}</span>}
                  <h3>{curriculum.title}</h3>
                  <p>{curriculum.summary}</p>
                  <ul>
                    {curriculum.strengths.map((strength) => <li key={strength}>{strength}</li>)}
                  </ul>
                  <a className="text-link" href="#book-demo">Know more <span aria-hidden="true">↗</span></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Demo Video Gallery (YouTube Facade Lightbox) */}
        <section className="demo-classes-section" id="demo-classes" aria-labelledby="demo-classes-title">
          <div className="section-wrap demo-classes-container">
            <div className="demo-header-center">
              <div className="demo-kicker-wrap">
                <span className="demo-kicker-dash" aria-hidden="true" />
                <span className="demo-kicker-text">SEE A CLASS BEFORE YOU JOIN</span>
              </div>
              <h2 id="demo-classes-title" className="demo-headline">
                A first look at how SmartNum teaches.
              </h2>
              <p className="demo-subheadline">
                Video previews are loaded only after you choose to play them.
              </p>
            </div>

            <DemoVideoGallery videos={content.demoVideos.filter((video) => video.published)} />
          </div>
        </section>

        {/* Demo Lead Form Band */}
        <section className="demo-section" id="book-demo" aria-labelledby="demo-title">
          <div className="section-wrap demo-layout">
            <div className="demo-copy">
              <span className="section-kicker">Free Demo Class · Indirapuram</span>
              <h2 id="demo-title">Give your child a focused start.</h2>
              <p>Book a free 1-on-1 demo session for Classes 9–12th, Foundational Courses, IIT-JEE Mains, Advanced, or Olympiads. Experience our smart classrooms and teaching methods.</p>
              <div className="demo-contact-note">
                <span className="contact-spark">✳</span>
                <span>
                  <strong>No pressure to enrol.</strong>
                  <small>First see whether our teaching approach fits the learner.</small>
                </span>
              </div>
            </div>
            <div className="demo-form-panel">
              <DemoLeadForm />
            </div>
          </div>
        </section>

        {/* 5.1 About SmartNum */}
        <AboutSmartNumSection />

        {/* Testimonials Carousel */}
        <section className="proof-section" id="results" aria-labelledby="proof-title">
          <div className="section-wrap">
            <div className="section-heading section-heading-row">
              <div>
                <span className="section-kicker">Progress, honestly told</span>
                <h2 id="proof-title">Every result belongs to the learner behind it.</h2>
              </div>
              <p>We publish only verified feedback shared with permission. Nothing here promises a score or rank.</p>
            </div>
            <TestimonialsCarousel testimonials={content.testimonials} />
          </div>
        </section>

        {/* Faculty & Tutors Carousel with Dynamic Accordions */}
        <section className="teachers-section section-wrap" id="teachers" aria-labelledby="teachers-title">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-kicker">Expert tutors</span>
              <h2 id="teachers-title">Meet the educators behind the explanations.</h2>
            </div>
            <p>Experienced subject specialists for Classes 9–12th, Foundational Courses, IIT-JEE Mains &amp; Advanced, and Olympiads.</p>
          </div>
          <FacultyCarousel
            faculty={content.faculty}
            videos={content.demoVideos}
          />
        </section>

        {/* FAQ Accordion */}
        <section className="faq-section section-wrap" id="faq" aria-labelledby="faq-title">
          <div className="section-heading">
            <span className="section-kicker">Questions are welcome</span>
            <h2 id="faq-title">Frequently asked questions.</h2>
          </div>
          <div className="faq-list">
            {questions.map(({ question, answer }) => (
              <details className="faq-item" key={question}>
                <summary>{question}<span aria-hidden="true">+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Visit Us Location Section */}
        <VisitUsSection contact={content.contact} />

        {/* Final CTA Band */}
        <section className="final-cta-section" aria-labelledby="final-cta-title">
          <div className="section-wrap final-cta-inner">
            <div>
              <span className="section-kicker">Take one small step</span>
              <h2 id="final-cta-title">Ready to experience SmartNum?</h2>
              <p>Book a free demo class at our Indirapuram campus and see our smart classrooms in action.</p>
            </div>
            <a className="button button-demo" href="#book-demo">
              Schedule Free Demo Class <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>
    </ScrollRevealProvider>

      {/* Footer */}
      <SiteFooter contact={content.contact} />

      {/* Floating Action Dial (Mobile & Desktop) */}
      <MobileFloatingActions phone={contactPhone} whatsappNumber={whatsappNumber} />
    </div>
  );
}