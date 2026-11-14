"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { MathText } from "@/web-client/components/ui/MathText";

interface QuestionOption {
  id: string;
  text: string;
  image?: string;
}

interface ImportErrorItem {
  sheet: string;
  row: number;
  field: string;
  message: string;
}

interface PreviewQuestionItem {
  question_code: string;
  subject: string;
  type: string;
  question_text: string;
  versionAction?: string;
}

interface DryRunData {
  valid: boolean;
  totalQuestions: number;
  validQuestions: number;
  errorCount: number;
  testsCount: number;
  sectionsCount: number;
  errors: ImportErrorItem[];
  previewQuestions: PreviewQuestionItem[];
  parsedData: unknown;
}

interface QuestionItem {
  id: string;
  code: string;
  version: number;
  isLocked: boolean;
  type: "MCQ_SINGLE" | "MCQ_MULTI" | "NUMERIC" | "TRUE_FALSE";
  stem: string;
  stemImage: string | null;
  options: QuestionOption[] | null;
  correct: { answer?: unknown; min?: number; max?: number } | unknown;
  explanation: string | null;
  solutionImage: string | null;
  subject: string;
  chapter: string | null;
  topic: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  createdAt: string;
  creator?: { name: string | null; email: string } | null;
  _count?: { testQuestions: number; attemptAnswers: number };
}

