"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";

interface EnrollmentItem {
  id: string;
  userId: string;
  courseId: string;
  source: string;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
  };
  order: {
    id: string;
    invoiceNo: string | null;
    total: number;
  } | null;
}

export function EnrollmentManagementView() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    userEmail: "",
    courseId: "",
    validityDays: "365",
    reason: "Direct offline centre enrolment",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const [enrRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/enrollments?${params.toString()}`),
        fetch("/api/courses"),
      ]);

      if (!enrRes.ok) throw new Error("Failed to load enrollments");
      const enrJson = await enrRes.json();
      setEnrollments(enrJson.data || []);

      if (coursesRes.ok) {
        const cJson = await coursesRes.json();
        setCourses(cJson.data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load enrollments.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadData();
  }

  async function handleManualEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: formData.userEmail,
            courseId: formData.courseId,
            validityDays: parseInt(formData.validityDays, 10),
            reason: formData.reason,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to manually enroll student.");
        }

        setIsModalOpen(false);
        loadData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to enroll student.";
        setError(msg);
      }
    });
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            Student Registry &amp; Access
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: "0.25rem 0 0" }}>
            Learners &amp; Course Enrolments
          </h1>
          <p style={{ color: "#475569", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
            Manage student course permissions, inspect active validity windows, and grant manual access.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              userEmail: "",
              courseId: courses[0]?.id || "",
              validityDays: "365",
              reason: "Direct offline centre enrolment",
            });
            setIsModalOpen(true);
          }}
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
          <span>+</span> Grant Manual Enrolment
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "0.875rem 1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "#ffffff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search by student name, email, or course..."
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
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            Loading enrolment records...
          </div>
        ) : enrollments.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            No enrolment records found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Student</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Enrolled Course</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Source</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Enrolled On</th>
                <th style={{ padding: "0.875rem 1rem", color: "#475569", fontWeight: 600 }}>Validity</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr) => (
                <tr key={enr.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{enr.user.name || "Student"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{enr.user.email}</div>
                  </td>
                  <td style={{ padding: "1rem", color: "#334155" }}>
                    <Link
                      href={`/courses/${enr.course.slug}`}
                      target="_blank"
                      style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
                    >
                      {enr.course.title} ↗
                    </Link>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        backgroundColor: enr.source === "PURCHASE" ? "#eff6ff" : "#f1f5f9",
                        color: enr.source === "PURCHASE" ? "#1d4ed8" : "#475569",
                        fontWeight: 600,
                      }}
                    >
                      {enr.source}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: enr.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                        color: enr.status === "ACTIVE" ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {enr.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8125rem" }}>
                    {new Date(enr.startedAt).toLocaleDateString("en-IN")}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.8125rem" }}>
                    {enr.expiresAt ? new Date(enr.expiresAt).toLocaleDateString("en-IN") : "Lifetime"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Manual Enrolment Modal */}
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
              maxWidth: "500px",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Grant Manual Enrolment
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualEnroll} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  Student User ID or Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. student1@example.com or user ID"
                  value={formData.userEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, userEmail: e.target.value }))}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  Select Course *
                </label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, courseId: e.target.value }))}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                >
                  <option value="">Select a Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  Validity (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.validityDays}
                  onChange={(e) => setFormData((prev) => ({ ...prev, validityDays: e.target.value }))}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  Enrolment Reason / Audit Note
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
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
                  {isPending ? "Granting..." : "Grant Enrolment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
