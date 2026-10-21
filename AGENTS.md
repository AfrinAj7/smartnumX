# AGENTS.md — Course Selling & Management Platform

> This file is both a **Software Requirements Specification (SRS)** and an **instruction file for AI coding agents**.
> Part A tells the agent how to work. Part B is the full SRS. Build exactly what is specified; where something is marked `[ASSUMPTION]`, follow the default but keep it easy to change.

---

# PART A — AGENT INSTRUCTIONS

## A1. Project summary
A web platform where an organization can **sell courses online**, **manage students/users**, **track attendance**, and **publish announcements**, all controlled from a secure **Admin Panel**.

## A1.1 Confirmed decisions (owner answers — these override any default below)
| Topic | Decision |
|---|---|
| Delivery mode | **Recorded lectures only for v1.** Live/offline batches are Phase 2 (schema kept, UI behind feature flag) |
| Payment gateway | **Cashfree** (India). GST invoicing unconfirmed, so GST fields are a Settings toggle, **off by default** |
| Video hosting | **YouTube** (existing playlists), embedded via the YouTube IFrame Player API |
| Certificates | Yes. Eligibility uses an **admin-configurable minimum attendance threshold** (global default + per-course override) |
| Role hierarchy | **Super Admin > Instructor > Student/User** (no separate "Admin" role) |
| WhatsApp / SMS | **Not enabled at launch, but fully configurable** (provider adapter + feature flags + templates) |
| Scale | About **100 students** in year 1 |
| Branding | **Navy blue, light blue, orange** (domain and logo still to be supplied) |

## A2. Tech stack `[ASSUMPTION where not listed above]`
| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth (Auth.js) — email/password + Google OAuth |
| Payments | Cashfree Payments (India, INR) — behind a `PaymentProvider` interface so other gateways can be added later |
| Video | YouTube (unlisted videos/playlists) via IFrame Player API; only the video ID is stored |
| File storage | S3-compatible (AWS S3 / Cloudflare R2) for PDFs, thumbnails, certificates (signed URLs) |
| Email | Resend or SMTP (Nodemailer) |
| WhatsApp / SMS | Pluggable `MessageChannel` adapter (e.g., Twilio / Gupshup / Meta Cloud API); **disabled at launch** via feature flags |
| Validation | Zod (shared client + server) |
| Testing | Vitest (unit), Playwright (e2e) |
| Deployment | Vercel (app) + managed Postgres (Neon/Supabase/RDS) |

## A3. Repository structure
```
/src
  /app
    /(public)        # landing, course catalog, course detail, login, register
    /(student)       # dashboard, my courses, player, attendance, announcements, profile
    /(instructor)    # scoped views for instructors: own courses, students, attendance, announcements
    /(admin)         # admin panel
    /api             # route handlers (REST) — webhooks live here
  /components        # ui/, forms/, tables/, layout/
  /lib               # auth.ts, db.ts, payments/, mailer.ts, rbac.ts, validators/
  /server            # services (business logic), no UI imports
  /types
/prisma              # schema.prisma, migrations, seed.ts
/tests
/docs
```

## A4. Rules for the agent
1. **Read this whole file before writing code.** Implement features in the milestone order in Section B-14.
2. **Business logic goes in `/server` services**, never inside React components or route handlers directly.
3. **Every route and server action must check authentication AND role** via `lib/rbac.ts`. Never trust the client.
4. **Validate all input with Zod** on the server. Never write raw SQL with string interpolation.
5. **Never hardcode secrets.** Use environment variables; maintain `.env.example`.
6. **Payments:** Only mark an order `PAID` from a **verified webhook/signature**, never from a client redirect.
7. **Passwords:** hash with bcrypt/argon2. Never log passwords, tokens, or payment data.
8. **Course content access** must be gated by an active `Enrollment` check on every request. Never expose `youtubeVideoId` in public pages or catalog APIs; return it only to enrolled users or for lessons flagged `isPreview`.
9. **Soft delete** users, courses, and orders (`deletedAt`); never hard-delete financial or attendance records.
10. **Log admin actions** to `AuditLog` (who, what, entity, before/after, timestamp).
11. Write at least one test per service function with business rules (enrollment, attendance, payment verification).
12. Keep UI responsive (mobile-first), accessible (WCAG 2.1 AA basics), and consistent via shared components.
13. Use paginated queries (default 20/page) for all list endpoints and admin tables.
14. After each milestone: run lint, type-check, tests; update `/docs/CHANGELOG.md`.
15. If a requirement is ambiguous, pick the safest default, document it in `/docs/DECISIONS.md`, and continue.

