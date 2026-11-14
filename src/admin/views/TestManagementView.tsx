"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";

interface TestItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: "FULL_MOCK" | "CHAPTER" | "SECTIONAL" | "DIAGNOSTIC";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  durationMin: number;
  totalMarks: number;
  passMarks: number | null;
  lateStartRule: "REDUCE_TIME" | "FULL_TIME";
  graceSeconds: number;
  maxAttempts: number;
  isFreePreview: boolean;
  series?: { id: string; title: string; slug: string } | null;
  _count: { testQuestions: number; sections: number; attempts: number };
}

interface TestSeriesOption {
  id: string;
  title: string;
  slug: string;
  productType?: "COURSE" | "TEST_SERIES";
}

export function TestManagementView() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [seriesList, setSeriesList] = useState<TestSeriesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [seriesFilter, setSeriesFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    seriesId: "",
    type: "FULL_MOCK" as TestItem["type"],
    status: "DRAFT" as TestItem["status"],
    durationMin: 180,
    passMarks: "60",
    lateStartRule: "REDUCE_TIME" as "REDUCE_TIME" | "FULL_TIME",
    graceSeconds: 10,
    maxAttempts: 1,
    isFreePreview: false,
    requireFullscreen: false,
    instructions: "",
  });

  const loadTests = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (seriesFilter !== "ALL") params.set("seriesId", seriesFilter);

      const res = await fetch(`/api/admin/tests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tests");

      const result = await res.json();
      setTests(result.data || []);
      setSeriesList(result.testSeries || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading tests";
      setActionError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, seriesFilter]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  function openCreateModal() {
    setModalMode("create");
    setSelectedTest(null);
    setFormData({
      code: `MOCK-${Date.now().toString().slice(-4)}`,
      title: "",
      description: "",
      seriesId: seriesList[0]?.id || "",
      type: "FULL_MOCK",
      status: "DRAFT",
      durationMin: 180,
      passMarks: "60",
      lateStartRule: "REDUCE_TIME",
      graceSeconds: 10,
      maxAttempts: 1,
      isFreePreview: false,
      requireFullscreen: false,
      instructions: "NTA-pattern online computer based test simulation.",
    });
    setIsModalOpen(true);
  }

  function openEditModal(t: TestItem) {
    setModalMode("edit");
    setSelectedTest(t);
    setFormData({
      code: t.code,
      title: t.title,
      description: t.description || "",
      seriesId: t.series?.id || "",
      type: t.type,
      status: t.status,
      durationMin: t.durationMin,
      passMarks: t.passMarks ? String(t.passMarks) : "",
      lateStartRule: t.lateStartRule,
      graceSeconds: t.graceSeconds,
      maxAttempts: t.maxAttempts,
      isFreePreview: t.isFreePreview,
      requireFullscreen: false,
      instructions: "",
    });
    setIsModalOpen(true);
  }

  async function handleDelete(t: TestItem) {
    if (!confirm(`Are you sure you want to archive test "${t.title}" (${t.code})?`)) return;
    try {
      const res = await fetch(`/api/admin/tests/${t.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to archive test");
      setActionSuccess("Test archived successfully.");
      loadTests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to archive test";
      setActionError(msg);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const payload = {
      code: formData.code.trim(),
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      seriesId: formData.seriesId || null,
      type: formData.type,
      status: formData.status,
      durationMin: Number(formData.durationMin) || 180,
      passMarks: formData.passMarks ? Number(formData.passMarks) : null,
      lateStartRule: formData.lateStartRule,
      graceSeconds: Number(formData.graceSeconds) || 10,
      maxAttempts: Number(formData.maxAttempts) || 1,
      isFreePreview: formData.isFreePreview,
      requireFullscreen: formData.requireFullscreen,
      instructions: formData.instructions.trim() || null,
    };

    startTransition(async () => {
      try {
        const url = modalMode === "create" ? "/api/admin/tests" : `/api/admin/tests/${selectedTest?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save test");

        setIsModalOpen(false);
        setActionSuccess(modalMode === "create" ? "Test created successfully." : "Test updated successfully.");
        loadTests();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error saving test";
        setActionError(msg);
      }
    });
  }

  async function handleToggleStatus(test: TestItem) {
    const newStatus = test.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/tests/${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setActionSuccess(`Test ${test.code} is now ${newStatus}.`);
      loadTests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      setActionError(msg);
    }
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Tests & CBT Mocks
            </h1>
            <span
              style={{
                backgroundColor: "#e0e7ff",
                color: "#3730a3",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
              }}
            >
              {tests.length} Tests
            </span>
          </div>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
            Manage Computer-Based Tests, configure exam durations, section timers, question allocations, and publish status.
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
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>+ Create New Test</span>
        </button>
      </div>

      {actionError && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "0.875rem 1rem", borderRadius: "0.5rem", marginBottom: "1.25rem" }}>
          ⚠️ {actionError}
        </div>
      )}

      {actionSuccess && (
        <div style={{ backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "0.875rem 1rem", borderRadius: "0.5rem", marginBottom: "1.25rem" }}>
          ✓ {actionSuccess}
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          backgroundColor: "#ffffff",
          padding: "1rem",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.25rem" }}>
            Search Title or Code
          </label>
          <input
            type="text"
            placeholder="Search test..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.25rem" }}>
            Parent Test Series
          </label>
          <select
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
          >
            <option value="ALL">All Test Series & Courses</option>
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.productType === "COURSE" ? `📚 [Course] ${s.title}` : `🎯 [Test Series] ${s.title}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.25rem" }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Tests Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            Loading tests...
          </div>
        ) : tests.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.5rem" }}>
              No tests created yet
            </p>
            <p style={{ fontSize: "0.875rem" }}>
              Click &quot;+ Create New Test&quot; above to setup your first mock test.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Test Code & Title</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Series Course</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Duration & Marks</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Sections & Questions</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.title}</div>
                      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginTop: "0.25rem" }}>
                        <span style={{ fontSize: "0.75rem", backgroundColor: "#f1f5f9", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", fontWeight: 600, color: "#334155" }}>
                          {t.code}
                        </span>
                        {t.isFreePreview && (
                          <span style={{ fontSize: "0.7rem", backgroundColor: "#dcfce7", color: "#15803d", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                            Free Preview
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <div style={{ color: "#334155", fontWeight: 600 }}>{t.series?.title || "Standalone"}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{t.type.replace("_", " ")}</div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{t.durationMin} mins</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Total: {t.totalMarks} marks</div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{t._count.testQuestions} questions</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{t._count.sections} sections</div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.375rem",
                          backgroundColor:
                            t.status === "PUBLISHED" ? "#dcfce7" : t.status === "DRAFT" ? "#fef3c7" : "#f1f5f9",
                          color:
                            t.status === "PUBLISHED" ? "#166534" : t.status === "DRAFT" ? "#92400e" : "#475569",
                        }}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                        <Link
                          href={`/admin/tests/${t.id}`}
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            borderRadius: "0.375rem",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            textDecoration: "none",
                          }}
                        >
                          ⚙️ Build &amp; Questions
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t)}
                          style={{
                            padding: "0.35rem 0.6rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            borderRadius: "0.375rem",
                            backgroundColor: t.status === "PUBLISHED" ? "#f1f5f9" : "#dcfce7",
                            color: t.status === "PUBLISHED" ? "#475569" : "#15803d",
                            border: t.status === "PUBLISHED" ? "1px solid #cbd5e1" : "1px solid #86efac",
                            cursor: "pointer",
                          }}
                          title={t.status === "PUBLISHED" ? "Revert to Draft" : "Publish Test"}
                        >
                          {t.status === "PUBLISHED" ? "Draft" : "Publish 🚀"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          style={{
                            padding: "0.35rem 0.6rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: "0.375rem",
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                            cursor: "pointer",
                          }}
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          style={{
                            padding: "0.35rem 0.6rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: "0.375rem",
                            backgroundColor: "#fff1f2",
                            color: "#be123c",
                            border: "1px solid #fecdd3",
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
          onClick={() => !isPending && setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {modalMode === "create" ? "Create New CBT Test" : `Edit Test (${formData.code})`}
              </h3>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Test Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Test Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. JEE Main Full Mock 1"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Map to Course / Test Series
                  </label>
                  <select
                    value={formData.seriesId}
                    onChange={(e) => setFormData({ ...formData, seriesId: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="">None (Standalone)</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.productType === "COURSE" ? `📚 [Course] ${s.title}` : `🎯 [Test Series] ${s.title}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Test Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TestItem["type"] })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="FULL_MOCK">Full Mock Test</option>
                    <option value="CHAPTER">Chapter Mastery Test</option>
                    <option value="SECTIONAL">Sectional Test</option>
                    <option value="DIAGNOSTIC">Diagnostic Mock</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={360}
                    value={formData.durationMin}
                    onChange={(e) => setFormData({ ...formData, durationMin: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    value={formData.passMarks}
                    onChange={(e) => setFormData({ ...formData, passMarks: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TestItem["status"] })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="DRAFT">Draft (Hidden)</option>
                    <option value="PUBLISHED">Published (Active)</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Late Start Rule
                  </label>
                  <select
                    value={formData.lateStartRule}
                    onChange={(e) => setFormData({ ...formData, lateStartRule: e.target.value as "REDUCE_TIME" | "FULL_TIME" })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="REDUCE_TIME">Reduce Time (Clamp to Window Close)</option>
                    <option value="FULL_TIME">Full Time (Award Complete Duration)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Network Grace Buffer (Seconds)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={formData.graceSeconds}
                    onChange={(e) => setFormData({ ...formData, graceSeconds: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isFreePreview}
                    onChange={(e) => setFormData({ ...formData, isFreePreview: e.target.checked })}
                  />
                  <span>Mark as Free Preview Mock (Enables instant demo attempts for visitors)</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "0.625rem 1.25rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", fontWeight: 600 }}
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
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {isPending ? "Saving..." : modalMode === "create" ? "Create Test" : "Update Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

