"use client";

import { useState } from "react";

type SubjectChip = "mathematics" | "reasoning" | "stem";

interface ProgrammeCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  bestFor: string;
  highlights: string[];
  icon: string;
}

const mathProgrammes: ProgrammeCard[] = [
  {
    id: "classes-9-12",
    badge: "School & Board Prep",
    title: "Classes 9–12 · Any board",
    description:
      "Stay on top of your school syllabus, whichever board you’re in. Concepts are explained in plain language, then practised until they stick.",
    bestFor: "students who want strong marks and fewer last-minute panics.",
    highlights: [
      "CBSE, ICSE / ISC & State Boards",
      "NCERT & exemplar step-by-step",
      "Chapter-wise practice & revision sets",
    ],
    icon: "📐",
  },
  {
    id: "foundation",
    badge: "Early Edge & Concepts",
    title: "Foundation courses",
    description:
      "Build the basics properly, so tougher topics feel easier later. We go slowly where it matters and don’t skip the “why”.",
    bestFor: "students who want a solid base before Class 11 or competitive exams.",
    highlights: [
      "First-principles conceptual clarity",
      "Algebraic & geometric foundations",
      "Smooth transition to higher-level maths",
    ],
    icon: "🏛️",
  },
  {
    id: "iit-jee",
    badge: "Competitive Excellence",
    title: "IIT-JEE Main & Advanced",
    description:
      "Concept-first teaching, then problem practice at JEE level. Mock tests show where you’re losing marks, so you know what to fix next.",
    bestFor: "aspirants who want a structured plan, not random practice.",
    highlights: [
      "JEE Main & Advanced problem sets",
      "Rank & weak-spot diagnostics",
      "High-yield mock exam series",
    ],
    icon: "⚡",
  },
  {
    id: "olympiads",
    badge: "Advanced Problem Solving",
    title: "Olympiads",
    description:
      "Go beyond the textbook with puzzles and problems that make you think. It’s maths for the curious.",
    bestFor: "students who enjoy a challenge and want to stretch themselves.",
    highlights: [
      "IOQM, PRMO & AMC preparation",
      "Puzzles & non-routine problem solving",
      "Deep mathematical curiosity & stretch",
    ],
    icon: "🏆",
  },
];

const reasoningProgrammes: ProgrammeCard[] = [
  {
    id: "logical-reasoning",
    badge: "Aptitude & Logic",
    title: "Logical & Analytical Reasoning",
    description:
      "Master pattern recognition, deductive logic, and structured analytical problem solving for school olympiads, NTSE, and competitive aptitude.",
    bestFor: "students preparing for competitive aptitude exams and critical thinking benchmarks.",
    highlights: [
      "Pattern discovery & syllogisms",
      "Non-verbal reasoning & spatial intuition",
      "Timed puzzle workouts & test practice",
    ],
    icon: "🧩",
  },
];

const stemProgrammes: ProgrammeCard[] = [
  {
    id: "stem-labs",
    badge: "Coming Soon",
    title: "Hands-on STEM & Applied Mathematics",
    description:
      "Integrating practical physics, algorithmic thinking, and visual mathematics into applied projects. Currently under curriculum development.",
    bestFor: "learners curious about the intersection of mathematics, coding, and real-world science.",
    highlights: [
      "Simulation-based mathematical experiments",
      "Algorithmic & computational thinking",
      "Pre-registration open for upcoming cohort",
    ],
    icon: "🔬",
  },
];

