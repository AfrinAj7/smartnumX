# Changelog

## Unreleased

- **Archived Courses & Test Series Discovery & 1-Click Restore**:
  - Identified soft-deleted and archived courses in PostgreSQL (`deletedAt != null` or `status = ARCHIVED`).
  - Added dedicated `📦 Archived` tab to `/admin/courses` displaying total archived counts and items.
  - Implemented `restoreCourse(id)` service and `POST /api/admin/courses/[id]/restore` endpoint that resets `deletedAt: null` and restores course status to `DRAFT`.
  - Added green `↺ Restore to Draft` action button to restore any archived course/test series with a single click.
- **Negative Marking & Flexible Marking Scheme Management**:
  - Added negative marking configuration to the admin Test Builder (`/admin/tests/[id]`).
  - Implemented `⚙️ Marking Scheme & Negative Marks` modal allowing admins to bulk configure positive marks and toggle negative marking ON/OFF (setting 0 penalty for Board exams or custom negative penalty like -1 for JEE).
  - Added scope selection to apply marking scheme changes across the entire test or a specific section.
  - Added inline question marks editor allowing instant click-to-edit for any question's marks and negative penalty.
  - Updated backend scoring engine (`scoreQuestionResponse`), recalculating total test marks dynamically upon marks adjustment.
- **Batches Navigation & Catalog Restructuring**:
  - Replaced "Courses" dropdown in the desktop and mobile navigation with a unified "Batches" dropdown mega menu.
  - Added prominent "View all batches" CTA in the Batches dropdown header, spotlight card, and mobile drawer.
  - Created first-class `/batches` catalog page and dynamic `/batches/[slug]` detail page with full schema.org metadata and batch enrollment flows.
  - Added clean Next.js server redirects from `/courses` -> `/batches` and `/courses/[slug]` -> `/batches/[slug]`.
  - Updated all cart, checkout, dashboard, orders, and footer links to point to `/batches`.
- **Demo Test Series & Tests Cleanup**:
  - Purged all seeded demo mock tests and test series from the database while preserving real user test series and questions.
  - Cleaned seed scripts (`seed-products.mjs` and `seed-tests.mjs`) to prevent demo test series from re-populating.
  - Updated Test Series navigation menus and catalog CTAs to point only to active test series.
- **Question Bank Pagination & Verification**:
  - Added 20-item-per-page pagination with jump-to-page, prev/next, and total count to the admin Question Bank view.
  - Fixed phone schema regex and default contact number validation.


