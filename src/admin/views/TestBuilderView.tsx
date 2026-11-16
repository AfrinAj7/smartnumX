"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { MathText } from "@/web-client/components/ui/MathText";
import { TestAnalyticsView } from "@/admin/components/tests/TestAnalyticsView";
import { TestReevaluationView } from "@/admin/components/tests/TestReevaluationView";
import { TestAttemptsView } from "@/admin/components/tests/TestAttemptsView";

interface QuestionItem {
  id: string;
  code: string;
  type: string;
  stem: string;
  subject: string;
  chapter: string | null;
  difficulty: string | null;
}

interface TestQuestionItem {
  id: string;
  order: number;
  marks: number;
  negMarks: number;
  questionId: string;
  question: QuestionItem;
}

interface SectionItem {
  id: string;
  name: string;
  order: number;
  durationMin: number | null;
  maxToAttempt: number | null;
  testQuestions: TestQuestionItem[];
}

interface TestDetail {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  durationMin: number;
  totalMarks: number;
  passMarks: number | null;
  series?: { id: string; title: string; slug: string; productType?: "COURSE" | "TEST_SERIES" } | null;
  sections: SectionItem[];
  testQuestions: TestQuestionItem[]; // unsectioned questions if any
  _count: { testQuestions: number; attempts: number };
}

