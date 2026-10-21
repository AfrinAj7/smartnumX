"use client";

import { useEffect } from "react";

export function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const selector = [
      ".section-heading",
      ".steps-header-row",
      ".steps-grid > .step-item",
      ".why-section-inner",
      ".course-explorer",
      ".programme-card-grid > .programme-card",
      ".curriculum-card-grid > .curriculum-card",
      ".demo-video-grid > .demo-video-card",
      ".demo-section",
      ".about-section",
      ".proof-grid > .proof-placeholder",
      ".teacher-grid > .teacher-placeholder",
      ".faq-section",
      ".visit-us-grid > div",
      ".final-cta-section",
      ".reveal-on-scroll",
    ].join(",");

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

    elements.forEach((el) => {
      el.classList.add("reveal-on-scroll");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.1,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
