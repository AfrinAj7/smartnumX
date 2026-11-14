"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SubjectBreakdownItem {
  subject: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  marksScored: number;
  maxMarks: number;
  accuracyPct: number;
  timeSpentSec: number;
}

interface TopicInsight {
  chapter: string;
  subject: string;
  accuracyPct: number;
}

interface ResultData {
  isResultAvailable: boolean;
  reason?: string;
  attempt: {
    id: string;
    attemptNo: number;
    startedAt: string;
    submittedAt: string;
    score: number;
    totalMarks: number;
    percentage: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    accuracyPct: number;
    rank: number | null;
    percentile: number | null;
    totalCandidates: number;
    totalTimeSpentSec: number;
    isPassed: boolean | null;
    passMarks: number | null;
  };
  test: {
    id: string;
    code: string;
    title: string;
    type: string;
    solutionMode: string;
    durationMin: number;
  };
  benchmarks: {
    topperScore: number;
    averageScore: number;
    totalAttempts: number;
  };
  subjectBreakdown: SubjectBreakdownItem[];
  strongTopics: TopicInsight[];
  weakTopics: TopicInsight[];
}

export function ExamResultView({
  testId,
  attemptId,
  user,
}: {
  testId: string;
  attemptId: string;
  user: { name?: string | null; email?: string | null };
}) {
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/tests/${testId}/attempt/${attemptId}/result`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load examination result.");
        }
        setData(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error fetching results.");
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [testId, attemptId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", color: "#64748b" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid #cbd5e1", borderTopColor: "#0284c7", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
        <p style={{ fontWeight: 600 }}>Calculating score & competitive analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "0.75rem", border: "1px solid #fee2e2", maxWidth: "480px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#991b1b", marginBottom: "0.5rem" }}>Unable to View Result</h2>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.25rem" }}>{error || "Unknown error"}</p>
          <Link href="/dashboard" style={{ padding: "0.6rem 1.25rem", backgroundColor: "#0284c7", color: "#ffffff", borderRadius: "0.375rem", fontWeight: 700, textDecoration: "none", fontSize: "0.875rem" }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data.isResultAvailable) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", maxWidth: "520px", textAlign: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⏳</div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>Result Pending Release</h2>
          <p style={{ color: "#64748b", fontSize: "0.925rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            {data.reason || "The results for this test will be available according to the schedule."}
          </p>
          <Link href="/dashboard" style={{ padding: "0.65rem 1.25rem", backgroundColor: "#0284c7", color: "#ffffff", borderRadius: "0.375rem", fontWeight: 700, textDecoration: "none", fontSize: "0.875rem" }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { attempt, test, benchmarks, subjectBreakdown, strongTopics, weakTopics } = data;

  const formatSec = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "2rem 1rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {/* HEADER STRIP */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, backgroundColor: "#0284c7", color: "#ffffff", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", textTransform: "uppercase" }}>
                {test.type.replace("_", " ")}
              </span>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Code: {test.code}</span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
              Performance Analytics: {test.title}
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
              Candidate: <strong>{user?.name || "Student"}</strong> ({user?.email}) • Attempt #{attempt.attemptNo}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href={`/tests/${testId}/solutions/${attemptId}`}
              style={{
                padding: "0.65rem 1.25rem",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                borderRadius: "0.375rem",
                fontWeight: 800,
                fontSize: "0.9rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              📖 View Detailed Solutions
            </Link>
            <Link
              href="/dashboard"
              style={{
                padding: "0.65rem 1.15rem",
                backgroundColor: "#e2e8f0",
                color: "#334155",
                borderRadius: "0.375rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* 1. TOP METRIC CARDS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* SCORE CARD */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Score Obtained</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 900, color: attempt.score >= 0 ? "#0284c7" : "#dc2626" }}>
                {attempt.score}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "1rem", fontWeight: 700 }}>/ {attempt.totalMarks}</span>
            </div>
            <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#64748b" }}>
              Percentage: <strong>{attempt.percentage}%</strong>
              {attempt.isPassed !== null && (
                <span style={{ marginLeft: "0.5rem", fontWeight: 800, color: attempt.isPassed ? "#16a34a" : "#dc2626" }}>
                  ({attempt.isPassed ? "PASSED" : "FAILED"})
                </span>
              )}
            </div>
          </div>

          {/* RANK CARD */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>All India Rank</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a" }}>
                {attempt.rank !== null ? `#${attempt.rank}` : "N/A"}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>/ {attempt.totalCandidates}</span>
            </div>
            <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#64748b" }}>
              Percentile: <strong>{attempt.percentile !== null ? `${attempt.percentile}%ile` : "Calculating..."}</strong>
            </div>
          </div>

          {/* ACCURACY CARD */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Overall Accuracy</span>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: attempt.accuracyPct >= 70 ? "#16a34a" : attempt.accuracyPct >= 50 ? "#d97706" : "#dc2626", marginTop: "0.25rem" }}>
              {attempt.accuracyPct}%
            </div>
            <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#64748b" }}>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>{attempt.correctCount} Correct</span> •{" "}
              <span style={{ color: "#dc2626", fontWeight: 700 }}>{attempt.incorrectCount} Incorrect</span>
            </div>
          </div>

          {/* TIME SPENT */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Time Spent</span>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#475569", marginTop: "0.25rem" }}>
              {formatSec(attempt.totalTimeSpentSec)}
            </div>
            <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#64748b" }}>
              Max Allowed: <strong>{test.durationMin} mins</strong>
            </div>
          </div>
        </div>

        {/* 2. PEER COMPARISON BENCHMARK (Student vs Average vs Topper) */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
            Comparative Benchmarking (Batch of {benchmarks.totalAttempts} Candidates)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {/* Student Bar */}
            <div style={{ backgroundColor: "#f0f9ff", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #bae6fd" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0369a1", marginBottom: "0.25rem" }}>YOUR SCORE</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0284c7" }}>{attempt.score}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                Accuracy: {attempt.accuracyPct}% • Questions Attempted: {attempt.correctCount + attempt.incorrectCount}
              </div>
            </div>

            {/* Batch Average Bar */}
            <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>BATCH AVERAGE</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#334155" }}>{benchmarks.averageScore}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                {attempt.score >= benchmarks.averageScore ? (
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>
                    ▲ +{(attempt.score - benchmarks.averageScore).toFixed(1)} pts above average
                  </span>
                ) : (
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>
                    ▼ -{(benchmarks.averageScore - attempt.score).toFixed(1)} pts below average
                  </span>
                )}
              </div>
            </div>

            {/* Batch Topper Bar */}
            <div style={{ backgroundColor: "#fffbeb", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #fef3c7" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#92400e", marginBottom: "0.25rem" }}>BATCH TOPPER</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#d97706" }}>{benchmarks.topperScore}</div>
              <div style={{ fontSize: "0.75rem", color: "#92400e", marginTop: "0.25rem" }}>
                Difference from Topper: {(benchmarks.topperScore - attempt.score).toFixed(1)} pts
              </div>
            </div>
          </div>
        </div>

        {/* 3. SUBJECT-WISE PERFORMANCE BREAKDOWN */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
            Subject-wise Performance Breakdown
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Subject</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>Total</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>Attempted</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", color: "#16a34a" }}>Correct</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", color: "#dc2626" }}>Incorrect</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>Accuracy</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>Time</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Marks Scored</th>
                </tr>
              </thead>
              <tbody>
                {subjectBreakdown.map((sub) => (
                  <tr key={sub.subject} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#0f172a" }}>{sub.subject}</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>{sub.totalQuestions}</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: 600 }}>{sub.attempted}</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", color: "#16a34a", fontWeight: 700 }}>{sub.correct}</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{sub.incorrect}</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: 700, color: sub.accuracyPct >= 70 ? "#16a34a" : sub.accuracyPct >= 50 ? "#d97706" : "#dc2626" }}>
                      {sub.accuracyPct}%
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", color: "#64748b" }}>{formatSec(sub.timeSpentSec)}</td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 900, color: sub.marksScored >= 0 ? "#0f172a" : "#dc2626" }}>
                      {sub.marksScored}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. STRONG TOPICS & WEAK TOPICS SECTION */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* STRONG TOPICS */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.2rem" }}>💪</span>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#16a34a", margin: 0 }}>
                Strong Areas (&ge; 70% Accuracy)
              </h4>
            </div>
            {strongTopics.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {strongTopics.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "0.375rem",
                      backgroundColor: "#dcfce7",
                      color: "#15803d",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    {item.chapter} ({item.subject}): {item.accuracyPct}%
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
                No topics met the 70% accuracy threshold yet. Keep practicing!
              </p>
            )}
          </div>

          {/* WEAK TOPICS / FOCUS AREAS */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🎯</span>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#dc2626", margin: 0 }}>
                Focus Topics to Improve (&lt; 50% Accuracy)
              </h4>
            </div>
            {weakTopics.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {weakTopics.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "0.375rem",
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      border: "1px solid #fecaca",
                    }}
                  >
                    {item.chapter} ({item.subject}): {item.accuracyPct}%
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "#16a34a", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>
                Excellent! No topics fell below 50% accuracy.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