export function CourseExplorer() {
  const [activeSubject, setActiveSubject] = useState<SubjectChip>("mathematics");

  const displayedProgrammes =
    activeSubject === "mathematics"
      ? mathProgrammes
      : activeSubject === "reasoning"
      ? reasoningProgrammes
      : stemProgrammes;

  return (
    <div className="course-explorer course-explorer-redesign">
      {/* Subject Chips Bar */}
      <div
        className="subject-chips-bar"
        role="tablist"
        aria-label="Select subject stream"
      >
        <button
          type="button"
          role="tab"
          id="chip-math"
          aria-selected={activeSubject === "mathematics"}
          aria-controls="programmes-grid-panel"
          className={`subject-chip-btn ${activeSubject === "mathematics" ? "is-active" : ""}`}
          onClick={() => setActiveSubject("mathematics")}
        >
          <span className="chip-icon" aria-hidden="true">∑</span>
          <span>Mathematics</span>
        </button>

        <button
          type="button"
          role="tab"
          id="chip-reasoning"
          aria-selected={activeSubject === "reasoning"}
          aria-controls="programmes-grid-panel"
          className={`subject-chip-btn ${activeSubject === "reasoning" ? "is-active" : ""}`}
          onClick={() => setActiveSubject("reasoning")}
        >
          <span className="chip-icon" aria-hidden="true">🧩</span>
          <span>Reasoning</span>
        </button>

        <button
          type="button"
          role="tab"
          id="chip-stem"
          aria-selected={activeSubject === "stem"}
          aria-controls="programmes-grid-panel"
          className={`subject-chip-btn chip-stem ${activeSubject === "stem" ? "is-active" : ""}`}
          onClick={() => setActiveSubject("stem")}
        >
          <span className="chip-icon" aria-hidden="true">🔬</span>
          <span>STEM</span>
          <span className="chip-soon-badge">coming soon</span>
        </button>
      </div>

      {/* Programme Cards Grid */}
      <div
        id="programmes-grid-panel"
        role="tabpanel"
        aria-labelledby={`chip-${activeSubject}`}
        className={`programmes-cards-grid grid-count-${displayedProgrammes.length}`}
      >
        {displayedProgrammes.map((prog) => (
          <article className="programme-feature-card" key={prog.id}>
            <div className="card-top-meta">
              <span className="prog-badge">{prog.badge}</span>
              <span className="prog-icon" aria-hidden="true">{prog.icon}</span>
            </div>

            <h3 className="prog-title">{prog.title}</h3>
            <p className="prog-desc">{prog.description}</p>

            {/* Best for Callout Box */}
            <div className="prog-best-for-box">
              <span className="best-for-tag">Best for:</span>
              <span className="best-for-text">{prog.bestFor}</span>
            </div>

            {/* Highlights List */}
            <ul className="prog-highlights-list" aria-label="Curriculum highlights">
              {prog.highlights.map((item) => (
                <li key={item}>
                  <span className="highlight-bullet" aria-hidden="true">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="card-action-row">
              <a className="card-explore-link" href="#book-demo">
                Explore syllabus <span className="arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Small Secondary Links Under Cards */}
      <div className="programme-secondary-links-row">
        <span className="secondary-links-label">Also exploring:</span>
        <a className="secondary-chip-link" href="#book-demo">
          <span className="sec-icon" aria-hidden="true">📝</span>
          <span>Mock tests and test series</span>
          <span className="sec-arrow" aria-hidden="true">↗</span>
        </a>
        <span className="secondary-links-dot" aria-hidden="true">•</span>
        <a className="secondary-chip-link" href="#book-demo">
          <span className="sec-icon" aria-hidden="true">📚</span>
          <span>Free resources</span>
          <span className="sec-arrow" aria-hidden="true">↗</span>
        </a>
      </div>

      {/* How You'll Learn Strip (Replaces the "to confirm" table) */}
      <div className="how-you-learn-strip">
        <div className="how-you-learn-content">
          <span className="how-badge">
            <span className="how-dot" aria-hidden="true" />
            How you’ll learn:
          </span>
          <span className="how-text">
            recorded video lessons, notes, practice tests and progress tracking.
          </span>
        </div>
      </div>

      {/* Call to Action Area */}
      <div className="explore-cta-area">
        <div className="explore-cta-button-group">
          <a className="button-gold-cta" href="#book-demo">
            Book a free demo class <span className="btn-arrow" aria-hidden="true">→</span>
          </a>
          <a className="button-soft-choice" href="#book-demo">
            Help me choose <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="explore-cta-subtext">
          <span className="cta-check-symbol" aria-hidden="true">✓</span>
          No payment needed. Just tell us your class and goal.
        </p>
      </div>
    </div>
  );
}