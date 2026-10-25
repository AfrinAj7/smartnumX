"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    categoryId: "",
    price: "",
    discountPrice: "",
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
      if (json.meta?.categories) {
        setCategories(json.meta.categories);
      }
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

  function openCreateModal() {
    setModalMode("create");
    setSelectedCourse(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      categoryId: categories[0]?.id || "",
      price: "1999",
      discountPrice: "1499",
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

    const payload = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      categoryId: formData.categoryId || undefined,
      price: parseFloat(formData.price) || 0,
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
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
        const msg = err instanceof Error ? err.message : "Failed to save course";
        setActionError(msg);
      }
    });
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return (
    <div className="admin-course-view" style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Top Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            Academic Catalog &amp; E-Commerce
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0.25rem 0 0" }}>
            Course Management
          </h1>
          <p style={{ color: "#475569", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
            Create and edit programs, set tuition fees in ₹, configure validity, and publish to the live catalog.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
          }}
        >
          <span>+</span> Create New Course
        </button>
      </div>

      {actionError && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "0.875rem 1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
          ⚠️ {actionError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "#ffffff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search courses by title, slug, or keywords..."
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
              fontWeight: 500,
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
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            Loading course catalog...
          </div>
        ) : courses.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <p style={{ margin: "0 0 1rem", fontSize: "1rem" }}>No courses found matching your criteria.</p>
            <button
              onClick={openCreateModal}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Add First Course
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Course Details</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Tuition Price</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Enrolments</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "0.25rem" }}>
                      {course.title}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem", fontFamily: "monospace" }}>
                      /courses/{course.slug}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", color: "#334155" }}>
                    <span style={{ backgroundColor: "#f1f5f9", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>
                      {course.category?.name || "General"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", color: "#0f172a" }}>
                    <div style={{ fontWeight: 600 }}>₹{course.price.toLocaleString("en-IN")}</div>
                    {course.discountPrice && course.discountPrice < course.price && (
                      <div style={{ fontSize: "0.75rem", color: "#16a34a" }}>
                        Offer: ₹{course.discountPrice.toLocaleString("en-IN")}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor:
                          course.status === "PUBLISHED"
                            ? "#dcfce7"
                            : course.status === "DRAFT"
                            ? "#fef3c7"
                            : "#f1f5f9",
                        color:
                          course.status === "PUBLISHED"
                            ? "#15803d"
                            : course.status === "DRAFT"
                            ? "#b45309"
                            : "#475569",
                      }}
                    >
                      {course.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", color: "#475569" }}>
                    <div>👥 {course._count.enrollments} Students</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>🛒 {course._count.orderItems} Orders</div>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <Link
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        style={{
                          padding: "0.375rem 0.75rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          textDecoration: "none",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      >
                        Preview ↗
                      </Link>

                      <button
                        onClick={() => handleToggleStatus(course)}
                        style={{
                          padding: "0.375rem 0.75rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#ffffff",
                          color: course.status === "PUBLISHED" ? "#b45309" : "#15803d",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        {course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        onClick={() => openEditModal(course)}
                        style={{
                          padding: "0.375rem 0.75rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#ffffff",
                          color: "#2563eb",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteCourse(course)}
                        style={{
                          padding: "0.375rem 0.75rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #fecaca",
                          backgroundColor: "#fff5f5",
                          color: "#dc2626",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Create / Edit */}
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
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {modalMode === "create" ? "Create New Course" : "Edit Course Details"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  Course Title *
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
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  placeholder="e.g. Class 10 Board Excellence Programme"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: autoSlug(e.target.value) }))}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  placeholder="class-10-board-excellence"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  placeholder="Comprehensive concept-first tuition and diagnostic testing..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                    Standard Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                    placeholder="1999"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                    Discount / Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, discountPrice: e.target.value }))}
                    style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                    placeholder="1499"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                    style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
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
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.validityDays}
                    onChange={(e) => setFormData((prev) => ({ ...prev, validityDays: e.target.value }))}
                    style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                    placeholder="365"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  Publishing Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "DRAFT" | "PUBLISHED" }))}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                >
                  <option value="DRAFT">Draft (Hidden from catalog checkout)</option>
                  <option value="PUBLISHED">Published (Available for purchase)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "0.625rem 1rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 600,
                    cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.7 : 1,
                  }}
                >
                  {isPending ? "Saving..." : modalMode === "create" ? "Create Course" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