export function QuestionBankView() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [chapterFilter, setChapterFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [previewQuestion, setPreviewQuestion] = useState<QuestionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [imagesZipFile, setImagesZipFile] = useState<File | null>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunData | null>(null);
  const [executingImport, setExecutingImport] = useState(false);
  const [importResult, setImportResult] = useState<{ importedQuestions: number; testsAffected: number } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    type: "MCQ_SINGLE" as QuestionItem["type"],
    subject: "Mathematics",
    chapter: "",
    topic: "",
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
    stem: "",
    stemImage: "",
    options: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
    ],
    correctAnswer: "A",
    correctAnswersMulti: ["A"],
    numericAnswer: "",
    numericMin: "",
    numericMax: "",
    explanation: "",
    solutionImage: "",
  });

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (subjectFilter !== "ALL") params.set("subject", subjectFilter);
      if (chapterFilter !== "ALL") params.set("chapter", chapterFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (difficultyFilter !== "ALL") params.set("difficulty", difficultyFilter);
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load questions");

      const result = await res.json();
      setQuestions(result.data || []);
      if (result.meta) {
        setTotalCount(result.meta.total || 0);
        setTotalPages(result.meta.totalPages || 1);
      }
      if (result.taxonomy) {
        setSubjects(result.taxonomy.subjects || []);
        setChapters(result.taxonomy.chapters || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading questions";
      setActionError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter, chapterFilter, typeFilter, difficultyFilter, page, pageSize]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function openImportModal() {
    setIsImportModalOpen(true);
    setImportStep(1);
    setImportFile(null);
    setImagesZipFile(null);
    setDryRunResult(null);
    setImportResult(null);
    setActionError(null);
  }

  async function handleDryRun(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) {
      alert("Please select an Excel (.xlsx) or CSV file.");
      return;
    }

    setDryRunLoading(true);
    setActionError(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      if (imagesZipFile) {
        formData.append("imagesZip", imagesZipFile);
      }

      const res = await fetch("/api/admin/questions/import/dry-run", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to analyze import file.");
      }

      setDryRunResult(json.data);
      setImportStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error analyzing import file.";
      setActionError(msg);
    } finally {
      setDryRunLoading(false);
    }
  }

  async function handleExecuteImport() {
    if (!dryRunResult) return;
    setExecutingImport(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/questions/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedData: dryRunResult.parsedData,
          fileName: importFile?.name || "import.xlsx",
          fileSize: importFile?.size || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to execute import.");
      }

      setImportResult(json.data);
      setImportStep(3);
      loadQuestions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing import.";
      setActionError(msg);
    } finally {
      setExecutingImport(false);
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedQuestion(null);
    setFormData({
      code: `Q-${Date.now().toString().slice(-6)}`,
      type: "MCQ_SINGLE",
      subject: "Mathematics",
      chapter: "Algebra",
      topic: "",
      difficulty: "MEDIUM",
      stem: "",
      stemImage: "",
      options: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ],
      correctAnswer: "A",
      correctAnswersMulti: ["A"],
      numericAnswer: "",
      numericMin: "",
      numericMax: "",
      explanation: "",
      solutionImage: "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(q: QuestionItem) {
    setModalMode("edit");
    setSelectedQuestion(q);

    let corrSingle = "A";
    let corrMulti = ["A"];
    let numVal = "";
    let nMin = "";
    let nMax = "";

    if (q.correct && typeof q.correct === "object") {
      const c = q.correct as { answer?: unknown; min?: number; max?: number };
      if (typeof c.answer === "string") corrSingle = c.answer;
      if (Array.isArray(c.answer)) corrMulti = c.answer.map(String);
      if (typeof c.answer === "number") numVal = String(c.answer);
      if (c.min !== undefined) nMin = String(c.min);
      if (c.max !== undefined) nMax = String(c.max);
    }

    setFormData({
      code: q.code,
      type: q.type,
      subject: q.subject,
      chapter: q.chapter || "",
      topic: q.topic || "",
      difficulty: q.difficulty || "MEDIUM",
      stem: q.stem,
      stemImage: q.stemImage || "",
      options:
        Array.isArray(q.options) && q.options.length > 0
          ? q.options
          : [
              { id: "A", text: "" },
              { id: "B", text: "" },
            ],
      correctAnswer: corrSingle,
      correctAnswersMulti: corrMulti,
      numericAnswer: numVal,
      numericMin: nMin,
      numericMax: nMax,
      explanation: q.explanation || "",
      solutionImage: q.solutionImage || "",
    });
    setIsModalOpen(true);
  }

  async function handleDelete(q: QuestionItem) {
    if (!confirm(`Are you sure you want to delete question "${q.code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete question");
      setActionSuccess("Question deleted successfully.");
      loadQuestions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete question";
      setActionError(msg);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    let correctPayload: Record<string, unknown> = {};
    if (formData.type === "MCQ_SINGLE" || formData.type === "TRUE_FALSE") {
      correctPayload = { answer: formData.correctAnswer };
    } else if (formData.type === "MCQ_MULTI") {
      correctPayload = { answer: formData.correctAnswersMulti };
    } else if (formData.type === "NUMERIC") {
      const num = parseFloat(formData.numericAnswer);
      if (isNaN(num)) {
        setActionError("Please enter a valid numeric correct answer.");
        return;
      }
      correctPayload = {
        answer: num,
        min: formData.numericMin ? parseFloat(formData.numericMin) : num - 0.01,
        max: formData.numericMax ? parseFloat(formData.numericMax) : num + 0.01,
      };
    }

    const payload = {
      code: formData.code.trim(),
      type: formData.type,
      subject: formData.subject.trim(),
      chapter: formData.chapter.trim() || null,
      topic: formData.topic.trim() || null,
      difficulty: formData.difficulty,
      stem: formData.stem.trim(),
      stemImage: formData.stemImage.trim() || null,
      options:
        formData.type === "NUMERIC"
          ? null
          : formData.options.filter((o) => o.text.trim().length > 0),
      correct: correctPayload,
      explanation: formData.explanation.trim() || null,
      solutionImage: formData.solutionImage.trim() || null,
    };

    startTransition(async () => {
      try {
        const url =
          modalMode === "create"
            ? "/api/admin/questions"
            : `/api/admin/questions/${selectedQuestion?.id}`;
        const method = modalMode === "create" ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save question");

        setIsModalOpen(false);
        setActionSuccess(data.message || "Question saved successfully.");
        loadQuestions();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error saving question";
        setActionError(msg);
      }
    });
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Top Header */}
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
              Question Bank
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
              {totalCount} Questions
            </span>
          </div>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
            Search, preview, and author single-choice, multiple-choice, and numerical questions with live KaTeX LaTeX formatting.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={openImportModal}
            style={{
              backgroundColor: "#ffffff",
              color: "#0f172a",
              padding: "0.625rem 1.15rem",
              borderRadius: "0.5rem",
              border: "1px solid #cbd5e1",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>📥 Bulk Import (Excel / CSV)</span>
          </button>

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
            <span>+ Author New Question</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            padding: "0.875rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.25rem",
          }}
        >
          ⚠️ {actionError}
        </div>
      )}

      {actionSuccess && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
            padding: "0.875rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.25rem",
          }}
        >
          ✓ {actionSuccess}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
            Search Text / Code
          </label>
          <input
            type="text"
            placeholder="Search stem or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.25rem" }}>
            Subject
          </label>
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.25rem" }}>
            Chapter
          </label>
          <select
            value={chapterFilter}
            onChange={(e) => {
              setChapterFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="ALL">All Chapters</option>
            {chapters.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.25rem" }}>
            Question Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="ALL">All Types</option>
            <option value="MCQ_SINGLE">Single Choice (MCQ)</option>
            <option value="MCQ_MULTI">Multiple Choice (Multi)</option>
            <option value="NUMERIC">Numerical Answer</option>
            <option value="TRUE_FALSE">True / False</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.25rem" }}>
            Difficulty
          </label>
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions Table / List */}
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
            Loading questions from database...
          </div>
        ) : questions.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.5rem" }}>
              No questions found
            </p>
            <p style={{ fontSize: "0.875rem" }}>
              Try adjusting your filter criteria or click &quot;Author New Question&quot; to add one.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Code & Version</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Subject & Chapter</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Type</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Question Stem (Rendered)</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569" }}>Difficulty</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#475569", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{q.code}</div>
                      <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem" }}>
                        <span style={{ fontSize: "0.7rem", backgroundColor: "#f1f5f9", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", color: "#475569" }}>
                          v{q.version}
                        </span>
                        {q.isLocked && (
                          <span style={{ fontSize: "0.7rem", backgroundColor: "#fef3c7", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", color: "#92400e" }}>
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{q.subject}</div>
                      <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{q.chapter || "—"}</div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.375rem",
                          backgroundColor:
                            q.type === "NUMERIC" ? "#e0f2fe" : q.type === "MCQ_MULTI" ? "#f3e8ff" : "#f1f5f9",
                          color:
                            q.type === "NUMERIC" ? "#0369a1" : q.type === "MCQ_MULTI" ? "#6b21a8" : "#334155",
                        }}
                      >
                        {q.type.replace("_", " ")}
                      </span>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top", maxWidth: "420px" }}>
                      <div style={{ maxHeight: "3.5rem", overflow: "hidden", textOverflow: "ellipsis", color: "#334155" }}>
                        <MathText content={q.stem} />
                      </div>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "0.25rem",
                          backgroundColor:
                            q.difficulty === "HARD" ? "#fee2e2" : q.difficulty === "MEDIUM" ? "#fef3c7" : "#dcfce7",
                          color:
                            q.difficulty === "HARD" ? "#991b1b" : q.difficulty === "MEDIUM" ? "#92400e" : "#166534",
                        }}
                      >
                        {q.difficulty || "MEDIUM"}
                      </span>
                    </td>

                    <td style={{ padding: "0.75rem 1rem", verticalAlign: "top", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                        <button
                          type="button"
                          onClick={() => setPreviewQuestion(q)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: "0.375rem",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            cursor: "pointer",
                          }}
                        >
                          👁️ Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(q)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: "0.375rem",
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(q)}
                          style={{
                            padding: "0.3rem 0.6rem",
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

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1.25rem",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              gap: "0.75rem",
              fontSize: "0.875rem",
              color: "#475569",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <span>
                Showing <strong>{Math.min((page - 1) * pageSize + 1, totalCount)}</strong> to{" "}
                <strong>{Math.min(page * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> questions
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <label htmlFor="qb-page-size" style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Per page:
                </label>
                <select
                  id="qb-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage(1)}
                title="First Page"
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: page <= 1 ? "#f1f5f9" : "#ffffff",
                  color: page <= 1 ? "#94a3b8" : "#1e293b",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                « First
              </button>

              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: page <= 1 ? "#f1f5f9" : "#ffffff",
                  color: page <= 1 ? "#94a3b8" : "#1e293b",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                ‹ Prev
              </button>

              {/* Dynamic Page Buttons */}
              {(() => {
                const pages: (number | string)[] = [];
                const maxButtons = 5;
                let startPage = Math.max(1, page - 2);
                const endPage = Math.min(totalPages, startPage + maxButtons - 1);
                if (endPage - startPage < maxButtons - 1) {
                  startPage = Math.max(1, endPage - maxButtons + 1);
                }

                if (startPage > 1) {
                  pages.push(1);
                  if (startPage > 2) pages.push("...");
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) pages.push("...");
                  pages.push(totalPages);
                }

                return pages.map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={p}
                      type="button"
                      disabled={loading}
                      onClick={() => setPage(p)}
                      style={{
                        minWidth: "2rem",
                        padding: "0.35rem 0.5rem",
                        borderRadius: "0.375rem",
                        border: p === page ? "1px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: p === page ? "#2563eb" : "#ffffff",
                        color: p === page ? "#ffffff" : "#1e293b",
                        fontWeight: p === page ? 700 : 500,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`dots-${idx}`} style={{ padding: "0 0.25rem", color: "#94a3b8" }}>
                      …
                    </span>
                  )
                );
              })()}

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: page >= totalPages ? "#f1f5f9" : "#ffffff",
                  color: page >= totalPages ? "#94a3b8" : "#1e293b",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                Next ›
              </button>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(totalPages)}
                title="Last Page"
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: page >= totalPages ? "#f1f5f9" : "#ffffff",
                  color: page >= totalPages ? "#94a3b8" : "#1e293b",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewQuestion && (
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
          onClick={() => setPreviewQuestion(null)}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
                  {previewQuestion.subject} &bull; {previewQuestion.chapter}
                </span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0" }}>
                  {previewQuestion.code} (v{previewQuestion.version})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem" }}>Question Stem</h4>
              <div style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "1rem", lineHeight: 1.6 }}>
                <MathText content={previewQuestion.stem} />
              </div>
            </div>

            {/* Options if MCQ */}
            {previewQuestion.options && Array.isArray(previewQuestion.options) && previewQuestion.options.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem" }}>Options</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {previewQuestion.options.map((opt) => {
                    const corr = previewQuestion.correct as { answer?: unknown };
                    const isCorrect =
                      corr?.answer === opt.id || (Array.isArray(corr?.answer) && corr?.answer.includes(opt.id));

                    return (
                      <div
                        key={opt.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.5rem",
                          border: `1.5px solid ${isCorrect ? "#10b981" : "#e2e8f0"}`,
                          backgroundColor: isCorrect ? "#ecfdf5" : "#ffffff",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            color: isCorrect ? "#047857" : "#64748b",
                            width: "1.5rem",
                          }}
                        >
                          {opt.id}.
                        </span>
                        <div style={{ flex: 1, color: isCorrect ? "#065f46" : "#1e293b" }}>
                          <MathText content={opt.text} />
                        </div>
                        {isCorrect && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#047857", backgroundColor: "#a7f3d0", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>
                            Correct Key
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Numeric Correct Answer */}
            {previewQuestion.type === "NUMERIC" && (
              <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#047857", display: "block" }}>
                  NUMERICAL ANSWER KEY
                </span>
                <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#065f46" }}>
                  Value: {String((previewQuestion.correct as { answer?: unknown })?.answer ?? "N/A")}
                </span>
              </div>
            )}

            {/* Solution & Explanation */}
            {previewQuestion.explanation && (
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem" }}>Step-by-step Solution</h4>
                <div style={{ padding: "1rem", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "0.5rem", fontSize: "0.925rem", color: "#92400e", lineHeight: 1.6 }}>
                  <MathText content={previewQuestion.explanation} />
                </div>
              </div>
            )}

            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Author / Edit Modal */}
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
              maxWidth: "800px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {modalMode === "create" ? "Author New Question" : `Edit Question (${formData.code})`}
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Question Code *
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
                    Question Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as QuestionItem["type"] })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="MCQ_SINGLE">Single Choice MCQ</option>
                    <option value="MCQ_MULTI">Multiple Choice Multi</option>
                    <option value="NUMERIC">Numerical Answer</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Chapter
                  </label>
                  <input
                    type="text"
                    value={formData.chapter}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD" })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Stem Input with Live KaTeX Preview */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                  Question Stem (Supports LaTeX $...$ or $$...$$) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.stem}
                  onChange={(e) => setFormData({ ...formData, stem: e.target.value })}
                  placeholder="e.g. Find the roots of the equation $x^2 - 5x + 6 = 0$."
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", fontFamily: "monospace" }}
                />
                {formData.stem && (
                  <div style={{ marginTop: "0.5rem", padding: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "0.375rem", border: "1px dashed #cbd5e1" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                      LIVE MATH PREVIEW:
                    </span>
                    <MathText content={formData.stem} />
                  </div>
                )}
              </div>

              {/* Options Section for MCQ / True False */}
              {(formData.type === "MCQ_SINGLE" || formData.type === "MCQ_MULTI" || formData.type === "TRUE_FALSE") && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem" }}>
                    Options & Correct Key
                  </label>
                  {formData.options.map((opt, idx) => (
                    <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 800, width: "1.5rem" }}>{opt.id}</span>
                      <input
                        type="text"
                        placeholder={`Option ${opt.id} text (e.g. $5\\text{ m}$)`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...formData.options];
                          updated[idx] = { ...updated[idx], text: e.target.value };
                          setFormData({ ...formData, options: updated });
                        }}
                        style={{ flex: 1, padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                      />
                      {formData.type === "MCQ_MULTI" ? (
                        <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={formData.correctAnswersMulti.includes(opt.id)}
                            onChange={(e) => {
                              const set = new Set(formData.correctAnswersMulti);
                              if (e.target.checked) set.add(opt.id);
                              else set.delete(opt.id);
                              setFormData({ ...formData, correctAnswersMulti: Array.from(set) });
                            }}
                          />
                          Correct
                        </label>
                      ) : (
                        <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={opt.id}
                            checked={formData.correctAnswer === opt.id}
                            onChange={() => setFormData({ ...formData, correctAnswer: opt.id })}
                          />
                          Correct
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Numerical Answer Section */}
              {formData.type === "NUMERIC" && (
                <div style={{ marginBottom: "1.25rem", padding: "1rem", backgroundColor: "#f0fdf4", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#166534", marginBottom: "0.5rem" }}>
                    Numerical Answer & Tolerance Range
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#166534", marginBottom: "0.25rem" }}>
                        Exact Target Value *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={formData.numericAnswer}
                        onChange={(e) => setFormData({ ...formData, numericAnswer: e.target.value })}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #86efac" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#166534", marginBottom: "0.25rem" }}>
                        Min Accepted (Optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.numericMin}
                        onChange={(e) => setFormData({ ...formData, numericMin: e.target.value })}
                        placeholder="e.g. 3.99"
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #86efac" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#166534", marginBottom: "0.25rem" }}>
                        Max Accepted (Optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.numericMax}
                        onChange={(e) => setFormData({ ...formData, numericMax: e.target.value })}
                        placeholder="e.g. 4.01"
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #86efac" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Explanation / Solution */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                  Step-by-step Solution / Explanation (Supports LaTeX)
                </label>
                <textarea
                  rows={3}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="e.g. By Pythagoras Theorem: $c = \sqrt{a^2 + b^2} = 10\text{ cm}$."
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              {/* Action Buttons */}
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
                  {isPending ? "Saving..." : modalMode === "create" ? "Save Question" : "Update Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
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
          onClick={() => !dryRunLoading && !executingImport && setIsImportModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              maxWidth: "860px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "1.75rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Bulk Question Importer (Excel & CSV)
                </h3>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Step {importStep} of 3: {importStep === 1 ? "Upload Spreadsheet & ZIP" : importStep === 2 ? "Dry-Run Review & Validation" : "Import Completed"}
                </span>
              </div>
              <button
                type="button"
                disabled={dryRunLoading || executingImport}
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Upload Form */}
            {importStep === 1 && (
              <form onSubmit={handleDryRun}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#0f172a", display: "block" }}>
                      Need the standard spreadsheet format?
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      Contains Tests, Sections, Questions, and sample LaTeX formulas.
                    </span>
                  </div>
                  <a
                    href="/templates/Question_Import_Template.xlsx"
                    download="Question_Import_Template.xlsx"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#ffffff",
                      color: "#2563eb",
                      border: "1px solid #2563eb",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.825rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    ⬇️ Download Excel Template
                  </a>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.35rem" }}>
                    Select Spreadsheet File (.xlsx, .xls, .csv) *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "0.375rem",
                      border: "1.5px dashed #cbd5e1",
                      backgroundColor: "#fafafa",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem", display: "block" }}>
                    Supports multi-sheet workbooks (Tests + Sections + Questions) or single-sheet CSV/Excel files.
                  </span>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.35rem" }}>
                    Optional: Upload Diagrams & Images (.zip)
                  </label>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setImagesZipFile(e.target.files?.[0] || null)}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "0.375rem",
                      border: "1.5px dashed #cbd5e1",
                      backgroundColor: "#fafafa",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem", display: "block" }}>
                    If your questions have image files in the <code>question_image</code> column (e.g. <code>diagram_q1.png</code>), pack them in a ZIP archive.
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    style={{ padding: "0.6rem 1.25rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dryRunLoading || !importFile}
                    style={{
                      padding: "0.6rem 1.5rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {dryRunLoading ? "Analyzing Spreadsheet..." : "Validate & Preview (Dry-Run) →"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Dry-Run Report */}
            {importStep === 2 && dryRunResult && (
              <div>
                {/* Metric Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ padding: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Total Questions</span>
                    <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>{dryRunResult.totalQuestions}</span>
                  </div>
                  <div style={{ padding: "0.75rem", backgroundColor: "#f0fdf4", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                    <span style={{ fontSize: "0.75rem", color: "#166534", display: "block" }}>Valid Questions</span>
                    <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#15803d" }}>{dryRunResult.validQuestions}</span>
                  </div>
                  <div style={{ padding: "0.75rem", backgroundColor: dryRunResult.errorCount > 0 ? "#fef2f2" : "#f8fafc", borderRadius: "0.5rem", border: `1px solid ${dryRunResult.errorCount > 0 ? "#fecaca" : "#e2e8f0"}` }}>
                    <span style={{ fontSize: "0.75rem", color: dryRunResult.errorCount > 0 ? "#991b1b" : "#64748b", display: "block" }}>Row Errors</span>
                    <span style={{ fontSize: "1.35rem", fontWeight: 800, color: dryRunResult.errorCount > 0 ? "#dc2626" : "#0f172a" }}>{dryRunResult.errorCount}</span>
                  </div>
                  <div style={{ padding: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Tests Detected</span>
                    <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2563eb" }}>{dryRunResult.testsCount}</span>
                  </div>
                </div>

                {/* Validation Status Banner */}
                {dryRunResult.valid ? (
                  <div style={{ padding: "0.85rem 1rem", backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "0.5rem", color: "#166534", fontWeight: 700, marginBottom: "1rem" }}>
                    ✓ Perfect! All {dryRunResult.totalQuestions} questions passed validation and are ready to ingest.
                  </div>
                ) : (
                  <div style={{ padding: "0.85rem 1rem", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "0.5rem", color: "#991b1b", marginBottom: "1rem" }}>
                    <strong>⚠️ {dryRunResult.errorCount} Error(s) Found in Spreadsheet</strong>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
                      Please correct the following rows in your spreadsheet, or proceed only if you want to skip invalid rows.
                    </p>
                  </div>
                )}

                {/* Error Table */}
                {dryRunResult.errors.length > 0 && (
                  <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid #fecaca", borderRadius: "0.375rem", marginBottom: "1.25rem" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                      <thead style={{ backgroundColor: "#fef2f2" }}>
                        <tr>
                          <th style={{ padding: "0.4rem 0.6rem", textAlign: "left", color: "#991b1b" }}>Sheet</th>
                          <th style={{ padding: "0.4rem 0.6rem", textAlign: "left", color: "#991b1b" }}>Row #</th>
                          <th style={{ padding: "0.4rem 0.6rem", textAlign: "left", color: "#991b1b" }}>Field</th>
                          <th style={{ padding: "0.4rem 0.6rem", textAlign: "left", color: "#991b1b" }}>Issue Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dryRunResult.errors.map((err: ImportErrorItem, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #fee2e2" }}>
                            <td style={{ padding: "0.35rem 0.6rem" }}>{err.sheet}</td>
                            <td style={{ padding: "0.35rem 0.6rem", fontWeight: 700 }}>Row {err.row}</td>
                            <td style={{ padding: "0.35rem 0.6rem", color: "#b91c1c", fontWeight: 600 }}>{err.field}</td>
                            <td style={{ padding: "0.35rem 0.6rem", color: "#450a0a" }}>{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Question Preview */}
                <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem" }}>
                  Question Sample Preview (First {dryRunResult.previewQuestions.length} Rows)
                </h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "0.375rem", marginBottom: "1.25rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead style={{ backgroundColor: "#f8fafc" }}>
                      <tr>
                        <th style={{ padding: "0.4rem 0.6rem", textAlign: "left" }}>Code</th>
                        <th style={{ padding: "0.4rem 0.6rem", textAlign: "left" }}>Subject</th>
                        <th style={{ padding: "0.4rem 0.6rem", textAlign: "left" }}>Type</th>
                        <th style={{ padding: "0.4rem 0.6rem", textAlign: "left" }}>Stem Preview</th>
                        <th style={{ padding: "0.4rem 0.6rem", textAlign: "left" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dryRunResult.previewQuestions.map((q: PreviewQuestionItem) => (
                        <tr key={q.question_code} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.4rem 0.6rem", fontWeight: 700 }}>{q.question_code}</td>
                          <td style={{ padding: "0.4rem 0.6rem" }}>{q.subject}</td>
                          <td style={{ padding: "0.4rem 0.6rem" }}>{q.type}</td>
                          <td style={{ padding: "0.4rem 0.6rem", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis" }}>
                            <MathText content={q.question_text} />
                          </td>
                          <td style={{ padding: "0.4rem 0.6rem" }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.35rem", borderRadius: "0.2rem", backgroundColor: q.versionAction === "BRANCH" ? "#fef3c7" : "#dcfce7", color: q.versionAction === "BRANCH" ? "#92400e" : "#15803d" }}>
                              {q.versionAction}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setImportStep(1)}
                    style={{ padding: "0.6rem 1.25rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", fontWeight: 600 }}
                  >
                    &larr; Back to Upload
                  </button>

                  <button
                    type="button"
                    disabled={executingImport || !dryRunResult.valid}
                    onClick={handleExecuteImport}
                    style={{
                      padding: "0.6rem 1.5rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor: dryRunResult.valid ? "#16a34a" : "#94a3b8",
                      color: "#ffffff",
                      cursor: dryRunResult.valid ? "pointer" : "not-allowed",
                      fontWeight: 700,
                    }}
                  >
                    {executingImport ? "Ingesting Questions..." : `Confirm & Import ${dryRunResult.validQuestions} Questions →`}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Success Completion */}
            {importStep === 3 && importResult && (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
                <h4 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
                  Import Ingested Successfully!
                </h4>
                <p style={{ color: "#475569", fontSize: "0.95rem", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
                  Successfully added <strong>{importResult.importedQuestions}</strong> questions into the Question Bank and automatically linked them across <strong>{importResult.testsAffected}</strong> tests and subject sections.
                </p>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    padding: "0.65rem 1.75rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Done & View Question Bank
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

