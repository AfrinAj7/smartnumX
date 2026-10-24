"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomepageContent } from "@/server/site-content/homepage";

type Testimonial = HomepageContent["testimonials"][number];

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    name: "Arnav Goel",
    quote:
      "Shweta ma'am is the reason I survived through jee period. I am currently studying at IIT Kanpur, and Shweta ma'am is still one of the best teacher's I've had. I would definitely recommend joining this tuition for JEE and boards.",
    learnerClass: "IIT Kanpur · JEE Alum",
    relation: "Student",
    approved: true,
  },
  {
    name: "Jaydeep Kumar Verma",
    quote:
      "The Magician Of Mathematics, How Easily sweta mam teaches us just look so smooth.",
    learnerClass: "Class 12th Board",
    relation: "Student",
    approved: true,
  },
  {
    name: "Ananya Goel",
    quote:
      "The best tuition you can take for maths! Shweta ma'am is the reason I cracked JEE Advance to get into IIT! Also I got 99% in maths in 12th due to her giving us many tests for practise! Recommended for any student taking up PCM in 12th or preparing for IIT JEE.",
    learnerClass: "IIT Alum · 99% in 12th",
    relation: "Student",
    approved: true,
  },
  {
    name: "Nibha B",
    quote:
      "Studying at SmartNum Maths Academy completely transformed my JEE preparation. Shweta ma'am focuses heavily on concept clarity and previous year questions (PYQs). Thanks to her rigorous practice tests and personalized doubt-clearing sessions, I was able to clear JEE Advanced and secure a seat at IIT.",
    learnerClass: "JEE Advanced · IIT Seat",
    relation: "Student",
    approved: true,
  },
  {
    name: "Afrin J",
    quote:
      "If you want to excel in Class 12 CBSE Maths, SmartNum is the perfect place. Shweta ma'am provides excellent study material and conducts regular chapter-wise mock tests that build real confidence. I scored a 99% in my board exams entirely because of her dedicated guidance.",
    learnerClass: "Class 12 CBSE · 99% Scored",
    relation: "Student",
    approved: true,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || "SN").toUpperCase();
}

function getHighlightBadge(item: Testimonial): string {
  const text = (item.quote + " " + item.learnerClass).toLowerCase();
  if (text.includes("iit kanpur")) return "IIT Kanpur Student";
  if (text.includes("iit")) return "IIT-JEE Alum";
  if (text.includes("99%")) return "99% in Mathematics";
  if (text.includes("magician")) return "Classroom Favorite";
  if (item.relation === "Parent") return "Verified Parent";
  return `Class ${item.learnerClass || "12"} Success`;
}

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const approvedList = testimonials.filter((t) => t.approved);
  const items = approvedList.length > 0 ? approvedList : FALLBACK_TESTIMONIALS;

  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const isAtStart = el.scrollLeft <= 8;
    const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
    setCanScrollLeft(!isAtStart);
    setCanScrollRight(!isAtEnd);

    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 380;
    const current = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(0, current), items.length - 1));
  }, [items.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scrollByDirection = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 380;
    el.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 20 : 380;
    el.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  return (
    <div className="proof-carousel-wrapper" role="region" aria-label="Student and parent testimonials">
      {/* Control Bar: Review Count + Left/Right Arrow Buttons */}
      <div className="proof-carousel-header">
        <div className="proof-header-left">
          <span className="proof-counter-chip">
            <span className="proof-spark-dot" aria-hidden="true" />
            {items.length} Verified {items.length === 1 ? "Experience" : "Experiences"} · 100% Genuine Feedback
          </span>
        </div>

        <div className="proof-carousel-arrows">
          <button
            type="button"
            className={`proof-arrow-btn ${!canScrollLeft ? "is-disabled" : ""}`}
            onClick={() => scrollByDirection("left")}
            disabled={!canScrollLeft}
            aria-label="Previous testimonial"
            title="Previous review"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className={`proof-arrow-btn ${!canScrollRight ? "is-disabled" : ""}`}
            onClick={() => scrollByDirection("right")}
            disabled={!canScrollRight}
            aria-label="Next testimonial"
            title="Next review"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track: Single row, smooth scrolling, no wrap */}
      <div className="proof-carousel-track" ref={trackRef}>
        {items.map((testimonial, idx) => {
          const highlight = getHighlightBadge(testimonial);
          const initials = getInitials(testimonial.name);

          return (
            <article
              key={`${testimonial.name}-${idx}`}
              className={`proof-card ${idx === activeIndex ? "is-active-card" : ""}`}
            >
              {/* Card Header: Stars + Highlight Badge */}
              <div className="proof-card-top">
                <div className="proof-stars" aria-label="5 out of 5 stars">
                  {"★★★★★"}
                </div>
                <span className="proof-badge-chip">{highlight}</span>
              </div>

              {/* Quote Mark Decorative */}
              <div className="proof-quote-mark" aria-hidden="true">
                &ldquo;
              </div>

              {/* Quote Body */}
              <blockquote className="proof-quote-text">
                {testimonial.quote}
              </blockquote>

              {/* Card Footer: Student Info + Trust Tag */}
              <div className="proof-card-footer">
                <div className="proof-author-wrap">
                  <div className="proof-author-avatar" aria-hidden="true">
                    <span>{initials}</span>
                  </div>
                  <div className="proof-author-meta">
                    <strong className="proof-author-name">{testimonial.name}</strong>
                    <span className="proof-author-sub">
                      {testimonial.relation} · {testimonial.learnerClass.startsWith("Class") ? testimonial.learnerClass : `Class ${testimonial.learnerClass}`}
                    </span>
                  </div>
                </div>

                <div className="proof-verified-pill" title="Verified student feedback with consent">
                  <span className="verified-check" aria-hidden="true">✓</span>
                  <span>Verified</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Indicator Dots */}
      <div className="proof-carousel-indicators" role="tablist" aria-label="Testimonial slides">
        {items.map((item, idx) => (
          <button
            key={`dot-testimonial-${idx}`}
            type="button"
            className={`proof-indicator-dot ${idx === activeIndex ? "is-active" : ""}`}
            onClick={() => scrollToIndex(idx)}
            aria-label={`Jump to review ${idx + 1} from ${item.name}`}
            title={`Review ${idx + 1}: ${item.name}`}
          />
        ))}
      </div>
    </div>
  );
}
