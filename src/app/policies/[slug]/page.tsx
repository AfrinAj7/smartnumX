import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHomepageContent } from "@/server/site-content/homepage";
import { SiteFooter } from "@/web-client/components/layout/SiteFooter";
import { SiteHeader } from "@/web-client/components/layout/SiteHeader";
import { MobileFloatingActions } from "@/web-client/components/marketing/MobileFloatingActions";

export const dynamic = "force-dynamic";

const validSlugs = ["terms", "privacy", "refund", "child-safety"] as const;
type PolicySlug = typeof validSlugs[number];

const policyMeta: Record<PolicySlug, { title: string; metaTitle: string; description: string; badge: string }> = {
  terms: {
    title: "Terms & Conditions",
    metaTitle: "Terms & Conditions | SmartNum Coaching, Indirapuram",
    description: "The terms for joining SmartNum classes, using our recorded lessons and website, and paying fees. Read them before you enrol.",
    badge: "Enrolment & Service Terms",
  },
  privacy: {
    title: "Privacy Policy",
    metaTitle: "Privacy Policy | SmartNum Coaching, Indirapuram",
    description: "How SmartNum collects, uses and protects the personal data of students and parents, including children's data, in line with Indian law.",
    badge: "DPDP Act 2023 & Child Data Protection",
  },
  refund: {
    title: "Refund & Cancellation Policy",
    metaTitle: "Refund & Cancellation Policy | SmartNum",
    description: "When SmartNum fees are refundable, how to request a refund, and how long it takes. Clear rules, fair process.",
    badge: "Fair Refund & Cancellation Guidelines",
  },
  "child-safety": {
    title: "Child Safety Policy",
    metaTitle: "Child Safety Policy | SmartNum Coaching, Indirapuram",
    description: "How SmartNum keeps students safe: CCTV, staff conduct, one-to-one session rules, online safety, and how to raise a concern.",
    badge: "POCSO Compliance & Campus Security",
  },
};