## A5. Commands (expected)
```
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed       # creates super admin + sample data
npm run dev
npm run lint && npm run typecheck && npm test
```

## A6. Environment variables (`.env.example`)
```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_ENV=sandbox            # sandbox | production
YOUTUBE_API_KEY=               # optional: playlist import
FEATURE_BATCHES=false          # Phase 2 live/offline batches
FEATURE_WHATSAPP=false
FEATURE_SMS=false
WHATSAPP_PROVIDER=
WHATSAPP_API_KEY=
SMS_PROVIDER=
SMS_API_KEY=
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
APP_URL=
```

---

# PART B — SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for a web-based **Course Selling and Management Platform** including user management, attendance tracking, announcements, and a full admin panel.

### 1.2 Scope
The system allows:
- Visitors to browse and purchase courses.
- Students to access purchased courses, view attendance, and read announcements.
- Instructors to manage their own courses, view their students' progress and attendance, and post announcements.
- Super Admin to manage everything: users, instructors, courses, orders, attendance, announcements, settings, and reports.

### 1.3 Definitions
| Term | Meaning |
|---|---|
| Course | A product for sale containing modules/lessons |
| Batch | A scheduled group of students taking a course together (for live/offline classes) |
| Enrollment | A student's access right to a course/batch, created after successful payment or manual admin grant |
| Session | A single class meeting in a batch (date + time) — attendance is marked per session |
| RBAC | Role-Based Access Control |

### 1.4 Intended users
Visitors, Students, Instructors, Super Admin.

---

## 2. Overall Description

### 2.1 Product perspective
Standalone web application (responsive, works on desktop/tablet/mobile browsers) with a REST API backend and relational database.

### 2.2 User roles & permissions summary
**Hierarchy: Super Admin > Instructor > Student.** In this document "Admin" and "admin panel" mean the Super Admin unless an Instructor is explicitly mentioned. Instructors use the same `/admin` panel but see only scoped modules and only data for courses assigned to them.

| Capability | Visitor | Student | Instructor | Super Admin |
|---|:-:|:-:|:-:|:-:|
| Browse catalog | ✅ | ✅ | ✅ | ✅ |
| Purchase course | — | ✅ | — | ✅ (manual order) |
| Access purchased content | — | ✅ | ✅ (own courses) | ✅ |
| View own attendance | — | ✅ | — | ✅ |
| View student attendance / progress | — | — | ✅ (own courses) | ✅ (all) |
| Edit/override attendance | — | — | ✅ (own, within edit window) | ✅ (all) |
| Read announcements | — | ✅ | ✅ | ✅ |
| Create announcements | — | — | ✅ (own courses) | ✅ (any audience) |
| Create/edit courses and lessons | — | — | ✅ (own; publishing needs Super Admin unless permitted) | ✅ |
| Manage users | — | — | view students of own courses | ✅ |
| Create/manage instructors, roles | — | — | — | ✅ |
| Orders, refunds, coupons | — | — | — | ✅ |
| Reports / revenue | — | — | own-course engagement only | ✅ |
| System settings, audit log | — | — | — | ✅ |

### 2.3 Operating environment
Modern browsers (latest 2 versions of Chrome, Edge, Firefox, Safari). Server: Node.js 20+, PostgreSQL 15+.