export function TestBuilderView({ testId }: { testId: string }) {
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Section Modal
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionDuration, setSectionDuration] = useState("");
  const [sectionMaxAttempt, setSectionMaxAttempt] = useState("");

  // Question Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSubject, setPickerSubject] = useState("ALL");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerMarks, setPickerMarks] = useState("4");
  const [pickerNegMarks, setPickerNegMarks] = useState("1");
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerPageSize, setPickerPageSize] = useState(25);
  const [pickerTotal, setPickerTotal] = useState(0);
  const [pickerTotalPages, setPickerTotalPages] = useState(1);

  // Marking Scheme Configuration State
  const [isMarkingModalOpen, setIsMarkingModalOpen] = useState(false);
  const [markingPositive, setMarkingPositive] = useState("4");
  const [markingNegativeEnabled, setMarkingNegativeEnabled] = useState(true);
  const [markingNegativeDeduction, setMarkingNegativeDeduction] = useState("1");
  const [markingTargetSection, setMarkingTargetSection] = useState<string>("ALL");
  const [markingSubmitting, setMarkingSubmitting] = useState(false);

  // Individual Question Marks Editing State
  const [editingQuestionMarks, setEditingQuestionMarks] = useState<{
    questionId: string;
    code: string;
    marks: string;
    negMarks: string;
  } | null>(null);
  const [savingIndividualMarks, setSavingIndividualMarks] = useState(false);

  // Tab & Assignments State
  const [activeTab, setActiveTab] = useState<"CURRICULUM" | "ANALYTICS" | "REEVALUATE" | "ATTEMPTS" | "ASSIGNMENTS">("CURRICULUM");
  const [assignments, setAssignments] = useState<Array<{
    id: string;
    userId: string;
    user: { id: string; name: string | null; email: string; phone: string | null };
    source: string;
    validUntil: string | null;
    createdAt: string;
    attemptsCount: number;
    bestScore: number | null;
    latestAttempt: { id: string; status: string; totalScore: number | null; startedAt: string; submittedAt: string | null } | null;
  }>>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [grantIdentifiers, setGrantIdentifiers] = useState("");
  const [grantValidUntil, setGrantValidUntil] = useState("");
  const [grantSource, setGrantSource] = useState<"ADMIN_GRANT" | "FREE_PREVIEW">("ADMIN_GRANT");
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleTogglePublish = async () => {
    if (!test) return;
    const newStatus = test.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const confirmMsg =
      newStatus === "PUBLISHED"
        ? "Publish this mock test? Enrolled students will immediately be able to attempt it."
        : "Revert test to DRAFT? Students will no longer see it until published.";
    if (!confirm(confirmMsg)) return;

    setPublishing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/tests/${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update test status");
      setActionSuccess(`Test status updated to ${newStatus}.`);
      loadTest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating test status";
      setActionError(msg);
    } finally {
      setPublishing(false);
    }
  };

  const loadTest = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}`);
      if (!res.ok) throw new Error("Failed to load test details");
      const result = await res.json();
      setTest(result.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading test";
      setActionError(msg);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  const loadBankQuestions = useCallback(async () => {
    setPickerLoading(true);
    try {
      const params = new URLSearchParams();
      if (pickerSearch) params.set("search", pickerSearch);
      if (pickerSubject !== "ALL") params.set("subject", pickerSubject);
      params.set("page", pickerPage.toString());
      params.set("pageSize", pickerPageSize.toString());

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch questions from bank");
      const data = await res.json();
      setBankQuestions(data.data || []);
      if (data.meta) {
        setPickerTotal(data.meta.total || 0);
        setPickerTotalPages(data.meta.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setPickerLoading(false);
    }
  }, [pickerSearch, pickerSubject, pickerPage, pickerPageSize]);

  useEffect(() => {
    if (isPickerOpen) {
      loadBankQuestions();
    }
  }, [isPickerOpen, loadBankQuestions]);

  function openPicker(sectionId: string | null) {
    setTargetSectionId(sectionId);
    setPickerPage(1);
    setIsPickerOpen(true);
  }

  async function handleAddQuestion(q: QuestionItem) {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tests/${testId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: q.id,
            sectionId: targetSectionId,
            marks: parseFloat(pickerMarks) || 4,
            negMarks: parseFloat(pickerNegMarks) || 1,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add question to test");

        setActionSuccess(`Added "${q.code}" to test.`);
        loadTest();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error adding question";
        setActionError(msg);
      }
    });
  }

  async function handleRemoveQuestion(questionId: string) {
    if (!confirm("Are you sure you want to remove this question from the test?")) return;
    try {
      const res = await fetch(`/api/admin/tests/${testId}/questions?questionId=${questionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove question");
      setActionSuccess("Question removed from test.");
      loadTest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error removing question";
      setActionError(msg);
    }
  }

  async function handleApplyMarkingScheme(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setMarkingSubmitting(true);
    try {
      const marks = parseFloat(markingPositive) || 4;
      const negMarks = markingNegativeEnabled ? (parseFloat(markingNegativeDeduction) || 0) : 0;
      const sectionId = markingTargetSection === "ALL" ? undefined : markingTargetSection;

      const res = await fetch(`/api/admin/tests/${testId}/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          marks,
          negMarks,
          sectionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update marking scheme");

      setActionSuccess(`Updated marking scheme (+${marks} / -${negMarks}) across questions.`);
      setIsMarkingModalOpen(false);
      loadTest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error applying marking scheme";
      setActionError(msg);
    } finally {
      setMarkingSubmitting(false);
    }
  }

  async function handleSaveIndividualMarks(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuestionMarks) return;
    setSavingIndividualMarks(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: editingQuestionMarks.questionId,
          marks: parseFloat(editingQuestionMarks.marks) || 0,
          negMarks: parseFloat(editingQuestionMarks.negMarks) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to update question marks");
      setActionSuccess(`Updated marks for "${editingQuestionMarks.code}".`);
      setEditingQuestionMarks(null);
      loadTest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating question marks";
      setActionError(msg);
    } finally {
      setSavingIndividualMarks(false);
    }
  }

  async function handleCreateSection(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sectionName.trim(),
          durationMin: sectionDuration ? parseInt(sectionDuration, 10) : null,
          maxToAttempt: sectionMaxAttempt ? parseInt(sectionMaxAttempt, 10) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create section");
      setIsSectionModalOpen(false);
      setSectionName("");
      setSectionDuration("");
      setSectionMaxAttempt("");
      setActionSuccess("Section created successfully.");
      loadTest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating section";
      setActionError(msg);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm("Are you sure you want to delete this section? Questions in it will be unassigned.")) return;
    try {
      const res = await fetch(`/api/admin/tests/${testId}/sections/${sectionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete section");
      setActionSuccess("Section deleted.");
      loadTest();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting section";
      setActionError(msg);
    }
  }

  const loadAssignments = useCallback(async (searchQuery?: string) => {
    setAssignmentsLoading(true);
    try {
      const q = searchQuery !== undefined ? searchQuery : assignmentSearch;
      const res = await fetch(`/api/admin/tests/${testId}/assignments?search=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Failed to load assignments");
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [testId, assignmentSearch]);

  useEffect(() => {
    if (activeTab === "ASSIGNMENTS") {
      loadAssignments();
    }
  }, [activeTab, loadAssignments]);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantIdentifiers.trim()) return;
    setGrantSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const identifiers = grantIdentifiers.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/admin/tests/${testId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifiers,
          source: grantSource,
          validUntil: grantValidUntil ? new Date(grantValidUntil).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant access");
      setActionSuccess(data.message || "Access granted successfully.");
      setGrantIdentifiers("");
      loadAssignments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error granting access";
      setActionError(msg);
    } finally {
      setGrantSubmitting(false);
    }
  };

  const handleRevokeAccess = async (userId: string, userName: string) => {
    if (!confirm(`Revoke direct test access for ${userName}?`)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke access");
      setActionSuccess(data.message || "Access revoked.");
      loadAssignments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error revoking access";
      setActionError(msg);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1rem", textAlign: "center", color: "#64748b" }}>
        Loading test details...
      </div>
    );
  }

  if (!test) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1rem", textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontWeight: 700 }}>Test not found.</p>
        <Link href="/admin/tests" style={{ color: "#2563eb", marginTop: "1rem", display: "inline-block" }}>
          &larr; Back to Tests
        </Link>
      </div>
    );
  }

  // Already assigned question IDs
  const assignedQuestionIds = new Set<string>();
  test.sections?.forEach((s) => s.testQuestions?.forEach((tq) => assignedQuestionIds.add(tq.questionId)));
  test.testQuestions?.forEach((tq) => assignedQuestionIds.add(tq.questionId));

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/tests" style={{ color: "#2563eb", fontSize: "0.875rem", textDecoration: "none", fontWeight: 600 }}>
          &larr; Back to Tests & Mocks
        </Link>
      </div>

      {/* Test Hero Banner */}
      <div
        style={{
          backgroundColor: "#0a2540",
          color: "#ffffff",
          padding: "1.5rem 1.75rem",
          borderRadius: "0.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ backgroundColor: "#2563eb", color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                {test.code}
              </span>
              <span style={{ backgroundColor: test.status === "PUBLISHED" ? "#10b981" : "#f59e0b", color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                {test.status}
              </span>

              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={publishing}
                style={{
                  backgroundColor: test.status === "PUBLISHED" ? "#334155" : "#10b981",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.75rem",
                  borderRadius: "0.25rem",
                  border: "none",
                  cursor: publishing ? "not-allowed" : "pointer",
                }}
              >
                {publishing
                  ? "Updating..."
                  : test.status === "PUBLISHED"
                  ? "Revert to Draft"
                  : "Publish Test 🚀"}
              </button>

              <Link
                href={`/tests/${test.id}/instructions`}
                target="_blank"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.6rem",
                  borderRadius: "0.25rem",
                  textDecoration: "none",
                }}
              >
                Preview Student Exam ↗
              </Link>

              {test.series ? (
                <Link
                  href={test.series.productType === "COURSE" ? `/admin/courses/${test.series.id}` : `/test-series/${test.series.slug}`}
                  target="_blank"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.25)",
                    border: "1px solid rgba(147, 197, 253, 0.4)",
                    color: "#bfdbfe",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.25rem 0.6rem",
                    borderRadius: "0.25rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                  title="View parent course/test-series"
                >
                  {test.series.productType === "COURSE" ? "📚 Course:" : "🎯 Test Series:"} {test.series.title} ↗
                </Link>
              ) : (
                <span
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    padding: "0.25rem 0.6rem",
                    borderRadius: "0.25rem",
                  }}
                >
                  Standalone (Not mapped to any course)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.5rem 0 0.25rem" }}>
              {test.title}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", margin: 0 }}>
              {test.description || "No description provided."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", textAlign: "right" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block" }}>DURATION</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800 }}>{test.durationMin}m</span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block" }}>TOTAL MARKS</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#38bdf8" }}>{test.totalMarks}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block" }}>QUESTIONS</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#4ade80" }}>{test._count.testQuestions}</span>
            </div>
          </div>
        </div>
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

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("CURRICULUM")}
          style={{
            padding: "0.75rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 700,
            borderBottom: activeTab === "CURRICULUM" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "CURRICULUM" ? "#2563eb" : "#64748b",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          📝 Sections &amp; Questions ({test._count.testQuestions})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ANALYTICS")}
          style={{
            padding: "0.75rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 700,
            borderBottom: activeTab === "ANALYTICS" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "ANALYTICS" ? "#2563eb" : "#64748b",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          📊 Analytics &amp; Insights
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("REEVALUATE")}
          style={{
            padding: "0.75rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 700,
            borderBottom: activeTab === "REEVALUATE" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "REEVALUATE" ? "#2563eb" : "#64748b",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          ⚖️ Re-evaluation Engine
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ATTEMPTS")}
          style={{
            padding: "0.75rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 700,
            borderBottom: activeTab === "ATTEMPTS" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "ATTEMPTS" ? "#2563eb" : "#64748b",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          🛡️ Student Attempts &amp; Integrity ({test._count.attempts})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ASSIGNMENTS")}
          style={{
            padding: "0.75rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 700,
            borderBottom: activeTab === "ASSIGNMENTS" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "ASSIGNMENTS" ? "#2563eb" : "#64748b",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          👥 Direct Grants
        </button>
      </div>

      {activeTab === "CURRICULUM" && (
        <>
          {/* Sections and Questions Builder */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Sections &amp; Assigned Questions
            </h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsMarkingModalOpen(true)}
                style={{
                  backgroundColor: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #86efac",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span>⚙️ Marking Scheme &amp; Negative Marks</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(true)}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  border: "1px solid #2563eb",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add Section
              </button>
            </div>
          </div>

      {test.sections && test.sections.length > 0 ? (
        test.sections.map((sec, idx) => (
          <div
            key={sec.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              marginBottom: "1.5rem",
              overflow: "hidden",
            }}
          >
            {/* Section Header */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Section {idx + 1}
                </span>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0.15rem 0" }}>
                  {sec.name}
                </h3>
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                  <span>{sec.testQuestions?.length || 0} Questions</span>
                  {sec.durationMin && <span>&bull; Timer: {sec.durationMin} mins</span>}
                  {sec.maxToAttempt && (
                    <span style={{ color: "#d97706", fontWeight: 700 }}>
                      &bull; Choice Rule: Attempt any {sec.maxToAttempt}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => openPicker(sec.id)}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add Question from Bank
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSection(sec.id)}
                  style={{
                    backgroundColor: "#fff1f2",
                    color: "#be123c",
                    border: "1px solid #fecdd3",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Delete Section
                </button>
              </div>
            </div>

            {/* Questions List */}
            {sec.testQuestions && sec.testQuestions.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}>
                    <th style={{ padding: "0.6rem 1rem", color: "#64748b", fontWeight: 700, width: "3rem" }}>#</th>
                    <th style={{ padding: "0.6rem 1rem", color: "#64748b", fontWeight: 700 }}>Code & Subject</th>
                    <th style={{ padding: "0.6rem 1rem", color: "#64748b", fontWeight: 700 }}>Question Stem</th>
                    <th style={{ padding: "0.6rem 1rem", color: "#64748b", fontWeight: 700, width: "7rem" }}>Marks</th>
                    <th style={{ padding: "0.6rem 1rem", color: "#64748b", fontWeight: 700, width: "4rem", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.testQuestions.map((tq, qIdx) => (
                    <tr key={tq.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#64748b" }}>{qIdx + 1}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{tq.question.code}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{tq.question.subject}</div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>
                        <div style={{ maxHeight: "2.5rem", overflow: "hidden" }}>
                          <MathText content={tq.question.stem} />
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <span style={{ color: "#166534", fontWeight: 700 }}>+{tq.marks}</span>
                          <span>/</span>
                          <span style={{ color: Number(tq.negMarks) > 0 ? "#991b1b" : "#64748b", fontWeight: 700 }}>
                            {Number(tq.negMarks) > 0 ? `-${tq.negMarks}` : "0 (No neg)"}
                          </span>
                          <button
                            type="button"
                            title="Edit marks and negative marking for this question"
                            onClick={() =>
                              setEditingQuestionMarks({
                                questionId: tq.questionId,
                                code: tq.question.code,
                                marks: String(tq.marks),
                                negMarks: String(tq.negMarks),
                              })
                            }
                            style={{
                              marginLeft: "0.25rem",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              opacity: 0.8,
                            }}
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(tq.questionId)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#be123c",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
                No questions assigned to this section yet. Click &quot;+ Add Question from Bank&quot; above.
              </div>
            )}
          </div>
        ))
      ) : (
        <div style={{ padding: "2.5rem", backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px dashed #cbd5e1", textAlign: "center" }}>
          <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
            This test has no sections yet
          </p>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1rem" }}>
            Create sections (e.g. &quot;Section A - MCQ&quot; and &quot;Section B - Numeric&quot;) to organize questions.
          </p>
          <button
            onClick={() => setIsSectionModalOpen(true)}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Create First Section
          </button>
        </div>
      )}
        </>
      )}

      {activeTab === "ASSIGNMENTS" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Information Banner */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              padding: "1.25rem 1.5rem",
              fontSize: "0.875rem",
              color: "#334155",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>ℹ️ Automatic Entitlements vs. Direct Grants</span>
            </div>
            <p style={{ margin: "0 0 0.5rem" }}>
              1. <strong>Course Enrollment:</strong> All students who purchase or are enrolled in the parent Test Series course automatically have access to this test.
            </p>
            <p style={{ margin: "0 0 0.5rem" }}>
              2. <strong>Direct Student Grants:</strong> Use the form below to grant individual students or batches direct access (e.g. scholarships, offline payments, trial access) without requiring course enrollment.
            </p>
            <p style={{ margin: 0 }}>
              3. <strong>Free Preview:</strong> If this test is flagged as a free preview, all registered students can attempt it without any grant.
            </p>
          </div>

          {/* Grant Form Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
              Grant Direct Student Access
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1rem" }}>
              Enter student emails or user IDs to unlock this mock exam for them.
            </p>

            <form onSubmit={handleGrantAccess}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                  Student Email(s) or User ID(s) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="student1@example.com, student2@example.com (comma, space, or newline separated)"
                  value={grantIdentifiers}
                  onChange={(e) => setGrantIdentifiers(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Grant Type
                  </label>
                  <select
                    value={grantSource}
                    onChange={(e) => setGrantSource(e.target.value as "ADMIN_GRANT" | "FREE_PREVIEW")}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="ADMIN_GRANT">Admin Grant (Official)</option>
                    <option value="FREE_PREVIEW">Free Preview Grant</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Valid Until (Optional Expiration)
                  </label>
                  <input
                    type="date"
                    value={grantValidUntil}
                    onChange={(e) => setGrantValidUntil(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={grantSubmitting}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.625rem 1.5rem",
                    borderRadius: "0.375rem",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: grantSubmitting ? "not-allowed" : "pointer",
                    opacity: grantSubmitting ? 0.7 : 1,
                  }}
                >
                  {grantSubmitting ? "Granting..." : "Grant Direct Access →"}
                </button>
              </div>
            </form>
          </div>

          {/* Assigned Students List */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Directly Assigned Students ({assignments.length})
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>
                  Students granted direct test entitlements with real-time attempt tracking.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadAssignments()}
                  style={{
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                    minWidth: "220px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => loadAssignments()}
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    padding: "0.45rem 0.875rem",
                    borderRadius: "0.375rem",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  Filter
                </button>
              </div>
            </div>

            {assignmentsLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                Loading assigned students...
              </div>
            ) : assignments.length === 0 ? (
              <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: "0.5rem" }}>
                No direct assignments recorded for this test yet. Use the form above to grant access.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Student</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Type</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Valid Until</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Attempts</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Best Score</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Latest Status</th>
                      <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.user.name || "Student"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.user.email}</div>
                          {item.user.phone && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{item.user.phone}</div>}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              backgroundColor: item.source === "ADMIN_GRANT" ? "#e0f2fe" : "#fef3c7",
                              color: item.source === "ADMIN_GRANT" ? "#0369a1" : "#92400e",
                            }}
                          >
                            {item.source}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", color: "#475569", fontSize: "0.8125rem" }}>
                          {item.validUntil ? new Date(item.validUntil).toLocaleDateString("en-IN") : "Lifetime"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#0f172a" }}>
                          {item.attemptsCount}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: item.bestScore !== null ? "#2563eb" : "#94a3b8" }}>
                          {item.bestScore !== null ? `${item.bestScore}/${test.totalMarks}` : "—"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          {item.latestAttempt ? (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.25rem",
                                backgroundColor:
                                  item.latestAttempt.status === "SUBMITTED"
                                    ? "#dcfce7"
                                    : item.latestAttempt.status === "IN_PROGRESS"
                                    ? "#fef3c7"
                                    : "#f1f5f9",
                                color:
                                  item.latestAttempt.status === "SUBMITTED"
                                    ? "#15803d"
                                    : item.latestAttempt.status === "IN_PROGRESS"
                                    ? "#92400e"
                                    : "#475569",
                              }}
                            >
                              {item.latestAttempt.status}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Not Attempted</span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleRevokeAccess(item.userId, item.user.name || item.user.email)}
                            style={{
                              backgroundColor: "#ffffff",
                              color: "#ef4444",
                              border: "1px solid #fca5a5",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "ANALYTICS" && <TestAnalyticsView testId={testId} />}

      {activeTab === "REEVALUATE" && (
        <TestReevaluationView testId={testId} onReevaluationComplete={loadTest} />
      )}

      {activeTab === "ATTEMPTS" && <TestAttemptsView testId={testId} />}

      {/* Add Section Modal */}
      {isSectionModalOpen && (
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
          onClick={() => setIsSectionModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              maxWidth: "480px",
              width: "100%",
              padding: "1.5rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              Add New Test Section
            </h3>
            <form onSubmit={handleCreateSection}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Section A - Multiple Choice"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Section Timer (Min)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={sectionDuration}
                    onChange={(e) => setSectionDuration(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Max to Attempt (Choice)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5 of 10"
                    value={sectionMaxAttempt}
                    onChange={(e) => setSectionMaxAttempt(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", backgroundColor: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Picker Modal from Question Bank */}
      {isPickerOpen && (
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
          onClick={() => setIsPickerOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              maxWidth: "850px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Question Bank Picker
                </h3>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Pick questions from your library to add to this section.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {/* Score settings for added questions */}
            <div style={{ display: "flex", gap: "1rem", backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Marks:</label>
                <input
                  type="number"
                  value={pickerMarks}
                  onChange={(e) => setPickerMarks(e.target.value)}
                  style={{ width: "4rem", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Negative Marks:</label>
                <input
                  type="number"
                  value={pickerNegMarks}
                  onChange={(e) => setPickerNegMarks(e.target.value)}
                  style={{ width: "4rem", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            {/* Search in Picker */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                type="text"
                placeholder="Search stem or code..."
                value={pickerSearch}
                onChange={(e) => {
                  setPickerSearch(e.target.value);
                  setPickerPage(1);
                }}
                style={{ flex: 1, padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
              />
              <select
                value={pickerSubject}
                onChange={(e) => {
                  setPickerSubject(e.target.value);
                  setPickerPage(1);
                }}
                style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
              >
                <option value="ALL">All Subjects</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Logical Reasoning">Logical Reasoning</option>
              </select>
            </div>

            {/* Bank Questions Table */}
            {pickerLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading questions...</div>
            ) : bankQuestions.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No matching questions found in bank.</div>
            ) : (
              <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <tbody>
                    {bankQuestions.map((q) => {
                      const isAssigned = assignedQuestionIds.has(q.id);
                      return (
                        <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.6rem 0.75rem" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{q.code}</div>
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{q.subject} &bull; {q.type}</span>
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", color: "#334155" }}>
                            <div style={{ maxHeight: "2.5rem", overflow: "hidden" }}>
                              <MathText content={q.stem} />
                            </div>
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>
                            {isAssigned ? (
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", backgroundColor: "#dcfce7", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                                Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleAddQuestion(q)}
                                style={{
                                  backgroundColor: "#2563eb",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "0.3rem 0.75rem",
                                  borderRadius: "0.25rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                + Add
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Picker Pagination */}
            {pickerTotal > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.5rem",
                  borderTop: "1px solid #e2e8f0",
                  gap: "0.5rem",
                  fontSize: "0.8rem",
                  color: "#64748b",
                  marginTop: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span>
                    Showing {Math.min((pickerPage - 1) * pickerPageSize + 1, pickerTotal)}–{Math.min(pickerPage * pickerPageSize, pickerTotal)} of {pickerTotal}
                  </span>
                  <select
                    value={pickerPageSize}
                    onChange={(e) => {
                      setPickerPageSize(Number(e.target.value));
                      setPickerPage(1);
                    }}
                    style={{ padding: "0.2rem 0.4rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1", fontSize: "0.75rem" }}
                  >
                    <option value={15}>15 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <button
                    type="button"
                    disabled={pickerPage <= 1 || pickerLoading}
                    onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor: pickerPage <= 1 ? "#f1f5f9" : "#fff",
                      cursor: pickerPage <= 1 ? "not-allowed" : "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    ‹ Prev
                  </button>
                  <span style={{ padding: "0 0.4rem", fontWeight: 700, color: "#0f172a" }}>
                    {pickerPage} / {pickerTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pickerPage >= pickerTotalPages || pickerLoading}
                    onClick={() => setPickerPage((p) => Math.min(pickerTotalPages, p + 1))}
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      border: "1px solid #cbd5e1",
                      backgroundColor: pickerPage >= pickerTotalPages ? "#f1f5f9" : "#fff",
                      cursor: pickerPage >= pickerTotalPages ? "not-allowed" : "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}

            <div style={{ textAlign: "right", marginTop: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Marking Scheme Modal */}
      {isMarkingModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 60,
          }}
          onClick={() => setIsMarkingModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              maxWidth: "520px",
              width: "100%",
              padding: "1.5rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Configure Marking Scheme &amp; Negative Marks
              </h3>
              <button
                type="button"
                onClick={() => setIsMarkingModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
              Set positive marks for correct answers and enable or disable negative marking across questions in this test series.
            </p>

            <form onSubmit={handleApplyMarkingScheme}>
              {/* Positive Marks */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  Correct Answer Marks (+ve):
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={markingPositive}
                  onChange={(e) => setMarkingPositive(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  placeholder="e.g. 4"
                />
              </div>

              {/* Negative Marks Mode */}
              <div style={{ marginBottom: "1.25rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>
                  Negative Marking System:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input
                      type="radio"
                      name="negativeMarkingToggle"
                      checked={markingNegativeEnabled}
                      onChange={() => setMarkingNegativeEnabled(true)}
                    />
                    <span style={{ fontWeight: 600, color: "#b91c1c" }}>
                      Enable Negative Marking (Deduct on Wrong Answer)
                    </span>
                  </label>

                  {markingNegativeEnabled && (
                    <div style={{ marginLeft: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>Penalty per wrong answer: -</span>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={markingNegativeDeduction}
                        onChange={(e) => setMarkingNegativeDeduction(e.target.value)}
                        style={{ width: "5rem", padding: "0.3rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1" }}
                      />
                      <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>marks (e.g. 1 for JEE, 0.25 for NEET)</span>
                    </div>
                  )}

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input
                      type="radio"
                      name="negativeMarkingToggle"
                      checked={!markingNegativeEnabled}
                      onChange={() => setMarkingNegativeEnabled(false)}
                    />
                    <span style={{ fontWeight: 600, color: "#15803d" }}>
                      Disable Negative Marking (0 penalty &mdash; CBSE / Board Mock pattern)
                    </span>
                  </label>
                </div>
              </div>

              {/* Target Scope */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  Apply To:
                </label>
                <select
                  value={markingTargetSection}
                  onChange={(e) => setMarkingTargetSection(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                >
                  <option value="ALL">Entire Test (All Sections &amp; Questions)</option>
                  {test.sections?.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} ({sec.testQuestions?.length || 0} Questions)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsMarkingModalOpen(false)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markingSubmitting}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: "#16a34a",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: markingSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {markingSubmitting ? "Applying..." : "Apply Marking Scheme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Question Marks Edit Modal */}
      {editingQuestionMarks && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 70,
          }}
          onClick={() => setEditingQuestionMarks(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              maxWidth: "400px",
              width: "100%",
              padding: "1.5rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
              Edit Question Marking
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "1rem" }}>
              Question: <strong>{editingQuestionMarks.code}</strong>
            </p>

            <form onSubmit={handleSaveIndividualMarks}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                  Positive Marks (+ve)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={editingQuestionMarks.marks}
                  onChange={(e) => setEditingQuestionMarks({ ...editingQuestionMarks, marks: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                  Negative Marks Penalty (-ve, set 0 for no negative marking)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  required
                  value={editingQuestionMarks.negMarks}
                  onChange={(e) => setEditingQuestionMarks({ ...editingQuestionMarks, negMarks: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Set 0 to disable negative marking on this question.</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setEditingQuestionMarks(null)}
                  style={{ padding: "0.4rem 0.85rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingIndividualMarks}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: savingIndividualMarks ? "not-allowed" : "pointer",
                  }}
                >
                  {savingIndividualMarks ? "Saving..." : "Save Marks"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

