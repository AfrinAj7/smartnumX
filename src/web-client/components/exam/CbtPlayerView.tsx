/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MathText } from "@/web-client/components/ui/MathText";

export interface QuestionOption {
  id: string;
  text: string;
  image?: string | null;
}

export type StudentResponseValue = string | number | string[] | null;

export interface QuestionData {
  id: string;
  code: string;
  type: "MCQ_SINGLE" | "MCQ_MULTI" | "NUMERIC" | "TRUE_FALSE";
  subject: string;
  chapter: string | null;
  stem: string;
  stemImage: string | null;
  options: QuestionOption[] | null;
  marks: number;
  negMarks: number;
  order: number;
  sectionId: string | null;
}

export interface SectionData {
  id: string;
  name: string;
  order: number;
  durationMin: number | null;
  maxToAttempt: number | null;
  questions: QuestionData[];
}

export type PaletteState = "NOT_VISITED" | "NOT_ANSWERED" | "ANSWERED" | "MARKED" | "ANSWERED_MARKED";

export interface ExamBundle {
  attemptId: string;
  status: string;
  startedAt: string;
  deadlineAt: string;
  remainingSec: number;
  violationsCount: number;
  test: {
    id: string;
    code: string;
    title: string;
    durationMin: number;
    totalMarks: number;
    requireFullscreen: boolean;
    maxViolations: number;
    instructions: string | null;
  };
  sections: SectionData[];
  answersMap: Record<
    string,
    {
      response: StudentResponseValue;
      state: PaletteState;
      timeSpentSec: number;
    }
  >;
}