### 2.4 Constraints & assumptions
- v1 is **recorded lectures only**; videos live on YouTube playlists owned by the organization.
- Currency is **INR**; multi-currency is out of scope for v1.
- GST status is unknown, so GST fields are optional and controlled in Settings.
- **YouTube limitation:** unlisted videos cannot be fully protected (anyone with the video ID/link can watch). The platform hides IDs from non-enrolled users, but a determined paying student could share a link. If piracy becomes a concern, migrate to Vimeo/Bunny/Mux; this is why video access sits behind a `VideoProvider` interface.
- Expected volume is about 100 students in year 1.
---

## 3. Functional Requirements

> Priority: **M** = Must, **S** = Should, **C** = Could.

### 3.1 Authentication & Account (AUTH)
| ID | Requirement | P |
|---|---|:-:|
| AUTH-1 | Users can register with name, email, phone, password | M |
| AUTH-2 | Email verification via tokenized link before first purchase | M |
| AUTH-3 | Login with email/password; optional Google OAuth | M |
| AUTH-4 | Forgot / reset password via expiring email link (30 min) | M |
| AUTH-5 | Logout and session expiry (idle 30 days, configurable) | M |
| AUTH-6 | Rate-limit login (5 failed attempts → 15 min lock) | M |
| AUTH-7 | Users can edit profile (name, phone, avatar) and change password | M |
| AUTH-8 | Optional 2FA (TOTP) for Super Admin and Instructor | S |

### 3.2 Public Website & Course Catalog (CAT)
| ID | Requirement | P |
|---|---|:-:|
| CAT-1 | Landing page with featured courses, testimonials, FAQ, contact | M |
| CAT-2 | Catalog page with search, category filter, price filter, sort | M |
| CAT-3 | Course detail page: title, description, instructor, curriculum outline, price, discount, duration, reviews, preview lesson | M |
| CAT-4 | SEO: meta tags, OpenGraph, sitemap.xml, clean slugs | M |
| CAT-5 | Course reviews & ratings by enrolled students (admin-moderated) | S |
| CAT-6 | Wishlist | C |

### 3.3 Cart, Checkout & Payments (PAY)
| ID | Requirement | P |
|---|---|:-:|
| PAY-1 | "Buy now" and cart for multiple courses | M |
| PAY-2 | Coupon codes (percentage / flat, expiry, usage limit, per-course scope) | M |
| PAY-3 | Checkout via Cashfree (UPI, cards, netbanking, wallets); sandbox mode for testing | M |
| PAY-4 | Order created as `PENDING`; set to `PAID` only after verified webhook signature | M |
| PAY-5 | On `PAID`: auto-create Enrollment, send receipt email, show in dashboard | M |
| PAY-6 | Failed/abandoned payment handling; retry from "My Orders" | M |
| PAY-7 | Receipt/invoice PDF. GST fields (GSTIN, tax breakup) shown only if the GST toggle is enabled in Settings (**off by default**) | S |
| PAY-8 | Refunds initiated by admin; enrollment revoked or retained by choice | M |
| PAY-9 | Installments / EMI plans | C |
| PAY-10 | Idempotent webhook processing (no duplicate enrollments) | M |

### 3.4 Course Content & Learning (LRN)
| ID | Requirement | P |
|---|---|:-:|
| LRN-1 | Course structure: Course → Modules → Lessons | M |
| LRN-2 | Lesson types: **YouTube video (primary)**, PDF/document, text, external link, live-class link (Phase 2) | M |
| LRN-3 | Student "My Courses" dashboard with progress % | M |
| LRN-4 | Mark lesson complete; resume from last position | M |
| LRN-5 | Content accessible only with active enrollment: video IDs returned only to enrolled users (or preview lessons); files via signed expiring URLs | M |
| LRN-6 | Optional access expiry (e.g., 6 months) per course | S |
| LRN-7 | Quizzes / assignments | C |
| LRN-8 | Certificate of completion (PDF, unique verification code, public verify page) issued automatically when eligibility rules are met (see LRN-11) | M |
| LRN-9 | Lesson player embeds YouTube via IFrame Player API (no related videos, modest branding), reports watch progress, and resumes from last position | M |
| LRN-10 | Admin can paste a single YouTube link or **import an entire playlist** as lessons (via YouTube Data API; manual entry fallback). Optional drip release date per lesson (`releaseAt`) | M |
| LRN-11 | **Certificate eligibility:** `attendance % ≥ minAttendancePct` (global default in Settings, e.g. 75%; per-course override; 0 = no attendance rule) AND, if enabled for the course, progress = 100% | M |
| LRN-12 | Admin can manually issue or revoke a certificate with a reason (audit-logged) | S |

