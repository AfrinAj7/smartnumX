"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Centre {
  id: string;
  name: string;
  city: string;
}

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  price: number;
  discountPrice: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  productType: "COURSE" | "TEST_SERIES";
  mode: "ONLINE" | "PHYSICAL" | "BOTH" | null;
  targetClass: string | null;
  targetExam: string | null;
  badge: string | null;
  validity: string | null;
  seatsTotal: number | null;
  seatsLeft: number | null;
  centreId: string | null;
  centre?: { name: string; city: string } | null;
  testCountFull: number | null;
  testCountChapter: number | null;
  isFree: boolean;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  validityDays: number | null;
  _count: {
    modules: number;
    enrollments: number;
    orderItems: number;
  };
}

export function CourseManagementView() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [productTypeTab, setProductTypeTab] = useState<"ALL" | "COURSE" | "TEST_SERIES">("ALL");

  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Comprehensive Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    categoryId: "",
    productType: "COURSE" as "COURSE" | "TEST_SERIES",
    mode: "ONLINE" as "ONLINE" | "PHYSICAL" | "BOTH",
    targetClass: "Class 10",
    targetExam: "",
    badge: "",
    validity: "1 Year Access",
    seatsTotal: "30",
    seatsLeft: "15",
    centreId: "",
    testCountFull: "10",
    testCountChapter: "40",
    isFree: false,
    price: "1999",
    discountPrice: "1499",
    validityDays: "365",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
  });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load courses");
      }
      const json = await res.json();
      setCourses(json.data || []);
      if (json.meta?.categories) setCategories(json.meta.categories);
      if (json.meta?.centres) setCentres(json.meta.centres);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch courses.";
      setActionError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadCourses();
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function openCreateModal(initialType: "COURSE" | "TEST_SERIES" = "COURSE") {
    setModalMode("create");
    setSelectedCourse(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      categoryId: categories[0]?.id || "",
      productType: initialType,
      mode: "ONLINE",
      targetClass: "Class 10",
      targetExam: initialType === "TEST_SERIES" ? "CBSE & ICSE Board" : "",
      badge: "",
      validity: initialType === "TEST_SERIES" ? "Till Exam 2026-27" : "1 Year Portal Access",
      seatsTotal: "30",
      seatsLeft: "15",
      centreId: centres[0]?.id || "",
      testCountFull: "10",
      testCountChapter: "40",
      isFree: false,
      price: initialType === "TEST_SERIES" ? "999" : "14999",
      discountPrice: initialType === "TEST_SERIES" ? "499" : "9999",
      validityDays: "365",
      status: "DRAFT",
    });
    setActionError(null);
    setIsModalOpen(true);
  }

  function openEditModal(course: CourseItem) {
    setModalMode("edit");
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug,
      description: course.description,
      categoryId: course.categoryId || "",
      productType: course.productType || "COURSE",
      mode: course.mode || "ONLINE",
      targetClass: course.targetClass || "Class 10",
      targetExam: course.targetExam || "",
      badge: course.badge || "",
      validity: course.validity || "1 Year Access",
      seatsTotal: course.seatsTotal ? String(course.seatsTotal) : "30",
      seatsLeft: course.seatsLeft !== null && course.seatsLeft !== undefined ? String(course.seatsLeft) : "15",
      centreId: course.centreId || centres[0]?.id || "",
      testCountFull: course.testCountFull ? String(course.testCountFull) : "10",
      testCountChapter: course.testCountChapter ? String(course.testCountChapter) : "40",
      isFree: Boolean(course.isFree),
      price: String(course.price),
      discountPrice: course.discountPrice ? String(course.discountPrice) : "",
      validityDays: course.validityDays ? String(course.validityDays) : "365",
      status: course.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    });
    setActionError(null);
    setIsModalOpen(true);
  }

  async function handleToggleStatus(course: CourseItem) {
    const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      setActionError(msg);
    }
  }

  async function handleDeleteCourse(course: CourseItem) {
    if (!confirm(`Are you sure you want to archive "${course.title}"?`)) {
      return;
    }
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete course");
      }
      loadCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete course";
      setActionError(msg);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);

    const isPhysical = formData.productType === "COURSE" && (formData.mode === "PHYSICAL" || formData.mode === "BOTH");
    const isTest = formData.productType === "TEST_SERIES";

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      categoryId: formData.categoryId || undefined,
      productType: formData.productType,
      mode: formData.productType === "COURSE" ? formData.mode : null,
      targetClass: formData.targetClass.trim() || undefined,
      targetExam: formData.targetExam.trim() || undefined,
      badge: formData.badge.trim() || null,
      validity: formData.validity.trim() || undefined,
      seatsTotal: isPhysical ? parseInt(formData.seatsTotal, 10) || 30 : null,
      seatsLeft: isPhysical ? parseInt(formData.seatsLeft, 10) || 0 : null,
      centreId: isPhysical ? formData.centreId || null : null,
      testCountFull: isTest ? parseInt(formData.testCountFull, 10) || 0 : null,
      testCountChapter: isTest ? parseInt(formData.testCountChapter, 10) || 0 : null,
      isFree: formData.isFree,
      price: formData.isFree ? 0 : parseFloat(formData.price) || 0,
      discountPrice: formData.isFree ? 0 : formData.discountPrice ? parseFloat(formData.discountPrice) : null,
      validityDays: parseInt(formData.validityDays, 10) || 365,
      status: formData.status,
    };

    startTransition(async () => {
      try {
        const url = modalMode === "create" ? "/api/admin/courses" : `/api/admin/courses/${selectedCourse?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
        }

        setIsModalOpen(false);
        loadCourses();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to save product details";
        setActionError(msg);
      }
    });
  }

  // Filter tab list
  const filteredCourses = courses.filter((c) => {
    if (productTypeTab === "COURSE") return c.productType === "COURSE";
    if (productTypeTab === "TEST_SERIES") return c.productType === "TEST_SERIES";
    return true;
  });

  return (
    <div className="admin-course-view" style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Top Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Academic Catalog &amp; E-Commerce Management
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0 0" }}>
            Courses &amp; Test Series
          </h1>
          <p style={{ color: "#475569", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
            Add, price, and manage tuition programmes, offline classroom seats, and mock test packages.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => openCreateModal("COURSE")}
            style={{
              backgroundColor: "#ea580c",
              color: "#ffffff",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(234, 88, 12, 0.25)",
            }}
          >
            + Create Course
          </button>
          <button
            onClick={() => openCreateModal("TEST_SERIES")}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)",
            }}
          >
            + Create Test Series
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "0.875rem 1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
          ⚠️ {actionError}
        </div>
      )}

      {/* Tabs Row */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", backgroundColor: "#f1f5f9", padding: "0.25rem", borderRadius: "0.5rem", width: "fit-content" }}>
        <button
          type="button"
          onClick={() => setProductTypeTab("ALL")}
          style={{
            backgroundColor: productTypeTab === "ALL" ? "#ffffff" : "transparent",
            color: productTypeTab === "ALL" ? "#0f172a" : "#64748b",
            fontWeight: 700,
            fontSize: "0.8125rem",
            padding: "0.4rem 0.85rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          All Items ({courses.length})
        </button>
        <button
          type="button"
          onClick={() => setProductTypeTab("COURSE")}
          style={{
            backgroundColor: productTypeTab === "COURSE" ? "#ffffff" : "transparent",
            color: productTypeTab === "COURSE" ? "#0f172a" : "#64748b",
            fontWeight: 700,
            fontSize: "0.8125rem",
            padding: "0.4rem 0.85rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Tuition Courses ({courses.filter((c) => c.productType === "COURSE").length})
        </button>
        <button
          type="button"
          onClick={() => setProductTypeTab("TEST_SERIES")}
          style={{
            backgroundColor: productTypeTab === "TEST_SERIES" ? "#ffffff" : "transparent",
            color: productTypeTab === "TEST_SERIES" ? "#0f172a" : "#64748b",
            fontWeight: 700,
            fontSize: "0.8125rem",
            padding: "0.4rem 0.85rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Test Series Packs ({courses.filter((c) => c.productType === "TEST_SERIES").length})
        </button>
      </div>

      {/* Search and Filter */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "#ffffff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search by title, slug, or exam..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem 0.875rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.875rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Course List Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading products...</div>
        ) : filteredCourses.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <p style={{ margin: "0 0 1rem", fontSize: "1rem" }}>No products found matching criteria.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Type &amp; Title</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Mode / Centre</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Price &amp; Offer</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Seats / Tests</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((c) => {
                const isTest = c.productType === "TEST_SERIES";
                const publicUrl = isTest ? `/test-series/${c.slug}` : `/courses/${c.slug}`;

                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.4rem",
                            borderRadius: "0.25rem",
                            backgroundColor: isTest ? "#eff6ff" : "#fff7ed",
                            color: isTest ? "#1d4ed8" : "#c2410c",
                          }}
                        >
                          {isTest ? "Test Series" : "Course"}
                        </span>
                        {c.badge && (
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "0.25rem", backgroundColor: "#ea580c", color: "#fff" }}>
                            {c.badge}
                          </span>
                        )}
                        {c.isFree && (
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "0.25rem", backgroundColor: "#dcfce7", color: "#15803d" }}>
                            FREE
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{c.title}</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem", fontFamily: "monospace" }}>{publicUrl}</div>
                    </td>

                    <td style={{ padding: "1rem", color: "#334155" }}>
                      {isTest ? (
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Online CBT Simulator</span>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{c.mode || "ONLINE"}</div>
                          {c.mode === "PHYSICAL" && (
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              📍 {c.centre?.name || "Indirapuram Centre"}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "1rem", color: "#0f172a" }}>
                      {c.isFree ? (
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>₹0 (Free Diagnostic)</span>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700 }}>₹{c.price.toLocaleString("en-IN")}</div>
                          {c.discountPrice && c.discountPrice < c.price && (
                            <div style={{ fontSize: "0.75rem", color: "#16a34a" }}>
                              Offer: ₹{c.discountPrice.toLocaleString("en-IN")}
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    <td style={{ padding: "1rem", color: "#475569" }}>
                      {isTest ? (
                        <div style={{ fontSize: "0.8125rem" }}>
                          📊 {c.testCountFull || 0} Mocks · {c.testCountChapter || 0} Drills
                        </div>
                      ) : c.mode === "PHYSICAL" ? (
                        <div style={{ fontSize: "0.8125rem", color: (c.seatsLeft ?? 0) <= 5 ? "#dc2626" : "#0f172a", fontWeight: 600 }}>
                          🪑 {c.seatsLeft ?? 0} / {c.seatsTotal ?? 30} seats left
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Unlimited Online Enrolments</div>
                      )}
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.625rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: c.status === "PUBLISHED" ? "#dcfce7" : c.status === "DRAFT" ? "#fef3c7" : "#f1f5f9",
                          color: c.status === "PUBLISHED" ? "#15803d" : c.status === "DRAFT" ? "#b45309" : "#475569",
                        }}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                        <Link
                          href={publicUrl}
                          target="_blank"
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #cbd5e1",
                            color: "#334155",
                            textDecoration: "none",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          View ↗
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#fff",
                            color: c.status === "PUBLISHED" ? "#b45309" : "#15803d",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {c.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#fff",
                            color: "#2563eb",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c)}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #fecaca",
                            backgroundColor: "#fff5f5",
                            color: "#dc2626",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit / Create Product Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                {modalMode === "create" ? "Create New Product" : `Edit: ${formData.title}`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Product Classification */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Product Type *
                  </label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, productType: e.target.value as "COURSE" | "TEST_SERIES" }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontWeight: 600 }}
                  >
                    <option value="COURSE">Tuition Course (Lectures, DPPs, Doubts)</option>
                    <option value="TEST_SERIES">Test Series (CBT Mocks &amp; Analytics)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Target Class *
                  </label>
                  <select
                    value={formData.targetClass}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetClass: e.target.value }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Class 12 Plus">Class 12 Plus (Droppers)</option>
                    <option value="IIT-JEE">IIT-JEE Competitive</option>
                  </select>
                </div>
              </div>

              {/* Title & Slug */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      title: newTitle,
                      slug: modalMode === "create" ? autoSlug(newTitle) : prev.slug,
                    }));
                  }}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  placeholder="e.g. Class 10 Board Excellence Mock Series"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: autoSlug(e.target.value) }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Promotional Badge (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. High Yield, New, 2026 Batch"
                    value={formData.badge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              {/* Pricing & Free Checkbox */}
              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <input
                    type="checkbox"
                    id="isFreeCheckbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isFree: e.target.checked }))}
                  />
                  <label htmlFor="isFreeCheckbox" style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>
                    Free Product (1-Click Free Diagnostic Enrolment — ₹0)
                  </label>
                </div>

                {!formData.isFree && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Discounted Offer Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.discountPrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discountPrice: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* If COURSE: Mode & Centre Details */}
              {formData.productType === "COURSE" && (
                <div style={{ backgroundColor: "#fff7ed", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #ffedd5" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 800, color: "#9a3412" }}>
                    Delivery Mode &amp; Centre Configuration
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Delivery Mode
                      </label>
                      <select
                        value={formData.mode}
                        onChange={(e) => setFormData((prev) => ({ ...prev, mode: e.target.value as "ONLINE" | "PHYSICAL" | "BOTH" }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                      >
                        <option value="ONLINE">Online Interactive</option>
                        <option value="PHYSICAL">Physical Classroom Coaching</option>
                        <option value="BOTH">Dual Mode (Online + Physical)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Centre Location
                      </label>
                      <select
                        value={formData.centreId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, centreId: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                      >
                        {centres.map((ctr) => (
                          <option key={ctr.id} value={ctr.id}>
                            {ctr.name} ({ctr.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(formData.mode === "PHYSICAL" || formData.mode === "BOTH") && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                          Total Physical Capacity (Seats)
                        </label>
                        <input
                          type="number"
                          value={formData.seatsTotal}
                          onChange={(e) => setFormData((prev) => ({ ...prev, seatsTotal: e.target.value }))}
                          style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                          Seats Remaining Left
                        </label>
                        <input
                          type="number"
                          value={formData.seatsLeft}
                          onChange={(e) => setFormData((prev) => ({ ...prev, seatsLeft: e.target.value }))}
                          style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* If TEST_SERIES: Mock counts */}
              {formData.productType === "TEST_SERIES" && (
                <div style={{ backgroundColor: "#eff6ff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #dbeafe" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", fontWeight: 800, color: "#1e40af" }}>
                    Test Series Package Metrics
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Full Length Mocks Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.testCountFull}
                        onChange={(e) => setFormData((prev) => ({ ...prev, testCountFull: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Chapter &amp; Topic Drills Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.testCountChapter}
                        onChange={(e) => setFormData((prev) => ({ ...prev, testCountChapter: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category, Validity & Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Publishing Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "DRAFT" | "PUBLISHED" }))}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontWeight: 700 }}
                  >
                    <option value="DRAFT">Draft (Hidden)</option>
                    <option value="PUBLISHED">Published (Active in Catalog)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    padding: "0.5rem 1.5rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: formData.productType === "TEST_SERIES" ? "#2563eb" : "#ea580c",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: isPending ? "wait" : "pointer",
                  }}
                >
                  {isPending ? "Saving..." : modalMode === "create" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
