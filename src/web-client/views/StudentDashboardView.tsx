export function StudentDashboardView() {
  return (
    <section className="workspace-welcome" aria-labelledby="dashboard-title">
      <span className="eyebrow">A steady start</span>
      <h2 id="dashboard-title">Your next idea starts here.</h2>
      <p>
        Your courses, progress, study materials, and questions will come together in this space.
      </p>
      <div className="workspace-progress-line">
        <span>Learning workspace</span>
        <span>Foundation in progress</span>
      </div>
    </section>
  );
}