### 3.5 Batches & Sessions (BAT)
> **Phase 2.** v1 is recorded-lecture only. Build the schema and services, but hide the Batch/Session UI behind `FEATURE_BATCHES=false`.

| ID | Requirement | P |
|---|---|:-:|
| BAT-1 | Admin/instructor creates a Batch for a course: name, start/end date, capacity, instructor, mode (online/offline/hybrid) | M |
| BAT-2 | Batch has Sessions (date, start/end time, topic, meeting link/venue) | M |
| BAT-3 | Recurring session generator (e.g., Mon/Wed/Fri 7 PM for 8 weeks) | S |
| BAT-4 | Enrollment may be attached to a batch; capacity enforced | M |
| BAT-5 | Students see upcoming sessions on dashboard | M |
| BAT-6 | Reschedule / cancel session with notification to students | S |

### 3.6 Attendance Management (ATT)
**Two attendance modes:**
1. **Auto (lesson-based) — used in v1 for recorded courses.** A lesson counts as *attended* when the student watches at least `watchThresholdPct` of it (default 80%, configurable). No manual marking required.
2. **Manual (session-based) — Phase 2 / optional.** Instructor marks Present/Absent/Late/Excused for live sessions or doubt-clearing classes.

Note: auto attendance relies on client-reported player events, so treat it as a good-faith measure (reasonable anti-cheat: count only foreground playback time, cap skipping, require sequential position updates).

| ID | Requirement | P |
|---|---|:-:|
| ATT-1 | Instructor/admin opens a session and marks each enrolled student: **Present / Absent / Late / Excused** | M |
| ATT-2 | "Mark all present" shortcut then adjust exceptions | M |
| ATT-3 | Attendance can only be marked for students enrolled in that batch | M |
| ATT-4 | Edits to submitted attendance allowed within a configurable window (default 48h); later edits require admin and are audit-logged | M |
| ATT-5 | Student view: per-course and per-session attendance history with percentage | M |
| ATT-6 | Admin view: filter by course, batch, student, date range | M |
| ATT-7 | Export attendance to CSV / Excel | M |
| ATT-8 | Low-attendance alert: notify student (and admin) when below threshold (default 75%) | S |
| ATT-9 | Self check-in via time-limited code/QR during the session | C |
| ATT-10 | Bulk import attendance from CSV | C |
| ATT-11 | Auto-capture for online sessions via meeting provider API | C |
| ATT-12 | **Auto attendance from recorded lessons** (watch ≥ threshold ⇒ attended), stored with `source=auto` | M |
| ATT-13 | **Minimum attendance threshold** configurable globally and per course; used for certificates and low-attendance alerts | M |
| ATT-14 | Admin/instructor can manually override a lesson's attendance for a student (reason required, audit-logged) | S |

**Attendance % formulas:**
- Recorded: `attended lessons ÷ lessons released so far` (lessons with `releaseAt` in the future are excluded).
- Manual sessions: `(Present + Late×lateWeight) / (Total sessions − Excused)`; default `lateWeight = 1`.
- If a course has both, they are combined as one pool of items. Weights are configurable in Settings.

