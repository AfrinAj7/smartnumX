"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { SmartNumWordmark } from "./SmartNumWordmark";

export type NavUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: "SUPER_ADMIN" | "INSTRUCTOR" | "STUDENT" | string;
} | null;

type SiteHeaderProps = {
  phone?: string;
  whatsappNumber?: string;
  user?: NavUser;
};

const coursesMegaMenu = [
  {
    title: "School & Board Tuition",
    items: [
      { label: "Class 9 Tuition (Maths & Science)", href: "/#course-explorer", badge: "CBSE & ICSE" },
      { label: "Class 10 Board Excellence", href: "/#course-explorer", badge: "Board Prep" },
      { label: "Class 11 Foundation & Boards", href: "/#course-explorer", badge: "Any Board" },
      { label: "Class 12 Board Mastery", href: "/#course-explorer", badge: "Board + Prep" },
    ],
  },
  {
    title: "Competitive Pathways",
    items: [
      { label: "IIT-JEE Mains Preparation", href: "/#course-explorer", badge: "Popular" },
      { label: "IIT-JEE Advanced Mentorship", href: "/#course-explorer", badge: "Intensive" },
      { label: "Math & Science Olympiads", href: "/#course-explorer", badge: "National" },
      { label: "Self-Paced Recorded Modules", href: "/#course-explorer", badge: "Online" },
    ],
  },
];

const testSeriesMenu = [
  { label: "Free Diagnostic Mock Test", href: "/#course-explorer", badge: "Free" },
  { label: "Class 10 Board Mock Series", href: "/#course-explorer", badge: "New" },
  { label: "Class 12 Board Mock Papers", href: "/#course-explorer", badge: "2026 Batch" },
  { label: "IIT-JEE Mains Full Mocks", href: "/#course-explorer", badge: "High Yield" },
  { label: "Annual Scholarship Assessment", href: "/#book-demo", badge: "Up to 50% Off" },
];

const freeResourcesMenu = [
  { label: "Chapter-Wise Study Notes", href: "/#why-smartnum", desc: "Concise theory summaries" },
  { label: "NCERT & Board Worked Examples", href: "/#why-smartnum", desc: "Step-by-step problem breakdown" },
  { label: "Previous-Year Question Papers (PYQs)", href: "/#why-smartnum", desc: "Last 5 years solved" },
  { label: "Curated Practice Worksheets", href: "/#why-smartnum", desc: "Daily homework and drills" },
  { label: "Weekly Free Topic Quizzes", href: "/#why-smartnum", desc: "Quick 10-minute self tests" },
];

const moreMenu = [
  { label: "About SmartNum", href: "/about", desc: "Our story, founder & teaching ethos" },
  { label: "Expert Faculty & Tutors", href: "/#teachers", desc: "Meet our verified subject experts" },
  { label: "Campus Tour & Facilities", href: "/#visit-us", desc: "AC Smart classrooms & CCTV safety" },
  { label: "Student Results & Wall of Fame", href: "/#why-smartnum", desc: "Real progress stories" },
  { label: "Free Demo Class Video Gallery", href: "/#demo-classes", desc: "Watch sample lectures" },
  { label: "Frequently Asked Questions", href: "/#faq", desc: "Got questions? We're here to help" },
  { label: "Contact & Directions", href: "/#contact", desc: "Indirapuram campus location" },
];

function cleanDigits(value?: string) {
  return value?.replace(/\D/g, "") ?? "";
}