- Started Phase 1 with a Next.js App Router and TypeScript scaffold.
- Added the initial PostgreSQL/Prisma domain schema and shared role-check helpers.
- Added baseline SmartNum brand tokens and implementation phase tracking.
- Added hashed email-verification and password-reset tokens, credential lockout, Auth.js credentials and optional Google sign-in, and Resend HTTPS mail delivery.
- Added sign-up, sign-in, verification, password recovery, first-login password change, and role-protected learner/admin workspace routes.
- Grouped shared UI under `src/web-client`, admin views under `src/admin`, and kept business services under `src/server`.
- Added repeatable environment-driven sample seed data and architecture/setup documentation.
- Added five-attempt credential lockout tests, forced first-login password change, and server-side role/status refresh.
- Upgraded Vitest to the compatible patched release and pinned patched PostCSS; documented remaining upstream dependency advisories.
- Comprehensive SmartNum marketing landing page complete with sticky navigation, mathematics hero carousel, interactive Why SmartNum tabs/mobile accordion, programmes & curricula cards, YouTube facade video gallery, demo lead capture, FAQ accordion with JSON-LD schema, and dedicated Indirapuram Visit Us location block with Google Maps embed.
- Full SmartNum branding and contact integration: Indirapuram address (04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014), phones (9958966823), email (gosmartnum@gmail.com), WhatsApp, Instagram, Facebook, YouTube, and LinkedIn profiles.
- Admin Panel Site Content Editor (`/admin/site-content`) with S3 presigned upload support for hero images, curriculum images, tutor photos, and MP4 demo videos. S3 variables (`S3_ENDPOINT`, `S3_PUBLIC_URL`) documented in `.env.example` and `ARCHITECTURE.md`.
- Buy Flow Phase 2: Extended Prisma schema with `ProductType` (`COURSE`, `TEST_SERIES`), `ProductMode` (`ONLINE`, `PHYSICAL`, `BOTH`), `Centre` model for physical coaching centers, hierarchical `Category` tree with parent-child relations, and extended course product metadata (seat caps, real-time seats left, test series counts, validity, free flag, syllabus/mock inclusions). Seeded full product catalog and coupons.
- Buy Flow Phase 3: Redesigned header with categorized Courses dropdown (School & Board Tuition vs Competitive Pathways) and interactive two-column Test Series Mega-Menu (left category tabs, dynamic right flyout, badges, mobile accordion, no NEET entries). Added "My Purchases & Access" to user dropdown.
- Buy Flow Phase 4: Implemented Course and Test Series listing and detail pages (`/courses`, `/courses/[slug]`, `/test-series`, `/test-series/[slug]`).
  - Created interactive Dual-Mode Course Detail with Online vs Physical (Offline) toggle, centre selector, and real-time seat availability countdown.
  - Created Test Series catalog and detail views with test breakdown (Full Mocks, Chapter Drills, Video Solutions), CBT simulator tags, sample test preview, rank/percentile analysis features, and test schedule.
  - Built unified `BuyButtons` client component supporting instant "Buy Now" (direct to `/checkout`), "Add to Cart", and 1-click free enrollment for diagnostic tests (`/api/free-enroll`).
  - Added responsive design and styling via `src/app/catalog-flow.css`.
- Buy Flow Phase 5: Cart, Checkout, and Payment Integration (Test Mode).
  - Extended `getCart()` with productType, delivery mode, centre name, remaining seats, and test series mock counts.
  - Built dedicated Coupon Validation Engine (`src/server/coupons/coupon-service.ts`) and API (`/api/coupons/validate`) with expiry, usage limits, minimum cart value, and product-type scope checks.
  - Redesigned `/cart` with SmartNum orange branding, product-aware cards (Tuition Programme vs Test Series), live coupon apply/remove, and seamless transition to checkout.
  - Built comprehensive `/checkout` view featuring Student & Academic details form (Name, WhatsApp Phone, Email, Target Class, City/Centre), simulated payment mode selector (UPI, Cards, NetBanking), and instant payment success/failure simulation.
  - Added atomic physical batch seat-decrement protection in `demo-payment-service.ts` to prevent overselling of physical coaching classroom seats.
  - Enhanced Order Confirmation (`/orders/[id]`) with product-specific badges, item breakdowns, invoice display, and direct portal navigation.
- Buy Flow Phase 6: Post-Purchase Entitlements, "My Purchases" Access, and Email Receipts.
  - Implemented `checkUserCourseAccess(userId, courseIdOrSlug)` in `enrollment-service.ts` to enforce active enrollment gating on courses and test series.
  - Extended `listUserEnrollments` to surface product type, mode, offline centre, validity, and mock counts.
  - Built full `StudentDashboardView.tsx` with student greeting, quick metrics (active enrollments, courses, mock test packs), category tabs (`All`, `Tuition Courses`, `Test Series`), and direct action buttons ("Start Learning" / "Attempt Tests").
  - Connected `/dashboard` and `/dashboard/my-courses` to load real active enrollments and order histories.
  - Updated `WorkspaceShell` navigation with "My Purchases & Access", tuition programmes, order history, and direct catalog links.
  - Added automated order receipt dispatch (`sendOrderReceiptEmail`) via SMTP/Resend with console fallback upon payment completion.
