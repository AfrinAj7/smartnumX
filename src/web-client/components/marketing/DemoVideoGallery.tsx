"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HomepageContent } from "@/server/site-content/homepage";

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

function getVideoTopics(video: DemoVideo): string[] {
  const titleLower = video.title.toLowerCase();
  const subjLower = video.subject.toLowerCase();

  if (titleLower.includes("quadratic")) {
    return [
      "Graphical derivation of roots and parabola vertex visualization",
      "Discriminant analysis & nature of roots for CBSE Board exams",
      "Factoring vs quadratic formula comparison with step-by-step proofs",
      "Eliminating sign errors in negative coefficients",
    ];
  }
  if (titleLower.includes("calculus") || titleLower.includes("limits")) {
    return [
      "Intuitive epsilon-delta understanding and limits first principles",
      "Graphical visualization of continuous vs discontinuous curves",
      "Algebraic factorization and standard limit theorems",
      "Class 11 & 12 Board exam shortcuts and high-yield questions",
    ];
  }
  if (titleLower.includes("jee") || subjLower.includes("jee") || titleLower.includes("mentorship")) {
    return [
      "Multi-concept synthesis linking algebra with coordinate geometry",
      "Eliminating incorrect options using boundary condition checks",
      "Time management strategies for JEE Mains & Advanced speed",
      "Deep analysis of tricky past-year JEE trap questions",
    ];
  }
  return [
    `Core conceptual breakdown for ${video.subject}`,
    `NCERT and Board syllabus alignment for ${video.classLabel}`,
    "Step-by-step problem breakdown from first principles",
    "Diagnostic error analysis and speed-improving tips",
  ];
}

