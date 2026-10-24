"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import type { HomepageContent } from "@/server/site-content/homepage";

type SiteFooterProps = {
  contact?: HomepageContent["contact"];
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  whatsappNumber?: string;
  address?: string;
};

export function SiteFooter({
  contact,
  email = contact?.email || "gosmartnum@gmail.com",
  phone = contact?.phone || "+91 99589 47774",
  secondaryPhone = contact?.secondaryPhone || "+91 88004 05640",
  whatsappNumber = contact?.whatsapp || "+91 99589 47774",
  address = contact?.address || "04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014",
}: SiteFooterProps) {
  const number = whatsappNumber?.replace(/\D/g, "");
  const phoneDigits = phone.replace(/[^+\d]/g, "");
  const secondaryPhoneDigits = secondaryPhone.replace(/[^+\d]/g, "");

  const instagramUrl = contact?.instagramUrl || "https://www.instagram.com/smartnumofficial/";
  const facebookUrl = contact?.facebookUrl || "https://www.facebook.com/profile.php?id=61594903500934";
  const youtubeUrl = contact?.youtubeUrl || "https://www.youtube.com/@GoSmartNum";
  const linkedInUrl = contact?.linkedInUrl || "https://www.linkedin.com/company/smartnum/about/";

  // Footer counselling mini-form state
  const [counsellingName, setCounsellingName] = useState("");
  const [counsellingPhone, setCounsellingPhone] = useState("");
  const [counsellingClass, setCounsellingClass] = useState("Class 10");
  const [formPending, setFormPending] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleCounsellingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormPending(true);
    setFormError("");
    setFormSuccess(false);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: counsellingName.trim(),
          phone: counsellingPhone.trim(),
          studentClass: counsellingClass,
          board: "Any Board",
          interest: "Free Academic Counselling",
          source: "footer-counselling",
          acceptedConsent: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setFormError(result.error?.message || "Please check your phone number and try again.");
        return;
      }

      setFormSuccess(true);
      setCounsellingName("");
      setCounsellingPhone("");
    } catch {
      setFormError("Could not submit request right now. Please call us directly.");
    } finally {
      setFormPending(false);
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer" id="site-footer">
      {/* FTR-2: Get Free Counselling Mini-Form Strip */}
      <section className="footer-counselling-band" aria-label="Free academic counselling request">
        <div className="counselling-band-inner">
          <div className="counselling-band-text">
            <span className="counselling-badge">Free Guidance</span>
            <h3>Need guidance for your child’s academic goals?</h3>
            <p>Speak to our senior academic directors for batch advice, board strategy, or JEE roadmap.</p>
          </div>

          <form className="counselling-form" onSubmit={handleCounsellingSubmit}>
            {formSuccess ? (
              <div className="counselling-success-msg">
                <span>✓</span> Thank you! Our academic counsellor will call you shortly.
              </div>
            ) : (
              <>
                <div className="counselling-inputs">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={counsellingName}
                    onChange={(e) => setCounsellingName(e.target.value)}
                    aria-label="Your Name"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number (10 digits)"
                    value={counsellingPhone}
                    onChange={(e) => setCounsellingPhone(e.target.value)}
                    aria-label="Phone Number"
                  />
                  <select
                    value={counsellingClass}
                    onChange={(e) => setCounsellingClass(e.target.value)}
                    aria-label="Student Class"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10 (Board)</option>
                    <option value="Class 11">Class 11 (Foundational / JEE)</option>
                    <option value="Class 12">Class 12 (Board / JEE)</option>
                    <option value="IIT-JEE / Olympiad">IIT-JEE / Olympiad</option>
                  </select>
                </div>
                <button type="submit" className="counselling-submit-btn" disabled={formPending}>
                  {formPending ? "Sending..." : "Request Free Counselling ↗"}
                </button>
              </>
            )}
            {formError && <p className="counselling-error-msg">{formError}</p>}
          </form>
        </div>
      </section>

      {/* 5-Column Main Footer */}
      <div className="footer-main">
        {/* Column 1: Brand & Identity */}
        <div className="footer-brand-column">
          <Link className="brand-wordmark" href="/" aria-label="SmartNum Home">
            <Image
              className="brand-wordmark-image footer-logo-image"
              src="/images/FOOTERLogo.png"
              alt="SmartNum Footer Logo"
              width={900}
              height={480}
              priority
            />
          </Link>
          <p className="footer-brand-desc">
            Mathematics made clearer. Coaching for Classes 9–12th (Any Board), Foundational Courses, IIT-JEE Mains &amp; Advanced &amp; Olympiads with air-conditioned smart classrooms, CCTV safety, and 1-on-1 doubt sessions.
          </p>
          <div className="footer-location">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f57c00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <a
              href={contact?.mapsUrl || "https://share.google/8gHRuZQQxRuYAkqVd"}
              target="_blank"
              rel="noreferrer"
              className="footer-address-link"
              title="Open campus in Google Maps"
            >
              {address}
            </a>
          </div>

          <div className="footer-social-inline">
            {instagramUrl && (
              <a className="social-circle insta" href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            )}
            {facebookUrl && (
              <a className="social-circle fb" href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            )}
            {youtubeUrl && (
              <a className="social-circle yt" href={youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
                </svg>
              </a>
            )}
            {linkedInUrl && (
              <a className="social-circle linkedin" href={linkedInUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Column 2: Company */}
        <div className="footer-link-group">
          <h2>COMPANY</h2>
          <Link className="footer-link-item" href="/about">About SmartNum</Link>
          <Link className="footer-link-item" href="/#teachers">Expert Tutors &amp; Faculty</Link>
          <Link className="footer-link-item" href="/#why-smartnum">Student Results &amp; Wall of Fame</Link>
          <Link className="footer-link-item" href="/#visit-us">Campus Tour &amp; Facilities</Link>
          <Link className="footer-link-item" href="/#faq">Blog &amp; Exam Insights</Link>
          <Link className="footer-link-item" href="/#contact">Careers / Teach With Us</Link>
          <Link className="footer-link-item" href="/#contact">Contact &amp; Directions</Link>
        </div>

        {/* Column 3: Learn & Practice */}
        <div className="footer-link-group">
          <h2>LEARN &amp; PRACTICE</h2>
          <Link className="footer-link-item" href="/#course-explorer">Classes 9 &amp; 10 Tuition</Link>
          <Link className="footer-link-item" href="/#course-explorer">Classes 11 &amp; 12th Tuition</Link>
          <Link className="footer-link-item" href="/#course-explorer">IIT-JEE Mains &amp; Advanced</Link>
          <Link className="footer-link-item" href="/#course-explorer">Olympiads Preparation</Link>
          <Link className="footer-link-item" href="/#course-explorer">Free Diagnostic Mock Tests</Link>
          <Link className="footer-link-item" href="/#why-smartnum">Curated Worksheets &amp; PYQs</Link>
          <Link className="footer-link-item" href="/#book-demo">Book Free Demo Lesson</Link>
        </div>

        {/* Column 4: Boards & Curricula */}
        <div className="footer-link-group">
          <h2>BOARDS &amp; CURRICULA</h2>
          <Link className="footer-link-item" href="/#curricula">CBSE Board (Classes 9–12)</Link>
          <Link className="footer-link-item" href="/#curricula">ICSE &amp; ISC Standards</Link>
          <Link className="footer-link-item" href="/#curricula">UP State &amp; Any Board</Link>
          <Link className="footer-link-item" href="/#curricula">IB / IGCSE Framework</Link>
          <Link className="footer-link-item" href="/#why-smartnum">Small Batches (Max 15)</Link>
          <Link className="footer-link-item" href="/#why-smartnum">1-on-1 Doubt Clearing</Link>
        </div>

        {/* Column 5: Contact & Support Hours */}
        <div className="footer-link-group footer-contact">
          <h2>CONTACT &amp; HOURS</h2>
          {phone && (
            <a className="footer-contact-item" href={`tel:${phoneDigits}`}>
              <span className="footer-contact-icon" aria-hidden="true">📞</span>
              <span>{phone}</span>
            </a>
          )}
          {secondaryPhone && (
            <a className="footer-contact-item" href={`tel:${secondaryPhoneDigits}`}>
              <span className="footer-contact-icon" aria-hidden="true">📞</span>
              <span>{secondaryPhone}</span>
            </a>
          )}
          {email && (
            <a className="footer-contact-item" href={`mailto:${email}`}>
              <span className="footer-contact-icon" aria-hidden="true">✉️</span>
              <span>{email}</span>
            </a>
          )}
          {number && (
            <a className="footer-contact-item" href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer">
              <span className="footer-contact-icon whatsapp" aria-hidden="true">💬</span>
              <span>WhatsApp Chat</span>
            </a>
          )}

          {/* Support Hours Card */}
          <div className="footer-hours-card">
            <span className="hours-title">🕒 Office &amp; Support Hours:</span>
            <p>Mon – Sat: <strong>10:00 AM – 7:00 PM</strong></p>
            <p>Sunday: <em>By Appointment</em></p>
          </div>

          <Link href="/#visit-us" className="footer-visit-btn">
            Schedule Campus Visit ↗
          </Link>
        </div>
      </div>

      {/* Footer Bottom Legal Bar */}
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} SmartNum Learning Space. All rights reserved.</span>
        <div className="footer-legal-wrap">
          <Link href="/policies/terms">Terms</Link>
          <span className="footer-divider" aria-hidden="true">|</span>
          <Link href="/policies/privacy">Privacy Policy</Link>
          <span className="footer-divider" aria-hidden="true">|</span>
          <Link href="/policies/refund">Refund Policy</Link>
          <span className="footer-divider" aria-hidden="true">|</span>
          <Link href="/policies/terms">Child Safety</Link>
          <button className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}