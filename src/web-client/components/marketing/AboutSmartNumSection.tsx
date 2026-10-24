"use client";

import Image from "next/image";

const concreteFacts = [
  { label: "10–20 students per batch", detail: "Small groups, teacher knows every child" },
  { label: "Smart, AC classrooms", detail: "Digital boards & climate control" },
  { label: "CCTV-monitored campus", detail: "Full coverage for parent peace of mind" },
  { label: "1-on-1 doubt sessions", detail: "Sit down with faculty until it clicks" },
  { label: "Regular tests & recaps", detail: "Error analysis after every topic" },
  { label: "Progress report for parents", detail: "Honest, continuous performance view" },
];

export function AboutSmartNumSection() {
  return (
    <section
      className="about-editorial-section"
      id="about"
      aria-labelledby="about-title"
    >
      {/* Background Subtle Maths Sketch (6-8% opacity) */}
      <div className="about-bg-sketch" aria-hidden="true">
        <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="300" cy="300" r="220" stroke="#0B1F4B" strokeWidth="1.5" strokeDasharray="6 6" />
          <path d="M120 420 L480 180" stroke="#0B1F4B" strokeWidth="1.5" />
          <path d="M180 480 Q300 280 440 380" stroke="#0B1F4B" strokeWidth="1.5" />
          <path d="M260 270 A40 40 0 0 1 300 300" stroke="#F57C00" strokeWidth="1.5" />
          <text x="315" y="295" fill="#0B1F4B" fontSize="18" fontFamily="sans-serif">θ</text>
          <text x="410" y="220" fill="#0B1F4B" fontSize="20" fontFamily="sans-serif">f(x)</text>
        </svg>
      </div>

      <div className="about-editorial-container">
        {/* Left Column (Cols 1-6): Editorial Narrative & Concrete Facts */}
        <div className="about-editorial-left">
          <div className="about-eyebrow-row">
            <span className="about-eyebrow-dash" aria-hidden="true" />
            <span className="about-eyebrow-text">About SmartNum</span>
          </div>

          <h2 id="about-title" className="about-editorial-heading">
            Think it through{" "}
            <span className="about-hand-drawn-wrapper">
              clearly<span className="about-period">.</span>
              <svg
                className="about-hand-drawn-underline"
                viewBox="0 0 160 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 10C35 4 95 3 157 8C110 12 55 12 18 10"
                  stroke="#F57C00"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </h2>

          <p className="about-editorial-p about-p1">
            SmartNum is a small learning space in Indirapuram, Ghaziabad. We coach students in Classes 9–12 for Boards, IIT-JEE, Olympiads, and competitive aptitude, in batches small enough (10–20 students) for every child to be known by name.
          </p>

          <p className="about-editorial-p about-p2">
            Class time is for understanding. Recorded lessons are there for revision at your own pace. And when something still doesn&apos;t click, you can sit down with a teacher, one on one.
          </p>

          {/* 2x3 Concrete Facts Matrix */}
          <div className="about-facts-matrix" role="list" aria-label="SmartNum centre facts">
            {concreteFacts.map((fact) => (
              <div className="about-fact-item" role="listitem" key={fact.label}>
                <span className="about-fact-dot" aria-hidden="true" />
                <div>
                  <strong className="about-fact-label">{fact.label}</strong>
                  <span className="about-fact-detail">{fact.detail}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="about-action-row">
            <a className="button-orange-primary" href="#book-demo">
              Book a free demo <span className="btn-arrow" aria-hidden="true">→</span>
            </a>
            <a className="about-secondary-link" href="#teachers">
              Meet the teaching team <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Right Column (Cols 7-12): Asymmetric Photo Collage with Looping Motion Chip */}
        <div className="about-editorial-right">
          <div className="about-collage-canvas">
            {/* Image A: Classroom Main Shot (4:5 Ratio) */}
            <figure className="about-collage-main">
              <div className="about-image-frame aspect-4-5">
                <Image
                  src="/images/editorial/smart-class-room.jpeg"
                  alt="Students in a small-batch maths class at SmartNum, Indirapuram"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 480px"
                  className="editorial-photo"
                  priority
                />
                <div className="about-photo-vignette" />
              </div>
              <figcaption className="about-handwriting-caption">
                Small-batch classroom · Indirapuram Centre
              </figcaption>
            </figure>

            {/* Image B: Overlapping 1-on-1 Doubt Clearing Shot (1:1 Ratio) */}
            <figure className="about-collage-overlap">
              {/* Paper Tape Detail */}
              <div className="washi-tape-detail" aria-hidden="true">
                1-on-1 Doubt Desk
              </div>
              <div className="about-image-frame aspect-1-1">
                <Image
                  src="/images/editorial/about-doubt-session.jpg"
                  alt="Teacher bending over a notebook with one student during doubt-clearing at SmartNum"
                  fill
                  sizes="(max-width: 768px) 45vw, 240px"
                  className="editorial-photo"
                />
              </div>
            </figure>

            {/* Looping Motion Clip Chip (3-4s Whiteboard Solution Working) */}
            <div className="about-loop-chip" aria-label="Whiteboard solution loop">
              <div className="about-loop-media-wrap">
                <Image
                  src="/images/editorial/teach.webp"
                  alt="Looping motion: Teacher solving step-by-step math problem at the smart whiteboard"
                  width={140}
                  height={94}
                  className="about-loop-gif"
                  unoptimized
                />
                <span className="about-loop-badge">
                  <span className="loop-pulse-dot" aria-hidden="true" />
                  Whiteboard Working
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
