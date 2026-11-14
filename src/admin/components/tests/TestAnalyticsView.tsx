"use client";

import { useEffect, useState } from "react";
import type { TestComprehensiveAnalytics } from "@/server/tests/analytics-service";

interface TestAnalyticsViewProps {
  testId: string;
}

export function TestAnalyticsView({ testId }: TestAnalyticsViewProps) {
  const [data, setData] = useState<TestComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/tests/${testId}/analytics`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load test analytics");
        setData(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading analytics");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [testId]);

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
        <div>Calculating test analytics, score distributions, and discrimination indices...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "1.5rem", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
        ⚠️ {error || "No analytics data available for this test."}
      </div>
    );
  }

  const { overview, scoreDistribution, subjectBreakdown, questionAnalytics, integritySummary, test } = data;

  // Filter questions
  const filteredQuestions = questionAnalytics.filter((q) => {
    const matchesSearch =
      q.code.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.stem.toLowerCase().includes(questionSearch.toLowerCase()) ||
      (q.chapter && q.chapter.toLowerCase().includes(questionSearch.toLowerCase()));
    const matchesSubject = subjectFilter === "ALL" || q.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjects = Array.from(new Set(questionAnalytics.map((q) => q.subject)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Action Header & Exports */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Comprehensive Examination Analytics
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Real-time psychometric performance, score distributions, facility indices, and candidate integrity.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a
            href={`/api/admin/tests/${testId}/analytics/export?type=results`}
            download
            style={{
              backgroundColor: "#ffffff",
              color: "#1e40af",
              border: "1px solid #93c5fd",
              padding: "0.5rem 0.875rem",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            📥 Download Leaderboard CSV
          </a>

          <a
            href={`/api/admin/tests/${testId}/analytics/export?type=questions`}
            download
            style={{
              backgroundColor: "#ffffff",
              color: "#0f766e",
              border: "1px solid #99f6e4",
              padding: "0.5rem 0.875rem",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            📊 Download Item Analysis CSV
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Completed</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
            {overview.completedAttempts}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            {overview.inProgressAttempts} active &bull; {overview.completionRatePct}% completion
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Batch Average</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2563eb", marginTop: "0.25rem" }}>
            {overview.avgScore} <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>/ {test.totalMarks}</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            Std Dev: &plusmn;{overview.stdDeviation} marks
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Topper Score</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", marginTop: "0.25rem" }}>
            {overview.topperScore}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            Lowest: {overview.lowestScore} marks
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pass Rate</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0891b2", marginTop: "0.25rem" }}>
            {overview.passRatePct !== null ? `${overview.passRatePct}%` : "N/A"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            Cutoff: {test.passMarks !== null ? `${test.passMarks} marks` : "No cutoff set"}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Integrity Status</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: integritySummary.attemptsWithViolationsCount > 0 ? "#dc2626" : "#16a34a", marginTop: "0.25rem" }}>
            {integritySummary.attemptsWithViolationsCount} <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>flagged</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            {integritySummary.totalViolationsRecorded} total violations ({integritySummary.tabBlurCount} blur, {integritySummary.fullscreenExitCount} exit)
          </div>
        </div>
      </div>

      {/* Score Distribution & Subject Performance */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
        {/* Score Distribution Histogram */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1rem" }}>
            Score Distribution
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {scoreDistribution.map((bucket) => (
              <div key={bucket.range}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                  <span>{bucket.range}</span>
                  <span>{bucket.count} students ({bucket.percentage}%)</span>
                </div>
                <div style={{ height: "0.75rem", backgroundColor: "#f1f5f9", borderRadius: "0.25rem", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(bucket.percentage, 2)}%`,
                      backgroundColor:
                        bucket.range.includes("81%")
                          ? "#16a34a"
                          : bucket.range.includes("61%")
                          ? "#2563eb"
                          : bucket.range.includes("41%")
                          ? "#0284c7"
                          : bucket.range.includes("21%")
                          ? "#f59e0b"
                          : "#ef4444",
                      borderRadius: "0.25rem",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subject & Section Benchmarks */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1rem" }}>
            Subject Benchmarks
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "0.5rem 0.5rem" }}>Subject</th>
                  <th style={{ padding: "0.5rem 0.5rem" }}>Questions</th>
                  <th style={{ padding: "0.5rem 0.5rem" }}>Avg Score</th>
                  <th style={{ padding: "0.5rem 0.5rem" }}>Accuracy</th>
                  <th style={{ padding: "0.5rem 0.5rem" }}>Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {subjectBreakdown.map((s) => (
                  <tr key={s.subject} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700, color: "#0f172a" }}>{s.subject}</td>
                    <td style={{ padding: "0.6rem 0.5rem", color: "#64748b" }}>{s.totalQuestions}</td>
                    <td style={{ padding: "0.6rem 0.5rem", fontWeight: 600, color: "#2563eb" }}>{s.avgMarks}</td>
                    <td style={{ padding: "0.6rem 0.5rem" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: s.avgAccuracyPct >= 70 ? "#16a34a" : s.avgAccuracyPct >= 40 ? "#0284c7" : "#dc2626",
                        }}
                      >
                        {s.avgAccuracyPct}%
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem 0.5rem", color: "#64748b" }}>{Math.round(s.avgTimeSpentSec / 60)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Question Item Analysis Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Question Item Analysis (Psychometrics)
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>
              Facility index (difficulty), discrimination index, and common misconceptions for each question.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Search question code or stem..."
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.8125rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
              }}
            />

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.8125rem",
                borderRadius: "0.375rem",
                border: "1px solid #cbd5e1",
                backgroundColor: "#fff",
              }}
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                <th style={{ padding: "0.75rem" }}>#</th>
                <th style={{ padding: "0.75rem" }}>Question Code</th>
                <th style={{ padding: "0.75rem" }}>Subject &amp; Chapter</th>
                <th style={{ padding: "0.75rem" }}>Attempt Rate</th>
                <th style={{ padding: "0.75rem" }}>Facility Index (% Correct)</th>
                <th style={{ padding: "0.75rem" }}>Discrimination</th>
                <th style={{ padding: "0.75rem" }}>Avg Time</th>
                <th style={{ padding: "0.75rem" }}>Distractor (Mistake)</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                    No questions match your filter.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => {
                  const facilityLevel =
                    q.accuracyPct >= 75 ? "EASY" : q.accuracyPct >= 40 ? "MODERATE" : "DIFFICULT";
                  const facilityColor =
                    facilityLevel === "EASY" ? "#16a34a" : facilityLevel === "MODERATE" ? "#0284c7" : "#dc2626";

                  return (
                    <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem", fontWeight: 700, color: "#64748b" }}>
                        Q{q.order}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{q.code}</div>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{q.type} &bull; +{q.marks}/-{q.negMarks}</span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ fontWeight: 600, color: "#334155" }}>{q.subject}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{q.chapter || "General"}</div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>{q.attemptRatePct}%</span>
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>({q.attemptedCount}/{q.totalPresented})</div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 800, color: facilityColor }}>
                            {q.accuracyPct}%
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              padding: "0.1rem 0.35rem",
                              borderRadius: "0.25rem",
                              backgroundColor: `${facilityColor}15`,
                              color: facilityColor,
                            }}
                          >
                            {facilityLevel}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {q.discriminationIndex !== null ? (
                          <span
                            style={{
                              fontWeight: 700,
                              color: q.discriminationIndex >= 0.3 ? "#16a34a" : q.discriminationIndex >= 0.1 ? "#f59e0b" : "#dc2626",
                            }}
                          >
                            {q.discriminationIndex}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>--</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem", color: "#475569" }}>
                        {q.avgTimeSpentSec}s
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {q.mostCommonMistake ? (
                          <span
                            style={{
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                            title="Most chosen wrong option"
                          >
                            Option {q.mostCommonMistake}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