export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = policyMeta[slug as PolicySlug];
  if (!meta) return { title: "Policy Not Found | SmartNum" };

  return {
    title: meta.metaTitle,
    description: meta.description,
    openGraph: {
      title: meta.metaTitle,
      description: meta.description,
      type: "article",
    },
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!validSlugs.includes(slug as PolicySlug)) {
    notFound();
  }

  const currentSlug = slug as PolicySlug;
  const currentMeta = policyMeta[currentSlug];

  const [content, session] = await Promise.all([
    getHomepageContent(db),
    auth(),
  ]);

  const policy = content.policySettings;
  const contact = content.contact;

  const legalEntityName = policy?.legalEntityName || "SmartNum Learning Space";
  const gstin = policy?.gstin || "";
  const lastUpdated = policy?.lastUpdated || "October 2026";
  const classesAndExams = policy?.classesAndExams || "Classes 9–12 for Board exams, NEET, IIT-JEE and Olympiads";
  const admissionFee = policy?.admissionFee || "₹1,000";
  const coolingOffDays = policy?.coolingOffDays || "3";
  const maxRecordedLessonsPercent = policy?.maxRecordedLessonsPercent || "10";
  const withdrawalWindowDays = policy?.withdrawalWindowDays || "30";
  const overdueGraceDays = policy?.overdueGraceDays || "7";
  const cctvRetentionDays = policy?.cctvRetentionDays || "30";
  const grievanceOfficerName = policy?.grievanceOfficerName || "Shweta Agarwal";
  const grievanceOfficerRole = policy?.grievanceOfficerRole || "Academic Director & Grievance Redressal Officer";
  const childSafetyOfficerName = policy?.childSafetyOfficerName || "Shweta Agarwal";
  const childSafetyOfficerRole = policy?.childSafetyOfficerRole || "Founder, Lead Educator & Child Safety Officer";
  const jurisdictionCity = policy?.jurisdictionCity || "Ghaziabad, Uttar Pradesh";
  const proctoredTestsConsent = policy?.proctoredTestsConsent ?? false;

  const address = contact?.address || "04224, ATS Advantage, Indirapuram, Ghaziabad, UP – 201014";
  const phone = contact?.phone || "+91 99589 47774";
  const secondaryPhone = contact?.secondaryPhone || "+91 88004 05640";
  const email = contact?.email || "gosmartnum@gmail.com";
  const whatsapp = contact?.whatsapp || "+91 99589 47774";

  const entityString = gstin ? `${legalEntityName} (GSTIN: ${gstin})` : legalEntityName;

  return (
    <div className="policy-page-wrapper">
      <SiteHeader
        phone={phone}
        whatsappNumber={whatsapp}
        user={session?.user}
      />

      <main className="policy-main-container">
        {/* Policy Top Header */}
        <header className="policy-hero-header">
          <div className="policy-container">
            <div className="policy-breadcrumbs">
              <Link href="/">Home</Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Policies</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-active">{currentMeta.title}</span>
            </div>

            <div className="policy-badge-wrap">
              <span className="policy-tag-badge">{currentMeta.badge}</span>
              <span className="policy-date-pill">Last updated: {lastUpdated}</span>
            </div>

            <h1 className="policy-page-title">{currentMeta.title}</h1>
            <p className="policy-page-desc">{currentMeta.description}</p>

            {/* Policy Navigation Bar */}
            <nav className="policy-nav-tabs" aria-label="Legal policies navigation">
              <Link
                href="/policies/terms"
                className={`policy-nav-tab ${currentSlug === "terms" ? "is-active" : ""}`}
              >
                Terms & Conditions
              </Link>
              <Link
                href="/policies/privacy"
                className={`policy-nav-tab ${currentSlug === "privacy" ? "is-active" : ""}`}
              >
                Privacy Policy
              </Link>
              <Link
                href="/policies/refund"
                className={`policy-nav-tab ${currentSlug === "refund" ? "is-active" : ""}`}
              >
                Refund & Cancellation
              </Link>
              <Link
                href="/policies/child-safety"
                className={`policy-nav-tab ${currentSlug === "child-safety" ? "is-active" : ""}`}
              >
                Child Safety Policy
              </Link>
            </nav>
          </div>
        </header>

        {/* Policy Body Content Grid */}
        <section className="policy-body-section">
          <div className="policy-container policy-layout-grid">
            {/* Main Policy Document Article */}
            <article className="policy-document-article">
              {currentSlug === "terms" && (
                <div className="policy-prose">
                  <div className="policy-intro-card">
                    <p>
                      These terms explain how SmartNum works and what we expect from each other. By enrolling, paying a fee, or using our website and learning materials, you agree to them. If you are a student under 18, your parent or guardian must agree on your behalf. If anything is unclear, please call or write to us before you enrol.
                    </p>
                  </div>

                  <section className="policy-section">
                    <h2>1. Who we are</h2>
                    <p>
                      SmartNum is a premier coaching centre situated at <strong>{address}</strong>, run by <strong>{entityString}</strong>. In these terms, &ldquo;SmartNum&rdquo;, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean the centre; &ldquo;you&rdquo; means the student and, for any student under the age of 18, their parent or legal guardian.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>2. What we offer</h2>
                    <ul>
                      <li>Classroom coaching for <strong>{classesAndExams}</strong>.</li>
                      <li>Small, focused batches, regular chapter tests, and structured progress reports shared with parents.</li>
                      <li>Self-paced recorded lessons, comprehensive revision notes, and graded practice worksheets.</li>
                      <li>Dedicated one-to-one doubt-clearing sessions with experienced faculty.</li>
                      <li>A free initial demo session before deciding to join.</li>
                    </ul>
                    <p>
                      The exact programme, batch allocation, class schedule, and tuition fee are confirmed in writing via official receipt, WhatsApp confirmation, or enrolment form upon admission.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>3. Who can enrol</h2>
                    <p>
                      Anyone is welcome to attend a free demo class. To confirm enrolment, a student under 18 requires a parent or guardian to complete registration, provide verifiable consent, and make the payment. You must provide truthful, complete, and accurate information.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>4. Admission, batches and schedule</h2>
                    <ul>
                      <li>A student seat is confirmed only after completion of the admission form and receipt of the initial fee payment.</li>
                      <li>We reserve the right to reschedule batch timings, instructors, or classrooms when necessary (such as teacher unavailability, public holidays, or small batch realignments) and will communicate updates in advance whenever possible.</li>
                      <li>If a batch does not achieve workable strength or is cancelled by us, we provide a full refund or an immediate batch transfer as outlined in our Refund Policy.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>5. Fees and payments</h2>
                    <ul>
                      <li>Tuition fees are displayed transparently prior to enrolment and may be paid in full or in agreed instalments upon admission.</li>
                      <li>Online payments are processed securely by our certified payment partner (Cashfree Payments). SmartNum does not store or process your credit card, debit card, UPI PIN, or bank credentials.</li>
                      <li>Fees include or exclude GST as applicable. A formal payment receipt is generated for every completed transaction.</li>
                      <li>
                        If an instalment is overdue by more than <strong>{overdueGraceDays} days</strong>, SmartNum reserves the right to pause classroom attendance, testing access, recorded video streaming, or score reports until dues are settled.
                      </li>
                      <li>All fees paid are strictly subject to our Refund Policy.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>6. Attendance and learning</h2>
                    <ul>
                      <li>Regular classroom attendance is critical for academic consistency. We record attendance for every session and share attendance summaries with parents.</li>
                      <li>Missed classes are not repeated live, but recorded lectures and revision support may be provided for enrolled batches.</li>
                      <li>Diagnostic tests, weekly assessments, and mock examinations are mandatory components of our pedagogy. Results identify areas of improvement and do not constitute a legal promise of future exam performance.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>7. Our recorded lessons, notes and materials</h2>
                    <p>
                      All video lectures, notes, problem sets, sample papers, worksheets, and tests remain the exclusive intellectual property of SmartNum or are used with licensed authorization. Enrolled students receive a <strong>personal, revocable, non-transferable licence</strong> for private educational use while enrolment is active. You must strictly avoid:
                    </p>
                    <ul>
                      <li>recording, screen-capturing, downloading, duplicating, sharing, selling, or uploading materials anywhere (including WhatsApp groups, Telegram channels, YouTube, or social media);</li>
                      <li>sharing student account login credentials, passwords, or direct video streaming URLs with external individuals;</li>
                      <li>removing, obscuring, or tampering with watermarks, copyright notices, or security identifiers.</li>
                    </ul>
                    <p>
                      Any detected infringement or unauthorized distribution results in immediate termination of access without refund, alongside potential legal proceedings under Indian copyright law.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>8. Student conduct</h2>
                    <p>
                      We foster an atmosphere of safety, academic focus, and mutual respect. Students are expected to:
                    </p>
                    <ul>
                      <li>arrive punctually and behave respectfully toward teachers, centre staff, and fellow learners;</li>
                      <li>refrain from any form of bullying, harassment, verbal intimidation, or discrimination;</li>
                      <li>keep mobile phones switched off or silenced during lectures unless instructed by faculty;</li>
                      <li>respect centre property and never bring hazardous, unauthorized, or distracting items onto campus;</li>
                      <li>maintain strict academic integrity in tests and avoid unauthorized sharing of exam materials.</li>
                    </ul>
                    <p>
                      In cases of severe or repeated misconduct, SmartNum reserves the right to issue formal warnings, temporarily suspend, or permanently expel a student. Where applicable, refund rights are governed by our Refund Policy and Child Safety Policy.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>9. Academic guidance and no outcome guarantees</h2>
                    <p>
                      Our educators deliver thorough instruction and rigorous conceptual training; however, <strong>SmartNum does not guarantee specific exam marks, percentiles, competitive ranks, college admissions, or career placements.</strong> Academic success is influenced by student effort, consistency, health, and exam conditions. Testimonials and success stories published are shared with explicit permission and reflect individual student accomplishments.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>10. Your account and website security</h2>
                    <p>
                      If you access an online student account, you are responsible for maintaining the confidentiality of your credentials. Notify us immediately if you suspect unauthorized access. You must not attempt to scrape, reverse-engineer, overload, or inject harmful scripts into our platform or digital systems.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>11. Photographs and video recordings</h2>
                    <p>
                      We may record or photograph classes for quality control, teacher training, centre safety (CCTV), and, <strong>strictly with explicit written parental consent</strong>, for academic achievements or marketing. Consent may be modified or revoked at any time by contacting our centre.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>12. Communication consent</h2>
                    <p>
                      By submitting an enquiry or completing enrolment, you consent to receive communication from SmartNum via phone calls, SMS, WhatsApp, and email regarding admission, class schedules, tests, academic reports, and centre notices. You may opt out of promotional messages at any time; essential transactional and emergency notices will continue.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>13. Suspension and termination</h2>
                    <p>
                      SmartNum may suspend or revoke enrolment in the event of persistent non-payment, unauthorized distribution of proprietary materials, serious behavioral misconduct, submission of falsified details, or material breach of these terms. You may withdraw at any time; refunds are determined strictly by our Refund Policy.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>14. Disclaimers and limits of liability</h2>
                    <ul>
                      <li>While we make every effort to maintain uninterrupted classroom facilities, website uptime, and recorded lecture availability, we do not guarantee error-free or uninterrupted operation at all times.</li>
                      <li>To the maximum extent permitted by applicable Indian law, SmartNum is not liable for indirect, incidental, or consequential damages, or disruptions caused by events beyond our reasonable control (force majeure, internet service outages, power interruptions, natural calamities, strikes, or regulatory lockdowns).</li>
                      <li>Our total aggregate liability for any verifiable claim arising out of these terms is strictly limited to the tuition fees actually paid for the programme in dispute.</li>
                      <li>Nothing in these terms diminishes any statutory rights available under the Consumer Protection Act, 2019.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>15. Revisions to these terms</h2>
                    <p>
                      We may periodically update these terms. The current effective version is always accessible on this page with the revised &ldquo;Last updated&rdquo; timestamp. Significant updates will be communicated to enrolled students and parents.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>16. Governing law and dispute resolution</h2>
                    <p>
                      These terms are governed by the laws of India. In the event of any query, dispute, or dissatisfaction, we encourage contacting centre leadership for an amicable discussion. We endeavour to review and respond within <strong>7 working days</strong>. If a matter cannot be resolved amicably, jurisdiction shall lie exclusively with the competent courts at <strong>{jurisdictionCity}</strong>.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>17. Contact us</h2>
                    <div className="policy-contact-box">
                      <p><strong>{entityString}</strong></p>
                      <p>Centre: {address}</p>
                      <p>Phone / WhatsApp: <a href={`tel:${phone}`}>{phone}</a>, <a href={`tel:${secondaryPhone}`}>{secondaryPhone}</a></p>
                      <p>Email: <a href={`mailto:${email}`}>{email}</a></p>
                    </div>
                  </section>
                </div>
              )}

              {currentSlug === "privacy" && (
                <div className="policy-prose">
                  <div className="policy-intro-card">
                    <p>
                      At SmartNum, we handle information about students, many of whom are minors. We collect only what is essential, safeguard it rigorously, and use it exclusively for educational delivery and centre management. This policy outlines our data practices in full compliance with India&rsquo;s <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>.
                    </p>
                  </div>

                  <section className="policy-section">
                    <h2>1. Data fiduciary</h2>
                    <p>
                      <strong>{entityString}</strong>, located at <strong>{address}</strong>, operates as the &ldquo;Data Fiduciary&rdquo; responsible for determining the purposes and means of processing personal data under this policy.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>2. Information we collect</h2>
                    <div className="policy-table-wrapper">
                      <table className="policy-data-table">
                        <thead>
                          <tr>
                            <th>Interaction</th>
                            <th>Categories of Personal Data Collected</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Demo Request or Enquiry</strong></td>
                            <td>Student and parent name, mobile number, email address, current school grade/class, target examination or board, and optional message.</td>
                          </tr>
                          <tr>
                            <td><strong>Admission & Enrolment</strong></td>
                            <td>Student full name, date of birth, residential address, previous school details, parent/guardian contact info, and emergency numbers.</td>
                          </tr>
                          <tr>
                            <td><strong>Learning & Academic Tracking</strong></td>
                            <td>Classroom attendance logs, test scores, homework submissions, diagnostic evaluation notes, and recorded lesson playback statistics.</td>
                          </tr>
                          <tr>
                            <td><strong>Fee Payments</strong></td>
                            <td>Payment amount, transaction ID, invoice reference, and date. <em>Card numbers, UPI PINs, and net banking credentials are handled entirely by Cashfree Payments; SmartNum never stores financial credentials.</em></td>
                          </tr>
                          <tr>
                            <td><strong>Website Usage</strong></td>
                            <td>Browser type, operating system, pages visited, referral source, and technical session cookies.</td>
                          </tr>
                          <tr>
                            <td><strong>Campus Safety (CCTV)</strong></td>
                            <td>Security video footage recorded in classrooms, corridors, front desk, and common areas at the Indirapuram centre.</td>
                          </tr>
                          <tr>
                            <td><strong>Photographs / Testimonials</strong></td>
                            <td>Photographs, video snippets, or quotes collected <strong>only with explicit, signed parental consent</strong>.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="policy-note-card">
                      <strong>Online Proctored Assessments:</strong>{" "}
                      {proctoredTestsConsent ? (
                        <span>
                          When online tests with camera or audio monitoring are scheduled, SmartNum requests explicit prior parental consent, explaining exactly what is monitored, who can view the feed, and the deletion timeline.
                        </span>
                      ) : (
                        <span>
                          SmartNum does not conduct remote webcam or microphone surveillance of minors without explicit prior parental consent and documented need.
                        </span>
                      )}
                    </div>
                  </section>

                  <section className="policy-section">
                    <h2>3. Purpose of data processing</h2>
                    <ul>
                      <li>Deliver classroom teaching, doubt clarification, and curriculum progression.</li>
                      <li>Administer admissions, process fee transactions, issue receipts, and manage refunds.</li>
                      <li>Transmit academic performance updates, attendance notifications, and test schedules to parents.</li>
                      <li>Maintain student safety, campus physical security, and emergency preparedness.</li>
                      <li>Respond to parent questions, counselling enquiries, and administrative support requests.</li>
                      <li>Fulfil legal, financial, accounting, and tax compliance obligations under Indian law.</li>
                    </ul>
                    <p>
                      Our processing relies on lawful consent (provided when submitting a form, completing admission, or accepting terms) and necessary statutory grounds under the DPDP Act 2023.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>4. Protection of children&rsquo;s data</h2>
                    <p>
                      For any student under 18 years of age, SmartNum processes data <strong>only upon obtaining verifiable parental or legal guardian consent.</strong> In strict compliance with Section 9 of the Digital Personal Data Protection Act, 2023:
                    </p>
                    <ul>
                      <li>We do not engage in targeted advertising directed toward children.</li>
                      <li>We do not track, profile, or monitor children&rsquo;s behavioral patterns for marketing purposes.</li>
                      <li>We do not process children&rsquo;s data in any manner detrimental to their physical, mental, or moral well-being.</li>
                      <li>Parents retain the right to review, update, or request erasure of their child&rsquo;s data at any time.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>5. Data disclosure and third-party partners</h2>
                    <p>
                      SmartNum <strong>never sells, rents, or commercialises</strong> personal information. Data is shared strictly on a need-to-know basis with:
                    </p>
                    <ul>
                      <li><strong>Instructors & Support Staff:</strong> Qualified personnel who require student academic and contact details to deliver instruction and support.</li>
                      <li><strong>Trusted Technology Partners:</strong> Secure vendors bound by confidentiality agreements, including Cashfree Payments (payment gateway), cloud infrastructure providers, messaging channels (SMS/WhatsApp/Email), and YouTube (unlisted private educational videos).</li>
                      <li><strong>Legal Authorities:</strong> Competent judicial or government authorities when mandatory by law, court order, or child welfare protection laws (such as POCSO).</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>6. Cookies and website analytics</h2>
                    <p>
                      Our website utilizes essential functional cookies to ensure page navigation, authentication security, and session management. Any performance analytics used are aggregated and non-identifying. We do not place advertising tracking cookies on student learning portals.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>7. Data retention</h2>
                    <ul>
                      <li><strong>Prospective Enquiries:</strong> Retained for up to 12 months, after which they are purged if admission is not confirmed.</li>
                      <li><strong>Enrolled Student & Accounting Records:</strong> Maintained for the duration of enrolment and up to 7 years post-completion to comply with statutory accounting and tax regulations.</li>
                      <li><strong>CCTV Video Recordings:</strong> Stored securely on centre hardware and overwritten after approximately <strong>{cctvRetentionDays} days</strong>, unless required for an active legal or safety inquiry.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>8. Information security</h2>
                    <p>
                      We implement multi-tiered security safeguards, including HTTPS SSL/TLS encryption for all digital transfers, strict role-based access control (staff access only what is required for their responsibilities), password-protected portals, and locked on-premise storage for physical records and CCTV footage. In the unlikely event of a personal data breach impacting you, we will issue prompt notification in accordance with DPDP rules.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>9. Your statutory rights under DPDP Act</h2>
                    <p>
                      Parents and adult students have clear rights regarding their personal data:
                    </p>
                    <ul>
                      <li><strong>Right to Access:</strong> Review a summary of personal data held and processing activities performed.</li>
                      <li><strong>Right to Correction & Erasure:</strong> Rectify inaccurate details or request deletion when data is no longer necessary.</li>
                      <li><strong>Right to Withdraw Consent:</strong> Revoke processing consent (subject to ongoing academic or contractual necessities).</li>
                      <li><strong>Right of Grievance Redressal:</strong> Submit grievances directly to our designated Grievance Officer.</li>
                      <li><strong>Right to Nominate:</strong> Appoint a representative to exercise rights in case of death or incapacity.</li>
                    </ul>
                    <p>
                      We acknowledge all privacy requests within <strong>7 working days</strong> and resolve them within 30 days. You may also contact the Data Protection Board of India if unresolved.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>10. Grievance Redressal Officer</h2>
                    <p>
                      For privacy enquiries, access requests, or data grievances, please contact our designated officer:
                    </p>
                    <div className="policy-contact-box">
                      <p><strong>{grievanceOfficerName}</strong></p>
                      <p>{grievanceOfficerRole}</p>
                      <p>SmartNum, {address}</p>
                      <p>Phone / WhatsApp: <a href={`tel:${phone}`}>{phone}</a>, <a href={`tel:${secondaryPhone}`}>{secondaryPhone}</a></p>
                      <p>Email: <a href={`mailto:${email}`}>{email}</a></p>
                    </div>
                  </section>
                </div>
              )}

              {currentSlug === "refund" && (
                <div className="policy-prose">
                  <div className="policy-intro-card">
                    <p>
                      We want every family to feel confident when joining SmartNum. That is why our <strong>first demo session is 100% free</strong>, allowing you to experience our teaching approach before making any financial commitment. This policy provides transparent rules regarding fee refunds, cooling-off windows, and dispute resolution.
                    </p>
                  </div>

                  <section className="policy-section">
                    <h2>1. Free demo guarantee</h2>
                    <p>
                      Attending a scheduled demo class carries zero fee, zero obligation, and requires no advance payment.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>2. Cooling-off refund window</h2>
                    <p>
                      If you enrol and subsequently change your mind shortly after fee payment:
                    </p>
                    <div className="policy-highlight-card">
                      <p className="policy-highlight-lead">
                        <strong>Within {coolingOffDays} days of payment:</strong>
                      </p>
                      <p>
                        If requested within <strong>{coolingOffDays} calendar days</strong> of paying tuition fees, and provided the student has attended no more than <strong>2 classes</strong> and watched no more than <strong>{maxRecordedLessonsPercent}%</strong> of released recorded lectures, SmartNum issues a <strong>full refund</strong> of tuition fees paid, minus a non-refundable admission/registration fee of <strong>{admissionFee}</strong>.
                      </p>
                    </div>
                  </section>

                  <section className="policy-section">
                    <h2>3. Mid-programme withdrawal</h2>
                    <p>
                      If a withdrawal is submitted after the cooling-off window but within the <strong>first {withdrawalWindowDays} days</strong> of the course term:
                    </p>
                    <ul>
                      <li>We calculate a pro-rata refund for the unexpired duration of the enrolled programme.</li>
                      <li>Deductions apply for the non-refundable registration fee of <strong>{admissionFee}</strong> and the actual cost of any printed curriculum materials, test banks, or study kits already issued to the student.</li>
                      <li>
                        <strong>After {withdrawalWindowDays} days:</strong> Tuition fees become entirely non-refundable. Faculty scheduling, classroom capacity, and batch sizes are committed for the academic term.
                      </li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>4. Cancellations or modifications initiated by SmartNum</h2>
                    <ul>
                      <li><strong>Batch Cancellation Prior to Start:</strong> If SmartNum cancels an announced batch or programme before commencement, the student receives a <strong>100% full refund</strong> immediately, or may choose an alternative batch without additional charges.</li>
                      <li><strong>Discontinuation During Course:</strong> If SmartNum is unable to continue a course mid-way, you receive a full pro-rata refund for all undelivered sessions, or fee credit toward another course.</li>
                      <li><strong>Substantial Schedule Alteration:</strong> If a permanent batch timing change implemented by SmartNum causes an unworkable conflict for the learner, notify us within 7 days of the notification to obtain an alternative batch transfer or pro-rata refund for remaining classes.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>5. Transaction issues and failed payments</h2>
                    <ul>
                      <li><strong>Deduction without Confirmation / Duplicate Debit:</strong> In rare cases where money is debited from your bank or card but enrolment fails to generate, or where a duplicate transaction occurs, we verify with Cashfree Payments and process a full reversal within <strong>5–7 working days</strong>.</li>
                      <li><strong>Payment Gateway Drops:</strong> Dropped or failed transactions are typically reversed automatically by your issuing bank or payment gateway within standard banking cycles. If a credit is not reflected after 7 business days, notify us with the payment transaction reference ID.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>6. Non-refundable items</h2>
                    <p>
                      The following items and circumstances are strictly non-refundable:
                    </p>
                    <ul>
                      <li>The initial admission/registration fee of <strong>{admissionFee}</strong>.</li>
                      <li>Printed books, bespoke study modules, or stationery already handed over to the student.</li>
                      <li>Fees for programmes already concluded or batches where more than <strong>{withdrawalWindowDays} days</strong> have elapsed since commencement.</li>
                      <li>Cases where a student&rsquo;s enrolment is terminated due to academic malpractice, cheating, distribution of proprietary lecture videos, or severe behavioral misconduct (under Sections 7 and 8 of the Terms & Conditions).</li>
                      <li>Subjective dissatisfaction with examination scores or competitive rankings, as academic performance depends on student dedication and external testing factors.</li>
                      <li>Individual classes missed by a student, as recorded lecture access and revision materials remain available.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>7. How to submit a refund request</h2>
                    <ol className="policy-steps-list">
                      <li>
                        <strong>Send Written Notification:</strong> Email <strong>{email}</strong> or message our official WhatsApp at <strong>{phone}</strong> with the subject line <em>&ldquo;Refund Request - [Student Name]&rdquo;</em>.
                      </li>
                      <li>
                        <strong>Include Required Details:</strong> Provide the student&rsquo;s registered full name, programme/batch name, Cashfree payment reference ID, date of payment, and specific reason for withdrawal.
                      </li>
                      <li>
                        <strong>Verification (2 working days):</strong> Our team will confirm receipt within <strong>2 working days</strong> and verify eligibility according to this policy.
                      </li>
                      <li>
                        <strong>Payout (7–10 working days):</strong> Approved refunds are credited directly to the <strong>original source of payment</strong> (same UPI ID, debit/credit card, or net banking account used at checkout) within <strong>7 to 10 working days</strong>. Bank processing may require an additional 2–3 business days.
                      </li>
                    </ol>
                  </section>

                  <section className="policy-section">
                    <h2>8. Instalment plans</h2>
                    <p>
                      Where fee instalment arrangements have been approved, refund calculations evaluate only the sums actually paid. Any unpaid instalments corresponding to classes and materials received prior to formal withdrawal remain payable.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>9. Escalation & grievances</h2>
                    <p>
                      If you feel your refund request was assessed inaccurately, write to our senior administrative team with supporting documentation. We will conduct a thorough review and issue a final written decision within <strong>7 working days</strong>. This process does not impair any consumer rights available under Indian consumer law.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>10. Contact for refunds</h2>
                    <div className="policy-contact-box">
                      <p><strong>SmartNum Accounts & Admissions</strong></p>
                      <p>Centre: {address}</p>
                      <p>Phone / WhatsApp: <a href={`tel:${phone}`}>{phone}</a>, <a href={`tel:${secondaryPhone}`}>{secondaryPhone}</a></p>
                      <p>Email: <a href={`mailto:${email}`}>{email}</a></p>
                    </div>
                  </section>
                </div>
              )}

              {currentSlug === "child-safety" && (
                <div className="policy-prose">
                  <div className="policy-intro-card">
                    <p>
                      Parents place immense trust in SmartNum when sending their children to our classrooms. Every child has the absolute right to learn in an environment free from fear, intimidation, and harm. This policy sets out our proactive security measures, staff behavioral standards, one-to-one session rules, and our legal duties under Indian child protection statutes.
                    </p>
                  </div>

                  <section className="policy-section">
                    <h2>1. Our core safety commitments</h2>
                    <ul>
                      <li>Every learner is treated with respect, fairness, and positive encouragement, regardless of academic capability, gender, religion, or background.</li>
                      <li>Zero tolerance for bullying, physical intimidation, verbal abuse, sexual harassment, or discrimination by tutors, students, or visitors.</li>
                      <li>Child safety, psychological well-being, and dignity unconditionally take priority over schedules, examination results, and marketing goals.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>2. Campus physical security</h2>
                    <ul>
                      <li>
                        <strong>Comprehensive CCTV Coverage:</strong> High-definition CCTV monitors all classrooms, entrances, corridors, and reception areas. <strong>CCTV is strictly prohibited and never installed in washrooms or changing rooms.</strong> Video recordings are securely stored and retained for approximately <strong>{cctvRetentionDays} days</strong>, accessible only to designated administrators.
                      </li>
                      <li>
                        <strong>Infrastructure & Fire Safety:</strong> Classrooms are fully air-conditioned, well-illuminated, and well-ventilated, equipped with certified fire extinguishers and unobstructed exit routes.
                      </li>
                      <li>
                        <strong>On-site Adult Presence:</strong> Qualified staff members are present throughout all operational hours. Visitors must identify themselves and sign the centre visitor register.
                      </li>
                      <li>
                        <strong>Safe Dismissal:</strong> Minor students are dismissed only to parents, legal guardians, or individuals formally pre-authorized in writing by the family.
                      </li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>3. Staff vetting and code of conduct</h2>
                    <ul>
                      <li>All educators and administrative staff undergo identity verification, credential verification, and background reference checks before employment.</li>
                      <li>Every staff member signs our mandatory <strong>Child Protection Code of Conduct</strong> prohibiting corporal punishment, humiliation, abusive language, and favoritism.</li>
                      <li>Staff are forbidden from providing private vehicle transportation, giving personal gifts, or arranging private meetings with students outside centre premises.</li>
                      <li>Staff must never communicate with students through unmonitored personal social media accounts or private messaging. All communications occur via official centre channels with parents kept informed.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>4. Safeguards for one-to-one doubt sessions</h2>
                    <p>
                      Individual doubt-clearing sessions are essential for student academic confidence, but they are safeguarded through strict transparent protocols:
                    </p>
                    <ul>
                      <li>One-to-one sessions take place <strong>exclusively at the centre</strong> in open, visible areas or rooms with clear glass viewing panels, CCTV active, and doors open.</li>
                      <li>Sessions are scheduled during regular centre operational hours and logged in our daily academic register.</li>
                      <li>Parents have the right to request session schedules, inspect session logs, or remain present at the centre during doubt-clearing.</li>
                      <li>Students are informed that they may request another educator, a classmate, or their parent to be present at any point.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>5. Digital and online safety</h2>
                    <ul>
                      <li>Online lesson platforms and student doubt channels are dedicated exclusively to curriculum study. Staff never ask students for home photos, private addresses, or sensitive personal details.</li>
                      <li>Students are taught not to share login credentials, passwords, or video stream links with third parties.</li>
                      <li>
                        {proctoredTestsConsent ? (
                          <span>Where online mock tests utilize webcam or microphone proctoring, explicit parental consent is obtained beforehand, detailing retention duration and data privacy safeguards.</span>
                        ) : (
                          <span>SmartNum does not conduct remote video or microphone surveillance during online practice tests without prior explicit written parental consent.</span>
                        )}
                      </li>
                      <li>Private messaging of a non-academic nature by any party is strictly prohibited and must be reported immediately.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>6. Media, photographs and student privacy</h2>
                    <p>
                      We photograph or film students for academic recognition, awards, or marketing <strong>only with explicit, signed parental permission.</strong> SmartNum never publishes a minor student&rsquo;s home address, personal phone number, or school name publicly. Parents can withdraw media consent at any point.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>7. Anti-bullying policy</h2>
                    <p>
                      SmartNum enforces a strict anti-bullying rule. Name-calling, peer exclusion, cyber-harassment, or physical aggression is dealt with immediately. Staff counsel students, inform parents immediately, and enforce corrective action, including suspension or permanent removal for repeat or severe incidents.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>8. Health, first aid and medical emergencies</h2>
                    <ul>
                      <li>Parents are requested to inform the centre of known allergies, medical conditions, and emergency contacts during admission.</li>
                      <li>A fully stocked first-aid kit is maintained on site. In the event of illness or minor injury, parents are contacted without delay. In case of serious medical emergencies, staff are mandated to call national emergency services (<strong>112</strong>) immediately.</li>
                    </ul>
                  </section>

                  <section className="policy-section">
                    <h2>9. Mandatory reporting under Indian law (POCSO Act)</h2>
                    <div className="policy-warning-card">
                      <p>
                        Under the <strong>Protection of Children from Sexual Offences Act, 2012 (POCSO Act)</strong>, any person who knows or suspects that a child is facing, or has faced, sexual abuse or exploitation has a non-negotiable statutory obligation to report the matter to the Special Juvenile Police Unit or local police. SmartNum staff are legally required to report any such disclosure or suspicion immediately. We extend complete cooperation to child welfare and law enforcement authorities.
                      </p>
                    </div>
                  </section>

                  <section className="policy-section">
                    <h2>10. How to report a safety concern</h2>
                    <p>
                      Any student, parent, or guardian can speak up about any safety, emotional, or physical concern. <strong>You do not need formal proof to raise a concern.</strong>
                    </p>
                    <ol className="policy-steps-list">
                      <li>
                        Contact the designated <strong>Child Safety Officer</strong>:
                        <div className="policy-contact-box">
                          <p><strong>{childSafetyOfficerName}</strong></p>
                          <p>{childSafetyOfficerRole}</p>
                          <p>SmartNum Centre, {address}</p>
                          <p>Direct Phone / WhatsApp: <a href={`tel:${phone}`}>{phone}</a>, <a href={`tel:${secondaryPhone}`}>{secondaryPhone}</a></p>
                          <p>Confidential Email: <a href={`mailto:${email}`}>{email}</a></p>
                        </div>
                      </li>
                      <li>
                        <strong>Response within 24 Hours:</strong> We acknowledge every report within 24 hours, take immediate protective measures to ensure the child&rsquo;s safety, and maintain strict confidentiality.
                      </li>
                      <li>
                        <strong>Investigation & Action:</strong> The situation is investigated impartially, parents are informed of findings, and competent authorities are notified where legally mandated.
                      </li>
                      <li>
                        <strong>Zero Retaliation:</strong> No student or parent will ever experience academic bias, retaliation, or disadvantage for reporting a concern in good faith.
                      </li>
                    </ol>

                    <div className="policy-helpline-box">
                      <h3>External 24×7 National Emergency & Child Helplines (India)</h3>
                      <ul>
                        <li><strong>CHILDLINE India:</strong> <a href="tel:1098">1098</a> (Free, 24×7 National Child Protection Helpline)</li>
                        <li><strong>National Emergency Response:</strong> <a href="tel:112">112</a></li>
                        <li><strong>Police Helpline:</strong> <a href="tel:100">100</a></li>
                      </ul>
                    </div>
                  </section>

                  <section className="policy-section">
                    <h2>11. Annual review and staff training</h2>
                    <p>
                      This Child Safety Policy is reviewed annually and updated immediately following any significant event or statutory update. All educators and support staff complete mandatory child protection orientation upon joining SmartNum.
                    </p>
                  </section>

                  <section className="policy-section">
                    <h2>12. Contact us</h2>
                    <div className="policy-contact-box">
                      <p><strong>SmartNum Learning Space</strong></p>
                      <p>Centre: {address}</p>
                      <p>Phone / WhatsApp: <a href={`tel:${phone}`}>{phone}</a>, <a href={`tel:${secondaryPhone}`}>{secondaryPhone}</a></p>
                      <p>Email: <a href={`mailto:${email}`}>{email}</a></p>
                    </div>
                  </section>
                </div>
              )}
            </article>

            {/* Sticky Sidebar with Quick Details */}
            <aside className="policy-sidebar">
              <div className="policy-sidebar-card">
                <span className="sidebar-pill">Centre Information</span>
                <h3 className="sidebar-entity-title">{entityString}</h3>
                <p className="sidebar-address">{address}</p>

                <div className="sidebar-contact-list">
                  <div className="sidebar-contact-item">
                    <span className="contact-label">Phone & WhatsApp:</span>
                    <a href={`tel:${phone}`} className="contact-value">{phone}</a>
                    <a href={`tel:${secondaryPhone}`} className="contact-value">{secondaryPhone}</a>
                  </div>
                  <div className="sidebar-contact-item">
                    <span className="contact-label">Email:</span>
                    <a href={`mailto:${email}`} className="contact-value">{email}</a>
                  </div>
                </div>

                <div className="sidebar-actions">
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello SmartNum, I have a question regarding your " + currentMeta.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="sidebar-whatsapp-btn"
                  >
                    Chat on WhatsApp
                  </a>
                  <a href={`tel:${phone}`} className="sidebar-call-btn">
                    Call Admissions
                  </a>
                </div>
              </div>

              <div className="policy-sidebar-card officer-card">
                <span className="sidebar-pill">Key Contacts</span>
                <div className="officer-item">
                  <span className="officer-role">Grievance Redressal Officer</span>
                  <strong className="officer-name">{grievanceOfficerName}</strong>
                  <span className="officer-desc">{grievanceOfficerRole}</span>
                </div>
                <div className="officer-divider" />
                <div className="officer-item">
                  <span className="officer-role">Child Safety Officer</span>
                  <strong className="officer-name">{childSafetyOfficerName}</strong>
                  <span className="officer-desc">{childSafetyOfficerRole}</span>
                </div>
                <div className="officer-divider" />
                <div className="officer-item">
                  <span className="officer-role">Legal Jurisdiction</span>
                  <strong className="officer-name">{jurisdictionCity}</strong>
                </div>
              </div>

              <div className="policy-sidebar-card help-card">
                <span className="sidebar-pill">Emergency Contact</span>
                <p className="help-desc">For urgent child welfare assistance, the National Childline is available 24×7:</p>
                <a href="tel:1098" className="help-phone-btn">
                  Dial 1098 (CHILDLINE)
                </a>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <MobileFloatingActions phone={phone} whatsappNumber={whatsapp} />
      <SiteFooter contact={contact} />
    </div>
  );
}