- Buy Flow Phase 7: Admin Panel Management, Coupon Administration, and Production Readiness.
  - Upgraded Course Management in Admin Panel (`/admin/courses` and `CourseManagementView.tsx`) to support full CRUD for both Tuition Courses and Test Series packages.
  - Added management of delivery mode (Online vs Physical), offline coaching centre selection, classroom capacity and live remaining seats countdown, test breakdown metrics (Full Mocks, Chapter Drills), promotional badges, and free diagnostic flags.
  - Added dedicated Coupon & Voucher Management (`/admin/coupons` and `CouponManagementView.tsx`) with percentage/flat discounts, minimum cart values, usage caps, product-type targeting, and expiry controls.
  - Added "Courses & Test Series" and "Coupons & Vouchers" to `adminNavigation` in `WorkspaceShell.tsx`.
  - Verified 0 TypeScript compilation errors, 0 ESLint errors, 29/29 passing unit tests, and successful Next.js production build (`next build`) generating all 47 routes.

## [Phase 14] - 2026-11-08
### Added
- **Comprehensive Test Analytics Engine (`src/server/tests/analytics-service.ts`)**:
  - `getTestComprehensiveAnalytics`: Computes real-time examination psychometrics including total completions, in-progress attempts, completion rate %, batch average score, topper score, lowest score, median score, standard deviation, and cutoff pass rate %.
  - 5-bucket Score Distribution histogram (0-20%, 21-40%, 41-60%, 61-80%, 81-100%).
  - Subject-wise and Section-wise performance benchmarks (average marks, accuracy %, average time).
  - Question-by-Question Item Analysis (Psychometrics): Facility index (% correct / difficulty level), attempt rate %, average time spent, discrimination index (correlation between top 27% and bottom 27% cohorts), option frequency distribution, and most common mistake/distractor.
  - Proctoring Integrity metrics: total violations, tab blurs count, fullscreen exits count, and high-risk flagged attempts.
  - CSV Export functions: `generateTestResultsCsv` (complete leaderboard and candidate results) and `generateQuestionItemAnalysisCsv` (item difficulty and discrimination metrics).
- **Server-Authoritative Re-Evaluation Engine (`src/server/tests/reevaluation-service.ts`)**:
  - `reevaluateTest`: Re-evaluates all historical submitted attempts in chunks (50 attempts per batch) to respect shared hosting memory and connection constraints.
  - Supports 4 re-evaluation actions: `KEY_CHANGE` (replace correct key), `ACCEPT_MULTIPLE` (accept alternative valid options), `BONUS_MARKS_ALL` (award full positive marks to all candidates for disputed items), and `DROP_QUESTION` (exclude question and adjust test total marks).
  - Recalculates individual `AttemptAnswer` marks/correct status, overall `Attempt` scores, and automatically runs `calculateTestRanksAndPercentiles` to adjust ranks and percentiles.
  - Records detailed audit logs in `AuditLog` with before/after state and mandatory reason.
- **Candidate Attempt & Integrity Management (`src/server/tests/reevaluation-service.ts`)**:
  - `listTestAttempts`: Paginated candidate attempts list with search, status filtering, and violation filters.
  - `resetStudentAttempt`: Allows administrators to manage student attempts via `ALLOW_REATTEMPT` (wipes attempt for fresh retry), `REOPEN_IN_PROGRESS` (reopens attempt with compensatory minutes), and `ADD_TIME` (extends active deadline). Fully audit-logged.
- **API Endpoints**:
  - `GET /api/admin/tests/[id]/analytics`: Comprehensive analytics JSON payload.
  - `GET /api/admin/tests/[id]/analytics/export`: Downloads candidate results or question analysis CSV.
  - `POST /api/admin/tests/[id]/reevaluate`: Executes test re-evaluation.
  - `GET /api/admin/tests/[id]/attempts`: Paginated list of attempts with proctoring violation logs.
  - `POST /api/admin/tests/[id]/attempts/[attemptId]/reset`: Reset, reopen, or extend candidate attempt.