### 3.7 Announcements (ANN)
| ID | Requirement | P |
|---|---|:-:|
| ANN-1 | Admin/instructor creates announcement: title, rich-text body, attachments, priority (normal/important/urgent) | M |
| ANN-2 | Audience targeting: all users, specific course, specific batch, specific role, or selected users | M |
| ANN-3 | Publish now or schedule for later; set expiry; pin to top | M |
| ANN-4 | Delivery channels: in-app (M), email (M); WhatsApp/SMS through the channel adapter, **disabled at launch but fully configurable** (see NOT-5) | M |
| ANN-5 | Students see an announcements feed with unread badge; mark as read | M |
| ANN-6 | Admin can edit, unpublish, delete (soft) announcements | M |
| ANN-7 | Read-receipt count visible to admin | S |
| ANN-8 | Instructors limited to their own courses/batches | M |

### 3.8 Admin Panel (ADM)
Accessible at `/admin`. **Super Admin:** all modules. **Instructor:** only modules for their own courses/students (courses, lessons, students, attendance, announcements, own-course reports).

| ID | Module | Requirements | P |
|---|---|---|:-:|
| ADM-1 | **Dashboard** | KPIs: total revenue (today/week/month), new users, active enrollments, orders, avg attendance, recent orders, upcoming sessions; charts | M |
| ADM-2 | **User Management** | List/search/filter users; view profile, enrollments, orders, attendance; create user; edit; suspend/reactivate; reset password; change role; impersonate (Super Admin only, logged); export CSV; bulk actions | M |
| ADM-3 | **Course Management** | CRUD courses, categories, modules, lessons; upload media; reorder via drag-drop; draft/published/archived status; set price, discount, validity; assign instructor | M |
| ADM-4 | **Batch & Session Management** | CRUD batches and sessions; assign instructors; view enrolled students; transfer student between batches | M |
| ADM-5 | **Enrollment Management** | Manually enroll/unenroll user (free/offline payment) with reason; extend/revoke access | M |
| ADM-6 | **Orders & Payments** | List/filter orders; view payment status/gateway IDs; issue refunds; resend invoice; manual order for offline payment | M |
| ADM-7 | **Coupons** | CRUD coupons, usage stats | M |
| ADM-8 | **Attendance** | Mark/edit/view/export attendance across all batches; low-attendance report | M |
| ADM-9 | **Announcements** | Full announcement CRUD with targeting and scheduling | M |
| ADM-10 | **Reviews moderation** | Approve / hide reviews | S |
| ADM-11 | **Reports** | Revenue, course sales, enrollment trend, attendance, user growth; date-range filter; CSV export | M |
| ADM-12 | **Site Settings** | Site name, logo, contact info, tax settings, email templates, attendance thresholds, payment keys status, SEO defaults | M |
| ADM-13 | **Instructors & Roles** (Super Admin only) | Create/suspend instructors, assign courses to them, optional per-instructor permission toggles (e.g., can publish courses) | M |
| ADM-14 | **Audit Log** | Searchable log of all admin actions | M |
| ADM-15 | **CMS pages** | Edit static pages (About, Terms, Privacy, Refund Policy, FAQ) | S |

### 3.9 Student Dashboard (STU)
| ID | Requirement | P |
|---|---|:-:|
| STU-1 | Overview: enrolled courses, progress, next session, latest announcements, attendance summary | M |
| STU-2 | My Orders & downloadable invoices | M |
| STU-3 | My Attendance (per course/batch, percentage, session list) | M |
| STU-4 | Announcements feed | M |
| STU-5 | Profile & security settings | M |
| STU-6 | Certificates list | S |

### 3.10 Notifications (NOT)
| ID | Requirement | P |
|---|---|:-:|
| NOT-1 | Transactional emails: verify email, reset password, order receipt, enrollment confirmation, session reminder (24h/1h), announcement, low attendance | M |
| NOT-2 | In-app notification bell with unread count | M |
| NOT-3 | Admin-editable email templates with variables | S |
| NOT-4 | Queue emails (background job) with retry | M |
| NOT-5 | **Channel adapter** (`MessageChannel` interface: email, whatsapp, sms). WhatsApp/SMS providers configurable in Settings (provider, API key, sender ID, approved templates); controlled by feature flags, **off at launch** | M |
| NOT-6 | Per-user notification preferences (opt-in per channel) and delivery log with status/failure reason | S |

