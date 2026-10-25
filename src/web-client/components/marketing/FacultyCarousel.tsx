"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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
}: {
  faculty: Faculty[];
  videos?: DemoVideo[];
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

  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeFacultyIndex, setActiveFacultyIndex] = useState(0);
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

  const checkScroll = useCallback(() => {
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
  }, [facultyList.length]);

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

  const scrollToMasterclasses = () => {
    const el = document.getElementById("demo-videos") || document.getElementById("course-explorer");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
                    onClick={scrollToMasterclasses}
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

      {/* 3. ACCESSIBLE VIDEO LIGHTBOX MODAL */}
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