- **Admin UI in Test Builder (`src/admin/views/TestBuilderView.tsx`)**:
  - Integrated 3 new tabs: `📊 Analytics & Insights`, `⚖️ Re-evaluation Engine`, and `🛡️ Student Attempts & Integrity`.
  - Built `TestAnalyticsView.tsx` with KPI overview, visual score distribution bars, subject benchmarks, psychometric item analysis table, and 1-click CSV download buttons.
  - Built `TestReevaluationView.tsx` with interactive question selector, current key preview, rule selector, mandatory audit reason, and live re-evaluation summary card.
  - Built `TestAttemptsView.tsx` with candidate attempts table, expandable violation timeline drawers (`TAB_BLUR`, `FULLSCREEN_EXIT`), and "Manage Attempt" modal.
- **Testing & Quality Assurance**:
  - Added unit test suites `src/server/tests/analytics-service.test.ts` and `src/server/tests/reevaluation-service.test.ts`.
  - 13/13 test files passing, 65/65 unit tests passing.
  - Clean TypeScript compilation (`tsc --noEmit`), 0 ESLint errors/warnings, and successful Next.js production build (`next build`) generating 53 routes.

## [Phase 13] - 2026-11-08
### Added
- **Access Control & Automatic Entitlements Engine (`src/server/tests/assignment-service.ts`)**:
  - `assignTestToStudent`: Upserts direct `TestAssignment` records (`ADMIN_GRANT` or `FREE_PREVIEW`) with optional validity expiry and writes audit logs.
  - `bulkAssignTest`: Accepts lists of emails or user IDs, resolves student accounts, creates direct assignments, reports granular success/failed counts, and audits grants.
  - `revokeTestAssignment`: Removes direct grants with audit tracking.
  - `listTestAssignments`: Searchable admin list of directly assigned students with live attempt counts, best scores, and latest attempt states.
  - `getTestSeriesTestsForStudent`: Resolves complete mock test curriculum for a test series with student entitlement states (`ENROLLED`, `DIRECT_ASSIGNMENT`, `FREE_PREVIEW`, or `LOCKED`) and active/submitted attempt statuses.
- **Dynamic Real-Time Test & Question Aggregations (`src/server/courses/course-service.ts`)**:
  - `getPublicProductBySlug` and `listPublicTestSeries` now dynamically count real `PUBLISHED` tests in PostgreSQL:
    - Real full mocks count (`FULL_MOCK`)
    - Real chapter drills count (`CHAPTER_TEST`, `SECTIONAL`)
    - Real question count aggregated across all test questions
    - Gracefully falls back to course metadata columns when no tests are authored yet.
- **Admin Direct Grants Management UI & API (`src/admin/views/TestBuilderView.tsx` & `/api/admin/tests/[id]/assignments`)**:
  - Added tabbed interface in Test Builder: "Sections & Questions" vs "Direct Student Grants & Access".
  - Bulk grant form allowing administrators to paste student emails or IDs with optional expiration date and grant source.
  - Searchable table displaying student name, email, phone, grant type, validity, attempt count, best score, and one-click revocation.
- **Student Test Series Curriculum & Live Attempt Dashboard (`src/app/test-series/[slug]/page.tsx` & `TestSeriesDetailClient.tsx`)**:
  - Replaced static syllabus with real published mock tests.
  - Displays test type badges, specs (Mins, Marks, Questions), and access status (🆓 Free Preview, 🔓 Unlocked, 🔒 Locked).
  - Contextual action buttons:
    - "Resume Test ⏱️" for active in-progress exams (`/tests/[testId]/attempt/[attemptId]`).
    - "Scorecard 📊" and "Solutions 💡" for submitted attempts (`/tests/[testId]/result/[attemptId]` and `/solutions/[attemptId]`).
    - "Re-take Mock ↺" when allowed by `maxAttempts`.
    - "Attempt Free Preview 🚀" or "Start Test 🚀" (`/tests/[testId]/instructions`).
    - "Enroll to Unlock 🔒" / "Sign In to Unlock 🔒" with smooth scroll to pricing.