export function CbtPlayerView({
  testId,
  attemptId,
  user,
}: {
  testId: string;
  attemptId: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  // Loading & Exam State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<ExamBundle | null>(null);

  // Active Navigation
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Student Responses and Palette States in memory
  const [responses, setresponses] = useState<Record<string, StudentResponseValue>>({});
  const [paletteStates, setPaletteStates] = useState<Record<string, PaletteState>>({});

  // Countdown Timer
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Submission
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Integrity & Violations
  const [violationWarning, setViolationWarning] = useState<string | null>(null);
  const [violationsCount, setViolationsCount] = useState(0);
  const questionStartTimeRef = useRef<number>(Date.now());

  // 1. Fetch Exam Bundle
  useEffect(() => {
    async function loadBundle() {
      try {
        const res = await fetch(`/api/tests/${testId}/attempt/${attemptId}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load examination bundle.");
        }

        const data: ExamBundle = json.data;
        if (data.status === "SUBMITTED" || data.status === "AUTO_SUBMITTED") {
          setSubmitted(true);
          setLoading(false);
          return;
        }

        setBundle(data);
        setTimeLeftSec(data.remainingSec);
        setViolationsCount(data.violationsCount);

        // Preload answers & palette states
        const initialResponses: Record<string, StudentResponseValue> = {};
        const initialStates: Record<string, PaletteState> = {};

        data.sections.forEach((sec) => {
          sec.questions.forEach((q) => {
            const saved = data.answersMap[q.id];
            if (saved) {
              initialResponses[q.id] = saved.response;
              initialStates[q.id] = saved.state;
            } else {
              initialResponses[q.id] = null;
              initialStates[q.id] = "NOT_VISITED";
            }
          });
        });

        // Set first question of first section to NOT_ANSWERED if NOT_VISITED
        const firstQId = data.sections[0]?.questions[0]?.id;
        if (firstQId && initialStates[firstQId] === "NOT_VISITED") {
          initialStates[firstQId] = "NOT_ANSWERED";
        }

        setresponses(initialResponses);
        setPaletteStates(initialStates);
        questionStartTimeRef.current = Date.now();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading exam.");
      } finally {
        setLoading(false);
      }
    }

    loadBundle();
  }, [testId, attemptId]);

  // Submit Exam handler (callable from timer or manual click)
  const handleFinalSubmit = useCallback(async (isAuto = false) => {
    if (submitting || submitted) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tests/${testId}/attempt/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAuto }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Submission failed.");
      }

      setSubmitted(true);
      setShowSubmitModal(false);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error submitting exam.");
      setSubmitting(false);
    }
  }, [testId, attemptId, submitting, submitted]);

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (loading || submitted || timeLeftSec <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, submitted, timeLeftSec, handleFinalSubmit]);

  // 3. Integrity Monitoring (Fullscreen & Tab Switching)
  const recordViolation = useCallback(
    async (type: "TAB_BLUR" | "FULLSCREEN_EXIT", details: string) => {
      try {
        const res = await fetch(`/api/tests/${testId}/attempt/${attemptId}/violation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, details }),
        });
        const json = await res.json();
        if (json.data?.autoSubmitted) {
          alert("Maximum exam integrity violations reached. Your examination has been automatically submitted.");
          setSubmitted(true);
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          return;
        }
        if (json.data?.violationsCount !== undefined) {
          setViolationsCount(json.data.violationsCount);
        }
      } catch {
        // Suppress network error during background violation log
      }
    },
    [testId, attemptId]
  );

  useEffect(() => {
    if (loading || submitted || !bundle) return;

    // Fullscreen enforcement
    if (bundle.test.requireFullscreen) {
      const enterFs = async () => {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch {
          // Graceful ignore on unsupported devices (e.g. iOS Safari)
        }
      };
      enterFs();

      const onFsChange = () => {
        if (!document.fullscreenElement && !submitted) {
          setViolationWarning("Warning: Exiting fullscreen mode is recorded as an integrity violation!");
          recordViolation("FULLSCREEN_EXIT", "Candidate exited fullscreen view");
        }
      };

      document.addEventListener("fullscreenchange", onFsChange);
      return () => document.removeEventListener("fullscreenchange", onFsChange);
    }
  }, [loading, submitted, bundle, recordViolation]);

  useEffect(() => {
    if (loading || submitted) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setViolationWarning("Warning: Switching tabs or minimizing the examination window is recorded!");
        recordViolation("TAB_BLUR", "Candidate switched tab or application window");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loading, submitted, recordViolation]);

  // Active question accessor
  const currentSection = bundle?.sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  // Helper to persist student response to server
  const persistAnswer = useCallback(
    async (questionId: string, response: StudentResponseValue, state: PaletteState) => {
      const now = Date.now();
      const timeSpentSec = Math.max(1, Math.round((now - questionStartTimeRef.current) / 1000));
      questionStartTimeRef.current = now;

      // Optimistic update
      setresponses((prev) => ({ ...prev, [questionId]: response }));
      setPaletteStates((prev) => ({ ...prev, [questionId]: state }));

      try {
        await fetch(`/api/tests/${testId}/attempt/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            response,
            state,
            timeSpentSec,
          }),
        });
      } catch (err) {
        console.error("Autosave failed:", err);
      }
    },
    [testId, attemptId]
  );

  // Question navigation helper
  const navigateTo = (secIdx: number, qIdx: number) => {
    if (!bundle) return;
    const targetSection = bundle.sections[secIdx];
    if (!targetSection) return;
    const targetQ = targetSection.questions[qIdx];
    if (!targetQ) return;

    // If current question was NOT_VISITED, mark it as NOT_ANSWERED before leaving
    if (currentQuestion) {
      const currentState = paletteStates[currentQuestion.id];
      const currentResp = responses[currentQuestion.id];
      if (currentState === "NOT_VISITED") {
        const nextState: PaletteState = currentResp != null && currentResp !== "" ? "ANSWERED" : "NOT_ANSWERED";
        setPaletteStates((prev) => ({ ...prev, [currentQuestion.id]: nextState }));
      }
    }

    // If target question is NOT_VISITED, set it to NOT_ANSWERED
    if (paletteStates[targetQ.id] === "NOT_VISITED") {
      setPaletteStates((prev) => ({ ...prev, [targetQ.id]: "NOT_ANSWERED" }));
    }

    setCurrentSectionIndex(secIdx);
    setCurrentQuestionIndex(qIdx);
    questionStartTimeRef.current = Date.now();
  };

  const handleNext = () => {
    if (!bundle || !currentSection) return;
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      navigateTo(currentSectionIndex, currentQuestionIndex + 1);
    } else if (currentSectionIndex < bundle.sections.length - 1) {
      navigateTo(currentSectionIndex + 1, 0);
    }
  };

  const handlePrev = () => {
    if (!bundle) return;
    if (currentQuestionIndex > 0) {
      navigateTo(currentSectionIndex, currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      const prevSec = bundle.sections[currentSectionIndex - 1];
      navigateTo(currentSectionIndex - 1, prevSec.questions.length - 1);
    }
  };

  // Button Action: Save & Next
  const handleSaveAndNext = async () => {
    if (!currentQuestion) return;
    const currentResp = responses[currentQuestion.id];
    const isAnswered =
      currentResp !== null &&
      currentResp !== undefined &&
      currentResp !== "" &&
      (!Array.isArray(currentResp) || currentResp.length > 0);

    const nextState: PaletteState = isAnswered ? "ANSWERED" : "NOT_ANSWERED";
    await persistAnswer(currentQuestion.id, currentResp, nextState);
    handleNext();
  };

  // Button Action: Mark for Review & Next
  const handleMarkForReviewAndNext = async () => {
    if (!currentQuestion) return;
    const currentResp = responses[currentQuestion.id];
    const isAnswered =
      currentResp !== null &&
      currentResp !== undefined &&
      currentResp !== "" &&
      (!Array.isArray(currentResp) || currentResp.length > 0);

    const nextState: PaletteState = isAnswered ? "ANSWERED_MARKED" : "MARKED";
    await persistAnswer(currentQuestion.id, currentResp, nextState);
    handleNext();
  };

  // Button Action: Clear Response
  const handleClearResponse = async () => {
    if (!currentQuestion) return;
    await persistAnswer(currentQuestion.id, null, "NOT_ANSWERED");
  };

  // Option change handler
  const handleOptionChange = (value: string) => {
    if (!currentQuestion) return;

    if (currentQuestion.type === "MCQ_MULTI") {
      const currentList: string[] = Array.isArray(responses[currentQuestion.id])
        ? (responses[currentQuestion.id] as string[])
        : [];
      const exists = currentList.includes(value);
      const updated = exists ? currentList.filter((x) => x !== value) : [...currentList, value];
      setresponses((prev) => ({ ...prev, [currentQuestion.id]: updated }));
    } else {
      setresponses((prev) => ({ ...prev, [currentQuestion.id]: value }));
    }
  };

  // 4. Overall Question Palette Counts Summary
  const summaryCounts = useMemo(() => {
    const counts: Record<PaletteState, number> = {
      NOT_VISITED: 0,
      NOT_ANSWERED: 0,
      ANSWERED: 0,
      MARKED: 0,
      ANSWERED_MARKED: 0,
    };

    if (!bundle) return counts;

    bundle.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        const state = paletteStates[q.id] || "NOT_VISITED";
        counts[state]++;
      });
    });

    return counts;
  }, [bundle, paletteStates]);

  // Section summary counts for submit modal
  const sectionSummaries = useMemo(() => {
    if (!bundle) return [];
    return bundle.sections.map((sec) => {
      let answered = 0;
      let notAnswered = 0;
      let marked = 0;
      let notVisited = 0;

      sec.questions.forEach((q) => {
        const st = paletteStates[q.id] || "NOT_VISITED";
        if (st === "ANSWERED") answered++;
        else if (st === "ANSWERED_MARKED") {
          answered++;
          marked++;
        } else if (st === "MARKED") marked++;
        else if (st === "NOT_ANSWERED") notAnswered++;
        else notVisited++;
      });

      return {
        id: sec.id,
        name: sec.name,
        total: sec.questions.length,
        answered,
        notAnswered,
        marked,
        notVisited,
      };
    });
  }, [bundle, paletteStates]);

  // Format Timer HH:MM:SS
  const formattedTime = useMemo(() => {
    const h = Math.floor(timeLeftSec / 3600);
    const m = Math.floor((timeLeftSec % 3600) / 60);
    const s = timeLeftSec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [timeLeftSec]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", color: "#64748b" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid #cbd5e1", borderTopColor: "#0284c7", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
        <p style={{ fontWeight: 600 }}>Loading Examination Player & Syncing Timer...</p>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "0.75rem", border: "1px solid #fee2e2", maxWidth: "480px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#991b1b", marginBottom: "0.5rem" }}>Error Loading Exam</h2>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.25rem" }}>{error || "Unknown error"}</p>
          <Link href="/test-series" style={{ padding: "0.6rem 1.25rem", backgroundColor: "#0284c7", color: "#ffffff", borderRadius: "0.375rem", fontWeight: 700, textDecoration: "none", fontSize: "0.875rem" }}>
            Return to Test Series
          </Link>
        </div>
      </div>
    );
  }

  // Submitted Screen
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", maxWidth: "560px", textAlign: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ width: "4rem", height: "4rem", backgroundColor: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 1.25rem" }}>
            ✓
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
            Examination Submitted!
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.925rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Your responses for <strong>{bundle.test.title}</strong> ({bundle.test.code}) have been recorded successfully.
          </p>

          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.75rem", textAlign: "left", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: "#64748b" }}>Candidate Name:</span>
              <span style={{ fontWeight: 700, color: "#1e293b" }}>{user?.name || "Student"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: "#64748b" }}>Registered Email:</span>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>{user?.email}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: "#64748b" }}>Questions Answered:</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>
                {summaryCounts.ANSWERED + summaryCounts.ANSWERED_MARKED}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Unanswered / Skipped:</span>
              <span style={{ fontWeight: 700, color: "#dc2626" }}>
                {summaryCounts.NOT_ANSWERED + summaryCounts.NOT_VISITED + summaryCounts.MARKED}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={`/tests/${testId}/result/${attemptId}`}
              style={{
                padding: "0.7rem 1.5rem",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                borderRadius: "0.375rem",
                fontWeight: 800,
                textDecoration: "none",
                fontSize: "0.95rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              📊 View Score & Analysis
            </Link>
            <Link
              href={`/tests/${testId}/solutions/${attemptId}`}
              style={{
                padding: "0.7rem 1.25rem",
                backgroundColor: "#0284c7",
                color: "#ffffff",
                borderRadius: "0.375rem",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.95rem",
              }}
            >
              📖 Solutions
            </Link>
            <Link
              href="/dashboard"
              style={{
                padding: "0.7rem 1.25rem",
                backgroundColor: "#f1f5f9",
                color: "#334155",
                borderRadius: "0.375rem",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.95rem",
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = currentQuestion ? responses[currentQuestion.id] : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f1f5f9", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* 1. TOP HEADER STRIP */}
      <header
        style={{
          backgroundColor: "#0f172a",
          color: "#ffffff",
          padding: "0.6rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #0284c7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#38bdf8" }}>SmartNuM CBT</span>
          <span style={{ height: "1.2rem", width: "1px", backgroundColor: "#334155" }} />
          <div>
            <h1 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              {bundle.test.title}
            </h1>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Code: {bundle.test.code}</span>
          </div>
        </div>

        {/* Right side: Timer & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* Violations pill if any */}
          {violationsCount > 0 && (
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.15)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
              Violations: {violationsCount}
              {bundle.test.maxViolations > 0 && ` / ${bundle.test.maxViolations}`}
            </span>
          )}

          {/* Time Remaining Clock */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#1e293b", padding: "0.35rem 0.85rem", borderRadius: "0.375rem", border: "1px solid #334155" }}>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Time Left:</span>
            <span style={{ fontFamily: "monospace", fontSize: "1.15rem", fontWeight: 800, color: timeLeftSec < 300 ? "#ef4444" : "#38bdf8" }}>
              {formattedTime}
            </span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              padding: "0.45rem 1rem",
              backgroundColor: "#22c55e",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.375rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* VIOLATION WARNING BANNER */}
      {violationWarning && (
        <div style={{ backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "0.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#991b1b" }}>
          <span>⚠️ {violationWarning}</span>
          <button onClick={() => setViolationWarning(null)} style={{ background: "none", border: "none", color: "#991b1b", fontWeight: 800, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* 2. SUBJECT / SECTION TABS */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0.35rem 1rem", display: "flex", gap: "0.5rem", overflowX: "auto" }}>
        {bundle.sections.map((sec, idx) => {
          const isActive = idx === currentSectionIndex;
          return (
            <button
              key={sec.id}
              onClick={() => navigateTo(idx, 0)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: isActive ? "#0284c7" : "#f1f5f9",
                color: isActive ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              {sec.name} ({sec.questions.length})
            </button>
          );
        })}
      </div>

      {/* 3. MAIN EXAM BODY (Left: Question, Right: Palette) */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* LEFT: QUESTION WORKSPACE */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#ffffff", borderRight: "1px solid #cbd5e1" }}>
          {currentQuestion ? (
            <>
              {/* Question Header Bar */}
              <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fafafa" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>
                    Question {currentQuestionIndex + 1}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: "#e2e8f0", color: "#334155", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                    {currentQuestion.type.replace("_", " ")}
                  </span>
                  {currentQuestion.chapter && (
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>• {currentQuestion.chapter}</span>
                  )}
                </div>

                <div style={{ fontSize: "0.85rem", display: "flex", gap: "0.75rem" }}>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>+{currentQuestion.marks} Marks</span>
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>-{currentQuestion.negMarks} Marks</span>
                </div>
              </div>

              {/* Question Content Area (Scrollable) */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", lineHeight: 1.7, fontSize: "1.05rem", color: "#1e293b" }}>
                {/* Stem */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <MathText content={currentQuestion.stem} />
                </div>

                {/* Optional Stem Image */}
                {currentQuestion.stemImage && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <img
                      src={currentQuestion.stemImage}
                      alt="Question illustration"
                      style={{ maxWidth: "100%", maxHeight: "320px", objectFit: "contain", borderRadius: "0.375rem", border: "1px solid #e2e8f0" }}
                    />
                  </div>
                )}

                {/* OPTIONS SECTION */}
                <div style={{ marginTop: "1.25rem" }}>
                  {/* Single Choice or Multiple Choice Options */}
                  {(currentQuestion.type === "MCQ_SINGLE" || currentQuestion.type === "MCQ_MULTI") &&
                    Array.isArray(currentQuestion.options) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {currentQuestion.options.map((opt: QuestionOption) => {
                          const isSelected =
                            currentQuestion.type === "MCQ_MULTI"
                              ? Array.isArray(currentAnswer) && currentAnswer.includes(opt.id)
                              : currentAnswer === opt.id;

                          return (
                            <label
                              key={opt.id}
                              onClick={() => handleOptionChange(opt.id)}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.75rem",
                                padding: "0.85rem 1rem",
                                borderRadius: "0.5rem",
                                border: isSelected ? "2px solid #0284c7" : "1px solid #cbd5e1",
                                backgroundColor: isSelected ? "#f0f9ff" : "#ffffff",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <input
                                type={currentQuestion.type === "MCQ_MULTI" ? "checkbox" : "radio"}
                                checked={isSelected}
                                onChange={() => {}} // handled by wrapper label
                                style={{ marginTop: "0.25rem", cursor: "pointer" }}
                              />
                              <span style={{ fontWeight: 800, color: isSelected ? "#0284c7" : "#475569", minWidth: "1.5rem" }}>
                                {opt.id}.
                              </span>
                              <div style={{ flex: 1 }}>
                                <MathText content={opt.text} />
                                {opt.image && (
                                  <div style={{ marginTop: "0.5rem" }}>
                                    <img src={opt.image} alt={`Option ${opt.id}`} style={{ maxWidth: "200px", maxHeight: "150px" }} />
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                  {/* True / False Options */}
                  {currentQuestion.type === "TRUE_FALSE" && (
                    <div style={{ display: "flex", gap: "1rem" }}>
                      {["TRUE", "FALSE"].map((val) => {
                        const isSelected = currentAnswer === val;
                        return (
                          <label
                            key={val}
                            onClick={() => handleOptionChange(val)}
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem",
                              padding: "0.85rem",
                              borderRadius: "0.5rem",
                              border: isSelected ? "2px solid #0284c7" : "1px solid #cbd5e1",
                              backgroundColor: isSelected ? "#f0f9ff" : "#ffffff",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: "pointer" }}
                            />
                            <span>{val}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Numerical Value Input */}
                  {currentQuestion.type === "NUMERIC" && (
                    <div style={{ maxWidth: "340px", backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>
                        Enter Numerical Value (e.g. 4.5 or -12):
                      </label>
                      <input
                        type="text"
                        value={currentAnswer !== null && currentAnswer !== undefined ? currentAnswer : ""}
                        onChange={(e) => handleOptionChange(e.target.value)}
                        placeholder="Type answer here..."
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.85rem",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          borderRadius: "0.375rem",
                          border: "2px solid #94a3b8",
                          fontFamily: "monospace",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Footer Bar */}
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  borderTop: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={handleSaveAndNext}
                    style={{
                      padding: "0.55rem 1.15rem",
                      backgroundColor: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Save & Next
                  </button>
                  <button
                    onClick={handleMarkForReviewAndNext}
                    style={{
                      padding: "0.55rem 1.15rem",
                      backgroundColor: "#9333ea",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Mark for Review & Next
                  </button>
                  <button
                    onClick={handleClearResponse}
                    style={{
                      padding: "0.55rem 1rem",
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.375rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Clear Response
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={handlePrev}
                    disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                    style={{
                      padding: "0.55rem 1rem",
                      backgroundColor: "#f8fafc",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.375rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: currentSectionIndex === 0 && currentQuestionIndex === 0 ? "not-allowed" : "pointer",
                      opacity: currentSectionIndex === 0 && currentQuestionIndex === 0 ? 0.5 : 1,
                    }}
                  >
                    « Previous
                  </button>
                  <button
                    onClick={handleNext}
                    style={{
                      padding: "0.55rem 1rem",
                      backgroundColor: "#f8fafc",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.375rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Next »
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: "2rem", color: "#64748b" }}>No question in this section.</div>
          )}
        </div>

        {/* RIGHT: NTA-STYLE QUESTION PALETTE */}
        <aside
          style={{
            width: "320px",
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #cbd5e1",
            flexShrink: 0,
          }}
        >
          {/* Candidate Card */}
          <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#475569" }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user?.name || "Student Candidate"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user?.email}
              </div>
            </div>
          </div>

          {/* PALETTE LEGEND BADGES (5 NTA STATES) */}
          <div style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "1.5rem", height: "1.4rem", backgroundColor: "#16a34a", color: "#ffffff", borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {summaryCounts.ANSWERED}
              </span>
              <span>Answered</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "1.5rem", height: "1.4rem", backgroundColor: "#dc2626", color: "#ffffff", borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {summaryCounts.NOT_ANSWERED}
              </span>
              <span>Not Answered</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "1.5rem", height: "1.4rem", backgroundColor: "#9333ea", color: "#ffffff", borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {summaryCounts.MARKED}
              </span>
              <span>Marked for Review</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "1.5rem", height: "1.4rem", backgroundColor: "#64748b", color: "#ffffff", borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {summaryCounts.NOT_VISITED}
              </span>
              <span>Not Visited</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", gridColumn: "span 2" }}>
              <span style={{ width: "1.5rem", height: "1.4rem", backgroundColor: "#9333ea", color: "#ffffff", borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, position: "relative" }}>
                {summaryCounts.ANSWERED_MARKED}
                <span style={{ position: "absolute", bottom: "2px", right: "2px", width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
              </span>
              <span>Ans & Marked for Review</span>
            </div>
          </div>

          {/* QUESTION NUMBER GRID FOR ACTIVE SECTION */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.85rem" }}>
            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "0.75rem", textTransform: "uppercase" }}>
              {currentSection?.name} Questions
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.45rem" }}>
              {currentSection?.questions.map((q, idx) => {
                const state = paletteStates[q.id] || "NOT_VISITED";
                const isCurrent = idx === currentQuestionIndex;

                let bg = "#e2e8f0";
                let color = "#334155";
                let hasDot = false;

                if (state === "ANSWERED") {
                  bg = "#16a34a";
                  color = "#ffffff";
                } else if (state === "NOT_ANSWERED") {
                  bg = "#dc2626";
                  color = "#ffffff";
                } else if (state === "MARKED") {
                  bg = "#9333ea";
                  color = "#ffffff";
                } else if (state === "ANSWERED_MARKED") {
                  bg = "#9333ea";
                  color = "#ffffff";
                  hasDot = true;
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateTo(currentSectionIndex, idx)}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      border: isCurrent ? "2px solid #0f172a" : "1px solid rgba(0,0,0,0.05)",
                      borderRadius: "0.35rem",
                      backgroundColor: bg,
                      color,
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isCurrent ? "0 0 0 2px #38bdf8" : "none",
                    }}
                  >
                    {idx + 1}
                    {hasDot && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "3px",
                          right: "3px",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "#22c55e",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PALETTE FOOTER: SUBMIT BUTTON */}
          <div style={{ padding: "0.85rem", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
            <button
              onClick={() => setShowSubmitModal(true)}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "0.375rem",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Submit Examination
            </button>
          </div>
        </aside>
      </div>

      {/* 4. SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              maxWidth: "680px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ padding: "1rem 1.5rem", backgroundColor: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Examination Summary</h3>
              <button onClick={() => setShowSubmitModal(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.25rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <p style={{ color: "#475569", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Review your attempt summary before final submission. Once submitted, you cannot change any answers.
              </p>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "0.5rem" }}>Section Name</th>
                    <th style={{ padding: "0.5rem", textAlign: "center" }}>Total</th>
                    <th style={{ padding: "0.5rem", textAlign: "center", color: "#16a34a" }}>Answered</th>
                    <th style={{ padding: "0.5rem", textAlign: "center", color: "#dc2626" }}>Not Answered</th>
                    <th style={{ padding: "0.5rem", textAlign: "center", color: "#9333ea" }}>Marked</th>
                    <th style={{ padding: "0.5rem", textAlign: "center", color: "#64748b" }}>Not Visited</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionSummaries.map((sec) => (
                    <tr key={sec.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.6rem 0.5rem", fontWeight: 600 }}>{sec.name}</td>
                      <td style={{ padding: "0.6rem 0.5rem", textAlign: "center", fontWeight: 700 }}>{sec.total}</td>
                      <td style={{ padding: "0.6rem 0.5rem", textAlign: "center", color: "#16a34a", fontWeight: 700 }}>{sec.answered}</td>
                      <td style={{ padding: "0.6rem 0.5rem", textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{sec.notAnswered}</td>
                      <td style={{ padding: "0.6rem 0.5rem", textAlign: "center", color: "#9333ea", fontWeight: 700 }}>{sec.marked}</td>
                      <td style={{ padding: "0.6rem 0.5rem", textAlign: "center", color: "#64748b" }}>{sec.notVisited}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "0.375rem", padding: "0.75rem", fontSize: "0.825rem", color: "#92400e", marginBottom: "1.5rem" }}>
                <strong>Attention:</strong> Are you sure you want to finish and submit your exam?
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  style={{
                    padding: "0.6rem 1.25rem",
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Resume Exam
                </button>
                <button
                  onClick={() => handleFinalSubmit(false)}
                  disabled={submitting}
                  style={{
                    padding: "0.6rem 1.5rem",
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontWeight: 800,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Submitting..." : "Yes, Submit Exam"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
