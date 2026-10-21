"use client";

import Image from "next/image";
import Link from "next/link";
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

  const instagramUrl = contact?.instagramUrl || "https://www.instagram.com/smartnumofficial/";
  const facebookUrl = contact?.facebookUrl || "https://www.facebook.com/profile.php?id=61594903500934";
  const youtubeUrl = contact?.youtubeUrl || "https://www.youtube.com/@GoSmartNum";
  const linkedInUrl = contact?.linkedInUrl || "https://www.linkedin.com/company/smartnum/about/";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer" id="site-footer">
      <div className="footer-main">
        {/* Column 1: Brand Info */}
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
          <p>
            Classes 9–12th, Any Board | Foundational Courses, IIT-JEE Mains &amp; Advanced &amp; Olympiads with air-conditioned smart classrooms, CCTV safety, small batches, and 1-on-1 doubt sessions.
          </p>
          <div className="footer-location">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f57c00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{address}</span>
          </div>
        </div>

        {/* Column 2: Explore */}
        <div className="footer-link-group">
          <h2>EXPLORE</h2>
          <Link className="footer-link-item" href="/#course-explorer">
            <span className="footer-link-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            Classes &amp; Subjects
          </Link>
          <Link className="footer-link-item" href="/#why-smartnum">
            <span className="footer-link-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
              </svg>
            </span>
            Why SmartNum
          </Link>
          <Link className="footer-link-item" href="/#demo-classes">
            <span className="footer-link-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            Demo Classes
          </Link>
          <Link className="footer-link-item" href="/#visit-us">
            <span className="footer-link-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
              </svg>
            </span>
            Visit Our Campus
          </Link>
        </div>

        {/* Column 3: For Families */}
        <div className="footer-link-group">
          <h2>FOR FAMILIES</h2>
          <Link className="footer-link-item" href="/#about">
            <span className="footer-link-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            About SmartNum
          </Link>
          <Link className="footer-link-item" href="/#teachers">
            <span className="footer-link-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </span>
            Expert Tutors
          </Link>
          <Link className="footer-link-item" href="/#faq">
            <span className="footer-link-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            Frequently Asked Questions
          </Link>
          <Link className="footer-link-item" href="/#book-demo">
            <span className="footer-link-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            Book Free Demo Class
          </Link>
        </div>

        {/* Column 4: Contact Us */}
        <div className="footer-link-group footer-contact">
          <h2>CONTACT US</h2>
          {phone && (
            <a className="footer-contact-item" href={`tel:${phone.replace(/[^+\d]/g, "")}`}>
              <span className="footer-contact-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <span>{phone}</span>
            </a>
          )}
          {secondaryPhone && (
            <a className="footer-contact-item" href={`tel:${secondaryPhone.replace(/[^+\d]/g, "")}`}>
              <span className="footer-contact-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <span>{secondaryPhone}</span>
            </a>
          )}
          {email && (
            <a className="footer-contact-item" href={`mailto:${email}`}>
              <span className="footer-contact-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <span>{email}</span>
            </a>
          )}
          {number && (
            <a className="footer-contact-item" href={`https://wa.me/${number}`} target="_blank" rel="noreferrer">
              <span className="footer-contact-icon whatsapp" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </span>
              <span>WhatsApp Us</span>
            </a>
          )}

          <div className="footer-social-inline">
            {instagramUrl && (
              <a className="social-circle insta" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            )}
            {facebookUrl && (
              <a className="social-circle fb" href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            )}
            {youtubeUrl && (
              <a className="social-circle yt" href={youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
                </svg>
              </a>
            )}
            {linkedInUrl && (
              <a className="social-circle linkedin" href={linkedInUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} SmartNum Learning Space. All rights reserved.</span>
        <div className="footer-legal-wrap">
          <Link href="/policies/terms">Terms</Link>
          <span className="footer-divider" aria-hidden="true">|</span>
          <Link href="/policies/privacy">Privacy Policy</Link>
          <span className="footer-divider" aria-hidden="true">|</span>
          <Link href="/policies/refund">Refund Policy</Link>
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