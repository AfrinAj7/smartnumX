"use client";

import Image from "next/image";
import { useState } from "react";

type FeatureCategory = {
  id: string;
  tabLabel: string;
  icon: string;
  eyebrow: string;
  heading: string;
  description: string;
  checklist: string[];
  thumbnailUrl: string;
  youtubeId: string;
};

const whySmartNumFeatures: FeatureCategory[] = [
  {
    id: "conceptual-maths",
    tabLabel: "Conceptual Maths",
    icon: "∑",
    eyebrow: "VISUALIZING ABSTRACT MATHEMATICAL CONCEPTS",
    heading: "Hands-on Practical & Conceptual Maths",
    description:
      "We replace rote memorization with worked examples, geometric visualization, and step-by-step problem breakdown so students understand why formulas work.",
    checklist: [
      "Concept breakdown before numerical problem solving",
      "Interactive smart classroom visualizations",
      "Step-by-step worked solutions for complex topics",
    ],
    thumbnailUrl: "/images/smartnum images2.gif",
    youtubeId: "yXpQo9168C4",
  },
  {
    id: "cctv-safety",
    tabLabel: "Smart Class & CCTV",
    icon: "🏛️",
    eyebrow: "SAFETY, TRANSPARENCY & FOCUSED LEARNING",
    heading: "Safe CCTV-Enabled Campus & Smart Class",
    description:
      "Air-conditioned smart classrooms equipped with 24/7 CCTV surveillance ensure a comfortable, secure, and focused learning environment for every learner in Indirapuram.",
    checklist: [
      "Full CCTV coverage across all learning spaces",
      "Air-conditioned smart classrooms with digital boards",
      "Transparent learning spaces for parent peace of mind",
    ],
    thumbnailUrl: "/images/smartnum images2.gif",
    youtubeId: "yXpQo9168C4",
  },
  {
    id: "worksheets",
    tabLabel: "Curated Worksheets",
    icon: "📝",
    eyebrow: "PURPOSEFUL PRACTICE TAILORED TO BOARDS",
    heading: "Worksheets & Periodic Practice Sets",
    description:
      "Curated study material, chapter-wise worksheets, and homework review sets designed specifically for CBSE, ICSE, State Boards, and competitive exams.",
    checklist: [
      "Chapter-wise curated practice worksheets",
      "NCERT & Board exam past paper practice",
      "Graded difficulty levels from basic to advanced",
    ],
    thumbnailUrl: "/images/smartnum images2.gif",
    youtubeId: "yXpQo9168C4",
  },
  {
    id: "report-cards",
    tabLabel: "Progress Cards",
    icon: "📊",
    eyebrow: "DATA-DRIVEN PERFORMANCE TRACKING",
    heading: "Personalised Progress Report Cards",
    description:
      "Every student receives a tailor-made progress card tracking attendance, test scores, strength areas, and topics needing extra attention.",
    checklist: [
      "Monthly performance and progress report cards",
      "Attendance and test score tracking",
      "Actionable recommendations for improvement",
    ],
    thumbnailUrl: "/images/smartnum images2.gif",
    youtubeId: "yXpQo9168C4",
  },
  {
    id: "doubt-sessions",
    tabLabel: "1-on-1 Doubts & Mocks",
    icon: "🎯",
    eyebrow: "DEDICATED INDIVIDUAL SUPPORT",
    heading: "Mock Exams & 1-on-1 Doubt Sessions",
    description:
      "Regular exam-pattern mock tests combined with one-to-one doubt clearing sessions ensure students walk into exam halls with absolute confidence.",
    checklist: [
      "Dedicated 1-on-1 doubt clearing appointments",
      "Board & IIT-JEE pattern mock examination series",
      "Detailed answer key breakdown and error analysis",
    ],
    thumbnailUrl: "/images/smartnum images2.gif",
    youtubeId: "yXpQo9168C4",
  },
];

export function WhySmartNumTabs() {
  // Default to the CCTV safety & smart class tab per specification requirement #6
  const [activeTabId, setActiveTabId] = useState<string>("cctv-safety");
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  const activeFeature =
    whySmartNumFeatures.find((item) => item.id === activeTabId) ?? whySmartNumFeatures[1];

  function handleTabSelect(id: string) {
    setActiveTabId(id);
    setIsPlayingVideo(false);
  }

  return (
    <div className="why-smartnum-wrapper">
      {/* 5 Feature Navigation Tabs in a single, well-aligned row */}
      <div
        className="why-feature-tabs-row"
        role="tablist"
        aria-label="SmartNum Academic Excellence Categories"
      >
        {whySmartNumFeatures.map((item) => {
          const isSelected = activeTabId === item.id;
          const tabId = `why-tab-${item.id}`;
          const panelId = `why-panel-${item.id}`;

          return (
            <button
              key={item.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              className={`why-feature-tab ${isSelected ? "is-active" : ""}`}
              onClick={() => handleTabSelect(item.id)}
            >
              <span className="tab-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="tab-label">{item.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Main 16:9 Presentation Card (2 Columns: ~48% Text, ~52% Video) */}
      <div
        id={`why-panel-${activeFeature.id}`}
        role="tabpanel"
        aria-labelledby={`why-tab-${activeFeature.id}`}
        className="why-content-card"
      >
        {/* Left Column (Text, Heading, Checklist, CTA) */}
        <div className="why-card-text-col">
          <span className="why-card-eyebrow">{activeFeature.eyebrow}</span>
          <h3 className="why-card-heading">{activeFeature.heading}</h3>
          <p className="why-card-desc">{activeFeature.description}</p>

          <ul className="why-checklist" aria-label="Feature highlights">
            {activeFeature.checklist.map((highlight) => (
              <li key={highlight}>
                <span className="gold-check-icon" aria-hidden="true">
                  ✓
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          <div className="why-cta-wrap">
            <a className="button-gold-cta" href="#book-demo">
              Book a Free Demo Class <span className="btn-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Right Column (16:9 Video Presentation) */}
        <div className="why-card-video-col">
          <div className="why-video-box">
            {isPlayingVideo ? (
              <div className="why-video-active-frame">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeFeature.youtubeId}?autoplay=1&rel=0`}
                  title={`${activeFeature.heading} video player`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="why-video-iframe"
                />
                <button
                  type="button"
                  className="why-video-close-btn"
                  onClick={() => setIsPlayingVideo(false)}
                  aria-label="Close video and return to preview"
                >
                  ✕ Close
                </button>
              </div>
            ) : (
              <div className="why-video-poster-box">
                <Image
                  src={activeFeature.thumbnailUrl}
                  alt={`${activeFeature.heading} classroom preview`}
                  fill
                  className="why-video-poster-img"
                  sizes="(max-width: 900px) 100vw, 620px"
                  priority
                />
                <div className="why-video-gradient-overlay" />

                {/* Elegant "Watch Our Teaching Approach" Badge */}
                <span className="why-watch-badge">
                  <span className="badge-play-icon" aria-hidden="true">
                    ▶
                  </span>
                  Watch Our Teaching Approach
                </span>

                {/* Centered Golden Play Button */}
                <button
                  type="button"
                  className="why-center-play-btn"
                  onClick={() => setIsPlayingVideo(true)}
                  aria-label={`Play video: ${activeFeature.heading}`}
                >
                  <span className="play-triangle" aria-hidden="true">
                    ▶
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
