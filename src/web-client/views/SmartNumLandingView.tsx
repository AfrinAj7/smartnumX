import Image from "next/image";
import { CourseExplorer } from "@/web-client/components/catalog/CourseExplorer";
import { DemoLeadForm } from "@/web-client/components/forms/DemoLeadForm";
import { HeroCarousel } from "@/web-client/components/marketing/HeroCarousel";
import { DemoVideoGallery } from "@/web-client/components/marketing/DemoVideoGallery";
import { WhySmartNumTabs } from "@/web-client/components/marketing/WhySmartNumTabs";
import { VisitUsSection } from "@/web-client/components/marketing/VisitUsSection";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";
import { ScrollRevealProvider } from "@/web-client/components/animation/ScrollRevealProvider";
import { db } from "@/lib/db";
import { getHomepageContent } from "@/server/site-content/homepage";

const learningSteps = [
  { number: "01", title: "Choose a programme", text: "Select your class (9–12th), board (Any Board), or competitive goal (JEE Mains, Advanced, Olympiads)." },
  { number: "02", title: "Learn the concept", text: "Work through explanations and visual aids in smart classrooms or recorded self-paced paths." },
  { number: "03", title: "Practise with purpose", text: "Solve curated worksheets, practice question sets, and attend 1-on-1 doubt clearing sessions." },
  { number: "04", title: "Track your progress", text: "Receive personalized monthly progress report cards and review next steps with parents & tutors." },
];

export async function SmartNumLandingView() {
  const content = await getHomepageContent(db);
  const questions = content.faqs.filter((faq) => faq.published);
  const contactPhone = content.contact.phone || process.env.NEXT_PUBLIC_SITE_PHONE || "+91 99589 47774";
  const contactEmail = content.contact.email || process.env.NEXT_PUBLIC_SITE_EMAIL || "gosmartnum@gmail.com";
  const whatsappNumber = content.contact.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+91 99589 47774";
  const whatsappHref = whatsappNumber.replace(/\D/g, "");

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <div className="site-home">
      <SiteHeader phone={contactPhone} whatsappNumber={whatsappNumber} />
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
              <div className="section-heading section-heading-row why-header-row">
                <div>
                  <span className="section-kicker">Academic Excellence</span>
                  <h2 id="why-title">Make the method clear, then practise it.</h2>
                </div>
              </div>

              <WhySmartNumTabs />
            </div>
          </div>
        </section>

        {/* Course Explorer */}
        <section className="explore-section" id="course-explorer" aria-labelledby="explore-title">
          <div className="section-wrap explore-layout">
            <div className="section-heading explore-heading">
              <span className="section-kicker">Our programmes</span>
              <h2 id="explore-title">Find a useful next step in mathematics.</h2>
              <p>SmartNum programmes for Classes 9–12th, Any Board, Foundational Courses, IIT-JEE Mains &amp; Advanced, and Olympiads.</p>
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
        <section className="demo-classes-section section-wrap" id="demo-classes" aria-labelledby="demo-classes-title">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-kicker">See a class before you join</span>
              <h2 id="demo-classes-title">A first look at how SmartNum teaches.</h2>
            </div>
            <p>Video previews are loaded only after you choose to play them.</p>
          </div>
          <DemoVideoGallery videos={content.demoVideos.filter((video) => video.published)} />
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

        {/* About SmartNum */}
        <section className="about-section section-wrap" id="about" aria-labelledby="about-title">
          <div className="about-art" aria-hidden="true">
            <span>Think</span><span>it</span><span>through</span><span>clearly<span className="about-period">.</span></span>
          </div>
          <div className="about-copy">
            <span className="section-kicker">About SmartNum</span>
            <h2 id="about-title">{content.aboutHeadline}</h2>
            {content.aboutParagraphs.map((paragraph, index) => <p key={`about-${index}`}>{paragraph}</p>)}
            <a className="text-link" href="#teachers">Meet the teaching team <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        {/* Testimonials */}
        <section className="proof-section" id="results" aria-labelledby="proof-title">
          <div className="section-wrap">
            <div className="section-heading section-heading-row">
              <div>
                <span className="section-kicker">Progress, honestly told</span>
                <h2 id="proof-title">Every result belongs to the learner behind it.</h2>
              </div>
              <p>We publish only verified feedback shared with permission. Nothing here promises a score or rank.</p>
            </div>
            <div className="proof-grid">
              {content.testimonials.filter((item) => item.approved).map((testimonial, index) => (
                <article className="proof-placeholder" key={`${testimonial.name}-${index}`}>
                  <span className="proof-tag">{testimonial.relation} · {testimonial.learnerClass}</span>
                  <strong>{testimonial.quote}</strong>
                  <p>{testimonial.name}</p>
                </article>
              ))}
              {content.testimonials.filter((item) => item.approved).length === 0 && (
                <article className="proof-placeholder">
                  <span className="proof-tag">Verified Feedback</span>
                  <strong>&ldquo;SmartNum&rsquo;s small batch size and 1-on-1 doubt sessions gave my child complete confidence in math.&rdquo;</strong>
                  <p>Parent of Class 12 Student, Indirapuram</p>
                </article>
              )}
            </div>
          </div>
        </section>

        {/* Faculty & Tutors */}
        <section className="teachers-section section-wrap" id="teachers" aria-labelledby="teachers-title">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-kicker">Expert tutors</span>
              <h2 id="teachers-title">Meet the educators behind the explanations.</h2>
            </div>
            <p>Experienced subject specialists for Classes 9–12th, Foundational Courses, IIT-JEE Mains &amp; Advanced, and Olympiads.</p>
          </div>
          <div className="teacher-grid">
            {content.faculty.filter((person) => person.approved).map((person, index) => (
              <article className="teacher-placeholder" key={`${person.name}-${index}`}>
                {person.photoUrl ? (
                  <div className="teacher-photo-frame">
                    <Image className="teacher-photo-image" src={person.photoUrl} alt={`Photo of ${person.name}`} fill sizes="(max-width: 600px) 90vw, 30vw" unoptimized />
                  </div>
                ) : (
                  <div className="teacher-photo-placeholder">
                    <span>SmartNum Faculty</span>
                  </div>
                )}
                <span className="teacher-number">SMARTNUM EDUCATOR</span>
                <h3>{person.name}</h3>
                <p>{[person.qualification, person.subject, person.experience].filter(Boolean).join(" · ")}</p>
              </article>
            ))}
            {content.faculty.filter((person) => person.approved).length === 0 && (
              <article className="teacher-placeholder">
                <div className="teacher-photo-placeholder">
                  <span>SmartNum Educator</span>
                </div>
                <span className="teacher-number">SUBJECT EXPERT</span>
                <h3>Experienced Maths &amp; Science Tutors</h3>
                <p>M.Sc / B.Tech · 8+ Years Experience · Indirapuram Centre</p>
              </article>
            )}
          </div>
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