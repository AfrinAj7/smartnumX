"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HomepageContent } from "@/server/site-content/homepage";

type Faculty = HomepageContent["faculty"][number];
type DemoVideo = HomepageContent["demoVideos"][number];

function getYoutubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") videoId = url.pathname.slice(1);
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") ?? "";
      if (/^\/(embed|shorts)\//.test(url.pathname)) videoId = url.pathname.split("/")[2] ?? "";
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      : "";
  } catch {
    return "";
  }
}

function getFacultyVideoConcepts(video: DemoVideo): string[] {
  const title = video.title.toLowerCase();
  const subj = video.subject.toLowerCase();

  if (title.includes("matrices") || title.includes("determinant")) {
    return [
      "Row & column elementary transformations with intuitive geometric meaning",
      "Properties of determinants & calculating inverse without computational errors",
      "Cramer's Rule & solving system of linear equations for CBSE Board 6-markers",
      "Previous Year JEE Main & Advanced trap questions and determinant symmetry tricks",
    ];
  }
  if (title.includes("binomial")) {
    return [
      "First-principles derivation of binomial expansion and general term T_(r+1)",
      "Finding middle terms, greatest binomial coefficients, and term independent of x",
      "Series summation involving binomial coefficients using differentiation and integration",
      "High-yield shortcut formulas for competitive JEE Main & Advanced speed",
    ];
  }
  if (title.includes("complex")) {
    return [
      "Geometric interpretation of complex numbers on Argand plane & Euler's form",
      "Modulus-argument inequalities and loci representation in 2D geometry",
      "De Moivre's Theorem and cube roots of unity (1, ω, ω²) problem synthesis",
      "Step-by-step solutions of high-frequency JEE Advanced multi-concept problems",
    ];
  }
  if (title.includes("calculus") || title.includes("limits")) {
    return [
      "Limits from first principles and graphical interpretation of continuity",
      "L'Hôpital's rule versus algebraic rationalization & standard expansions",
      "Differentiability tests and tangent slope visualization on Cartesian plane",
      "Board exam presentation format and JEE speed shortcuts",
    ];
  }
  return [
    `Core theoretical foundation for ${video.subject} (${video.classLabel})`,
    "Conceptual derivations from first principles without rote memorization",
    "Identifying tricky board exam traps and negative-marking pitfalls",
    "Past 10 years question pattern breakdown and step-by-step solutions",
  ];
}

const DEFAULT_COMPANION_FACULTY: Faculty[] = [
  {
    name: "Dr. Sweta Agrawal",
    subject: "Higher Mathematics & Competitive Exams",
    qualification: "Ph.D. | M.Sc in Mathematics | Assistant Professor | Lead Educator",
    experience:
      "Accomplished mathematician and researcher with a Ph.D. in Mathematics and extensive academic experience as an Assistant Professor. She specializes in breaking down complex concepts for Board exams, IIT-JEE Mains & Advanced, and Olympiad aspirants through conceptual clarity and first principles.",
    photoUrl:
      "https://content.jdmagicbox.com/v2/comp/meerut/y7/9999px121.x121.240511122551.s5y7/catalogue/dr-shweta-agarwal-garh-rd-meerut-meerut-cancer-hospitals-pftrp2h0ro.jpg",
    approved: true,
  },
  {
    name: "Senior JEE Problem-Solving Specialist",
    subject: "Advanced Mathematics & JEE Mains / Advanced",
    qualification: "M.Tech / M.Sc Mathematics · 10+ Years Mentorship",
    experience:
      "Specialized in multi-concept synthesis linking coordinate geometry, algebra, and vectors. Expert in error-reduction techniques and time management strategies for IIT-JEE aspirants.",
    photoUrl: "/images/why-smartnum-tutor.jpg",
    approved: true,
  },
  {
    name: "Foundation & Olympiad Mentor",
    subject: "Mathematics & Logical Reasoning (Classes 9–10)",
    qualification: "B.Tech & Olympiad Coach · 8+ Years Experience",
    experience:
      "Dedicated to building rock-solid mathematical intuition for Classes 9 and 10 students. Focuses on elimination of fear in algebra, geometry proofs, and Olympiad-level puzzle solving.",
    photoUrl: "/images/Confident Mathematics Teacher Portrait.png",
    approved: true,
  },
];

