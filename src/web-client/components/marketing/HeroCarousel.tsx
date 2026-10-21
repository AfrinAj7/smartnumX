"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { HomepageContent } from "@/server/site-content/homepage";

type HeroSlide = HomepageContent["heroSlides"][number];

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[activeIndex];

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  function showSlide(index: number) {
    setActiveIndex((index + slides.length) % slides.length);
  }

  return (
    <section
      className="hero-section hero-full-cover"
      aria-label="SmartNum learning programmes"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      {/* Full-bleed background image covering the 2560x1034 hero container */}
      <div className="hero-bg-wrapper">
        {slide.imageUrl ? (
          <Image
            className="hero-bg-image"
            src={slide.imageUrl}
            alt={slide.imageAlt || "SmartNum Learning Space student classroom"}
            fill
            sizes="100vw"
            priority={activeIndex === 0}
            unoptimized
          />
        ) : (
          <div className="hero-bg-fallback" />
        )}
        <div className="hero-bg-overlay" />
      </div>

      {/* Left Edge Arrow Button */}
      {slides.length > 1 && (
        <button
          type="button"
          className="hero-nav-arrow hero-nav-prev"
          onClick={() => showSlide(activeIndex - 1)}
          aria-label="Previous slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {/* Right Edge Arrow Button */}
      {slides.length > 1 && (
        <button
          type="button"
          className="hero-nav-arrow hero-nav-next"
          onClick={() => showSlide(activeIndex + 1)}
          aria-label="Next slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      <div className="hero-content-container">
        <div className="hero-copy" aria-live="polite">
          <span className="section-kicker">{slide.eyebrow}</span>
          <h1>{slide.headline}</h1>
          <p className="hero-subtitle">{slide.copy}</p>
          <div className="hero-actions">
            <Link className="button button-demo" href="#book-demo">
              {slide.secondaryLabel || "Book a Free Demo Class"} <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button button-secondary" href="#course-explorer">
              {slide.primaryLabel || "Explore Programmes"}
            </Link>
          </div>

          <ul className="trust-chips" aria-label="Key SmartNum features">
            <li>Any Board (CBSE/ICSE/State/IB)</li>
            <li>Foundational &amp; Olympiads</li>
            <li>IIT-JEE Mains &amp; Advanced</li>
            <li>CCTV &amp; Smart Classrooms</li>
            <li>1:1 Doubt Sessions</li>
          </ul>
          <p className="hero-audience">📍 Indirapuram, Ghaziabad · Offline | Online Coaching</p>
        </div>

        <div className="hero-floating-card">
          <span className="section-kicker">Academic Excellence</span>
          <strong>Classes 9–12th · JEE &amp; Olympiads</strong>
          <span>Smart Classrooms · Small Batches</span>
        </div>
      </div>

      {/* Bottom Centered Carousel Indicator Dots */}
      {slides.length > 1 && (
        <div className="hero-dots-container" aria-label="Hero slides selection">
          <div className="hero-dots-bar">
            {slides.map((item, index) => (
              <button
                key={item.eyebrow || index}
                type="button"
                className={index === activeIndex ? "hero-dot is-active" : "hero-dot"}
                onClick={() => showSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
          <span className="hero-slide-badge">0{activeIndex + 1} / 0{slides.length}</span>
        </div>
      )}
    </section>
  );
}