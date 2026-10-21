# Implementation Plan

The work follows the delivery order in `AGENTS.md`. Each phase must pass lint, type-check, and tests, with permissions verified and the changelog updated before the next phase begins.

| Phase | Scope | Status |
|---|---|---|
| 1. Foundation | Project setup, tokens, authentication, RBAC, role-aware layouts, seed data | In progress: code and seed added; real migration/seed run awaits local Postgres credentials |
| 2. Marketing + CMS | Landing pages, editable sections, lead capture, SEO, consent, public page templates | In progress: SmartNum navigation/footer, mathematics carousel, programme sections, FAQ and lead capture; CMS and supporting pages remain |
| 3. Catalog + Checkout | Course discovery/detail, Cashfree, webhook verification, enrollment, invoices | Not started |
| 4. Student Learning | Dashboard, YouTube player, progress, attendance, certificates, notes | Not started |
| 5. Doubts + Notifications | Doubt workflows, instructor responses, in-app/email notifications | Not started |
| 6. Tests + Analytics | Question banks, server-graded tests, scholarship test, performance analytics | Not started |
| 7. Study Materials | Searchable resources hub, access rules, downloads | Not started |
| 8. Admin Panel | Users, instructors, courses, orders, leads, announcements, reports, settings, audit | Not started |
| 9. Hardening + Launch | Security, accessibility, performance, e2e coverage, deployment | Not started |

## Phase 1 Exit Criteria

- Project installs, builds, and passes lint and type-check.
- PostgreSQL schema validates and produces a migration diff; a real migration is still pending database configuration.
- Credential and Google sign-in, email verification, password recovery, and session policy are implemented.
- Role checks cover protected routes and server actions; instructor access is scoped to assigned courses.
- Seed command creates the configured super admin and clearly labeled sample data without hardcoded credentials.
- App layouts and initial unit tests are in place.

The initial auth, RBAC, role-aware route layouts, and seed code are implemented. The exit check that requires a real PostgreSQL migration and seed run is pending until `DATABASE_URL` and `SEED_ADMIN_PASSWORD` are configured locally. The production build was not run while the existing development server was active because both use `.next` output.