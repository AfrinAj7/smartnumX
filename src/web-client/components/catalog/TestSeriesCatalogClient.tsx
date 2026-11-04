"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BuyButtons } from "../cart/BuyButtons";

export interface TestSeriesItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  targetClass: string | null;
  targetExam: string | null;
  badge: string | null;
  isFree: boolean;
  price: number;
  discountPrice: number | null;
  validity: string | null;
  testCountFull: number | null;
  testCountChapter: number | null;
  sampleTestUrl: string | null;
  features: string[];
  inclusions: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
    parent?: {
      name: string;
      slug: string;
    } | null;
  } | null;
}

interface TestSeriesCatalogClientProps {
  testSeries: TestSeriesItem[];
  initialCategory?: string;
  initialFreeOnly?: boolean;
}

export function TestSeriesCatalogClient({
  testSeries,
  initialCategory,
  initialFreeOnly = false,
}: TestSeriesCatalogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "ALL");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [freeFilter, setFreeFilter] = useState<"ALL" | "FREE" | "PAID">(initialFreeOnly ? "FREE" : "ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  const categories = [
    { label: "All Test Series", slug: "ALL" },
    { label: "IIT JEE (Main + Adv)", slug: "ts-iit-jee-main-advanced" },
    { label: "IIT JEE Main", slug: "ts-iit-jee-main" },
    { label: "Class 9–12 Boards", slug: "ts-class-9-12" },
    { label: "Popular Exams", slug: "ts-popular-exams" },
    { label: "Free Test Series", slug: "ts-free-test-series", isFree: true },
  ];

  const classFilters = ["ALL", "Class 9", "Class 10", "Class 11", "Class 12", "Dropper"];

  const filteredItems = useMemo(() => {
    return testSeries
      .filter((item) => {
        // Category filter
        if (selectedCategory !== "ALL") {
          if (selectedCategory === "ts-free-test-series") {
            if (!item.isFree && item.price > 0) return false;
          } else {
            const catSlug = item.category?.slug || "";
            const parentSlug = item.category?.parent?.slug || "";
            if (catSlug !== selectedCategory && parentSlug !== selectedCategory && !catSlug.includes(selectedCategory.replace("ts-", ""))) {
              return false;
            }
          }
        }

        // Class filter
        if (selectedClass !== "ALL") {
          const itemClass = (item.targetClass || "").toLowerCase();
          if (!itemClass.includes(selectedClass.toLowerCase())) {
            return false;
          }
        }

        // Free / Paid filter
        if (freeFilter === "FREE" && !item.isFree && item.price > 0) {
          return false;
        }
        if (freeFilter === "PAID" && (item.isFree || item.price === 0)) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchExam = (item.targetExam || "").toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchExam) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice ?? a.price;
        const priceB = b.discountPrice ?? b.price;
        if (sortBy === "price-low") return priceA - priceB;
        if (sortBy === "price-high") return priceB - priceA;
        if (sortBy === "mocks-desc") return (b.testCountFull || 0) - (a.testCountFull || 0);
        return 0;
      });
  }, [testSeries, selectedCategory, selectedClass, freeFilter, searchQuery, sortBy]);

  return (
    <div className="test-series-catalog-wrap">
      {/* Search & Top Filter Bar */}
      <section className="catalog-filters-bar" aria-label="Test Series Filters">
        <div className="course-container">
          <div className="filter-controls-row">
            {/* Search Input */}
            <div className="catalog-search-box">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mock tests by exam, subject, or grade..."
                className="catalog-search-input"
                aria-label="Search mock tests"
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
              <label htmlFor="ts-sort-select" className="sort-label">Sort:</label>
              <select
                id="ts-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="catalog-sort-select"
              >
                <option value="featured">Featured / Recommended</option>
                <option value="mocks-desc">Most Full Mocks</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Tabs Bar */}
          <div className="ts-category-tabs-row" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`ts-nav-tab ${selectedCategory === cat.slug ? "is-active" : ""}`}
              >
                <span>{cat.label}</span>
                {cat.isFree && <span className="nav-badge free">FREE</span>}
              </button>
            ))}
          </div>

          {/* Class & Type Secondary Filters */}
          <div className="filter-pill-group-secondary" style={{ marginTop: "1rem" }}>
            <div className="mode-toggle-group">
              <span className="filter-group-label">Grade / Stream:</span>
              {classFilters.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`filter-chip ${selectedClass === cls ? "is-active" : ""}`}
                >
                  {cls === "ALL" ? "All Grades" : cls}
                </button>
              ))}
            </div>

            <div className="exam-toggle-group">
              <span className="filter-group-label">Access:</span>
              <button
                type="button"
                onClick={() => setFreeFilter("ALL")}
                className={`filter-chip ${freeFilter === "ALL" ? "is-active" : ""}`}
              >
                All Mocks
              </button>
              <button
                type="button"
                onClick={() => setFreeFilter("FREE")}
                className={`filter-chip ${freeFilter === "FREE" ? "is-active" : ""}`}
              >
                ✨ 100% Free Only
              </button>
              <button
                type="button"
                onClick={() => setFreeFilter("PAID")}
                className={`filter-chip ${freeFilter === "PAID" ? "is-active" : ""}`}
              >
                Comprehensive Paid Packs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Test Series Results Grid */}
      <section className="catalog-results-section">
        <div className="course-container">
          <div className="results-header-row">
            <span className="results-count-badge">
              Showing <strong>{filteredItems.length}</strong> test series packs
            </span>

            {(selectedCategory !== "ALL" || selectedClass !== "ALL" || freeFilter !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedClass("ALL");
                  setFreeFilter("ALL");
                  setSearchQuery("");
                }}
                className="reset-filters-btn"
              >
                Reset All Filters ↺
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="catalog-empty-state">
              <div className="empty-icon">📝</div>
              <h3>No test series matched your selection</h3>
              <p>Try resetting the category filter or searching for a different grade.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedClass("ALL");
                  setFreeFilter("ALL");
                  setSearchQuery("");
                }}
                className="btn-empty-reset"
              >
                View All Test Series
              </button>
            </div>
          ) : (
            <div className="ts-product-grid">
              {filteredItems.map((item) => {
                const effectivePrice = item.discountPrice ?? item.price;
                const discountPct = item.discountPrice && item.discountPrice < item.price
                  ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
                  : null;

                const isItemFree = item.isFree || item.price === 0;

                return (
                  <div key={item.slug} className="ts-product-card">
                    {/* Header Badges */}
                    <div className="ts-card-top-row">
                      <div className="badge-pill-group">
                        {item.badge && (
                          <span
                            className={`nav-badge ${
                              item.badge === "Free" || isItemFree
                                ? "free"
                                : item.badge === "High Yield" || item.badge === "Up to 50% Off"
                                ? "highlight-orange"
                                : "highlight"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.targetClass && (
                          <span className="ts-class-tag">{item.targetClass}</span>
                        )}
                      </div>
                      <span className="ts-exam-tag">{item.targetExam || "Mock Series"}</span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="ts-product-title">
                      <Link href={`/test-series/${item.slug}`}>{item.title}</Link>
                    </h3>
                    <p className="ts-product-desc">{item.description}</p>

                    {/* Test Counts Metrics Row */}
                    <div className="ts-metrics-strip">
                      <div className="metric-box">
                        <span className="metric-num">{item.testCountFull || "10+"}</span>
                        <span className="metric-label">Full Mocks</span>
                      </div>
                      <div className="metric-divider" />
                      <div className="metric-box">
                        <span className="metric-num">{item.testCountChapter || "25+"}</span>
                        <span className="metric-label">Chapter Tests</span>
                      </div>
                      <div className="metric-divider" />
                      <div className="metric-box">
                        <span className="metric-num">CBT</span>
                        <span className="metric-label">NTA Engine</span>
                      </div>
                    </div>

                    {/* Result & Analysis Highlights */}
                    <div className="ts-features-tags">
                      <span className="feature-pill">🎯 Rank Predictor</span>
                      <span className="feature-pill">📊 Percentile Score</span>
                      <span className="feature-pill">🔥 Topic Heatmap</span>
                      <span className="feature-pill">💡 Step-by-Step Solutions</span>
                    </div>

                    {/* Pricing Box */}
                    <div className="ts-pricing-box">
                      <div className="ts-pricing-left">
                        {isItemFree ? (
                          <div className="free-price-tag">
                            <span className="free-badge-symbol">✓</span>
                            <span className="free-price-text">100% FREE</span>
                          </div>
                        ) : (
                          <div className="price-row">
                            <span className="ts-current-price">₹{effectivePrice.toLocaleString("en-IN")}</span>
                            {item.discountPrice && item.discountPrice < item.price && (
                              <span className="ts-original-price">₹{item.price.toLocaleString("en-IN")}</span>
                            )}
                            {discountPct && (
                              <span className="ts-discount-pct">{discountPct}% OFF</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ts-pricing-right">
                        <span className="ts-validity-text">{item.validity || "Till Exam Date"}</span>
                      </div>
                    </div>

                    {/* Buy Actions */}
                    <div className="ts-card-actions">
                      <BuyButtons
                        slug={item.slug}
                        title={item.title}
                        price={item.price}
                        discountPrice={item.discountPrice}
                        isFree={isItemFree}
                        layout="card"
                        buyNowLabel={isItemFree ? "Enroll Free (Attempt Now)" : "Buy Test Series"}
                      />

                      <Link href={`/test-series/${item.slug}`} className="btn-ts-view-details">
                        View Schedule &amp; Sample Questions →
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

