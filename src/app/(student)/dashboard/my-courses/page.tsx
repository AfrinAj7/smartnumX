import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listUserEnrollments } from "@/server/enrollments/enrollment-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Courses | SmartNum Learner Space",
  description: "Access your enrolled academic tuition and competitive exam modules.",
};

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard/my-courses");
  }

  const enrollments = await listUserEnrollments(session.user.id);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Learner Space
        </span>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0 0" }}>
          My Enrolled Courses ({enrollments.length})
        </h1>
        <p style={{ color: "#475569", margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
          Track your chapter progress, watch recorded modules, and review worksheet solutions.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            padding: "3.5rem 2rem",
            textAlign: "center",
            maxWidth: "600px",
            margin: "2rem auto",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            No Enrolled Courses Found
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9375rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            You have not enrolled in any SmartNum tuition or competitive programs yet. Explore our curriculum catalog to get started.
          </p>
          <Link
            href="/batches"
            style={{
              display: "inline-block",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explore Batches Catalog →
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {enrollments.map((enr) => {
            const isTestSeries = enr.course.productType === "TEST_SERIES";
            const targetUrl = isTestSeries ? `/test-series/${enr.course.slug}#mock-tests` : `/batches/${enr.course.slug}`;

            return (
              <div
                key={enr.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: isTestSeries ? "#eff6ff" : "#fff7ed",
                          color: isTestSeries ? "#1d4ed8" : "#c2410c",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                        }}
                      >
                        {isTestSeries ? "Test Series Pack" : enr.course.categoryName}
                      </span>
                      {enr.course.mode === "PHYSICAL" && (
                        <span style={{ fontSize: "0.6875rem", fontWeight: 700, backgroundColor: "#fef3c7", color: "#92400e", padding: "0.2rem 0.45rem", borderRadius: "0.25rem" }}>
                          📍 Indirapuram
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: enr.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                        color: enr.status === "ACTIVE" ? "#15803d" : "#b91c1c",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "9999px",
                      }}
                    >
                      {enr.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                    {enr.course.title}
                  </h3>

                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.25rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {enr.course.description}
                  </p>

                  {/* Progress bar or Test Counts */}
                  {isTestSeries ? (
                    <div style={{ backgroundColor: "#f8fafc", padding: "0.625rem 0.75rem", borderRadius: "0.375rem", marginBottom: "1.25rem", fontSize: "0.75rem", color: "#334155" }}>
                      📊 {enr.course.testCountFull || 10} Full Mocks · 📖 {enr.course.testCountChapter || 40} Topic Tests · CBT Ready
                    </div>
                  ) : (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#475569", marginBottom: "0.375rem" }}>
                        <span>Course Progress</span>
                        <strong style={{ color: "#0f172a" }}>{enr.progressPct}%</strong>
                      </div>
                      <div style={{ height: "6px", backgroundColor: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${enr.progressPct}%`,
                            height: "100%",
                            backgroundColor: "#ea580c",
                            borderRadius: "9999px",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.375rem" }}>
                        {enr.completedLessons} of {enr.course.totalLessons} lessons completed
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {enr.expiresAt
                      ? `Valid until ${new Date(enr.expiresAt).toLocaleDateString("en-IN")}`
                      : enr.course.validity || "1 Year Portal Access"}
                  </span>

                  <Link
                    href={targetUrl}
                    style={{
                      backgroundColor: isTestSeries ? "#2563eb" : "#ea580c",
                      color: "#ffffff",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    {isTestSeries ? "Attempt Tests →" : "Start Learning →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
