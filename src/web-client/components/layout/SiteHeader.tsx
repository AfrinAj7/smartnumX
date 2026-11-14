"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { SmartNumWordmark } from "./SmartNumWordmark";
import { CartButton } from "../cart/CartButton";

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
    title: "School & Board Tuition (Classes 9–12)",
    items: [
      { label: "Class 9th Coaching (Maths & Science)", href: "/courses/class-9-maths-science-tuition", badge: "CBSE & ICSE", mode: "Online | Physical" },
      { label: "Class 10th Board Excellence", href: "/courses/class-10-board-excellence", badge: "Board Prep", mode: "Online | Physical" },
      { label: "Class 11th Foundation & Boards", href: "/courses/class-11-foundation-and-boards", badge: "Foundation", mode: "Online | Physical" },
      { label: "Class 12th Board Mastery", href: "/courses/class-12-board-mastery", badge: "Board + Prep", mode: "Online | Physical" },
    ],
  },
  {
    title: "Competitive Pathways & Olympiads",
    items: [
      { label: "IIT-JEE (Main) Intensive Prep", href: "/courses/iit-jee-mains-preparation", badge: "Popular", mode: "Online | Physical" },
      { label: "IIT-JEE (Main + Advanced) Mentorship", href: "/courses/iit-jee-advanced-mentorship", badge: "Intensive", mode: "Online | Physical" },
      { label: "Math & Science Olympiads", href: "/courses/maths-science-olympiads", badge: "National", mode: "Online | Physical" },
      { label: "Self-Paced Recorded Modules", href: "/courses/self-paced-recorded-modules", badge: "Online", mode: "Digital Only" },
    ],
  },
];

export interface TestSeriesNavItem {
  id: string;
  name: string;
  slug: string;
  badge?: string;
  badgeType?: "free" | "highlight" | "default";
  desc: string;
  subcategories: Array<{ label: string; href: string }>;
  featuredTests: Array<{
    title: string;
    href: string;
    badge: string;
    badgeType?: "free" | "highlight" | "default";
    stats: string;
    price: string;
    discountPrice?: string;
    isFree?: boolean;
  }>;
}

