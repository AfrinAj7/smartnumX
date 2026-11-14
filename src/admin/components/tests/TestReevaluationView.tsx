"use client";

import { useEffect, useState, useTransition } from "react";
import type { ReevaluateAction, ReevaluateResult } from "@/server/tests/reevaluation-service";

interface QuestionOption {
  id: string;
  code: string;
  type: string;
  stem: string;
  subject: string;
  marks: number;
  negMarks: number;
  currentCorrect: string;
}

interface TestReevaluationViewProps {
  testId: string;
  onReevaluationComplete?: () => void;
}

export function TestReevaluationView({ testId, onReevaluationComplete }: TestReevaluationViewProps) {
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [action, setAction] = useState<ReevaluateAction>("KEY_CHANGE");
  const [newCorrect, setNewCorrect] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ReevaluateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTestQuestions() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/tests/${testId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load test details");

        const test = json.data;
        const flat: QuestionOption[] = [];

        test.sections?.forEach((sec: { testQuestions: Array<{ marks: number; negMarks: number; question: { id: string; code: string; type: string; stem: string; subject: string; correct: unknown } }> }) => {
          sec.testQuestions.forEach((tq) => {
            flat.push({
              id: tq.question.id,
              code: tq.question.code,
              type: tq.question.type,
              stem: tq.question.stem,
              subject: tq.question.subject,
              marks: Number(tq.marks),
              negMarks: Number(tq.negMarks),
              currentCorrect: typeof tq.question.correct === "object" ? JSON.stringify(tq.question.correct) : String(tq.question.correct),
            });
          });
        });

        test.testQuestions?.forEach((tq: { marks: number; negMarks: number; question: { id: string; code: string; type: string; stem: string; subject: string; correct: unknown } }) => {
          flat.push({
            id: tq.question.id,
            code: tq.question.code,
            type: tq.question.type,
            stem: tq.question.stem,
            subject: tq.question.subject,
            marks: Number(tq.marks),
            negMarks: Number(tq.negMarks),
            currentCorrect: typeof tq.question.correct === "object" ? JSON.stringify(tq.question.correct) : String(tq.question.correct),
          });
        });

        setQuestions(flat);
        if (flat.length > 0) {
          setSelectedQuestionId(flat[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading questions");
      } finally {
        setLoading(false);
      }
    }

    loadTestQuestions();
  }, [testId]);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!selectedQuestion) {
      setError("Please select a target question.");
      return;
    }

    if ((action === "KEY_CHANGE" || action === "ACCEPT_MULTIPLE") && !newCorrect.trim()) {
      setError("Please specify the new correct key or accepted options.");
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      setError("A detailed reason (minimum 5 characters) is required for audit verification.");
      return;
    }

    const confirmMsg =
      `Are you sure you want to execute re-evaluation for question ${selectedQuestion.code}?\n\n` +
      `Action: ${action}\n` +
      `This will recalculate all submitted student attempts, adjust marks, recalculate ranks and percentiles.`;

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tests/${testId}/reevaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: selectedQuestion.id,
            action,
            newCorrect: action === "KEY_CHANGE" || action === "ACCEPT_MULTIPLE" ? newCorrect.trim() : undefined,
            reason: reason.trim(),
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to re-evaluate test");

        setResult(json.data);
        setReason("");
        setNewCorrect("");

        // Update local question's current correct key if changed
        if (action === "KEY_CHANGE") {
          setQuestions((prev) =>
            prev.map((q) => (q.id === selectedQuestion.id ? { ...q, currentCorrect: newCorrect.trim() } : q))
          );
        }

        if (onReevaluationComplete) {
          onReevaluationComplete();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error executing re-evaluation");
      }
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
        <div>Loading test questions and answer keys...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Overview Banner */}
      <div
        style={{
          backgroundColor: "#fffbeb",
          border: "1px solid #fef3c7",
          padding: "1rem 1.25rem",
          borderRadius: "0.5rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>⚖️</span>
        <div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#92400e", margin: 0 }}>
            Server-Authoritative Test Re-evaluation Engine
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "#b45309", margin: "0.25rem 0 0", lineHeight: 1.5 }}>
            Correct typographical errors in answer keys, accept alternative valid choices, award bonus marks for ambiguous questions, or drop faulty items. The engine recalculates all historical attempts in chunks and updates leaderboards, ranks, and percentiles.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "0.875rem 1rem", borderRadius: "0.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.25rem", borderRadius: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#166534", fontWeight: 800, fontSize: "1rem" }}>
            ✓ Re-evaluation Completed Successfully
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            <div style={{ backgroundColor: "#ffffff", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid #dcfce7" }}>
              <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700 }}>ATTEMPTS RE-EVALUATED</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#15803d" }}>{result.attemptsReevaluated}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid #dcfce7" }}>
              <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700 }}>SCORES INCREASED</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#16a34a" }}>+{result.scoreIncreasedCount}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid #dcfce7" }}>
              <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700 }}>SCORES DECREASED</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#dc2626" }}>-{result.scoreDecreasedCount}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid #dcfce7" }}>
              <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700 }}>UNCHANGED</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#475569" }}>{result.scoreUnchangedCount}</div>
            </div>
            <div style={{ backgroundColor: "#ffffff", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid #dcfce7" }}>
              <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700 }}>AVG SCORE DELTA</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2563eb" }}>
                {result.avgScoreDelta > 0 ? `+${result.avgScoreDelta}` : result.avgScoreDelta}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Re-evaluation Form */}
      <form onSubmit={handleExecute} style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1.25rem" }}>
          Configure Re-evaluation Rule
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
          {/* Target Question Picker */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
              Select Question *
            </label>
            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
                backgroundColor: "#fff",
                fontSize: "0.875rem",
              }}
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.code} ({q.subject}) &bull; Correct: {q.currentCorrect}
                </option>
              ))}
            </select>
          </div>

          {/* Action Choice */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
              Re-evaluation Action *
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as ReevaluateAction)}
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
                backgroundColor: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              <option value="KEY_CHANGE">🔑 Change Answer Key (Replace Correct Answer)</option>
              <option value="ACCEPT_MULTIPLE">🔀 Accept Multiple Valid Options (e.g., A or C)</option>
              <option value="BONUS_MARKS_ALL">🎁 Award Full Marks to All (Bonus / Disputed Item)</option>
              <option value="DROP_QUESTION">❌ Drop Question (Exclude from Test Total &amp; Scoring)</option>
            </select>
          </div>
        </div>

        {/* Selected Question Details Preview */}
        {selectedQuestion && (
          <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.375rem", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 800, color: "#0f172a" }}>{selectedQuestion.code} &bull; {selectedQuestion.subject}</span>
              <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                Current Key: {selectedQuestion.currentCorrect}
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#475569", maxHeight: "3rem", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selectedQuestion.stem.replace(/<[^>]*>?/gm, "")}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.35rem" }}>
              Marking: +{selectedQuestion.marks} marks &bull; -{selectedQuestion.negMarks} negative
            </div>
          </div>
        )}

        {/* Value Input for Key Change / Accept Multiple */}
        {(action === "KEY_CHANGE" || action === "ACCEPT_MULTIPLE") && (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
              {action === "KEY_CHANGE" ? "New Correct Answer Key *" : "Accepted Correct Options (Comma separated) *"}
            </label>
            <input
              type="text"
              required
              value={newCorrect}
              onChange={(e) => setNewCorrect(e.target.value)}
              placeholder={action === "KEY_CHANGE" ? "e.g. B or 14.5" : "e.g. A, C"}
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
                fontSize: "0.875rem",
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "0.25rem" }}>
              {action === "KEY_CHANGE"
                ? "The question record will be permanently updated with this key."
                : "Students who selected any of these options will receive full positive marks."}
            </span>
          </div>
        )}

        {/* Reason for Audit Log */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
            Reason for Re-evaluation (Mandatory for Audit Trail) *
          </label>
          <textarea
            required
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Disputed answer key reported by faculty; option B verified via NTA standards..."
            style={{
              width: "100%",
              padding: "0.6rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
              resize: "vertical",
            }}
          />
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: "right" }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              backgroundColor: isPending ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              padding: "0.65rem 1.5rem",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            {isPending ? "Executing Re-evaluation..." : "⚡ Execute Re-evaluation"}
          </button>
        </div>
      </form>
    </div>
  );
}