export function FacultyCarousel({
  faculty,
  videos,
}: {
  faculty: Faculty[];
  videos: DemoVideo[];
}) {
  const approvedFaculty = faculty.filter((f) => f.approved);
  const facultyList =
    approvedFaculty.length >= 2
      ? approvedFaculty
      : approvedFaculty.length === 1
      ? [
          approvedFaculty[0],
          ...DEFAULT_COMPANION_FACULTY.filter(
            (c) => c.name !== approvedFaculty[0].name
          ),
        ]
      : DEFAULT_COMPANION_FACULTY;

  const publishedVideos = videos.filter((v) => v.published);
  const videoList =
    publishedVideos.length > 0
      ? publishedVideos
      : [
          {
            title: "Zero To Hero Matrices & Determinants | Class 12 JEE 2027",
            subject: "Mathematics",
            classLabel: "Class 12 · JEE",
            videoUrl: "https://youtu.be/56ojjVBFb1M?si=9QYI-T5l64bE-bBN",
            thumbnailUrl:
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRo8pubcGyPp1EywtxW-H7QDgq7hu3qc7iKrlOazlCgQQ&s=10",
            altText: "Matrices and determinants lecture preview",
            published: true,
          },
          {
            title: "Binomial Theorem COMPLETE Concepts | JEE 2027",
            subject: "Maths",
            classLabel: "IIT JEE",
            videoUrl: "https://www.youtube.com/watch?v=wHScZKwUXcg",
            thumbnailUrl:
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWdhBtT278XOAIF3GzXe5NVBaPio1-AINagdVXqw_C_g&s=10",
            altText: "Binomial theorem lecture preview",
            published: true,
          },
          {
            title: "Determinants Tricks & Shortcuts | JEE Main + Advanced",
            subject: "Maths",
            classLabel: "JEE",
            videoUrl: "https://youtu.be/79_rE0QQcLY?si=pxI6yGGdev_SI2ej",
            thumbnailUrl: "https://i.ytimg.com/vi/2Dbf7HiM9V0/maxresdefault.jpg",
            altText: "Determinants tricks lecture preview",
            published: true,
          },
          {
            title: "Complex Numbers Important JEE Questions with Solutions",
            subject: "Mathematics",
            classLabel: "Class 12 Maths",
            videoUrl: "https://www.youtube.com/watch?v=0F2Y6fjYFbg",
            thumbnailUrl: "https://i.ytimg.com/vi/0F2Y6fjYFbg/maxresdefault.jpg",
            altText: "Complex numbers lecture preview",
            published: true,
          },
        ];

  const trackRef = useRef<HTMLDivElement>(null);
  const accordionsSectionRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeFacultyIndex, setActiveFacultyIndex] = useState(0);
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(0);
  const [activeVideoModal, setActiveVideoModal] = useState<DemoVideo | null>(null);

  useEffect(() => {
    const element = dialogRef.current;
    if (!element) return;
    if (activeVideoModal && !element.open) {
      element.showModal();
    }
    if (!activeVideoModal && element.open) {
      element.close();
    }
  }, [activeVideoModal]);

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const isAtStart = el.scrollLeft <= 8;
    const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
    setCanScrollLeft(!isAtStart);
    setCanScrollRight(!isAtEnd);

    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 380;
    const current = Math.round(el.scrollLeft / cardWidth);
    setActiveFacultyIndex(
      Math.min(Math.max(0, current), Math.max(0, facultyList.length - 1))
    );
  };

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
  }, [facultyList.length]);

  const scrollByDirection = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 380;
    el.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 380;
    el.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
    setActiveFacultyIndex(index);
  };

  const toggleAccordion = (index: number) => {
    setOpenAccordionIndex((prev) => (prev === index ? null : index));
  };

  const scrollToMasterclasses = (videoIndex = 0) => {
    setOpenAccordionIndex(videoIndex);
    accordionsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="faculty-showcase-wrapper" role="region" aria-label="SmartNum Faculty & Masterclasses">
      {/* 1. TOP CAROUSEL CONTROLS */}
      <div className="faculty-carousel-header">
        <div className="faculty-meta-wrap">
          <span className="faculty-count-chip">
            <span className="faculty-spark-dot" aria-hidden="true" />
            {facultyList.length} Academic Mentors · Ph.D. &amp; Subject Specialists
          </span>
        </div>

        <div className="faculty-carousel-arrows">
          <button
            type="button"
            className={`faculty-arrow-btn ${!canScrollLeft ? "is-disabled" : ""}`}
            onClick={() => scrollByDirection("left")}
            disabled={!canScrollLeft}
            aria-label="Previous faculty member"
            title="Previous mentor"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className={`faculty-arrow-btn ${!canScrollRight ? "is-disabled" : ""}`}
            onClick={() => scrollByDirection("right")}
            disabled={!canScrollRight}
            aria-label="Next faculty member"
            title="Next mentor"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. HORIZONTAL SCROLL CAROUSEL TRACK */}
      <div className="faculty-carousel-track" ref={trackRef}>
        {facultyList.map((person, idx) => {
          const isLead = person.name.toLowerCase().includes("sweta");

          return (
            <article
              key={`${person.name}-${idx}`}
              className={`faculty-card ${idx === activeFacultyIndex ? "is-active-card" : ""} ${isLead ? "is-lead-card" : ""}`}
            >
              <div className="faculty-card-header">
                <div className="faculty-avatar-frame">
                  {person.photoUrl ? (
                    <Image
                      src={person.photoUrl}
                      alt={`Photo of ${person.name}`}
                      fill
                      sizes="(max-width: 600px) 100vw, 360px"
                      className="faculty-avatar-img"
                      unoptimized
                    />
                  ) : (
                    <div className="faculty-avatar-placeholder">
                      <span>SmartNum Mentor</span>
                    </div>
                  )}
                  <div className="faculty-avatar-gradient" />
                  <span className="faculty-role-badge">
                    {isLead ? "★ Lead Faculty & Founder" : "Academic Mentor"}
                  </span>
                </div>
              </div>

              <div className="faculty-card-body">
                <div className="faculty-kicker-row">
                  <span className="faculty-kicker-text">SMARTNUM EDUCATOR</span>
                  {isLead && <span className="faculty-phd-pill">Ph.D. Mathematics</span>}
                </div>

                <h3 className="faculty-name">{person.name}</h3>

                <p className="faculty-qualification">
                  {person.qualification}
                </p>

                <div className="faculty-subject-tag">
                  <span className="subject-icon" aria-hidden="true">📐</span>
                  <span>{person.subject}</span>
                </div>

                <p className="faculty-bio">
                  {person.experience}
                </p>

                <div className="faculty-card-actions">
                  <button
                    type="button"
                    className="faculty-view-lectures-btn"
                    onClick={() => scrollToMasterclasses(0)}
                  >
                    <span>View Lectures &amp; Syllabus</span>
                    <span className="btn-arrow" aria-hidden="true">↓</span>
                  </button>

                  <a className="faculty-book-demo-btn" href="#book-demo">
                    Book 1-on-1 Demo →
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Carousel Indicator Dots */}
      <div className="faculty-carousel-indicators" role="tablist" aria-label="Faculty slides">
        {facultyList.map((person, idx) => (
          <button
            key={`dot-faculty-${idx}`}
            type="button"
            className={`faculty-indicator-dot ${idx === activeFacultyIndex ? "is-active" : ""}`}
            onClick={() => scrollToIndex(idx)}
            aria-label={`Jump to faculty member ${idx + 1}: ${person.name}`}
            title={`Mentor: ${person.name}`}
          />
        ))}
      </div>

      {/* 3. DYNAMIC ACCORDIONS MATCHING THE NUMBER OF VIDEOS */}
      <div
        className="faculty-accordions-section"
        ref={accordionsSectionRef}
        aria-labelledby="faculty-accordions-heading"
      >
        <div className="faculty-accordions-header">
          <div className="accordions-subkicker-wrap">
            <span className="badge-spark-dot" aria-hidden="true" />
            <span className="accordions-subkicker">
              Faculty Masterclasses · {videoList.length} Recorded Chapters
            </span>
          </div>

          <h3 id="faculty-accordions-heading" className="faculty-accordions-title">
            Curriculum &amp; Video Breakdown Taught by Our Faculty
          </h3>

          <p className="faculty-accordions-desc">
            Explore the exact conceptual framework, proofs, and trap-question strategies taught in each class. Each accordion corresponds directly to our published video masterclasses.
          </p>
        </div>

        <div className="faculty-accordions-list">
          {videoList.map((video, idx) => {
            const isOpen = openAccordionIndex === idx;
            const concepts = getFacultyVideoConcepts(video);

            return (
              <div
                key={`faculty-video-acc-${video.title}-${idx}`}
                className={`faculty-accordion-item ${isOpen ? "is-open" : ""}`}
              >
                <button
                  type="button"
                  className="faculty-accordion-trigger"
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  id={`faculty-acc-trigger-${idx}`}
                  aria-controls={`faculty-acc-panel-${idx}`}
                >
                  <div className="trigger-left-col">
                    <span className="trigger-num-badge">0{idx + 1}</span>
                    <div className="trigger-info">
                      <div className="trigger-tags-row">
                        <span className="trigger-tag subject">{video.subject}</span>
                        <span className="trigger-tag class-level">{video.classLabel}</span>
                        <span className="trigger-tag mentor">Taught by Dr. Sweta Agrawal</span>
                      </div>
                      <h4 className="trigger-video-title">{video.title}</h4>
                    </div>
                  </div>

                  <div className="trigger-right-col">
                    <span
                      className="trigger-play-cta"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVideoModal(video);
                      }}
                    >
                      Watch Lecture ▶
                    </span>
                    <span className="trigger-toggle-symbol" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div
                    className="faculty-accordion-content"
                    id={`faculty-acc-panel-${idx}`}
                    role="region"
                    aria-labelledby={`faculty-acc-trigger-${idx}`}
                  >
                    <div className="accordion-grid-layout">
                      <div className="accordion-details-col">
                        <h5 className="accordion-concepts-heading">
                          Core Concepts &amp; Proofs in This Masterclass:
                        </h5>
                        <ul className="accordion-concepts-list">
                          {concepts.map((concept, cIdx) => (
                            <li key={cIdx}>
                              <span className="concept-check-icon" aria-hidden="true">✓</span>
                              <span>{concept}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="accordion-pedagogy-box">
                          <span className="pedagogy-title">SmartNum Teaching Method:</span>
                          <p className="pedagogy-desc">
                            Delivered via interactive smart board in small batches. We break down the &ldquo;why&rdquo; before formulas, followed by step-by-step past year questions (PYQs) so students never get stuck on exam day.
                          </p>
                        </div>

                        <div className="accordion-footer-actions">
                          <button
                            type="button"
                            className="btn-play-lecture"
                            onClick={() => setActiveVideoModal(video)}
                          >
                            Play video lecture <span aria-hidden="true">▶</span>
                          </button>

                          <a className="btn-book-topic-demo" href="#book-demo">
                            Book demo on this chapter →
                          </a>
                        </div>
                      </div>

                      <div className="accordion-preview-col">
                        <button
                          type="button"
                          className="accordion-video-thumbnail"
                          onClick={() => setActiveVideoModal(video)}
                          aria-label={`Play masterclass: ${video.title}`}
                        >
                          {video.thumbnailUrl ? (
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.altText || video.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 300px"
                              className="accordion-thumb-img"
                              unoptimized
                            />
                          ) : (
                            <div className="accordion-thumb-fallback">
                              <span>SmartNum Masterclass</span>
                            </div>
                          )}
                          <div className="accordion-thumb-overlay" />
                          <span className="accordion-play-bubble" aria-hidden="true">
                            <span className="play-triangle">▶</span>
                          </span>
                        </button>
                        <span className="accordion-thumb-caption">
                          Click to stream preview player
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ACCESSIBLE VIDEO LIGHTBOX MODAL */}
      <dialog
        className="demo-video-dialog"
        ref={dialogRef}
        onClose={() => setActiveVideoModal(null)}
        onCancel={() => setActiveVideoModal(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setActiveVideoModal(null);
        }}
      >
        {activeVideoModal && (
          <div className="demo-video-dialog-content">
            <div className="demo-video-dialog-head">
              <div className="dialog-title-wrap">
                <span className="dialog-class-tag">
                  {activeVideoModal.subject} · {activeVideoModal.classLabel} · Taught by Dr. Sweta Agrawal
                </span>
                <strong className="dialog-video-title">{activeVideoModal.title}</strong>
              </div>
              <button
                type="button"
                className="demo-video-close"
                onClick={() => setActiveVideoModal(null)}
                aria-label="Close video player"
              >
                ✕ Close
              </button>
            </div>
            <div className="demo-video-player">
              {(() => {
                const youtubeUrl = getYoutubeEmbedUrl(activeVideoModal.videoUrl);
                if (youtubeUrl) {
                  return (
                    <iframe
                      src={youtubeUrl}
                      title={`${activeVideoModal.title} lecture player`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="demo-video-iframe"
                    />
                  );
                }
                return (
                  <video
                    src={activeVideoModal.videoUrl}
                    controls
                    autoPlay
                    preload="metadata"
                    aria-label={activeVideoModal.title}
                    className="demo-video-native"
                  />
                );
              })()}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