- **Comprehensive Unit Tests (`src/server/tests/assignment-service.test.ts`)**:
  - 7 unit tests covering single assignment, bulk assignment with invalid email handling, grant revocation, enrolled student access, free preview access, and direct grant recognition.

## [Phase 12] - 2026-11-08
### Added
- **Automated Scoring Engine (`src/server/tests/scoring-service.ts`)**:
  - Deterministic evaluation function `scoreQuestionResponse` supporting all question types:
    - Single-choice MCQs (`+marks` / `-negMarks` / `0` for unattempted).
    - Multi-choice MCQs with standard JEE Advanced partial marking (`+marks` if all correct without errors; fractional positive marks if subset of correct options chosen with `partialMarking: true`; negative marks if any incorrect option is picked).
    - Numerical Value questions with exact matches or customizable numeric tolerance bounds (`min`/`max` or `tolerance`).
    - True / False binary questions.
  - Section Choice Rule Enforcement: automatically caps evaluation to `maxToAttempt` (e.g. "Attempt any 5 of 10"), scoring the first eligible questions in question order and ignoring surplus attempts.
  - Transactional persistence: updates individual `AttemptAnswer` records (`isCorrect`, `marksAwarded`) and aggregates overall `Attempt` totals (`score`, `correctCount`, `incorrectCount`, `unattemptedCount`).
- **Competitive Ranking & Percentile Engine (`calculateTestRanksAndPercentiles`)**:
  - Computes competitive All-India Rank (AIR) and percentiles across all submitted attempts for each test.
  - Standardized multi-tier tie-breaking rules:
    1. Higher total score
    2. Fewer negative marks (lower incorrect count / higher accuracy)
    3. Higher subject priority score (Mathematics > Physics > Chemistry)
    4. Lower total time spent
    5. Earlier submission timestamp
- **Student Performance Analytics (`/tests/[testId]/result/[attemptId]`)**:
  - `ExamResultView.tsx`: Displays candidate score, max marks, percentage, pass/fail status, AIR rank, percentile, overall accuracy %, and time spent.
  - Comparative Peer Benchmarking: Student score vs Batch Average score vs Batch Topper score.
  - Subject-wise performance table: Questions count, Attempted, Correct, Incorrect, Marks Scored, Max Marks, Accuracy %, and Time spent per subject.
  - AI-ready Topic Insights: Categorizes topics into Strong Areas (&ge; 70% accuracy) and Weak / Focus Topics (< 50% accuracy).
- **Detailed Step-by-Step Solutions (`/tests/[testId]/solutions/[attemptId]`)**:
  - `ExamSolutionsView.tsx`: Interactive question-by-question review interface.
  - Status filters: `All`, `Correct`, `Incorrect`, and `Unattempted`.
  - Rich question cards showing candidate response, verified correct key, step-by-step LaTeX explanation (`MathText`), and solution diagram graphics.
  - Visibility controls respecting test `resultMode` (`IMMEDIATE`, `AFTER_WINDOW`, `MANUAL`) and `solutionMode` (`IMMEDIATE`, `AFTER_WINDOW`, `NEVER`).
- **REST APIs**:
  - `GET /api/tests/[testId]/attempt/[attemptId]/result`
  - `GET /api/tests/[testId]/attempt/[attemptId]/solutions`
- **Testing & Verification**:
  - Comprehensive unit test suite `src/server/tests/scoring-service.test.ts` verifying all scoring algorithms and tie-breaking rank calculations (48/48 unit tests passing across 10 test suites).
  - 0 TypeScript compiler errors (`tsc --noEmit`), 0 ESLint errors/warnings (`next lint`), and successful Next.js production build (`next build`) generating 53 routes.

