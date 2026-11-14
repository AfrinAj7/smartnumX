"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

interface ViolationItem {
  id: string;
  type: "TAB_BLUR" | "FULLSCREEN_EXIT";
  timestamp: string;
  details: string | null;
}

interface AttemptItem {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string; phone: string | null };
  attemptNo: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
  startedAt: string;
  deadlineAt: string;
  submittedAt: string | null;
  score: number | null;
  totalMarks: number | null;
  rank: number | null;
  percentile: number | null;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  violationsCount: number;
  violations: ViolationItem[];
  extraTimeMin: number;
}

interface TestAttemptsViewProps {
  testId: string;
}

export function TestAttemptsView({ testId }: TestAttemptsViewProps) {
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [violationsOnly, setViolationsOnly] = useState(false);

  // Selected attempt for modal
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptItem | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetAction, setResetAction] = useState<"ALLOW_REATTEMPT" | "REOPEN_IN_PROGRESS" | "ADD_TIME">("REOPEN_IN_PROGRESS");
  const [extraMinutes, setExtraMinutes] = useState("15");
  const [resetReason, setResetReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Expanded violations inspection
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (violationsOnly) params.set("violationsOnly", "true");

      const res = await fetch(`/api/admin/tests/${testId}/attempts?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load attempts");

      setAttempts(json.attempts || []);
      setTotalPages(json.meta?.totalPages || 1);
      setTotal(json.meta?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading attempts");
    } finally {
      setLoading(false);
    }
  }, [testId, page, search, statusFilter, violationsOnly]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAttempts();
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;

    if (!resetReason.trim() || resetReason.trim().length < 5) {
      alert("A reason (minimum 5 characters) is required for audit logs.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tests/${testId}/attempts/${selectedAttempt.id}/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: resetAction,
            extraMinutes: Number(extraMinutes) || 15,
            reason: resetReason.trim(),
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to manage attempt");

        setActionSuccess(json.data.message || "Attempt updated successfully.");
        setIsResetModalOpen(false);
        setResetReason("");
        loadAttempts();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to reset attempt");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Student Attempts &amp; Integrity Records ({total})
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Monitor candidate submissions, inspect proctoring violation logs, and reopen or extend time.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "0.875rem 1rem", borderRadius: "0.5rem" }}>
          ✓ {actionSuccess}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "0.875rem 1rem", borderRadius: "0.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "1rem",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            placeholder="Search student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "0.5rem",
            borderRadius: "0.375rem",
            border: "1px solid #cbd5e1",
            backgroundColor: "#fff",
            fontSize: "0.875rem",
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="AUTO_SUBMITTED">Auto-Submitted (Timeout)</option>
          <option value="IN_PROGRESS">In Progress</option>
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={violationsOnly}
            onChange={(e) => {
              setViolationsOnly(e.target.checked);
              setPage(1);
            }}
          />
          Violations Only 🚨
        </label>
      </div>

      {/* Attempts Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                <th style={{ padding: "0.75rem" }}>Rank</th>
                <th style={{ padding: "0.75rem" }}>Candidate</th>
                <th style={{ padding: "0.75rem" }}>Status</th>
                <th style={{ padding: "0.75rem" }}>Score</th>
                <th style={{ padding: "0.75rem" }}>Percentile</th>
                <th style={{ padding: "0.75rem" }}>Accuracy Breakdown</th>
                <th style={{ padding: "0.75rem" }}>Integrity (Violations)</th>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    Loading student attempts...
                  </td>
                </tr>
              ) : attempts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    No student attempts found.
                  </td>
                </tr>
              ) : (
                attempts.map((att) => {
                  const isExpanded = expandedAttemptId === att.id;
                  const vCount = att.violationsCount || att.violations.length;

                  return (
                    <tr key={att.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem", fontWeight: 800, color: "#2563eb" }}>
                        {att.rank ? `#${att.rank}` : "--"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{att.user.name || "Student"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{att.user.email}</div>
                        {att.extraTimeMin > 0 && (
                          <span style={{ fontSize: "0.65rem", color: "#0369a1", backgroundColor: "#e0f2fe", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                            +{att.extraTimeMin}m extra
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor:
                              att.status === "SUBMITTED"
                                ? "#dcfce7"
                                : att.status === "AUTO_SUBMITTED"
                                ? "#fef3c7"
                                : "#eff6ff",
                            color:
                              att.status === "SUBMITTED"
                                ? "#166534"
                                : att.status === "AUTO_SUBMITTED"
                                ? "#92400e"
                                : "#1e40af",
                          }}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {att.score !== null ? (
                          <div>
                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>{att.score}</span>
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}> / {att.totalMarks}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>--</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem", fontWeight: 700, color: "#0f766e" }}>
                        {att.percentile !== null ? `${att.percentile}%` : "--"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem" }}>
                          <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ {att.correctCount}</span>
                          <span style={{ color: "#dc2626", fontWeight: 700 }}>✗ {att.incorrectCount}</span>
                          <span style={{ color: "#64748b" }}>○ {att.unattemptedCount}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {vCount > 0 ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedAttemptId(isExpanded ? null : att.id)}
                              style={{
                                backgroundColor: vCount > 3 ? "#fee2e2" : "#fef3c7",
                                color: vCount > 3 ? "#991b1b" : "#92400e",
                                border: "none",
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.25rem",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              🚨 {vCount} Violations {isExpanded ? "▲" : "▼"}
                            </button>

                            {isExpanded && (
                              <div
                                style={{
                                  marginTop: "0.5rem",
                                  padding: "0.5rem",
                                  backgroundColor: "#fff1f2",
                                  borderRadius: "0.25rem",
                                  border: "1px solid #fecdd3",
                                  maxWidth: "240px",
                                }}
                              >
                                {att.violations.map((v) => (
                                  <div key={v.id} style={{ fontSize: "0.7rem", color: "#9f1239", marginBottom: "0.25rem" }}>
                                    &bull; <strong>{v.type}</strong> at {new Date(v.timestamp).toLocaleTimeString()}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#16a34a", fontSize: "0.75rem", fontWeight: 600 }}>✓ Clean</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAttempt(att);
                            setIsResetModalOpen(true);
                          }}
                          style={{
                            backgroundColor: "#f1f5f9",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "0.375rem",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          Manage ⚙️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
              Page {page} of {totalPages} ({total} attempts)
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ padding: "0.3rem 0.75rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: "0.3rem 0.75rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attempt Management Modal */}
      {isResetModalOpen && selectedAttempt && (
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
          onClick={() => !isPending && setIsResetModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.5rem",
              maxWidth: "500px",
              width: "100%",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
              Manage Candidate Attempt
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.8125rem", margin: "0 0 1rem" }}>
              Candidate: <strong>{selectedAttempt.user.name || selectedAttempt.user.email}</strong> &bull; Status: {selectedAttempt.status}
            </p>

            <form onSubmit={handleResetSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                  Action *
                </label>
                <select
                  value={resetAction}
                  onChange={(e) => setResetAction(e.target.value as "ALLOW_REATTEMPT" | "REOPEN_IN_PROGRESS" | "ADD_TIME")}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                >
                  <option value="REOPEN_IN_PROGRESS">Reopen Attempt In-Progress (+ Compensatory Minutes)</option>
                  <option value="ADD_TIME">Add Extra Time to Current Attempt</option>
                  <option value="ALLOW_REATTEMPT">Allow Fresh Re-attempt (Wipe &amp; Restart)</option>
                </select>
              </div>

              {(resetAction === "REOPEN_IN_PROGRESS" || resetAction === "ADD_TIME") && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                    Extra Minutes to Grant *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={extraMinutes}
                    onChange={(e) => setExtraMinutes(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
              )}

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.25rem" }}>
                  Reason (Mandatory for Audit Trail) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="e.g. Student reported power cut during exam; verified with proctor log..."
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsResetModalOpen(false)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "0.375rem",
                    backgroundColor: resetAction === "ALLOW_REATTEMPT" ? "#dc2626" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: isPending ? "not-allowed" : "pointer",
                  }}
                >
                  {isPending ? "Executing..." : "Apply Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