export function DemoVideoGallery({ videos }: { videos: DemoVideo[] }) {
  const [activeVideo, setActiveVideo] = useState<DemoVideo | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(0);
  const [expandedCardIndices, setExpandedCardIndices] = useState<Record<number, boolean>>({});

  const trackRef = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (activeVideo && !element.open) {
      element.showModal();
    }
    if (!activeVideo && element.open) {
      element.close();
    }
  }, [activeVideo]);

  // Handle scroll position and enable/disable navigation buttons
  const checkScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    const isAtStart = el.scrollLeft <= 8;
    const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
    setCanScrollLeft(!isAtStart);
    setCanScrollRight(!isAtEnd);

    // Estimate active index based on card width
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 380;
    const currentIndex = Math.round(el.scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(Math.max(0, currentIndex), Math.max(0, videos.length - 1)));
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScrollState();
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);
    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [videos.length]);

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
    setActiveCardIndex(index);
  };

  const toggleCardDrawer = (index: number) => {
    setExpandedCardIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleAccordion = (index: number) => {
    setOpenAccordionIndex((prev) => (prev === index ? null : index));
  };

  function renderPlayer(video: DemoVideo) {
    const youtubeUrl = getYoutubeEmbedUrl(video.videoUrl);
    if (youtubeUrl) {
      return (
        <iframe
          src={youtubeUrl}
          title={`${video.title} demo class player`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="demo-video-iframe"
        />
      );
    }
    return (
      <video
        src={video.videoUrl}
        controls
        autoPlay
        preload="metadata"
        aria-label={video.title}
        className="demo-video-native"
      />
    );
  }

  // Fallback featured preview video if none are published
  const fallbackVideo: DemoVideo = {
    title: "SmartNum Teaching Approach: Classroom Walkthrough & Conceptual Maths",
    subject: "Classroom Demo",
    classLabel: "Classes 9–12 & JEE",
    videoUrl: "https://www.youtube.com/watch?v=yXpQo9168C4",
    thumbnailUrl: "/images/smartnum-classroom-backdrop.jpg",
    altText: "SmartNum classroom teaching method walkthrough",
    published: true,
  };

  return (
    <div className="demo-gallery-wrapper">
      {videos.length > 0 ? (
        <div className="demo-carousel-section" role="region" aria-label="Demo class video previews">
          {/* Top Control Bar: Lecture Counter + Left/Right Navigation Arrows */}
          <div className="demo-carousel-control-bar">
            <div className="demo-carousel-meta">
              <span className="demo-count-badge">
                <span className="badge-spark-dot" aria-hidden="true" />
                {videos.length} Sample {videos.length === 1 ? "Lecture" : "Lectures"}
              </span>
            </div>

            <div className="demo-carousel-arrows">
              <button
                type="button"
                className={`demo-arrow-btn ${!canScrollLeft ? "is-disabled" : ""}`}
                onClick={() => scrollByDirection("left")}
                disabled={!canScrollLeft}
                aria-label="Previous sample class"
                title="Previous class"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                className={`demo-arrow-btn ${!canScrollRight ? "is-disabled" : ""}`}
                onClick={() => scrollByDirection("right")}
                disabled={!canScrollRight}
                aria-label="Next sample class"
                title="Next class"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Track: All cards sit in a single row without wrapping */}
          <div className="demo-carousel-track" ref={trackRef}>
            {videos.map((video, idx) => {
              const isCardExpanded = Boolean(expandedCardIndices[idx]);
              const topics = getVideoTopics(video);

              return (
                <article
                  className={`demo-video-card ${idx === activeCardIndex ? "is-active-card" : ""}`}
                  key={`${video.title}-${video.videoUrl}-${idx}`}
                >
                  <button
                    className="demo-video-poster"
                    type="button"
                    onClick={() => setActiveVideo(video)}
                    aria-label={`Play preview: ${video.title}`}
                  >
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.altText || `${video.title} preview`}
                        fill
                        sizes="(max-width: 768px) 85vw, 380px"
                        className="demo-poster-img"
                      />
                    ) : (
                      <div className="demo-video-empty">
                        <span>SmartNum Class Preview</span>
                      </div>
                    )}
                    <div className="demo-poster-overlay" />
                    <span className="demo-preview-pill">
                      <span className="pill-dot" aria-hidden="true" />
                      Class 0{idx + 1} Preview
                    </span>
                    <span className="demo-video-play" aria-hidden="true">
                      <span className="play-arrow">▶</span>
                    </span>
                  </button>

                  <div className="demo-video-caption">
                    <div className="demo-caption-top">
                      <span className="demo-subj-badge">{video.subject}</span>
                      <span className="demo-class-label">{video.classLabel}</span>
                    </div>

                    <h3 className="demo-video-title">{video.title}</h3>

                    <div className="demo-card-actions">
                      <button
                        type="button"
                        className="demo-play-text-btn"
                        onClick={() => setActiveVideo(video)}
                      >
                        Watch sample lesson <span className="arrow" aria-hidden="true">→</span>
                      </button>

                      <button
                        type="button"
                        className={`demo-card-toggle-btn ${isCardExpanded ? "is-open" : ""}`}
                        onClick={() => toggleCardDrawer(idx)}
                        aria-expanded={isCardExpanded}
                        title="View topics covered in this lecture"
                      >
                        <span>{isCardExpanded ? "Hide topics" : "Topics covered"}</span>
                        <span className="toggle-chevron" aria-hidden="true">{isCardExpanded ? "▴" : "▾"}</span>
                      </button>
                    </div>

                    {/* Expandable in-card syllabus drawer */}
                    {isCardExpanded && (
                      <div className="demo-card-drawer">
                        <span className="drawer-heading">Key concepts in this clip:</span>
                        <ul className="drawer-topics-list">
                          {topics.map((topic, tIdx) => (
                            <li key={tIdx}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Navigation Dot Indicators */}
          <div className="demo-carousel-indicators" role="tablist" aria-label="Lecture slides">
            {videos.map((video, idx) => (
              <button
                key={`dot-${idx}`}
                type="button"
                className={`demo-indicator-dot ${idx === activeCardIndex ? "is-active" : ""}`}
                onClick={() => scrollToIndex(idx)}
                aria-label={`Jump to video ${idx + 1}: ${video.title}`}
                title={`Lesson ${idx + 1}: ${video.title}`}
              />
            ))}
          </div>

          {/* Dynamic Accordion Section: 1 Accordion per Video */}
          <div className="demo-accordions-container" aria-labelledby="demo-accordion-heading">
            <div className="demo-accordion-header">
              <span className="section-subkicker">Syllabus &amp; Concept Breakdown</span>
              <h3 id="demo-accordion-heading" className="demo-accordion-title">
                Explore What You&apos;ll Learn in Each Class
              </h3>
              <p className="demo-accordion-desc">
                Select any preview lecture below to view the conceptual framework, key derivations, and practice methods taught at SmartNum.
              </p>
            </div>

            <div className="demo-accordion-list">
              {videos.map((video, idx) => {
                const isOpen = openAccordionIndex === idx;
                const topics = getVideoTopics(video);

                return (
                  <div
                    className={`demo-accordion-item ${isOpen ? "is-open" : ""}`}
                    key={`accordion-${video.title}-${idx}`}
                  >
                    <button
                      type="button"
                      className="demo-accordion-trigger"
                      onClick={() => toggleAccordion(idx)}
                      aria-expanded={isOpen}
                      id={`accordion-btn-${idx}`}
                      aria-controls={`accordion-panel-${idx}`}
                    >
                      <div className="trigger-left">
                        <span className="trigger-num">0{idx + 1}</span>
                        <div className="trigger-text-wrap">
                          <div className="trigger-badges">
                            <span className="trigger-badge subject">{video.subject}</span>
                            <span className="trigger-badge class-label">{video.classLabel}</span>
                          </div>
                          <h4 className="trigger-title">{video.title}</h4>
                        </div>
                      </div>

                      <div className="trigger-right">
                        <span className="trigger-play-hint" onClick={(e) => { e.stopPropagation(); setActiveVideo(video); }}>
                          Watch preview ▶
                        </span>
                        <span className="trigger-icon" aria-hidden="true">
                          {isOpen ? "−" : "+"}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div
                        className="demo-accordion-body"
                        id={`accordion-panel-${idx}`}
                        role="region"
                        aria-labelledby={`accordion-btn-${idx}`}
                      >
                        <div className="accordion-body-grid">
                          <div className="accordion-body-content">
                            <h5 className="body-section-title">Concepts Covered in This Session:</h5>
                            <ul className="accordion-topics-list">
                              {topics.map((topic, tIdx) => (
                                <li key={tIdx}>
                                  <span className="topic-bullet" aria-hidden="true">✓</span>
                                  <span>{topic}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="accordion-body-actions">
                              <button
                                type="button"
                                className="button-orange-primary"
                                onClick={() => setActiveVideo(video)}
                              >
                                Play video lecture <span className="btn-arrow" aria-hidden="true">▶</span>
                              </button>

                              <button
                                type="button"
                                className="button-soft-choice"
                                onClick={() => scrollToIndex(idx)}
                              >
                                Focus card in slider ↑
                              </button>

                              <a className="button-link-demo" href="#book-demo">
                                Book demo on this topic →
                              </a>
                            </div>
                          </div>

                          <div className="accordion-body-preview-card">
                            <button
                              type="button"
                              className="accordion-mini-poster"
                              onClick={() => setActiveVideo(video)}
                              aria-label={`Play preview for ${video.title}`}
                            >
                              {video.thumbnailUrl ? (
                                <Image
                                  src={video.thumbnailUrl}
                                  alt={video.altText || video.title}
                                  fill
                                  sizes="260px"
                                  className="mini-poster-img"
                                />
                              ) : (
                                <div className="demo-video-empty mini">
                                  <span>SmartNum Preview</span>
                                </div>
                              )}
                              <div className="mini-poster-overlay" />
                              <span className="mini-play-icon" aria-hidden="true">▶</span>
                            </button>
                            <span className="mini-poster-label">Click to launch player</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State with Fallback Showcase Card */
        <div className="demo-empty-showcase">
          <div className="demo-empty-card">
            <div className="demo-empty-content">
              <span className="demo-empty-badge">
                <span className="badge-spark" aria-hidden="true">🎬</span> Class Previews
              </span>
              <h3 className="demo-empty-title">
                Class previews will appear here when SmartNum adds approved videos in Site Content.
              </h3>
              <p className="demo-empty-desc">
                In the meantime, experience our teaching approach live in a free 1-on-1 demo session or watch our Indirapuram smart classroom walkthrough below.
              </p>
              <div className="demo-empty-actions">
                <a className="button-gold-cta" href="#book-demo">
                  Book a free demo class <span className="btn-arrow" aria-hidden="true">→</span>
                </a>
                <button
                  type="button"
                  className="button-soft-choice"
                  onClick={() => setActiveVideo(fallbackVideo)}
                >
                  Watch classroom walkthrough <span aria-hidden="true">▶</span>
                </button>
              </div>
            </div>

            <div className="demo-empty-preview-box">
              <button
                type="button"
                className="demo-fallback-poster"
                onClick={() => setActiveVideo(fallbackVideo)}
                aria-label="Play SmartNum classroom walkthrough video"
              >
                <Image
                  src={fallbackVideo.thumbnailUrl}
                  alt="SmartNum classroom walkthrough preview"
                  fill
                  className="demo-poster-img"
                  sizes="(max-width: 768px) 100vw, 480px"
                />
                <div className="demo-poster-overlay" />
                <span className="demo-preview-pill">Teaching Approach</span>
                <span className="demo-video-play" aria-hidden="true">
                  <span className="play-arrow">▶</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Video Lightbox Dialog */}
      <dialog
        className="demo-video-dialog"
        ref={dialog}
        onClose={() => setActiveVideo(null)}
        onCancel={() => setActiveVideo(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setActiveVideo(null);
        }}
      >
        {activeVideo && (
          <div className="demo-video-dialog-content">
            <div className="demo-video-dialog-head">
              <div className="dialog-title-wrap">
                <span className="dialog-class-tag">{activeVideo.subject} · {activeVideo.classLabel}</span>
                <strong className="dialog-video-title">{activeVideo.title}</strong>
              </div>
              <button
                type="button"
                className="demo-video-close"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video player"
              >
                ✕ Close
              </button>
            </div>
            <div className="demo-video-player">
              {renderPlayer(activeVideo)}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}