export function SiteHeader({
  phone = "+91 99589 47774",
  whatsappNumber = "+91 99589 47774",
  user = null,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>("courses");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const phoneDigits = phone.replace(/[^+\d]/g, "");
  const waDigits = cleanDigits(whatsappNumber);
  const whatsappUrl = waDigits
    ? `https://wa.me/${waDigits}?text=Hi%20SmartNum,%20I%20would%20like%20to%20know%20more%20about%20your%20courses`
    : undefined;

  // Handle shrink on scroll
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 30);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on outside click or Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveDropdown(null);
        setUserMenuOpen(false);
        setMobileDrawerOpen(false);
      }
    }
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  function handleDropdownEnter(menuKey: string) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(menuKey);
    }, 120);
  }

  function handleDropdownLeave() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  }

  function toggleDropdownClick(menuKey: string) {
    setActiveDropdown((prev) => (prev === menuKey ? null : menuKey));
  }

  function toggleAccordion(key: string) {
    setMobileAccordion((prev) => (prev === key ? null : key));
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U";
  const portalUrl =
    user?.role === "SUPER_ADMIN" || user?.role === "INSTRUCTOR" ? "/admin" : "/dashboard";
  const portalLabel =
    user?.role === "SUPER_ADMIN" ? "Admin Panel" : user?.role === "INSTRUCTOR" ? "Instructor Panel" : "My Dashboard";

  return (
    <>
      <header
        ref={headerRef}
        className={`site-header ${isScrolled ? "is-scrolled" : ""}`}
        role="banner"
      >
        <div className="site-header-inner">
          {/* Brand Logo */}
          <div className="site-header-brand">
            <SmartNumWordmark suffix="" />
          </div>

          {/* Desktop Primary Navigation */}
          <nav className="site-nav site-nav-desktop" aria-label="Main navigation">
            <Link
              className={`nav-link ${pathname === "/" ? "is-active" : ""}`}
              href="/"
            >
              Home
            </Link>

            <Link
              className={`nav-link ${pathname === "/about" ? "is-active" : ""}`}
              href="/about"
            >
              About
            </Link>

            {/* Courses Mega Menu */}
            <div
              className={`nav-dropdown-wrapper ${activeDropdown === "courses" ? "is-open" : ""}`}
              onMouseEnter={() => handleDropdownEnter("courses")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className="nav-link nav-dropdown-trigger"
                onClick={() => toggleDropdownClick("courses")}
                aria-expanded={activeDropdown === "courses"}
                aria-haspopup="true"
              >
                <span>Courses</span>
                <span className="dropdown-chevron" aria-hidden="true" />
              </button>

              <div className="nav-mega-panel courses-panel" role="region" aria-label="Courses menu">
                <div className="mega-columns-grid">
                  {coursesMegaMenu.map((group) => (
                    <div key={group.title} className="mega-column">
                      <h3 className="mega-heading">{group.title}</h3>
                      <ul className="mega-list">
                        {group.items.map((item) => (
                          <li key={item.label}>
                            <Link
                              href={item.href}
                              onClick={() => setActiveDropdown(null)}
                              className="mega-item-link"
                            >
                              <span>{item.label}</span>
                              {item.badge && <span className="nav-badge">{item.badge}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Mega Menu Spotlight Card */}
                  <div className="mega-spotlight">
                    <div className="spotlight-card">
                      <span className="spotlight-tag">Free Assessment</span>
                      <h4>Not sure which batch fits?</h4>
                      <p>Book a diagnostic session with our academic director.</p>
                      <Link
                        className="spotlight-btn"
                        href="/#book-demo"
                        onClick={() => setActiveDropdown(null)}
                      >
                        Book Free Demo ↗
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Series Dropdown */}
            <div
              className={`nav-dropdown-wrapper ${activeDropdown === "tests" ? "is-open" : ""}`}
              onMouseEnter={() => handleDropdownEnter("tests")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className="nav-link nav-dropdown-trigger"
                onClick={() => toggleDropdownClick("tests")}
                aria-expanded={activeDropdown === "tests"}
                aria-haspopup="true"
              >
                <span>Test Series</span>
                <span className="nav-badge highlight">Mocks</span>
                <span className="dropdown-chevron" aria-hidden="true" />
              </button>

              <div className="nav-dropdown-panel test-panel" role="region" aria-label="Test series menu">
                <ul className="dropdown-list">
                  {testSeriesMenu.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="dropdown-item-link"
                      >
                        <span>{item.label}</span>
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Free Resources Dropdown */}
            <div
              className={`nav-dropdown-wrapper ${activeDropdown === "resources" ? "is-open" : ""}`}
              onMouseEnter={() => handleDropdownEnter("resources")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className="nav-link nav-dropdown-trigger"
                onClick={() => toggleDropdownClick("resources")}
                aria-expanded={activeDropdown === "resources"}
                aria-haspopup="true"
              >
                <span>Free Resources</span>
                <span className="dropdown-chevron" aria-hidden="true" />
              </button>

              <div className="nav-dropdown-panel resources-panel" role="region" aria-label="Free resources menu">
                <ul className="dropdown-detailed-list">
                  {freeResourcesMenu.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="detailed-item-link"
                      >
                        <span className="item-title">{item.label}</span>
                        <span className="item-desc">{item.desc}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link className="nav-link" href="/#why-smartnum">
              Results
            </Link>

            <Link className="nav-link" href="/#faq">
              Blog
            </Link>

            {/* More Dropdown */}
            <div
              className={`nav-dropdown-wrapper ${activeDropdown === "more" ? "is-open" : ""}`}
              onMouseEnter={() => handleDropdownEnter("more")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className="nav-link nav-dropdown-trigger"
                onClick={() => toggleDropdownClick("more")}
                aria-expanded={activeDropdown === "more"}
                aria-haspopup="true"
              >
                <span>More</span>
                <span className="dropdown-chevron" aria-hidden="true" />
              </button>

              <div className="nav-dropdown-panel more-panel" role="region" aria-label="More links menu">
                <ul className="dropdown-detailed-list">
                  {moreMenu.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="detailed-item-link"
                      >
                        <span className="item-title">{item.label}</span>
                        <span className="item-desc">{item.desc}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </nav>

          {/* Desktop Right Actions: Call, Contact & Role-Aware Auth */}
          <div className="site-header-actions">
            {/* Outline Orange Call Button */}
            <a
              className="button-call-outline"
              href={`tel:${phoneDigits}`}
              title={`Call SmartNum: ${phone} (Mon–Sat 10:00 AM – 7:00 PM)`}
              aria-label={`Call SmartNum at ${phone}`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="call-icon-svg"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span className="call-text">Call Us</span>
            </a>

            {/* Solid Orange Contact Button */}
            <Link className="button-contact-solid" href="/#contact">
              Contact
            </Link>

            {/* Role-Aware Auth Button / Avatar Menu */}
            {user ? (
              <div className="user-menu-wrapper">
                <button
                  type="button"
                  className="user-avatar-btn"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  aria-expanded={userMenuOpen}
                  aria-label="User account menu"
                >
                  <span className="avatar-circle">{userInitial}</span>
                  <span className="avatar-name">{user.name?.split(" ")[0] || "Account"}</span>
                  <span className="dropdown-chevron small" aria-hidden="true" />
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown-panel" role="menu">
                    <div className="user-info-header">
                      <strong>{user.name || "SmartNum Learner"}</strong>
                      <span>{user.email}</span>
                      <span className="role-tag">{user.role}</span>
                    </div>
                    <div className="user-menu-links">
                      <Link
                        href={portalUrl}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {portalLabel}
                      </Link>
                      <Link
                        href="/#course-explorer"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Explore Courses
                      </Link>
                    </div>
                    <div className="user-menu-footer">
                      <button
                        type="button"
                        className="sign-out-btn"
                        onClick={() => signOut({ callbackUrl: "/" })}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link className="site-signin-btn" href="/sign-in">
                Sign in
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className="mobile-hamburger-btn"
              type="button"
              aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileDrawerOpen}
              aria-controls="mobile-navigation-drawer"
              onClick={() => setMobileDrawerOpen((prev) => !prev)}
            >
              <span className={`hamburger-bar ${mobileDrawerOpen ? "is-active" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Height Slide-in Drawer */}
      <div
        className={`mobile-drawer-overlay ${mobileDrawerOpen ? "is-visible" : ""}`}
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden={!mobileDrawerOpen}
      />

      <aside
        id="mobile-navigation-drawer"
        className={`mobile-drawer ${mobileDrawerOpen ? "is-open" : ""}`}
        aria-label="Mobile navigation drawer"
        aria-hidden={!mobileDrawerOpen}
      >
        <div className="mobile-drawer-header">
          <SmartNumWordmark suffix="" />
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* User Status Bar at top of drawer */}
        <div className="mobile-user-status">
          {user ? (
            <div className="drawer-user-pill">
              <span className="avatar-circle">{userInitial}</span>
              <div className="drawer-user-text">
                <strong>{user.name || "Student"}</strong>
                <span>{user.email}</span>
              </div>
              <Link
                href={portalUrl}
                className="drawer-portal-link"
                onClick={() => setMobileDrawerOpen(false)}
              >
                {portalLabel}
              </Link>
            </div>
          ) : (
            <div className="drawer-auth-buttons">
              <Link
                href="/sign-in"
                className="drawer-signin-btn"
                onClick={() => setMobileDrawerOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/#book-demo"
                className="drawer-demo-btn"
                onClick={() => setMobileDrawerOpen(false)}
              >
                Book Free Demo
              </Link>
            </div>
          )}
        </div>

        {/* Drawer Accordion Navigation */}
        <nav className="mobile-drawer-nav">
          <Link
            href="/"
            className="mobile-nav-root-link"
            onClick={() => setMobileDrawerOpen(false)}
          >
            🏠 Home
          </Link>

          <Link
            href="/about"
            className={`mobile-nav-root-link ${pathname === "/about" ? "is-active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            ℹ️ About SmartNum
          </Link>

          {/* Courses Accordion */}
          <div className="mobile-accordion-group">
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggleAccordion("courses")}
              aria-expanded={mobileAccordion === "courses"}
            >
              <span>🎓 Courses &amp; Programmes</span>
              <span className={`accordion-icon ${mobileAccordion === "courses" ? "is-open" : ""}`}>▾</span>
            </button>
            {mobileAccordion === "courses" && (
              <div className="accordion-content">
                {coursesMegaMenu.flatMap((g) => g.items).map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="accordion-sublink"
                  >
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Test Series Accordion */}
          <div className="mobile-accordion-group">
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggleAccordion("tests")}
              aria-expanded={mobileAccordion === "tests"}
            >
              <span>📝 Test Series &amp; Mocks</span>
              <span className={`accordion-icon ${mobileAccordion === "tests" ? "is-open" : ""}`}>▾</span>
            </button>
            {mobileAccordion === "tests" && (
              <div className="accordion-content">
                {testSeriesMenu.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="accordion-sublink"
                  >
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-badge highlight">{item.badge}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Free Resources Accordion */}
          <div className="mobile-accordion-group">
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggleAccordion("resources")}
              aria-expanded={mobileAccordion === "resources"}
            >
              <span>📚 Free Resources</span>
              <span className={`accordion-icon ${mobileAccordion === "resources" ? "is-open" : ""}`}>▾</span>
            </button>
            {mobileAccordion === "resources" && (
              <div className="accordion-content">
                {freeResourcesMenu.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="accordion-sublink"
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* More Accordion */}
          <div className="mobile-accordion-group">
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggleAccordion("more")}
              aria-expanded={mobileAccordion === "more"}
            >
              <span>🌟 More Links</span>
              <span className={`accordion-icon ${mobileAccordion === "more" ? "is-open" : ""}`}>▾</span>
            </button>
            {mobileAccordion === "more" && (
              <div className="accordion-content">
                {moreMenu.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="accordion-sublink"
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Pinned Bottom Actions in Drawer */}
        <div className="mobile-drawer-bottom">
          <a className="drawer-pinned-call" href={`tel:${phoneDigits}`}>
            📞 Call {phone}
          </a>
          {whatsappUrl && (
            <a
              className="drawer-pinned-wa"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              💬 WhatsApp Us
            </a>
          )}
        </div>
      </aside>

      {/* NAV-14: Mobile Sticky Bottom Action Bar (<= 768px) */}
      <div className="mobile-sticky-action-bar" role="navigation" aria-label="Quick contact actions">
        <a className="bottom-bar-action bar-call" href={`tel:${phoneDigits}`}>
          <span className="bar-icon" aria-hidden="true">📞</span>
          <span className="bar-label">Call Now</span>
        </a>
        {whatsappUrl && (
          <a
            className="bottom-bar-action bar-wa"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span className="bar-icon" aria-hidden="true">💬</span>
            <span className="bar-label">WhatsApp</span>
          </a>
        )}
        <Link className="bottom-bar-action bar-demo" href="/#book-demo">
          <span className="bar-icon" aria-hidden="true">🎓</span>
          <span className="bar-label">Book Demo</span>
        </Link>
      </div>
    </>
  );
}