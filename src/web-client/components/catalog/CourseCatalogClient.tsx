"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BuyButtons } from "../cart/BuyButtons";

export interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  targetClass: string | null;
  targetExam: string | null;
  badge: string | null;
  mode: "ONLINE" | "PHYSICAL" | "BOTH" | null;
  price: number;
  discountPrice: number | null;
  validity: string | null;
  startDate: string | Date | null;
  seatsTotal: number | null;
  seatsLeft: number | null;
  inclusions: string[];
  centre?: {
    id: string;
    name: string;
    city: string;
    address: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface CourseCatalogClientProps {
  courses: CourseItem[];
  basePath?: string;
}

export function CourseCatalogClient({ courses, basePath = "/batches" }: CourseCatalogClientProps) {
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedMode, setSelectedMode] = useState<string>("ALL");
  const [selectedExam, setSelectedExam] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const classes = ["ALL", "Class 9", "Class 10", "Class 11", "Class 12", "Class 11 & 12"];
  const modes = [
    { label: "All Modes", value: "ALL" },
    { label: "Online Mode", value: "ONLINE" },
    { label: "Physical Centre (Offline)", value: "PHYSICAL" },
  ];
  const exams = [
    { label: "All Programmes", value: "ALL" },
    { label: "CBSE & ICSE Boards", value: "BOARDS" },
    { label: "IIT-JEE (Main & Adv)", value: "JEE" },
    { label: "Foundations", value: "FOUNDATION" },
  ];

  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        // Class filter
        if (selectedClass !== "ALL") {
          const courseClass = course.targetClass?.toLowerCase() || "";
          if (!courseClass.includes(selectedClass.toLowerCase())) {
            return false;
          }
        }

        // Mode filter
        if (selectedMode !== "ALL") {
          if (selectedMode === "ONLINE" && course.mode !== "ONLINE" && course.mode !== "BOTH") {
            return false;
          }
          if (selectedMode === "PHYSICAL" && course.mode !== "PHYSICAL" && course.mode !== "BOTH") {
            return false;
          }
        }

        // Exam filter
        if (selectedExam !== "ALL") {
          const exam = (course.targetExam || "").toLowerCase();
          const title = course.title.toLowerCase();
          if (selectedExam === "BOARDS" && !exam.includes("cbse") && !exam.includes("icse") && !exam.includes("board")) {
            return false;
          }
          if (selectedExam === "JEE" && !exam.includes("jee") && !title.includes("jee")) {
            return false;
          }
          if (selectedExam === "FOUNDATION" && !exam.includes("foundation") && !title.includes("foundation")) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = course.title.toLowerCase().includes(q);
          const matchDesc = course.description.toLowerCase().includes(q);
          const matchExam = (course.targetExam || "").toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchExam) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice ?? a.price;
        const priceB = b.discountPrice ?? b.price;
        if (sortBy === "price-low") return priceA - priceB;
        if (sortBy === "price-high") return priceB - priceA;
        return 0;
      });
  }, [courses, selectedClass, selectedMode, selectedExam, searchQuery, sortBy]);

  return (
    <div className="catalog-content-wrapper">
      {/* Search and Filters Section */}
      <section className="catalog-filters-bar" aria-label="Course Filters">
        <div className="course-container">
          <div className="filter-controls-row">
            {/* Search Input */}
            <div className="catalog-search-box">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batches by subject, grade, or exam..."
                className="catalog-search-input"
                aria-label="Search batches"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="search-clear-btn"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="catalog-sort-box">
              <label htmlFor="course-sort-select" className="sort-label">Sort:</label>
              <select
                id="course-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="catalog-sort-select"
              >
                <option value="featured">Featured / Recommended</option>
                <option value="price-low">Fee: Low to High</option>
                <option value="price-high">Fee: High to Low</option>
              </select>
            </div>
          </div>

          {/* Filter Pills Rows */}
          <div className="filter-pills-container">
            {/* Class Tabs */}
            <div className="filter-pill-group">
              <span className="filter-group-label">Grade / Class:</span>
              <div className="pills-scroll-row">
                {classes.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`filter-pill ${selectedClass === cls ? "is-active" : ""}`}
                  >
                    {cls === "ALL" ? "All Grades" : cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode & Category Filter Options */}
            <div className="filter-pill-group-secondary">
              <div className="mode-toggle-group">
                <span className="filter-group-label">Mode:</span>
                {modes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMode(m.value)}
                    className={`filter-chip ${selectedMode === m.value ? "is-active" : ""}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="exam-toggle-group">
                <span className="filter-group-label">Exam:</span>
                {exams.map((ex) => (
                  <button
                    key={ex.value}
                    type="button"
                    onClick={() => setSelectedExam(ex.value)}
                    className={`filter-chip ${selectedExam === ex.value ? "is-active" : ""}`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Cards Grid */}
      <section className="catalog-results-section">
        <div className="course-container">
          <div className="results-header-row">
            <span className="results-count-badge">
              Showing <strong>{filteredCourses.length}</strong> {filteredCourses.length === 1 ? "batch" : "batches"}
            </span>

            {(selectedClass !== "ALL" || selectedMode !== "ALL" || selectedExam !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClass("ALL");
                  setSelectedMode("ALL");
                  setSelectedExam("ALL");
                  setSearchQuery("");
                }}
                className="reset-filters-btn"
              >
                Reset All Filters ↺
              </button>
            )}
          </div>

          {filteredCourses.length === 0 ? (
            <div className="catalog-empty-state">
              <div className="empty-icon">🎓</div>
              <h3>No batches matched your filters</h3>
              <p>Try clearing your search terms or picking a different grade/mode.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedClass("ALL");
                  setSelectedMode("ALL");
                  setSelectedExam("ALL");
                  setSearchQuery("");
                }}
                className="btn-empty-reset"
              >
                Show All Batches
              </button>
            </div>
          ) : (
            <div className="catalog-courses-grid">
              {filteredCourses.map((course) => {
                const effectivePrice = course.discountPrice ?? course.price;
                const discountPct = course.discountPrice && course.discountPrice < course.price
                  ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
                  : null;

                const hasPhysical = course.mode === "PHYSICAL" || course.mode === "BOTH";

                return (
                  <div key={course.slug} className="course-product-card">
                    {/* Top Badges */}
                    <div className="product-card-head">
                      <div className="head-badge-group">
                        {course.badge && <span className="product-badge">{course.badge}</span>}
                        {course.targetClass && <span className="product-class-pill">{course.targetClass}</span>}
                      </div>
                      <span className="product-mode-pill">
                        {course.mode === "BOTH"
                          ? "Online | Physical (Offline)"
                          : course.mode === "PHYSICAL"
                          ? "Physical Centre Batch"
                          : "Online Live & Recorded"}
                      </span>
                    </div>

                    {/* Title & Tagline */}
                    <h3 className="product-card-title">
                      <Link href={`${basePath}/${course.slug}`}>{course.title}</Link>
                    </h3>
                    <p className="product-card-desc">{course.description}</p>

                    {/* Centre & Seat Status (Physical Mode info) */}
                    {hasPhysical && (
                      <div className="centre-seats-banner">
                        <div className="centre-info">
                          <span className="centre-pin">📍</span>
                          <div>
                            <strong className="centre-name">
                              {course.centre?.name || "SmartNum Indirapuram Campus"}
                            </strong>
                            <span className="centre-city">ATS Advantage, Indirapuram</span>
                          </div>
                        </div>

                        {course.seatsLeft !== null && course.seatsLeft !== undefined && (
                          <div className={`seat-counter-pill ${course.seatsLeft <= 3 ? "is-low" : ""}`}>
                            <span className="seat-pulse" />
                            <span>
                              {course.seatsLeft <= 0
                                ? "Batch Full"
                                : `🔥 Only ${course.seatsLeft} of ${course.seatsTotal || 15} seats left`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inclusions List Preview */}
                    <div className="product-features-list">
                      <div className="feature-line">
                        <span className="feature-icon">✓</span>
                        <span>Small Batches (Max 15 Students) · Ph.D. Faculty</span>
                      </div>
                      <div className="feature-line">
                        <span className="feature-icon">✓</span>
                        <span>Interactive Lectures + Complete Video Recording Archive</span>
                      </div>
                      <div className="feature-line">
                        <span className="feature-icon">✓</span>
                        <span>Daily Practice Problems (DPPs) &amp; Doubt Support</span>
                      </div>
                    </div>

                    {/* Pricing Box */}
                    <div className="product-pricing-box">
                      <div className="pricing-left">
                        <div className="price-row">
                          <span className="current-price">₹{effectivePrice.toLocaleString("en-IN")}</span>
                          {course.discountPrice && course.discountPrice < course.price && (
                            <span className="original-price">₹{course.price.toLocaleString("en-IN")}</span>
                          )}
                        </div>
                        {discountPct && (
                          <span className="discount-tag">{discountPct}% OFF Tuition</span>
                        )}
                      </div>

                      <div className="pricing-right">
                        <span className="validity-label">{course.validity || "Full Academic Year"}</span>
                      </div>
                    </div>

                    {/* Buy Actions & Explore */}
                    <div className="product-actions-footer">
                      <BuyButtons
                        slug={course.slug}
                        title={course.title}
                        price={course.price}
                        discountPrice={course.discountPrice}
                        isFree={course.price === 0}
                        mode={course.mode || "BOTH"}
                        selectedMode={course.mode === "PHYSICAL" ? "PHYSICAL" : "ONLINE"}
                        seatsLeft={course.seatsLeft}
                        layout="card"
                      />

                      <Link href={`${basePath}/${course.slug}`} className="btn-view-details">
                        View Syllabus, Timings &amp; Options →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

