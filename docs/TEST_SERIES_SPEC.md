# Test Series Engine Specification (Phases 8–15)

## 1. Overview
The SmartNuM Test Series Engine allows administrators to author or import Computer-Based Tests (Full Mocks, Chapter Tests, Sectional Tests, and Free Diagnostic Mocks), attach them to Test Series products, and evaluate student attempts with a server-authoritative timer, auto-submission, and comprehensive score analytics.

---

## 2. Core Architecture & Database Models

### 2.1 Enums
- `TestType`: `FULL_MOCK`, `CHAPTER`, `SECTIONAL`, `DIAGNOSTIC`
- `TestStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `QuestionType`: `MCQ_SINGLE`, `MCQ_MULTI`, `NUMERIC`, `TRUE_FALSE`
- `AttemptStatus`: `IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`
- `ResultMode`: `INSTANT`, `AFTER_WINDOW`, `MANUAL`
- `SolutionMode`: `AFTER_SUBMIT`, `AFTER_WINDOW`, `NEVER`
- `LateStartRule`: `REDUCE_TIME`, `FULL_TIME`
- `AssignmentSource`: `ADMIN_GRANT`, `FREE_PREVIEW`

### 2.2 Models
1. **`Test`**:
   - `seriesId` references `Course(id)` where `productType = TEST_SERIES`
   - `code` unique per series (e.g. `JEE-MOCK-01`)
   - `durationMin`, `opensAt`, `closesAt`, `lateStartRule`, `graceSeconds` (default 10s)
   - `maxAttempts` (default 1, 0 = unlimited)
   - `requireFullscreen` (degrades gracefully on iOS)
   - `maxViolations` (default 0 = disabled)
   - `totalMarks` (computed sum of question marks)

2. **`TestSection`**:
   - `name`, `order`, optional `durationMin` (locks section when time expires), optional `maxToAttempt` (choice rule e.g. 5 of 10)

3. **`Question`**:
   - `code` (stable unique ID for re-import updates)
   - `version` (default 1), `parentId` (for versioning)
   - `isLocked` (locked once any submitted attempt uses it)
   - `createdById` (instructor ownership)
   - `stem`, `stemImage`, `options` (JSON), `correct` (JSON), `explanation`, `solutionImage`
   - Stems & explanations sanitized on save and render

4. **`TestQuestion`**:
   - Bridge table between `Test`, `TestSection`, and `Question`
   - `order`, `marks`, `negMarks`, `partialMarking`

5. **`Attempt`**:
   - `testId`, `userId`, `enrollmentId`, `attemptNo`
   - `startedAt`, `deadlineAt`, `submittedAt`, `seed`
   - `score`, `correctCount`, `incorrectCount`, `unattemptedCount`, `rank`, `percentile`
   - `violations`, `extraTimeMin`
   - Unique partial index on Postgres: `(testId, userId) WHERE status = 'IN_PROGRESS'`

6. **`AttemptSection`**:
   - Tracks per-section start and lock times: `startedAt`, `lockedAt`, `timeSpentSec`

7. **`AttemptAnswer`**:
   - `response` (JSON), `state` (5 CBT states: `NOT_VISITED`, `NOT_ANSWERED`, `ANSWERED`, `MARKED`, `ANSWERED_MARKED`), `timeSpentSec`

8. **`AttemptViolation`**:
   - Records only integrity violations (`TAB_BLUR`, `FULLSCREEN_EXIT`), no autosave/heartbeat noise

9. **`TestAssignment`**:
   - Dedicated for `ADMIN_GRANT` and `FREE_PREVIEW` only. Standard purchases use `Enrollment`.

10. **`ImportJob`**:
    - Stores file metadata, admin actor, and JSON report of created, updated, and skipped questions.

---

## 3. Server-Authoritative Timing & Deadline Formulas

When a student starts an attempt at `startedAt = now`:
1. **Nominal Duration**:
   $$\text{nominalDeadline} = \text{now} + (\text{test.durationMin} + \text{extraTimeMin}) \times 60 \times 1000$$
2. **Without Live Window (`test.closesAt == null`)**:
   $$\text{deadlineAt} = \text{nominalDeadline}$$
3. **With Live Window (`test.closesAt != null`)**:
   - If $\text{now} \ge \text{closesAt}$: Rejected (`EXAM_WINDOW_CLOSED`).
   - If $\text{test.lateStartRule} = \text{REDUCE_TIME}$:
     $$\text{deadlineAt} = \min(\text{nominalDeadline}, \text{test.closesAt})$$
   - If $\text{test.lateStartRule} = \text{FULL_TIME}$:
     $$\text{deadlineAt} = \text{nominalDeadline}$$
4. **Grace Buffer**:
   Server accepts submission up to $\text{deadlineAt} + \text{graceSeconds}$ (default 10 seconds) to accommodate network latency.

---

## 4. Rank Calculation & Tie-Breaking Rules
Leaderboard ranks are sorted by:
1. `score DESC` (Higher total score)
2. `correctCount DESC` (Higher accuracy)
3. `incorrectCount ASC` (Fewer penalties)
4. `(submittedAt - startedAt) ASC` (Faster completion)
5. `startedAt ASC` (Earlier participant)

Database query index:
`@@index([testId, status, score, correctCount, incorrectCount])`

---

## 5. Question Versioning & Ownership Security
1. **Immutability & Locking**:
   - Once a question is part of any submitted attempt (`Attempt.status IN ('SUBMITTED', 'AUTO_SUBMITTED')`), it is marked `isLocked = true`.
   - Editing a locked question creates a new `Question` record with `version = version + 1` and `parentId = old.id`.
2. **Re-Evaluation vs Editing**:
   - Erroneous answer keys are corrected strictly via the **Re-evaluate Tool**, which updates the test score history without breaking old attempts.
3. **Ownership on Imports**:
   - During Excel/CSV import, an update to an existing `question_code` is permitted only if `createdById == actorId` or if the actor is `SUPER_ADMIN`.