## [Phase 11] - 2026-11-08
### Added
- **Student CBT Exam Player & Server-Authoritative Timer (`/tests/[testId]/attempt/[attemptId]`)**:
  - Full NTA / JEE-style Computer-Based Testing user interface (`CbtPlayerView.tsx`).
  - Top examination header with Test Code, Test Title, candidate details, server countdown clock (HH:MM:SS), and Submit Exam trigger.
  - Multi-subject / section tabs (e.g. Physics, Chemistry, Mathematics, Aptitude) with question counts.
  - Question rendering panel powered by `MathText` (KaTeX LaTeX formulas) and optional diagram support.
  - Interactive inputs tailored to question type: single-choice radio options, multi-select checkboxes, numerical value input, and True/False toggles.
  - Standard CBT navigation actions: "Save & Next" (Green), "Mark for Review & Next" (Purple), "Clear Response", "Previous", and "Next".
  - Right-side Question Palette with live counts across all 5 official NTA states:
    - `ANSWERED` (Green)
    - `NOT_ANSWERED` (Orange/Red)
    - `MARKED` (Purple)
    - `NOT_VISITED` (Gray)
    - `ANSWERED_MARKED` (Purple with green evaluated indicator)
  - Interactive number grid allowing instant jumping to any question within the active section.
  - Examination Summary & Submission Confirmation Modal displaying section-by-section breakdown (Total, Answered, Unanswered, Marked, Not Visited).
  - Post-submission candidate confirmation view with test summary and navigation links.
- **Pre-Exam Instructions & Candidate Declaration (`/tests/[testId]/instructions`)**:
  - `ExamInstructionsView.tsx`: Displays official examination rules, duration, markings, negative markings, test series lock status, and candidate details.
  - Interactive mandatory candidate declaration checkbox before unlocking the "Start Examination" button.
- **Backend Exam Engine (`src/server/tests/exam-service.ts`)**:
  - `checkTestAccess`: Strict enrollment gating verifying active purchase in the parent test series or free preview permission.
  - `startOrResumeAttempt`: Server-authoritative timer logic calculating exact deadlines according to `lateStartRule` (`FULL_TIME` vs `REDUCE_TIME`) and auto-resuming existing active attempts.
  - `getAttemptExamBundle`: Critical security measure that sanitizes the question payload, strictly omitting `correct` answers, `explanation`, and `solutionImage`.
  - `saveStudentAnswer`: Real-time optimistic response persistence with auto-submit protection on deadline expiry.
  - `logViolation`: Records integrity breaches (`TAB_BLUR`, `FULLSCREEN_EXIT`) and auto-submits upon exceeding `maxViolations`.
  - `submitExamAttempt`: Concludes the attempt and marks all participating questions as `isLocked = true` to preserve historical integrity.
- **Testing & Verification**:
  - Unit tests in `src/server/tests/exam-service.test.ts` verifying access control, question sanitization, violation tracking, and immutability locking (37/37 passing).
  - 0 TypeScript compilation errors (`tsc --noEmit`), 0 ESLint errors (`next lint`), and clean Next.js production build (`next build`) generating 53 routes.

## [Phase 10] - 2026-11-07
### Added
- **Excel & CSV Bulk Question Importer (`/admin/questions`)**:
  - Downloadable official spreadsheet template (`public/templates/Question_Import_Template.xlsx`) with `Tests`, `Sections`, and `Questions` sheets.
  - Multi-sheet and single-sheet CSV/Excel parser supporting batch creation of tests, sections, and questions in a single upload.
  - Optional ZIP archive upload for question diagrams and solution graphics, with zip-slip prevention and secure image extraction.
  - Dry-Run Validation Engine (`/api/admin/questions/import/dry-run`): validates row-by-row syntax, question types, MCQ option sets, numeric tolerance ranges, and returns an interactive error report with exact row numbers and fix advice.
  - Immutability & Ownership Enforcement: protects questions with student attempts by automatically creating a branched version (`v2`) on re-import.
  - One-click Ingestion Execution (`/api/admin/questions/import/execute`): logs import metadata in `ImportJob` table, creates questions, maps them to tests/sections, and automatically recalculates test total marks.
