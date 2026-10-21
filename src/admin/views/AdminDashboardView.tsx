import Link from "next/link";

export function AdminDashboardView() {
  const kpis = [
    { title: "Total Students", value: "1,000+", subtitle: "Enrolled across all boards", change: "+12% this month", icon: "🎓", color: "blue" },
    { title: "Active Programs", value: "6", subtitle: "Classes 10–12, JEE", change: "4 Active Boards", icon: "📚", color: "green" },
    { title: "Demo Requests / Leads", value: "New Requests", subtitle: "Website demo inquiries", change: "Lead capture active", icon: "📥", color: "orange" },
    { title: "Faculty & Tutors", value: "75+", subtitle: "Verified subject experts", change: "Active across batches", icon: "👨‍🏫", color: "purple" },
  ];

  const quickActions = [
    {
      title: "Homepage Content & CMS",
      description: "Edit hero slides, banners, trust stats, features, curricula, tutor profiles, FAQs, and upload media.",
      href: "/admin/site-content",
      actionText: "Open CMS Editor",
      icon: "✏️",
      badge: "Active",
      active: true,
    },
    {
      title: "Lead Management",
      description: "Review free demo requests, assign leads to counselors, and track conversion status.",
      href: "#",
      actionText: "View Leads",
      icon: "📥",
      badge: "Phase 2 (Soon)",
      active: false,
    },
    {
      title: "Course Catalog & Modules",
      description: "Manage courses, syllabus structure, recorded video lessons, PDFs, and drip release schedules.",
      href: "#",
      actionText: "Manage Courses",
      icon: "📚",
      badge: "Phase 3 (Soon)",
      active: false,
    },
    {
      title: "Platform & Payment Settings",
      description: "Configure Cashfree gateway keys, tax toggles, automated email templates, and audit logs.",
      href: "#",
      actionText: "Configure Settings",
      icon: "⚙️",
      badge: "Phase 8 (Soon)",
      active: false,
    },
  ];

  return (
    <div className="admin-dashboard">
      {/* Welcome Banner */}
      <section className="dashboard-banner">
        <div className="banner-copy">
          <span className="banner-eyebrow">SMARTNUM MANAGEMENT PLATFORM</span>
          <h2>Welcome back to the Teaching Workspace</h2>
          <p>
            Control your website content, track demo class inquiries, and manage learning programs for SmartNum Learning Space.
          </p>
        </div>
        <div className="banner-cta">
          <Link href="/admin/site-content" className="button button-demo">
            <span>Edit Website Content</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="dashboard-kpis">
        <div className="kpi-grid">
          {kpis.map((kpi) => (
            <div key={kpi.title} className={`kpi-card kpi-card-${kpi.color}`}>
              <div className="kpi-head">
                <span className="kpi-icon" aria-hidden="true">{kpi.icon}</span>
                <span className="kpi-change">{kpi.change}</span>
              </div>
              <div className="kpi-body">
                <span className="kpi-value">{kpi.value}</span>
                <h3 className="kpi-title">{kpi.title}</h3>
                <p className="kpi-subtitle">{kpi.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Action Cards Grid */}
      <section className="dashboard-actions-section">
        <div className="section-head">
          <h3>Management Modules</h3>
          <p>Access active platform modules or preview upcoming capabilities.</p>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <div key={action.title} className={`action-card ${action.active ? "is-enabled" : "is-disabled"}`}>
              <div className="action-card-header">
                <span className="action-icon" aria-hidden="true">{action.icon}</span>
                <span className={`action-badge ${action.active ? "badge-active" : "badge-soon"}`}>
                  {action.badge}
                </span>
              </div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              {action.active ? (
                <Link href={action.href} className="button button-demo button-sm">
                  {action.actionText} <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <span className="action-disabled-label">{action.actionText} (Upcoming)</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Center Details & Info Summary */}
      <section className="dashboard-info-strip">
        <div className="info-card">
          <span className="info-icon" aria-hidden="true">📍</span>
          <div>
            <strong>Campus Location</strong>
            <span>04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014</span>
          </div>
        </div>
        <div className="info-card">
          <span className="info-icon" aria-hidden="true">📞</span>
          <div>
            <strong>Contact Phones</strong>
            <span>+91 99589 47774 / +91 88004 05640</span>
          </div>
        </div>
        <div className="info-card">
          <span className="info-icon" aria-hidden="true">✉️</span>
          <div>
            <strong>Support Email</strong>
            <span>gosmartnum@gmail.com</span>
          </div>
        </div>
      </section>
    </div>
  );
}