---

## 4. Data Model (Prisma-style summary)

```
User            id, name, email(unique), phone, passwordHash, role(SUPER_ADMIN|INSTRUCTOR|STUDENT), status(active|suspended),
                emailVerifiedAt, avatarUrl, createdAt, updatedAt, deletedAt
Category        id, name, slug
Course          id, title, slug(unique), description, thumbnailUrl, categoryId, instructorId,
                price, discountPrice, validityDays, minAttendancePct?, requireFullProgress, certificateEnabled,
                status(draft|published|archived), createdAt, deletedAt
Module          id, courseId, title, position
Lesson          id, moduleId, title, type(youtube|pdf|text|link|live), youtubeVideoId?, contentUrl?, body, duration, position, isPreview, releaseAt?
Batch           id, courseId, name, instructorId, startDate, endDate, capacity, mode, status
Session         id, batchId, title, startsAt, endsAt, meetingUrl, venue, status(scheduled|done|cancelled)
Enrollment      id, userId, courseId, batchId?, source(purchase|manual), orderId?, status(active|expired|revoked),
                startedAt, expiresAt?, UNIQUE(userId, courseId)
LessonProgress  id, enrollmentId, lessonId, completedAt, lastPositionSec
Attendance      id, sessionId?, lessonId?, userId, source(auto|manual), status(present|absent|late|excused),
                markedById?, markedAt, note,
                UNIQUE(sessionId, userId), UNIQUE(lessonId, userId)
Order           id, userId, subtotal, discount, tax, total, currency, status(pending|paid|failed|refunded|partially_refunded),
                couponId?, gateway, gatewayOrderId, gatewayPaymentId, invoiceNo, createdAt
OrderItem       id, orderId, courseId, price
Refund          id, orderId, amount, reason, gatewayRefundId, createdById, createdAt
Coupon          id, code(unique), type(percent|flat), value, maxUses, usedCount, validFrom, validTo, courseIds[]
Announcement    id, title, body, priority, authorId, audienceType(all|course|batch|role|users),
                audienceRef, publishAt, expiresAt, isPinned, status(draft|scheduled|published|archived), createdAt, deletedAt
AnnouncementRead  announcementId, userId, readAt
Notification    id, userId, type, title, body, link, readAt, createdAt
Review          id, courseId, userId, rating, comment, status(pending|approved|hidden)
Certificate     id, enrollmentId, code(unique), issuedAt, pdfUrl
AuditLog        id, actorId, action, entityType, entityId, before(json), after(json), ip, createdAt
Setting         key, value(json)
Page            id, slug, title, body, published
```

**Key indexes:** `User.email`, `Course.slug`, `Enrollment(userId, courseId)`, `Attendance(sessionId, userId)`, `Order.gatewayOrderId`, `Announcement(status, publishAt)`.

---

## 5. API Overview (REST, JSON)

