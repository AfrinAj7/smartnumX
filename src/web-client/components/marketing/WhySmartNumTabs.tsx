"use client";

import Image from "next/image";
import { useState } from "react";

type FeatureTab = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  icon: string;
};

const whySmartNumFeatures: FeatureTab[] = [
  {
    id: "hands-on",
    title: "Hands-on Practical & Conceptual Maths",
    subtitle: "Visualizing abstract mathematical concepts",
    description:
      "We replace rote memorization with worked examples, geometric visualization, and step-by-step problem breakdown so students understand why formulas work.",
    highlights: [
      "Concept breakdown before numerical problem solving",
      "Interactive smart classroom visualizations",
      "Step-by-step worked solutions for complex topics",
    ],
    icon: "∑",
  },
  {
    id: "cctv-safety",
    title: "Safe CCTV-Enabled Campus Smart Class",
    subtitle: "Complete safety, transparency, and comfort",
    description:
      "Air-conditioned smart classrooms equipped with 24/7 CCTV surveillance ensure a comfortable, secure, and focused environment for every learner.",
    highlights: [
      "Full CCTV coverage across all learning spaces",
      "Air-conditioned smart classrooms with digital aids",
      "Transparent environment for parent peace of mind",
    ],
    icon: "🏛️",
  },
  {
    id: "worksheets",
    title: "Worksheets & Periodic Practice Sets",
    subtitle: "Purposeful practice tailored to board syllabus",
    description:
      "Curated study material, chapter-wise worksheets, and homework review sets designed specifically for CBSE, ICSE, State Boards, and competitive exams.",
    highlights: [
      "Chapter-wise curated practice worksheets",
      "NCERT & Board exam past paper practice",
      "Graded difficulty levels from basic to advanced",
    ],
    icon: "📝",
  },
  {
    id: "report-cards",
    title: "Personalised Progress Report Cards",
    subtitle: "Data-driven performance tracking for each student",
    description:
      "Every student receives a tailor-made progress card tracking attendance, test scores, strength areas, and topics needing extra attention.",
    highlights: [
      "Monthly performance and progress report cards",
      "Attendance and test score tracking",
      "Actionable recommendations for improvement",
    ],
    icon: "📊",
  },
  {
    id: "doubt-sessions",
    title: "Mock Exams & 1-on-1 Doubt Sessions",
    subtitle: "Dedicated individual support before every exam",
    description:
      "Regular exam-pattern mock tests combined with one-to-one doubt clearing sessions ensure students walk into exam halls with absolute confidence.",
    highlights: [
      "Dedicated 1-on-1 doubt clearing appointments",
      "Board & IIT-JEE pattern mock examination series",
      "Detailed answer key breakdown and error analysis",
    ],
    icon: "🎯",
  },
];

export function WhySmartNumTabs() {
  const [activeTabId, setActiveTabId] = useState<string>("hands-on");
  const [openMobileAccordion, setOpenMobileAccordion] = useState<string>("hands-on");

  const activeFeature = whySmartNumFeatures.find((item) => item.id === activeTabId) ?? whySmartNumFeatures[0];

  return (
    <div className="why-smartnum-wrapper">
      {/* Desktop Tabs Navigation */}
      <div className="why-desktop-tabs" role="tablist" aria-label="Why choose SmartNum">
        {whySmartNumFeatures.map((item) => {
          const tabId = `why-tab-${item.id}`;
          const panelId = `why-panel-${item.id}`;
          const isSelected = activeTabId === item.id;

          return (
            <button
              key={`tab-btn-${item.id}`}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              className={isSelected ? "why-tab-btn is-active" : "why-tab-btn"}
              onClick={() => setActiveTabId(item.id)}
            >
              <span className="why-tab-icon" aria-hidden="true">{item.icon}</span>
              <span className="why-tab-text">{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Tab Panel */}
      <div
        id={`why-panel-${activeFeature.id}`}
        role="tabpanel"
        aria-labelledby={`why-tab-${activeFeature.id}`}
        className="why-desktop-panel"
      >
        <div className="why-panel-content">
          <span className="section-kicker">{activeFeature.subtitle}</span>
          <h3>{activeFeature.title}</h3>
          <p>{activeFeature.description}</p>
          <ul className="why-highlights-list">
            {activeFeature.highlights.map((highlight) => (
              <li key={highlight}>
                <span className="check-mark" aria-hidden="true">✓</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
          <a className="button button-demo" href="#book-demo">
            Book a free demo class <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="why-panel-visual">
          <Image
            className="why-visual-bg"
            src="/images/smartnum images2.gif"
            alt="SmartNum Air-conditioned Smart Classroom Indirapuram"
            fill
            sizes="380px"
            unoptimized
          />
        </div>

        {/* Mobile Accordion (Different Unique DOM IDs) */}
        <div className="why-mobile-accordion" aria-label="Why choose SmartNum accordion">
          {whySmartNumFeatures.map((item) => {
            const accBtnId = `why-acc-btn-${item.id}`;
            const accPanelId = `why-acc-panel-${item.id}`;
            const isOpen = openMobileAccordion === item.id;

            return (
              <div key={`acc-item-${item.id}`} className={isOpen ? "why-acc-item is-open" : "why-acc-item"}>
                <button
                  id={accBtnId}
                  type="button"
                  className="why-acc-header"
                  aria-expanded={isOpen}
                  aria-controls={accPanelId}
                  onClick={() => setOpenMobileAccordion(isOpen ? "" : item.id)}
                >
                  <span className="why-acc-title">
                    <span className="why-acc-icon" aria-hidden="true">{item.icon}</span>
                    {item.title}
                  </span>
                  <span className="why-acc-chevron" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div id={accPanelId} role="region" aria-labelledby={accBtnId} className="why-acc-body">
                    <span className="section-kicker">{item.subtitle}</span>
                    <p>{item.description}</p>
                    <ul className="why-highlights-list">
                      {item.highlights.map((highlight) => (
                        <li key={`acc-${item.id}-${highlight}`}>
                          <span className="check-mark" aria-hidden="true">✓</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    <a className="button button-demo button-sm" href="#book-demo">
                      Book a free demo
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
