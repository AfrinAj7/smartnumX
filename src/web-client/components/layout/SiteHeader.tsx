"use client";

import Link from "next/link";
import { useState } from "react";
import { SmartNumWordmark } from "./SmartNumWordmark";

type SiteHeaderProps = {
  phone?: string;
  whatsappNumber?: string;
};

const menuGroups = [
  { title: "Academic & Foundational", items: ["Classes 9 & 10 Tuition", "Classes 11 & 12th Tuition", "Any Board Preparation", "Foundational Course"] },
  { title: "Competitive & Entrance Pathways", items: ["IIT-JEE Mains Prep", "IIT-JEE Advanced Prep", "Olympiads (Math & Science)", "Self-Paced Recorded Portal"] },
];

function whatsappHref(value?: string) {
  const number = value?.replace(/\D/g, "");
  return number ? `https://wa.me/${number}` : undefined;
}

export function SiteHeader({ phone = "+91 99589 47774", whatsappNumber = "+91 99589 47774" }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const whatsapp = whatsappHref(whatsappNumber);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <SmartNumWordmark suffix="" />

        <nav className="site-nav site-nav-desktop" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/#why-smartnum">Why SmartNum</Link>
          <details className="site-mega-menu">
            <summary>Programmes</summary>
            <div className="site-mega-panel">
              {menuGroups.map((group) => (
                <section key={group.title}>
                  <h2>{group.title}</h2>
                  {group.items.map((item) => <Link key={item} href="/#course-explorer">{item}</Link>)}
                </section>
              ))}
              <Link className="mega-feature" href="/#course-explorer">Explore all programmes <span aria-hidden="true">↗</span></Link>
            </div>
          </details>
          <Link href="/#demo-classes">Demo Classes</Link>
          <Link href="/#teachers">Expert Tutors</Link>
          <Link href="/#visit-us">Visit Campus</Link>
          <Link href="/#contact">Contact Us</Link>
        </nav>

        <div className="site-header-actions">
          {phone ? (
            <a className="button button-call" href={`tel:${phone.replace(/[^+\d]/g, "")}`}>
              <span className="call-icon" aria-hidden="true">📞</span> Call
            </a>
          ) : (
            <span className="button button-call site-placeholder">Call</span>
          )}
          <Link className="button button-demo" href="/#book-demo">
            Book Free Demo Class
          </Link>
          <Link className="site-signin" href="/sign-in">Sign in</Link>
        </div>

        <button
          className="mobile-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-site-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="menu-toggle-lines" aria-hidden="true"><i /><i /><i /></span>
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>
      </div>

      {menuOpen && (
        <nav className="mobile-site-menu" id="mobile-site-menu" aria-label="Mobile navigation">
          <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/#why-smartnum" onClick={() => setMenuOpen(false)}>Why SmartNum</Link>
          <Link href="/#course-explorer" onClick={() => setMenuOpen(false)}>Our Programmes</Link>
          <Link href="/#demo-classes" onClick={() => setMenuOpen(false)}>Demo Classes</Link>
          <Link href="/#teachers" onClick={() => setMenuOpen(false)}>Expert Tutors</Link>
          <Link href="/#visit-us" onClick={() => setMenuOpen(false)}>Visit Campus</Link>
          <Link href="/#contact" onClick={() => setMenuOpen(false)}>Contact Us</Link>
          {phone && (
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} onClick={() => setMenuOpen(false)}>
              📞 Call us
            </a>
          )}
          <Link href="/sign-in" onClick={() => setMenuOpen(false)}>Sign in</Link>
          {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>WhatsApp us</a>}
        </nav>
      )}
    </header>
  );
}