| Area | Endpoints (examples) |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email` |
| Catalog | `GET /api/courses`, `GET /api/courses/:slug` |
| Checkout | `POST /api/checkout/order`, `POST /api/webhooks/cashfree` |
| Student | `GET /api/me/enrollments`, `/me/attendance`, `/me/announcements`, `/me/orders`, `POST /api/lessons/:id/complete` |
| Instructor | `GET /api/instructor/batches`, `POST /api/sessions/:id/attendance` |
| Admin | `/api/admin/users`, `/courses`, `/batches`, `/sessions`, `/enrollments`, `/orders`, `/refunds`, `/coupons`, `/attendance`, `/announcements`, `/reports/*`, `/settings`, `/audit-logs` |

Standard response: `{ data, error, meta: { page, pageSize, total } }`. Use HTTP status codes correctly (401, 403, 404, 422, 429).

---

## 6. Key Workflows

**6.1 Purchase flow**
1. User selects course → (login/register) → checkout → apply coupon.
2. Server creates `Order(PENDING)` + Cashfree order.
3. User pays → Cashfree webhook → signature verified → `Order=PAID`, `Enrollment` created (idempotent), email sent.
4. User redirected to My Courses.

**6.2a Recorded-lecture attendance flow (v1)**
1. Enrolled student opens a lesson → YouTube player loads (video ID served only after enrollment check).
2. Player events send watch progress to the server every ~15 s.
3. When watched ≥ threshold, the lesson is marked `attended` (`source=auto`) and progress/attendance % are recalculated.
4. When attendance % ≥ course threshold (and progress rule met), the certificate is generated and emailed.

**6.2b Manual attendance flow (Phase 2)**
1. Instructor opens today's session → sees enrolled students.
2. Marks statuses → Submit → stored with `markedById`, timestamp.
3. Student sees updated percentage; if below threshold, alert is queued.

**6.3 Announcement flow**
1. Admin creates announcement → chooses audience & schedule.
2. At `publishAt`, scheduler resolves recipients → creates notifications → queues emails.
3. Students see it in feed; opening marks as read.

---

## 7. UI / UX Requirements
- Mobile-first, responsive layouts; admin tables must be usable on tablet.
- Admin panel: left sidebar navigation, global search, data tables with sorting/filtering/pagination, confirmation dialogs for destructive actions.
- Light theme default, dark mode optional `[C]`.
- **Branding:** navy blue (primary: headers, sidebar, buttons), light blue (secondary: highlights, cards, links), orange (accent: CTAs, badges, progress). Define as design tokens in Tailwind config (suggested starting values: navy `#0B1F4B`, light blue `#4FA3E0`, orange `#F57C00`; replace with exact brand hex codes when supplied). Ensure text contrast meets WCAG AA.
- Loading skeletons, empty states, and clear error messages.
- Forms: inline validation, disabled submit while pending, toast notifications.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Public pages LCP < 2.5 s on 4G; API p95 < 500 ms; admin tables paginated server-side |
| **Scalability** | Sized for ~100 students in year 1 (design headroom to ~2,000); one small app instance + managed Postgres is sufficient; keep app servers stateless |
| **Security** | HTTPS only; OWASP Top 10 mitigations; CSRF protection; secure, httpOnly cookies; CSP headers; RBAC on every endpoint; input sanitization for rich text (XSS); signed URLs for media; rate limiting |
| **Privacy** | Collect minimum PII; comply with India DPDP Act; account deletion/export on request; privacy policy and consent at signup |
| **Reliability** | 99.5% uptime target; daily DB backups, 30-day retention; tested restore |
| **Availability of payments** | Webhook retries handled; reconciliation report for mismatched orders |
| **Maintainability** | TypeScript strict mode; ESLint + Prettier; ≥70% coverage on `/server` services |
| **Accessibility** | WCAG 2.1 AA for core flows |
| **Compatibility** | Latest 2 versions of major browsers; iOS Safari and Android Chrome |
| **Auditability** | All admin mutations logged and immutable |
| **Observability** | Structured logs, error tracking (Sentry), health endpoint `/api/health` |

---

## 9. Security & Compliance Checklist
- [ ] Passwords hashed (argon2/bcrypt), min length 8
- [ ] Email verification and secure reset tokens (single use, expiring)
- [ ] RBAC middleware on `/admin` (Super Admin + scoped Instructor) and `/api/admin/*`; instructors restricted to own courses
- [ ] Webhook signature verification and idempotency keys
- [ ] File upload type/size validation; virus scan `[C]`
- [ ] Rich-text sanitized on save and render
- [ ] No sensitive data in logs; PII access limited to admins
- [ ] Terms, Privacy, Refund policy pages live before launch

---

## 10. External Interfaces
| System | Purpose |
|---|---|
| Cashfree | Payments, refunds, webhooks |
| Google OAuth | Social login |
| YouTube IFrame API / Data API | Video playback, progress events, optional playlist import |
| S3/R2 | Document, thumbnail and certificate storage |
| SMTP / Resend | Email |
| Zoom / Google Meet `[C]` | Live class links, attendance auto-capture |
| WhatsApp / SMS provider | Announcement delivery (configured, **disabled at launch**) |

---

## 11. Out of Scope (v1)
Live/offline batch UI (Phase 2), native mobile apps, multi-language UI, multi-currency, marketplace for third-party instructors with payouts, proctored exams, built-in live video conferencing, affiliate program.

---

## 12. Acceptance Criteria (high level)
1. A visitor can register, buy a course via Cashfree (sandbox), and immediately access its content.
2. A student cannot access any lesson or media URL of a course they have not purchased.
3. Watching a lesson past the threshold auto-marks it attended and updates the student's attendance %; an instructor sees attendance only for their own courses.
3a. A certificate is issued only when the student meets the configured minimum attendance (and progress rule, if enabled).
4. A Super Admin can create, edit, suspend, and role-change users and instructors; all changes appear in the Audit Log.
5. An announcement targeted to a single batch is received only by students in that batch, via in-app and email.
6. Admin dashboard shows correct revenue and enrollment figures matching the Orders list.
7. Refund via admin updates order status and (optionally) revokes enrollment.
8. All **Must** requirements pass automated or documented manual tests.

---

## 13. Seed Data (for `prisma db seed`)
- 1 Super Admin (`admin@example.com`, password from env at seed time — force change on first login)
- 1 Instructor, 5 Students
- 2 Categories, 3 Courses (modules + lessons), 1 Batch with 6 Sessions
- 2 Coupons, sample orders/enrollments, sample attendance, 3 announcements

---

## 14. Delivery Milestones (build in this order)

| # | Milestone | Scope |
|---|---|---|
| 1 | **Foundation** | Project setup, DB schema, auth, RBAC, layouts, seed |
| 2 | **Catalog & Admin Courses** | Public catalog, course detail, admin course/module/lesson CRUD, media upload |
| 3 | **Checkout & Enrollment** | Cart, coupons, Cashfree, webhook, enrollments, orders, invoices, student dashboard + player |
| 4 | **User Management** | Admin user CRUD, suspend, roles, manual enrollment, audit log |
| 5 | **Attendance & Certificates** | Auto lesson-based attendance, thresholds, student view, exports, alerts, certificates (batches/sessions built but flagged off) |
| 6 | **Announcements & Notifications** | Targeting, scheduling, email queue, in-app feed |
| 7 | **Reports & Settings** | Dashboard KPIs, reports, site settings, CMS pages |
| 8 | **Hardening & Launch** | Tests, security review, performance, SEO, backups, deployment |

**Definition of Done (each milestone):** features meet SRS IDs listed, tests pass, no lint/type errors, permissions verified, CHANGELOG updated.

---

## 15. Decisions Log & Remaining Questions

**Resolved (see A1.1):** recorded lectures only; Cashfree; YouTube hosting; configurable attendance threshold for certificates; Super Admin > Instructor > Student; WhatsApp/SMS configurable but off; ~100 students; navy/light-blue/orange branding.

**Still open (defaults used meanwhile):**
1. Is the business GST-registered? (GST fields stay hidden until enabled.)
2. Exact brand hex codes, logo, and domain name.
3. Should instructors be allowed to publish courses themselves, or only Super Admin? (Default: Super Admin approves.)
4. Is YouTube link-sharing risk acceptable, or should paid content move to a protected host later?
5. Default certificate attendance threshold (default 75%) and lesson watch threshold (default 80%).
6. Certificate design/signature and wording.
7. Refund policy terms (days, conditions).
8. Preferred WhatsApp/SMS provider when you decide to enable it.
---

*Document version 1.1 (owner decisions applied) — maintain this file as the single source of truth; update requirement IDs when scope changes.*
