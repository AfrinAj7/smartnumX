"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TestMeta {
  id: string;
  code: string;
  title: string;
  durationMin: number;
  totalMarks: number;
  passMarks: number | null;
  instructions: string | null;
  requireFullscreen: boolean;
  isFreePreview: boolean;
}

export function ExamInstructionsView({
  testId,
  user,
}: {
  testId: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const router = useRouter();
  const [test, setTest] = useState<TestMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessReason, setAccessReason] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccess() {
      try {
        const res = await fetch(`/api/tests/${testId}/access`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to check test access.");
        }
        setTest(json.data.test);
        setHasAccess(json.data.hasAccess);
        if (!json.data.hasAccess) {
          setAccessReason(json.data.reason || "Access denied.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading test.");
      } finally {
        setLoading(false);
      }
    }
    fetchAccess();
  }, [testId]);

  async function handleStart() {
    if (!agreed) {
      alert("Please read and accept the declaration to proceed.");
      return;
    }

    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tests/${testId}/start`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to start exam.");
      }

      const { attemptId } = json.data;
      router.push(`/tests/${testId}/attempt/${attemptId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start test.");
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", color: "#64748b" }}>
        Loading examination instructions...
      </div>
    );
  }

  if (!hasAccess || !test) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "0.75rem", maxWidth: "480px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔒</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
            Test Access Locked
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            {accessReason || "You are not enrolled in the test series for this exam."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link
              href="/test-series"
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "0.5rem 1.25rem",
                borderRadius: "0.375rem",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Explore Test Series Packs
            </Link>
            <Link
              href="/dashboard"
              style={{
                backgroundColor: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: "#0a2540",
          color: "#ffffff",
          padding: "0.75rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "3px solid #2563eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "-0.5px" }}>
            Smart<span style={{ color: "#38bdf8" }}>NuM</span>
          </span>
          <span style={{ fontSize: "0.8rem", backgroundColor: "rgba(255,255,255,0.15)", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>
            NTA CBT Simulation Engine
          </span>
        </div>

        <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          {test.title} ({test.code})
        </div>
      </header>

      {/* Main Body */}
      <div style={{ flex: 1, maxWidth: "1100px", width: "100%", margin: "1.5rem auto", padding: "0 1rem", display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.5rem" }}>
        {/* Left: Instructions */}
        <div style={{ backgroundColor: "#ffffff", padding: "1.75rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
            General Instructions & Examination Rules
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
            Please read the instructions carefully before starting the exam.
          </p>

          {/* Test Meta Strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", backgroundColor: "#f8fafc", padding: "0.85rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>TOTAL DURATION</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{test.durationMin} Minutes</span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>TOTAL MARKS</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2563eb" }}>{test.totalMarks} Marks</span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>PASSING MARKS</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#166534" }}>{test.passMarks ? `${test.passMarks} Marks` : "Not Applicable"}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>LANGUAGE</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>English</span>
            </div>
          </div>

          {/* Color Code Legend */}
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.75rem" }}>
            Question Palette Status Legend:
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "2rem", height: "1.75rem", backgroundColor: "#e2e8f0", color: "#475569", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem" }}>1</span>
              <span>You have <strong>not visited</strong> the question yet.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "2rem", height: "1.75rem", backgroundColor: "#ea580c", color: "#ffffff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem" }}>2</span>
              <span>You have <strong>not answered</strong> the question.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "2rem", height: "1.75rem", backgroundColor: "#16a34a", color: "#ffffff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem" }}>3</span>
              <span>You have <strong>answered</strong> the question.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "2rem", height: "1.75rem", backgroundColor: "#7c3aed", color: "#ffffff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem" }}>4</span>
              <span>You have NOT answered the question, but have <strong>marked the question for review</strong>.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "2rem", height: "1.75rem", backgroundColor: "#7c3aed", color: "#ffffff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.25rem", position: "relative" }}>
                5
                <span style={{ position: "absolute", bottom: "2px", right: "2px", width: "6px", height: "6px", backgroundColor: "#22c55e", borderRadius: "50%" }}></span>
              </span>
              <span>You have <strong>answered as well as marked for review</strong> (will be considered for evaluation).</span>
            </div>
          </div>

          {/* Navigation & Answering Rules */}
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.5rem" }}>
            Navigating & Answering:
          </h3>
          <ul style={{ fontSize: "0.85rem", color: "#334155", paddingLeft: "1.25rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            <li>To answer a question, select an option button and click <strong>Save & Next</strong>.</li>
            <li>To deselect your chosen answer, click the <strong>Clear Response</strong> button.</li>
            <li>To change an answer, simply click another option and click <strong>Save & Next</strong>.</li>
            <li>The clock will be set at the server. The countdown timer at the top of the screen displays the remaining time available to you.</li>
            <li>When the timer reaches zero, the examination will end by itself. You do not need to terminate or leave your session.</li>
          </ul>

          {test.instructions && (
            <div style={{ padding: "0.85rem", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "0.5rem", fontSize: "0.85rem", color: "#92400e", marginBottom: "1.5rem" }}>
              <strong>Custom Instructions for this Exam:</strong>
              <p style={{ margin: "0.25rem 0 0" }}>{test.instructions}</p>
            </div>
          )}

          {/* Declaration Checkbox */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.85rem", color: "#0f172a", cursor: "pointer", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: "0.2rem" }}
              />
              <span>
                I have read and understood all the instructions. All computer hardware and internet connectivity allotted to me are in proper working condition. I declare that I will strictly abide by the rules of this examination.
              </span>
            </label>
          </div>

          {error && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "0.375rem", fontSize: "0.85rem" }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
            <button
              type="button"
              disabled={!agreed || starting}
              onClick={handleStart}
              style={{
                backgroundColor: agreed && !starting ? "#16a34a" : "#94a3b8",
                color: "#ffffff",
                padding: "0.75rem 2rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: agreed && !starting ? "pointer" : "not-allowed",
                boxShadow: agreed ? "0 2px 4px rgba(22, 163, 74, 0.25)" : "none",
              }}
            >
              {starting ? "Starting CBT Session..." : "I am ready to begin →"}
            </button>
          </div>
        </div>

        {/* Right: Candidate Profile Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#e2e8f0", margin: "0 auto 0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 800, color: "#475569" }}>
              {user.name ? user.name[0].toUpperCase() : "S"}
            </div>
            <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem" }}>
              {user.name || "SmartNum Student"}
            </h4>
            <span style={{ fontSize: "0.75rem", color: "#64748b", wordBreak: "break-all" }}>
              {user.email || "Candidate"}
            </span>
          </div>

          <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "0.75rem", color: "#64748b" }}>
            <strong style={{ display: "block", color: "#0f172a", marginBottom: "0.25rem" }}>Anti-Cheating Integrity:</strong>
            Full screen lock and window blur monitors are active during this exam. Exiting full screen or switching browser tabs will be recorded on your scorecard.
          </div>
        </div>
      </div>
    </div>
  );
}