const testSeriesNavCategories: TestSeriesNavItem[] = [
  {
    id: "ts-iit-jee-main-advanced",
    name: "IIT JEE (Main + Advanced)",
    slug: "ts-iit-jee-main-advanced",
    badge: "Advanced",
    desc: "Rigorous dual-paper mock series with multi-pattern questions & all-India percentile prediction.",
    subcategories: [
      { label: "Class 11th", href: "/test-series?category=ts-jee-adv-class-11" },
      { label: "Class 12th", href: "/test-series?category=ts-jee-adv-class-12" },
      { label: "Class 12th Plus (Droppers)", href: "/test-series?category=ts-jee-adv-droppers" },
    ],
    featuredTests: [
      {
        title: "IIT-JEE Advanced Full Mock Challenge",
        href: "/test-series/iit-jee-advanced-full-mock-challenge",
        badge: "Popular",
        stats: "15 Dual Papers · 30 Chapter Tests",
        price: "₹2,499",
        discountPrice: "₹1,499",
      },
      {
        title: "IIT-JEE Mains Full Mocks",
        href: "/test-series/iit-jee-mains-full-mocks",
        badge: "High Yield",
        badgeType: "highlight",
        stats: "20 Full Mocks · 40 Chapter Tests",
        price: "₹1,999",
        discountPrice: "₹999",
      },
    ],
  },
  {
    id: "ts-iit-jee-main",
    name: "IIT JEE Main",
    slug: "ts-iit-jee-main",
    badge: "High Yield",
    badgeType: "highlight",
    desc: "Computer-Based Test (CBT) mock exam series strictly matching the latest NTA exam pattern.",
    subcategories: [
      { label: "Class 11th", href: "/test-series?category=ts-jee-main-class-11" },
      { label: "Class 12th", href: "/test-series?category=ts-jee-main-class-12" },
      { label: "Class 12th Plus (Droppers)", href: "/test-series?category=ts-jee-main-droppers" },
    ],
    featuredTests: [
      {
        title: "IIT-JEE Mains Full Mocks (High Yield)",
        href: "/test-series/iit-jee-mains-full-mocks",
        badge: "High Yield",
        badgeType: "highlight",
        stats: "20 Full Mocks · NTA CBT Engine",
        price: "₹1,999",
        discountPrice: "₹999",
      },
      {
        title: "Free Diagnostic Mock Test",
        href: "/test-series/free-diagnostic-mock-test",
        badge: "Free",
        badgeType: "free",
        stats: "30-Min Rapid Test · Instant Scorecard",
        price: "Free",
        isFree: true,
      },
    ],
  },
  {
    id: "ts-class-9-12",
    name: "Class 9–12",
    slug: "ts-class-9-12",
    badge: "Boards",
    desc: "Board-focused mock papers with official step-by-step scoring rubric and topper model solutions.",
    subcategories: [
      { label: "Class 9", href: "/test-series?category=ts-school-class-9" },
      { label: "Class 10 (Board)", href: "/test-series?category=ts-school-class-10" },
      { label: "Class 11", href: "/test-series?category=ts-school-class-11" },
      { label: "Class 12 (Board)", href: "/test-series?category=ts-school-class-12" },
    ],
    featuredTests: [
      {
        title: "Class 10 Board Mock Series",
        href: "/test-series/class-10-board-mock-series",
        badge: "New",
        stats: "10 Full Board Mocks · 25 Topic Tests",
        price: "₹1,299",
        discountPrice: "₹699",
      },
      {
        title: "Class 12 Board Mock Papers",
        href: "/test-series/class-12-board-mock-papers",
        badge: "2026 Batch",
        badgeType: "highlight",
        stats: "12 Full Board Mocks · 30 Sectional Mocks",
        price: "₹1,499",
        discountPrice: "₹799",
      },
    ],
  },
  {
    id: "ts-popular-exams",
    name: "Popular Exams",
    slug: "ts-popular-exams",
    badge: "Diagnostic",
    desc: "National aptitude benchmarks and comprehensive scholarship diagnostic evaluations.",
    subcategories: [
      { label: "Annual Scholarship Assessment", href: "/test-series/annual-scholarship-assessment" },
      { label: "Free Diagnostic Mock Test", href: "/test-series/free-diagnostic-mock-test" },
    ],
    featuredTests: [
      {
        title: "Annual Scholarship Assessment",
        href: "/test-series/annual-scholarship-assessment",
        badge: "Up to 50% Off",
        badgeType: "highlight",
        stats: "60-Min Test · Tuition Scholarship",
        price: "Free",
        isFree: true,
      },
      {
        title: "Free Diagnostic Mock Test",
        href: "/test-series/free-diagnostic-mock-test",
        badge: "Free",
        badgeType: "free",
        stats: "30-Min Rapid Test · Weak Spot Analysis",
        price: "Free",
        isFree: true,
      },
    ],
  },
  {
    id: "ts-free-test-series",
    name: "Free Test Series",
    slug: "ts-free-test-series",
    badge: "FREE",
    badgeType: "free",
    desc: "Explore 100% free diagnostic and scholarship test series with zero payment required.",
    subcategories: [
      { label: "Free Diagnostic Mock", href: "/test-series/free-diagnostic-mock-test" },
      { label: "Scholarship Assessment", href: "/test-series/annual-scholarship-assessment" },
      { label: "View All Free Tests", href: "/test-series?free=true" },
    ],
    featuredTests: [
      {
        title: "Free Diagnostic Mock Test",
        href: "/test-series/free-diagnostic-mock-test",
        badge: "Free",
        badgeType: "free",
        stats: "Instant Evaluation · Weak Area Heatmap",
        price: "₹0 Free",
        isFree: true,
      },
      {
        title: "Annual Scholarship Assessment",
        href: "/test-series/annual-scholarship-assessment",
        badge: "Up to 50% Off",
        badgeType: "highlight",
        stats: "Benchmark Score · 50% Fee Waiver",
        price: "₹0 Free",
        isFree: true,
      },
    ],
  },
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
  const [activeTestCategory, setActiveTestCategory] = useState<string>("ts-iit-jee-main-advanced");
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

  const activeCategoryData =
    testSeriesNavCategories.find((c) => c.id === activeTestCategory) ||
    testSeriesNavCategories[0];

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

            {/* Courses Dropdown */}
            <div
              className={`nav-dropdown-wrapper ${activeDropdown === "courseMenu" ? "is-open" : ""}`}
              onMouseEnter={() => handleDropdownEnter("courseMenu")}
              onMouseLeave={handleDropdownLeave}
            >
              <div style={{ display: "inline-flex", alignItems: "center" }}>
                <Link
                  className={`nav-link ${pathname === "/courses" ? "is-active" : ""}`}
                  href="/courses"
                >
                  Courses
                </Link>
                <button
                  type="button"
                  className="nav-link nav-dropdown-trigger"
                  style={{ paddingLeft: "0.15rem", marginLeft: "-0.3rem" }}
                  onClick={() => toggleDropdownClick("courseMenu")}
                  aria-expanded={activeDropdown === "courseMenu"}
                  aria-haspopup="true"
                  aria-label="Toggle courses menu"
                >
                  <span className="dropdown-chevron" aria-hidden="true" />
                </button>
              </div>

              <div className="nav-dropdown-panel courses-dropdown-panel" role="region" aria-label="Courses directory">
                <div className="mega-columns-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
                              <div>
                                <span style={{ fontWeight: 600 }}>{item.label}</span>
                                {item.mode && (
                                  <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                                    {item.mode}
                                  </span>
                                )}
                              </div>
                              {item.badge && <span className="nav-badge">{item.badge}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="courses-panel-banner">
                  <span className="courses-banner-text">
                    📍 Indirapuram Campus + Live Interactive Online Mode available for every course
                  </span>
                  <Link
                    href="/courses"
                    onClick={() => setActiveDropdown(null)}
                    className="courses-banner-link"
                  >
                    View All Courses &amp; Batches →
                  </Link>
                </div>
              </div>
            </div>

            {/* Batches 2027 Mega Menu */}
            <div
              className={`nav-dropdown-wrapper ${activeDropdown === "batches" ? "is-open" : ""}`}
              onMouseEnter={() => handleDropdownEnter("batches")}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className="nav-link nav-dropdown-trigger"
                onClick={() => toggleDropdownClick("batches")}
                aria-expanded={activeDropdown === "batches"}
                aria-haspopup="true"
              >
                <span>Batches 2027</span>
                <span className="dropdown-chevron" aria-hidden="true" />
              </button>

              <div className="nav-mega-panel courses-panel" role="region" aria-label="Batches 2027 menu">
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

            {/* Test Series (Latest 2026-27) Two-Column Mega-Menu */}
            <div
              className={`nav-dropdown-wrapper ${activeDropdown === "testSeries" ? "is-open" : ""}`}
              onMouseEnter={() => handleDropdownEnter("testSeries")}
              onMouseLeave={handleDropdownLeave}
            >
              <div style={{ display: "inline-flex", alignItems: "center" }}>
                <Link
                  className={`nav-link ${pathname.startsWith("/test-series") ? "is-active" : ""}`}
                  href="/test-series"
                >
                  <span>Test Series</span>
                  <span className="nav-badge highlight-orange">Latest 2026-27</span>
                </Link>
                <button
                  type="button"
                  className="nav-link nav-dropdown-trigger"
                  style={{ paddingLeft: "0.15rem", marginLeft: "-0.3rem" }}
                  onClick={() => toggleDropdownClick("testSeries")}
                  aria-expanded={activeDropdown === "testSeries"}
                  aria-haspopup="true"
                  aria-label="Toggle test series menu"
                >
                  <span className="dropdown-chevron" aria-hidden="true" />
                </button>
              </div>

              <div className="nav-mega-panel test-series-mega-panel" role="region" aria-label="Test series latest 2026-27 menu">
                {/* Left Column: Category Tabs */}
                <div className="ts-mega-sidebar">
                  <div className="ts-mega-sidebar-title">Categories</div>
                  {testSeriesNavCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`ts-category-btn ${activeTestCategory === cat.id ? "is-active" : ""}`}
                      onMouseEnter={() => setActiveTestCategory(cat.id)}
                      onClick={() => setActiveTestCategory(cat.id)}
                    >
                      <div className="ts-category-label-group">
                        <span>{cat.name}</span>
                        {cat.badge && (
                          <span className={`nav-badge ${cat.badgeType === "free" ? "free" : cat.badgeType === "highlight" ? "highlight-orange" : ""}`}>
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <span className="ts-chevron" aria-hidden="true" />
                    </button>
                  ))}
                </div>

                {/* Right Flyout: Subcategories & Featured Tests */}
                <div className="ts-mega-content">
                  <div>
                    <div className="ts-content-header">
                      <div className="ts-content-heading-row">
                        <h4 className="ts-content-title">{activeCategoryData.name}</h4>
                        <Link
                          href={`/test-series?category=${activeCategoryData.slug}`}
                          onClick={() => setActiveDropdown(null)}
                          className="ts-view-all-link"
                        >
                          View All {activeCategoryData.name} Tests →
                        </Link>
                      </div>
                      <p className="ts-content-desc">{activeCategoryData.desc}</p>

                      <div className="ts-subcat-pills-row">
                        <span style={{ fontSize: "0.74rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Grades / Stream:</span>
                        {activeCategoryData.subcategories.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={() => setActiveDropdown(null)}
                            className="ts-subcat-pill"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="ts-tests-grid">
                      {activeCategoryData.featuredTests.map((test) => (
                        <Link
                          key={test.title}
                          href={test.href}
                          onClick={() => setActiveDropdown(null)}
                          className="ts-test-card"
                        >
                          <div>
                            <div className="ts-card-badge-row">
                              <span className={`nav-badge ${test.badgeType === "free" ? "free" : test.badgeType === "highlight" ? "highlight-orange" : ""}`}>
                                {test.badge}
                              </span>
                              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Mock Series</span>
                            </div>
                            <h5 className="ts-card-title">{test.title}</h5>
                            <div className="ts-card-stats">
                              <span>📊</span>
                              <span>{test.stats}</span>
                            </div>
                          </div>

                          <div className="ts-card-pricing-row">
                            <div className="ts-price-display">
                              <span className={`ts-price-sale ${test.isFree ? "free" : ""}`}>
                                {test.discountPrice || test.price}
                              </span>
                              {test.discountPrice && (
                                <span className="ts-price-mrp">{test.price}</span>
                              )}
                            </div>
                            <span className="ts-card-action">
                              {test.isFree ? "Enroll Free" : "Explore / Buy"} →
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="ts-content-footer">
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      All tests include real-time scoring, detailed accuracy heatmaps &amp; step-by-step solutions.
                    </span>
                    <Link
                      href="/test-series"
                      onClick={() => setActiveDropdown(null)}
                      className="ts-view-all-link"
                    >
                      Full Test Series Directory ↗
                    </Link>
                  </div>
                </div>
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

          {/* Desktop Right Actions: Contact, Cart & Role-Aware Auth */}
          <div className="site-header-actions">
            {/* Solid Orange Contact Button */}
            <Link className="button-contact-solid" href="/#contact">
              Contact
            </Link>

            {/* Shopping Cart Button */}
            <CartButton />

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
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Purchases &amp; Access
                      </Link>
                      <Link
                        href="/courses"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Explore Courses
                      </Link>
                      <Link
                        href="/test-series"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Test Series (Mocks)
                      </Link>
                    </div>
                    <div className="user-menu-footer">
                      <button
                        type="button"
                        className="sign-out-btn"
                        onClick={async () => {
                          try {
                            await signOut({ redirect: false });
                          } catch {
                            // ignore error
                          }
                          window.location.href = "/";
                        }}
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
            href="/courses"
            className={`mobile-nav-root-link ${pathname === "/courses" ? "is-active" : ""}`}
            onClick={() => setMobileDrawerOpen(false)}
          >
            📚 Courses
          </Link>

          {/* Batches 2027 Accordion */}
          <div className="mobile-accordion-group">
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggleAccordion("courses")}
              aria-expanded={mobileAccordion === "courses"}
            >
              <span>🎓 Batches 2027</span>
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

          {/* Test Series (Latest 2026-27) Accordion */}
          <div className="mobile-accordion-group">
            <button
              type="button"
              className="accordion-header"
              onClick={() => toggleAccordion("tests")}
              aria-expanded={mobileAccordion === "tests"}
            >
              <span>📝 Test Series (Latest 2026-27)</span>
              <span className={`accordion-icon ${mobileAccordion === "tests" ? "is-open" : ""}`}>▾</span>
            </button>
            {mobileAccordion === "tests" && (
              <div className="accordion-content">
                <Link
                  href="/test-series"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="accordion-sublink"
                  style={{ fontWeight: 700, color: "#0284c7", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.6rem" }}
                >
                  <span>Explore All Test Series ↗</span>
                  <span className="nav-badge highlight">Mocks</span>
                </Link>

                {testSeriesNavCategories.map((cat) => (
                  <div key={cat.id} style={{ marginTop: "0.6rem", marginBottom: "0.4rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", padding: "0.2rem 0.5rem" }}>
                      {cat.name}
                    </div>
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className="accordion-sublink"
                        style={{ paddingLeft: "1.2rem", fontSize: "0.82rem" }}
                      >
                        <span>{sub.label}</span>
                      </Link>
                    ))}
                  </div>
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