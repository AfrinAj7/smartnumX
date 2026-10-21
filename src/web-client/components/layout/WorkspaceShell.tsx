"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { AppRole } from "@/lib/rbac";
import { SmartNumWordmark } from "./SmartNumWordmark";

type WorkspaceShellProps = {
  role: AppRole;
  name: string;
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string | null;
  icon: string;
  badge?: string;
};

const adminNavigation: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Site Content (CMS)", href: "/admin/site-content", icon: "✏️" },
  { label: "Courses & Modules", href: null, icon: "📚", badge: "Soon" },
  { label: "Learners & Enrolments", href: null, icon: "🎓", badge: "Soon" },
  { label: "Leads & Demo Requests", href: null, icon: "📥", badge: "Soon" },
  { label: "Reports & Revenue", href: null, icon: "📈", badge: "Soon" },
  { label: "System Settings", href: null, icon: "⚙️", badge: "Soon" },
];

const learnerNavigation: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "📊" },
  { label: "My Courses", href: null, icon: "📚", badge: "Soon" },
  { label: "1-on-1 Doubts", href: null, icon: "❓", badge: "Soon" },
  { label: "Mock Tests", href: null, icon: "📝", badge: "Soon" },
  { label: "Study Library", href: null, icon: "📁", badge: "Soon" },
  { label: "My Attendance", href: null, icon: "📅", badge: "Soon" },
];

function getInitials(name: string) {
  if (!name) return "SN";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function WorkspaceShell({ role, name, children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = role !== "STUDENT";
  const navigation = isAdmin ? adminNavigation : learnerNavigation;
  const initials = getInitials(name);

  return (
    <div className="workspace-shell">
      {/* Mobile Top Bar */}
      <div className="workspace-mobile-bar">
        <SmartNumWordmark suffix={isAdmin ? "Admin" : "Portal"} />
        <button
          type="button"
          className="workspace-mobile-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="workspace-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`workspace-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="workspace-brand-block">
          <SmartNumWordmark suffix={isAdmin ? "Teaching Space" : "Learning Space"} />
          <span className="workspace-role-pill">
            {role === "SUPER_ADMIN" ? "Super Admin" : role === "INSTRUCTOR" ? "Instructor" : "Learner"}
          </span>
        </div>

        <nav className="workspace-nav" aria-label={isAdmin ? "Admin navigation" : "Student navigation"}>
          {navigation.map((item) => {
            const isActive = item.href ? pathname === item.href : false;

            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={`workspace-nav-item ${isActive ? "is-active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ) : (
              <span key={item.label} className="workspace-nav-item is-upcoming" aria-disabled="true">
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-badge">{item.badge || "Soon"}</span>
              </span>
            );
          })}
        </nav>

        <div className="workspace-sidebar-foot">
          <Link href="/" className="public-site-link">
            <span>View Public Website</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <p className="sidebar-copy">SmartNum Workspace · v1.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="workspace-content">
        <header className="workspace-header">
          <div className="workspace-header-title">
            <span className="workspace-header-caption">
              {isAdmin ? "SMARTNUM / ADMIN PANEL" : "SMARTNUM / LEARNER PORTAL"}
            </span>
            <h1>{isAdmin ? "Admin Workspace" : "Learner Dashboard"}</h1>
          </div>

          <div className="workspace-account">
            <Link href="/" className="button button-secondary button-sm header-view-site">
              View Website <span aria-hidden="true">↗</span>
            </Link>
            <div className="workspace-user-card">
              <div className="user-avatar" aria-hidden="true">{initials}</div>
              <div className="user-meta">
                <span className="user-name">{name}</span>
                <span className="user-role-label">{role}</span>
              </div>
            </div>
            <button
              type="button"
              className="workspace-signout-btn"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="workspace-main">{children}</main>
      </div>
    </div>
  );
}