- **Unit Testing**:
  - Added comprehensive test suite `src/server/tests/import-service.test.ts` (31/31 unit tests passing across all suites).

## [Phase 9] - 2026-11-07
### Added
- **Question Bank View & Management (`/admin/questions`)**:
  - Full Question Bank UI with real-time search, taxonomy filters (Subject, Chapter, Type, Difficulty), and KaTeX LaTeX mathematical rendering.
  - Question Preview Drawer showing rendered stems, options, correct keys, and step-by-step explanations.
  - Manual Question Authoring & Editing Modal with live KaTeX preview, support for single-choice MCQs, multi-choice MCQs, numerical tolerances (min/max), and True/False.
  - Enforced Question Versioning: locked questions or questions with submitted student attempts automatically branch to a new version row (`v2`) with `parentId` linkage.
- **Test Management & CBT Builder (`/admin/tests` & `/admin/tests/[id]`)**:
  - Test list view with duration, marks, pass marks, attempt limits, late start rules, and publishing status.
  - Section builder with section timers and choice rules (`maxToAttempt`, e.g. "Attempt any 5 of 10").
  - Question Bank Picker: search and allocate questions directly from the question bank into sections with custom marks and negative marks.
- **Admin Navigation**:
  - Added "Question Bank" (`/admin/questions`) and "Tests & CBT Mocks" (`/admin/tests`) to the Admin Workspace navigation.
- **Backend Services & APIs**:
  - `src/server/tests/question-service.ts` & `src/server/tests/test-service.ts`
  - REST endpoints: `GET/POST /api/admin/questions`, `GET/PUT/DELETE /api/admin/questions/[id]`, `GET/POST /api/admin/tests`, `GET/PUT/DELETE /api/admin/tests/[id]`, sections & test-questions handlers.
- **Math & LaTeX Rendering**:
  - Installed `katex` and built `MathText.tsx` for inline `$formula$` and display `$$formula$$` rendering.

## [Phase 8] - 2026-11-07
### Added
- **Test Series Architecture & Specification (`docs/TEST_SERIES_SPEC.md`)**:
  - Implemented all 11 user design refinements: question versioning, section timer tracking (`AttemptSection`), exact deadline formulas with `REDUCE_TIME` and `FULL_TIME`, partial unique index on active attempts, lean violation logging, graceful iOS fullscreen degradation, tie-break ranking rules, and dev-only DRAFT seeding.
- **Database Schema Models & Enums (`prisma/schema.prisma`)**:
  - Added enums: `TestType`, `TestStatus`, `QuestionType`, `AttemptStatus`, `ResultMode`, `SolutionMode`, `LateStartRule`, `AssignmentSource`, `AttemptAnswerState`, `ViolationType`.
  - Added models: `Test`, `TestSection`, `Question`, `Passage`, `TestQuestion`, `Attempt`, `AttemptSection`, `AttemptAnswer`, `AttemptViolation`, `TestAssignment`, `ImportJob`.
  - Added relations linking `User`, `Course`, `Enrollment`, and the new test series models.
- **Safe Database Migration**:
  - Executed safe, additive database sync without `--accept-data-loss`.
  - Created raw SQL partial unique index `unique_active_attempt` on `Attempt(testId, userId) WHERE status = 'IN_PROGRESS'`.
- **Phase 8 Seed Data (`prisma/seed-tests.mjs`)**:
  - Seeded sample tests marked as `DRAFT` in development:
    - `JEE-MOCK-01`: JEE Main Full Mock 1 (10 questions across Section A MCQ and Section B Numeric with choice rule).
    - `CH-ALG-01`: Quadratic Equations Chapter Test (5 questions with LaTeX expressions).
    - `DIAG-01`: Diagnostic Mock with Free Preview (`isFreePreview = true`).
  - Guarded seeding to skip in production environments.

