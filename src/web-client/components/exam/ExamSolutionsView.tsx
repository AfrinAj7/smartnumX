/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MathText } from "@/web-client/components/ui/MathText";

export interface QuestionOption {
  id: string;
  text: string;
  image?: string | null;
}

interface SolutionQuestion {
  id: string;
  code: string;
  type: string;
  subject: string;
  chapter: string | null;
  stem: string;
  stemImage: string | null;
  options: QuestionOption[] | null;
  correct: unknown;
  tolerance: number | null;
  explanation: string | null;
  solutionImage: string | null;
  marks: number;
  negMarks: number;
  order: number;
  sectionName: string;
  studentResponse: unknown;
  isCorrect: boolean;
  isAttempted: boolean;
  marksAwarded: number;
  timeSpentSec: number;
}

interface SolutionsData {
  isSolutionsAvailable: boolean;
  reason?: string;
  test: {
    id: string;
    code: string;
    title: string;
  };
  attempt: {
    id: string;
    score: number;
    totalMarks: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
  };
  questions: SolutionQuestion[];
}

export function ExamSolutionsView({
  testId,
  attemptId,
}: {
  testId: string;
  attemptId: string;
  user: { name?: string | null; email?: string | null };
}) {
  const [data, setData] = useState<SolutionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active filter: "ALL" | "CORRECT" | "INCORRECT" | "UNATTEMPTED"
  const [filter, setFilter] = useState<"ALL" | "CORRECT" | "INCORRECT" | "UNATTEMPTED">("ALL");

  useEffect(() => {
    async function fetchSolutions() {
      try {
        const res = await fetch(`/api/tests/${testId}/attempt/${attemptId}/solutions`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load solutions.");
        }
        setData(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading solutions.");
      } finally {
        setLoading(false);
      }
    }
    fetchSolutions();
  }, [testId, attemptId]);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    return data.questions.filter((q) => {
      if (filter === "CORRECT") return q.isCorrect;
      if (filter === "INCORRECT") return q.isAttempted && !q.isCorrect;
      if (filter === "UNATTEMPTED") return !q.isAttempted;
      return true;
    });
  }, [data, filter]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", color: "#64748b" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid #cbd5e1", borderTopColor: "#0284c7", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
        <p style={{ fontWeight: 600 }}>Loading detailed step-by-step solutions...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "0.75rem", border: "1px solid #fee2e2", maxWidth: "480px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#991b1b", marginBottom: "0.5rem" }}>Unable to View Solutions</h2>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.25rem" }}>{error || "Unknown error"}</p>
          <Link href={`/tests/${testId}/result/${attemptId}`} style={{ padding: "0.6rem 1.25rem", backgroundColor: "#0284c7", color: "#ffffff", borderRadius: "0.375rem", fontWeight: 700, textDecoration: "none", fontSize: "0.875rem" }}>
            Return to Result
          </Link>
        </div>
      </div>
    );
  }

  if (!data.isSolutionsAvailable) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", maxWidth: "520px", textAlign: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔒</div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>Solutions Locked</h2>
          <p style={{ color: "#64748b", fontSize: "0.925rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            {data.reason || "Detailed solutions will unlock according to the examination schedule."}
          </p>
          <Link href={`/tests/${testId}/result/${attemptId}`} style={{ padding: "0.65rem 1.25rem", backgroundColor: "#0284c7", color: "#ffffff", borderRadius: "0.375rem", fontWeight: 700, textDecoration: "none", fontSize: "0.875rem" }}>
            Return to Result
          </Link>
        </div>
      </div>
    );
  }

  const { test, attempt, questions } = data;

  const countCorrect = questions.filter((q) => q.isCorrect).length;
  const countIncorrect = questions.filter((q) => q.isAttempted && !q.isCorrect).length;
  const countUnattempted = questions.filter((q) => !q.isAttempted).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "2rem 1rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Code: {test.code}</span>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
              Detailed Step-by-Step Solutions
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
              {test.title} • Score: <strong>{attempt.score}/{attempt.totalMarks}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href={`/tests/${testId}/result/${attemptId}`}
              style={{
                padding: "0.55rem 1.15rem",
                backgroundColor: "#0284c7",
                color: "#ffffff",
                borderRadius: "0.375rem",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              📊 Performance Analytics
            </Link>
            <Link
              href="/dashboard"
              style={{
                padding: "0.55rem 1rem",
                backgroundColor: "#e2e8f0",
                color: "#334155",
                borderRadius: "0.375rem",
                fontWeight: 600,
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* FILTER BAR PILLS */}
        <div style={{ backgroundColor: "#ffffff", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
          <button
            onClick={() => setFilter("ALL")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              fontWeight: 700,
              fontSize: "0.825rem",
              cursor: "pointer",
              backgroundColor: filter === "ALL" ? "#0f172a" : "#f1f5f9",
              color: filter === "ALL" ? "#ffffff" : "#475569",
            }}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setFilter("CORRECT")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              fontWeight: 700,
              fontSize: "0.825rem",
              cursor: "pointer",
              backgroundColor: filter === "CORRECT" ? "#16a34a" : "#f1f5f9",
              color: filter === "CORRECT" ? "#ffffff" : "#16a34a",
            }}
          >
            ✓ Correct ({countCorrect})
          </button>
          <button
            onClick={() => setFilter("INCORRECT")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              fontWeight: 700,
              fontSize: "0.825rem",
              cursor: "pointer",
              backgroundColor: filter === "INCORRECT" ? "#dc2626" : "#f1f5f9",
              color: filter === "INCORRECT" ? "#ffffff" : "#dc2626",
            }}
          >
            ✕ Incorrect ({countIncorrect})
          </button>
          <button
            onClick={() => setFilter("UNATTEMPTED")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              fontWeight: 700,
              fontSize: "0.825rem",
              cursor: "pointer",
              backgroundColor: filter === "UNATTEMPTED" ? "#64748b" : "#f1f5f9",
              color: filter === "UNATTEMPTED" ? "#ffffff" : "#64748b",
            }}
          >
            — Unattempted ({countUnattempted})
          </button>
        </div>

        {/* QUESTIONS SOLUTIONS LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {filteredQuestions.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const isAttempted = q.isAttempted;

            let statusBg = "#f1f5f9";
            let statusColor = "#64748b";
            let statusLabel = "Skipped / Unattempted (0 Marks)";

            if (isCorrect) {
              statusBg = "#dcfce7";
              statusColor = "#15803d";
              statusLabel = `Correct (+${q.marksAwarded} Marks)`;
            } else if (isAttempted) {
              statusBg = "#fee2e2";
              statusColor = "#b91c1c";
              statusLabel = `Incorrect (${q.marksAwarded} Marks)`;
            }

            return (
              <div
                key={q.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "0.75rem",
                  border: isCorrect ? "1px solid #86efac" : isAttempted ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {/* QUESTION TOP BAR */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0f172a" }}>
                      Q{idx + 1}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: "#f1f5f9", color: "#334155", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                      {q.subject}
                    </span>
                    {q.chapter && (
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>• {q.chapter}</span>
                    )}
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>({q.sectionName})</span>
                  </div>

                  <span style={{ fontSize: "0.8rem", fontWeight: 800, padding: "0.25rem 0.65rem", borderRadius: "0.375rem", backgroundColor: statusBg, color: statusColor }}>
                    {statusLabel}
                  </span>
                </div>

                {/* STEM */}
                <div style={{ fontSize: "1rem", lineHeight: 1.7, color: "#1e293b", marginBottom: "1.25rem" }}>
                  <MathText content={q.stem} />
                </div>

                {/* STEM IMAGE */}
                {q.stemImage && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <img src={q.stemImage} alt="Diagram" style={{ maxWidth: "100%", maxHeight: "260px", objectFit: "contain", borderRadius: "0.375rem" }} />
                  </div>
                )}

                {/* OPTIONS REVIEW (FOR MCQ) */}
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    {q.options.map((opt: QuestionOption) => {
                      const isCorrectKey =
                        Array.isArray(q.correct)
                          ? (q.correct as string[]).includes(opt.id)
                          : String(q.correct).toUpperCase() === opt.id.toUpperCase();

                      const isStudentPick =
                        Array.isArray(q.studentResponse)
                          ? (q.studentResponse as string[]).includes(opt.id)
                          : String(q.studentResponse).toUpperCase() === opt.id.toUpperCase();

                      let optBg = "#ffffff";
                      let optBorder = "#e2e8f0";

                      if (isCorrectKey) {
                        optBg = "#f0fdf4";
                        optBorder = "#86efac";
                      } else if (isStudentPick && !isCorrectKey) {
                        optBg = "#fef2f2";
                        optBorder = "#fca5a5";
                      }

                      return (
                        <div
                          key={opt.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            borderRadius: "0.5rem",
                            backgroundColor: optBg,
                            border: `1.5px solid ${optBorder}`,
                          }}
                        >
                          <span style={{ fontWeight: 800, width: "1.5rem", color: isCorrectKey ? "#16a34a" : isStudentPick ? "#dc2626" : "#64748b" }}>
                            {opt.id}.
                          </span>
                          <div style={{ flex: 1, fontSize: "0.925rem" }}>
                            <MathText content={opt.text} />
                          </div>
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            {isCorrectKey && (
                              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#16a34a", backgroundColor: "#dcfce7", padding: "0.15rem 0.45rem", borderRadius: "0.25rem" }}>
                                Correct Key ✓
                              </span>
                            )}
                            {isStudentPick && (
                              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: isCorrectKey ? "#16a34a" : "#dc2626", backgroundColor: isCorrectKey ? "#dcfce7" : "#fee2e2", padding: "0.15rem 0.45rem", borderRadius: "0.25rem" }}>
                                Your Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* NUMERIC / TRUE-FALSE REVIEW */}
                {(q.type === "NUMERIC" || q.type === "TRUE_FALSE") && (
                  <div style={{ backgroundColor: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", marginBottom: "1.25rem", display: "flex", gap: "1.5rem", fontSize: "0.875rem" }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Your Answer: </span>
                      <strong style={{ color: isCorrect ? "#16a34a" : isAttempted ? "#dc2626" : "#64748b" }}>
                        {q.studentResponse !== null && q.studentResponse !== undefined ? String(q.studentResponse) : "Not Attempted"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Correct Answer: </span>
                      <strong style={{ color: "#16a34a" }}>
                        {String(q.correct)}
                        {q.tolerance ? ` (±${q.tolerance})` : ""}
                      </strong>
                    </div>
                  </div>
                )}

                {/* STEP-BY-STEP SOLUTION EXPLANATION */}
                {q.explanation && (
                  <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "0.5rem", padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1rem" }}>💡</span>
                      <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#92400e", textTransform: "uppercase" }}>
                        Step-by-step Solution
                      </span>
                    </div>
                    <div style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "#78350f" }}>
                      <MathText content={q.explanation} />
                    </div>
                    {q.solutionImage && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <img src={q.solutionImage} alt="Solution diagram" style={{ maxWidth: "100%", maxHeight: "240px", objectFit: "contain", borderRadius: "0.375rem" }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

