# Arch Quiz Platform – Multi-Instructor, Anti-Cheat, OTP-Secure System

## 1. Overview

**Arch Quiz Platform** is a multi-instructor online quiz system with:

- Modern **Arch-style quiz UI** (same theme as the original GAS app).
- **Multiple instructors**, each managing their own quizzes.
- **Multiple quizzes per instructor**.
- **Per-quiz student lists**, question banks, and configurable timing.
- **Email-based OTP verification** and **email invitations** for students.
- **Per-quiz shareable links sent via email**, mobile & desktop friendly.
- **Anti-cheat features** (fullscreen enforcement on desktop, focus/tab monitoring, suspicious event logs).
- **Real-time monitoring dashboard** for instructors.
- **Extendable architecture** based on Node.js, Next.js, and MongoDB.

---

## 2. Roles & Personas

### 2.1 Instructor

- Has an authenticated account.
- Creates and configures quizzes.
- Uploads student list and question bank.
- Sends quiz invitations (link + OTP) via email.
- Monitors live attempts and suspicious activity.
- Can force-end or extend quizzes.
- Exports results and logs.

### 2.2 Student

- Receives quiz invitation via email:
  - Quiz link.
  - One-time OTP code (or “Get OTP” flow).
- Verifies identity with OTP + email.
- Takes quiz on desktop or mobile (responsive UI).
- Subject to anti-cheat checks on desktop.

### 2.3 (Optional) System Admin

- Manages instructor accounts.
- Views platform-wide usage and logs.
- Handles system configuration (SMTP, rate limits, etc.).

---

## 3. Tech Stack

### 3.1 Backend

- **Node.js + Express** (or Next.js API routes).
- **MongoDB + Mongoose** for data persistence.
- **Nodemailer** (or equivalent) for transactional emails:
  - Quiz invitations.
  - OTP codes.
  - Optional notifications (exam ended, etc.).
- **JWT** (or NextAuth) for instructor authentication.
- **Bull / Agenda / node-cron** (optional) for scheduled jobs (e.g., reminder emails, quiz auto-close).

### 3.2 Frontend

- **Next.js + React**:
  - Server-side rendering for SEO and performance (where needed).
  - Single-page transitions for smooth UX.
- **Design**:
  - Use the **same visual style** as the existing Arch Quiz:
    - Gradient app header.
    - Rounded cards.
    - Soft shadows.
    - Muted text colors.
  - Responsive layout for **desktop, tablet, and mobile**.
  - Mobile devices:
    - Quiz fully accessible.
    - No fullscreen requirement (different UX than desktop).

### 3.3 Infrastructure

- Hosted on a Node-compatible platform (e.g., Vercel / Render / Heroku / custom).
- MongoDB Atlas (or self-hosted MongoDB).
- SMTP provider (e.g., SendGrid, Mailgun, SES, or institutional SMTP).

---

## 4. High-Level Architecture

```text
[Instructor Browser]         [Student Browser]
        |                           |
        |  (Next.js Pages/API)      |
        +------------+--------------+
                     |
            [Node.js / Express]
                     |
             [MongoDB Database]
                     |
              [SMTP / Email Service]
```

---

## 5. Data Model (MongoDB Collections)

### 5.1 `users` – Instructors (and admins)

```js
{
  _id: ObjectId,
  role: 'instructor' | 'admin',
  name: String,
  email: String,
  passwordHash: String,       // bcrypt hash
  createdAt: Date,
  updatedAt: Date
}
```

### 5.2 `quizzes`

```js
{
  _id: ObjectId,
  instructorId: ObjectId,     // ref: users._id
  title: String,
  description: String,
  slug: String,               // user-friendly identifier (optional)
  quizCode: String,           // e.g. "ARCH2025-M1"
  settings: {
    questionTimeSeconds: Number,   // per question, e.g. 35
    totalTimeSeconds: Number|null, // optional full exam duration
    startAt: Date|null,
    endAt: Date|null,
    shuffleQuestions: Boolean,
    shuffleOptions: Boolean,
    requireFullscreen: Boolean,    // desktop only
    logSuspiciousActivity: Boolean,
    allowMultipleAttempts: Boolean,
    showScoreToStudent: Boolean,   // if true, show score immediately
    mobileAllowed: Boolean,        // true by default
    requireStudentListMatch: Boolean // must be in uploaded list to start
  },
  status: 'draft' | 'published' | 'closed',
  createdAt: Date,
  updatedAt: Date
}
```

### 5.3 `questions`

```js
{
  _id: ObjectId,
  quizId: ObjectId,
  text: String,
  options: [String],         // 2–4 options
  correctIndex: Number,      // 0-based index
  order: Number,             // question order
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard' | null,
    tags: [String]
  }
}
```

### 5.4 `students`

Per-quiz student registry.

```js
{
  _id: ObjectId,
  quizId: ObjectId,
  name: String,
  email: String,
  externalId: String | null, // e.g. university ID
  metadata: Object,
  createdAt: Date
}
```

### 5.5 `quizInvites` – Invitations & OTPs

```js
{
  _id: ObjectId,
  quizId: ObjectId,
  studentId: ObjectId,        // ref: students._id
  email: String,
  otpCodeHash: String,        // hashed OTP (e.g. 6-digit numeric)
  otpExpiresAt: Date,
  lastOtpSentAt: Date,
  maxOtpAttempts: Number,     // e.g. limit OTP retries
  verifiedAt: Date|null,      // set when OTP successfully verified
  createdAt: Date
}
```

### 5.6 `attempts`

```js
{
  _id: ObjectId,
  quizId: ObjectId,
  studentId: ObjectId | null, // if matched by list
  inviteId: ObjectId | null,  // ref: quizInvites._id
  studentName: String,        // snapshot
  studentEmail: String,       // snapshot
  startedAt: Date,
  submittedAt: Date|null,
  status: 'in_progress' | 'completed' | 'forcibly_ended' | 'expired',
  score: {
    correctCount: Number,
    totalQuestions: Number,
    details: [{
      questionId: ObjectId,
      selectedIndex: Number,   // mapped original index
      isCorrect: Boolean
    }]
  },
  flags: {
    suspiciousEventsCount: Number,
    forciblyEndedReason: String|null
  },
  clientInfo: {
    userAgent: String,
    ip: String | null,
    deviceType: 'desktop' | 'mobile' | 'tablet'
  }
}
```

### 5.7 `events` – Anti-cheat & Activity Logs

```js
{
  _id: ObjectId,
  quizId: ObjectId,
  attemptId: ObjectId,
  type: String, // 'fullscreen_exit', 'tab_blur', 'tab_focus', 'visibility_hidden', 'visibility_visible', 'devtools_attempt', 'context_menu', 'copy', 'paste', 'otp_failed', 'otp_success', etc.
  message: String,
  timestamp: Date,
  extra: Object
}
```

---

## 6. Core Features & Flows

### 6.1 Instructor Auth Flow

1. **Sign Up** (Optional or admin-only creation):
   - Instructor submits name, email, password.
   - Validate email uniqueness.
   - Store `passwordHash` (bcrypt).
2. **Login**:
   - Instructor submits email + password.
   - Validate credentials.
   - Issue JWT/session cookie.
3. **Protected Routes**:
   - Any `/dashboard` and `/api/instructor/*` require authentication.
   - Role checks for `admin` vs `instructor`.

---

### 6.2 Quiz Creation & Management (Instructor)

1. Instructor logs into **Dashboard**.
2. Click **Create Quiz**:
   - Form fields:
     - Title, description.
     - Settings:
       - `questionTimeSeconds` (default 35).
       - Optional `totalTimeSeconds`.
       - `startAt`, `endAt`.
       - `shuffleQuestions`, `shuffleOptions`.
       - `requireFullscreen` (desktop only).
       - `logSuspiciousActivity`.
       - `allowMultipleAttempts`.
       - `showScoreToStudent`.
       - `requireStudentListMatch`.
   - Create `quizzes` document with `status='draft'`.

3. **Upload Student List** (CSV):
   - CSV columns: `Name, Email, StudentId (optional)`.
   - API parses CSV, creates `students` documents.
   - UI shows preview table.

4. **Upload Questions** (CSV or manual UI):
   - CSV columns: `Question, OptionA, OptionB, OptionC, OptionD, CorrectLetter`.
   - Parse into `questions` documents.
   - Optionally reorder questions via drag-and-drop UI.

5. **Publish Quiz**:
   - Set `status='published'`.
   - Generate/confirm `quizCode` and URL (`/q/:quizId` or `/q/:quizCode`).

6. **Send Invitations via Email**:
   - For each `student` in the quiz:
     - Generate a **6-digit OTP**.
     - Store `otpCodeHash` and `otpExpiresAt` in `quizInvites`.
     - Send email:
       - Subject: “Your Arch Quiz Invitation – {{quizTitle}}”
       - Body:
         - Quiz title, date/time window.
         - Link: `https://app.com/q/{{quizIdOrCode}}`.
         - OTP code (or option to request OTP again on landing page).
   - Throttle sending (batch or queue with worker).

---

### 6.3 Student Access & OTP Verification

1. Student receives email:
   - Clicks quiz link: `https://app.com/q/:quizIdOrCode`.

2. Quiz landing page:
   - Show quiz title, start/end time, instructions.
   - Email field (pre-filled if link includes email token, optional).
   - OTP field.
   - Button: **Verify & Start**.
   - Optional “Resend OTP” button with rate limiting.

3. On **Verify & Start**:
   - Frontend calls:
     - `POST /api/quizzes/:quizId/verify-otp` with `{ email, otp }`.
   - Backend:
     - Find `quizInvites` for quiz+email.
     - Check:
       - `otpCodeHash` matches hashed `otp`.
       - `otpExpiresAt` not passed.
       - `maxOtpAttempts` not exceeded.
     - If valid:
       - Set `verifiedAt = now`.
       - Log `otp_success` event.
       - Check:
         - `status === 'published'`.
         - Current time within `[startAt, endAt]` (if defined).
       - Check multiple attempts rules:
         - If `allowMultipleAttempts` is false and a completed attempt already exists for this quiz+email/student → reject.
       - Create new `attempt` with:
         - `status='in_progress'`.
         - `startedAt=now`.
         - Link to `studentId`, `inviteId`, `quizId`.
       - Respond with an **attempt token** (or attemptId) to be used during the quiz session.

4. If OTP invalid or expired:
   - Increment attempt counter.
   - Log `otp_failed`.
   - Return an error with generic message.

---

### 6.4 Quiz Taking Flow (Student UI)

**Requirements:**

- Same theme as existing Arch Quiz:
  - Gradient header, title, short subtitle.
  - Card layout for questions.
  - Options styled with a letter badge (A/B/C/D).
  - Single question per screen.
- Responsive:
  - On **mobile**:
    - Larger hit areas for options.
    - Vertical layout for controls.
    - No fullscreen enforcement; just mild anti-cheat warnings (visibility, blur).
  - On **desktop**:
    - Full anti-cheat features enabled.

**Steps:**

1. The quiz page, after OTP verification, loads:
   - Quiz metadata.
   - Question list (IDs + text + options), optionally pre-shuffled server-side.

2. For each question:
   - Show question number `i / total`.
   - Show question text.
   - Show 2–4 options with letter badges (A–D).
   - Start **per-question timer** (`questionTimeSeconds`, default 35s).
   - Anti-cheat listeners:
     - `fullscreenchange` (desktop only, if `requireFullscreen` is true).
     - `visibilitychange`.
     - `window.blur` / `window.focus`.
     - `contextmenu`, `copy`, `paste`, `cut`, devtools key combos.
   - On suspicious event:
     - Show small warning toast.
     - Send `POST /api/attempts/:attemptId/events` with event type + message.

3. When timer expires:
   - Auto-record current answer (or “No answer”).
   - If last question → finish quiz.
   - Else → move to next question.

4. When user clicks **Next**:
   - Record selected option.
   - Move to next question.

5. When user clicks **Quit**:
   - Confirm dialog: “Quit exam? Your answers so far will be submitted.”
   - If confirmed → finish quiz.

6. Finish quiz:
   - Ensure all questions have answers (or “No answer”).
   - Send final answers in `POST /api/attempts/:attemptId/finish`.
   - Backend:
     - Load questions.
     - Compute score (correctCount, totalQuestions).
     - Save `attempts.score` & `status='completed'` (or `'expired'`).
   - Frontend:
     - Show **end screen**:
       - Student name.
       - If `showScoreToStudent`:
         - “Score: X / Y”.
       - Else:
         - “Your exam has been submitted. Please wait for instructor feedback.”

---

### 6.5 Anti-Cheat Rules & Logging

**Desktop (if `requireFullscreen` enabled):**

- On quiz start:
  - Request fullscreen.
  - If user refuses, show overlay:
    - Explain that fullscreen is required.
    - Provide instructions (e.g. press F11).
    - Start countdown (e.g. 10 seconds).
    - If countdown reaches zero without fullscreen → auto-finish quiz.
- On `fullscreenchange`:
  - If fullscreen is lost:
    - Show overlay + countdown again.
    - Pause timers.
  - When fullscreen restored:
    - Hide overlay.
    - Resume timers.

**All devices (desktop + mobile):**

- Log events:
  - `visibility_hidden` / `visibility_visible`.
  - `window_blur` / `window_focus`.
  - `context_menu`.
  - `copy`, `paste`, `cut`, `keydown` on suspicious key combos.
- Each event:
  - Sends a small payload to `/api/attempts/:attemptId/events`.
  - Increments `flags.suspiciousEventsCount` for that attempt.

**Enhancement:**

- Define thresholds:
  - e.g., more than N suspicious events triggers a “high suspicion” flag shown in instructor dashboard.

---

### 6.6 Instructor Monitoring & Control

**Monitoring Page: `/dashboard/quizzes/:quizId/monitor`**

- **Summary metrics** (similar to GAS admin, but per quiz):
  - Total attempts.
  - Unique students.
  - Average score, min score, max score.
  - Number of questions.
  - Last submission time.
  - Number of **currently active** attempts.

- **Attempts table**:
  - Columns:
    - Student name.
    - Email.
    - Started at.
    - Submitted at.
    - Status (in_progress/completed/forcibly_ended/expired).
    - Score (if completed).
    - SuspiciousEventsCount (colored indicator).
  - Features:
    - Search/filter by name, email, status.
    - Sorting by score, time, etc.
    - Click row to open attempt detail.

- **Attempt detail view**:
  - Student info.
  - Score breakdown (if completed).
  - Timeline of events (from `events` collection).
  - Flags (e.g., “High suspicion: 12 anomalies”).

- **Controls**:
  - **End Exam Now**:
    - Sets quiz `status='closed'`.
    - Marks all `in_progress` attempts as `forcibly_ended` with reason.
    - On client side:
      - Next poll/websocket event instructs students to auto-submit.
  - **Extend Quiz**:
    - Extend `endAt` by X minutes.
  - **Export**:
    - Export attempts + scores as CSV/Excel.
    - Optional export of events for audit.

---

## 7. API Endpoints (Sketch)

> Note: Exact shape may differ if implemented as Next.js API routes. Below is conceptual.

### 7.1 Auth (Instructor)

- `POST /api/auth/register` – register instructor (or admin only).
- `POST /api/auth/login` – login.
- `POST /api/auth/logout` – logout.
- `GET /api/auth/me` – get current user.

### 7.2 Quizzes

- `GET /api/quizzes` – list quizzes (for current instructor).
- `POST /api/quizzes` – create quiz.
- `GET /api/quizzes/:quizId` – get quiz detail.
- `PATCH /api/quizzes/:quizId` – update quiz settings.
- `PATCH /api/quizzes/:quizId/status` – publish/close quiz.
- `GET /api/quizzes/:quizId/dashboard` – summary metrics for instructor.

### 7.3 Students

- `POST /api/quizzes/:quizId/students/upload` – upload CSV.
- `GET /api/quizzes/:quizId/students` – list students.

### 7.4 Questions

- `POST /api/quizzes/:quizId/questions/upload` – upload CSV.
- `GET /api/quizzes/:quizId/questions` – list questions.
- (Optional CRUD endpoints for manual editing.)

### 7.5 Invitations & OTP

- `POST /api/quizzes/:quizId/invitations/send` – send quiz invites to all students (or subset).
- `POST /api/quizzes/:quizId/invitations/resend` – resend invite/OTP to single student (with rate limiting).
- `POST /api/quizzes/:quizId/verify-otp` – verify OTP & start attempt.

### 7.6 Attempts & Logs

- `POST /api/attempts/:attemptId/finish` – submit quiz answers.
- `GET /api/quizzes/:quizId/attempts` – instructor list of attempts.
- `POST /api/attempts/:attemptId/events` – record suspicious event.

### 7.7 Quiz Lifecycle Actions

- `PATCH /api/quizzes/:quizId/terminate` – end exam for all participants.
- `PATCH /api/quizzes/:quizId/extend` – extend endAt time.

---

## 8. Frontend Pages (Next.js)

### 8.1 Public / Student

- `/q/[quizIdOrCode]`:
  - Landing + OTP verification.
  - After verification, render quiz UI:
    - Start card (instructions).
    - Question card(s) with timer.
    - End screen.
  - Responsive:
    - Desktop:
      - Uses fullscreen + full anti-cheat.
    - Mobile:
      - No fullscreen; simplified warnings.

### 8.2 Instructor

- `/login` – login form.
- `/dashboard` – list of instructor’s quizzes.
- `/dashboard/quizzes/new` – new quiz wizard.
- `/dashboard/quizzes/[quizId]` – quiz overview.
- `/dashboard/quizzes/[quizId]/students` – manage student list + invitations.
- `/dashboard/quizzes/[quizId]/questions` – manage questions.
- `/dashboard/quizzes/[quizId]/monitor` – monitoring & control.

### 8.3 Admin (optional)

- `/admin/users` – manage instructors.
- `/admin/quizzes` – overview of all quizzes.

---

## 9. Security & Privacy Considerations

- **Passwords**:
  - Stored using bcrypt with strong cost factor.
- **JWT / Sessions**:
  - Signed and encrypted where appropriate.
  - Short expiry; refresh mechanism as needed.
- **OTP**:
  - Store hash only (never raw OTP).
  - OTP expires after short time (e.g. 10–30 minutes).
  - Limit retries (e.g. 5 attempts per invite).
- **Rate Limiting**:
  - On login, OTP verification, OTP resend endpoints.
- **Access Control**:
  - Instructors can only access their own quizzes, students, attempts, events.
  - Admin can view all; logged by audit trail (optional).
- **Data Privacy**:
  - Minimal personal data: name, email, optional student ID.
  - Clear retention policy (e.g. delete attempts after N months if required).

---

## 10. UX & Enhancement Ideas

These enhancements are recommended but optional:

1. **Autosave answers**:
   - Save answer each time user clicks an option instead of only at the end.
   - Helps in case of sudden connection loss.

2. **Progress Snapshot on Reconnect**:
   - If student reconnects (same OTP + email and attempt still in progress), restore:
     - Current question index.
     - Remaining exam time (if using totalTimeSeconds).
     - Previously selected answers.

3. **Multi-language Support**:
   - Allow instructor to choose language (e.g., English / Arabic).
   - Support RTL layout for Arabic questions, labels, and student names.

4. **Dark Mode**:
   - Toggle for students and instructors (persisted in localStorage).
   - Keep Arch aesthetic with dark gradients and soft cards.

5. **Analytics**:
   - Show per-question stats:
     - Percentage of students who got it correct.
     - Most chosen wrong option (to find misleading questions).
   - Visualizations (bar charts) on instructor dashboard.

6. **Notification Emails**:
   - Optional:
     - “Your quiz has started” reminders.
     - “Your quiz has ended” summary to instructor.

7. **Device / Browser Check**:
   - On quiz start, detect:
     - Browser version.
     - Device type.
   - Warn about unsupported browsers if needed.

---

## 11. Implementation Notes / Priorities

1. **MVP**:
   - Instructor auth.
   - Quiz CRUD (without advanced analytics).
   - Student list & question upload.
   - Email invitations + OTP verification.
   - Basic quiz-taking flow with per-question timer.
   - Basic anti-cheat (events logged, minimal UI warnings).
   - Simple instructor monitoring (table + basic stats).

2. **Phase 2**:
   - Full fullscreen enforcement & countdown overlay.
   - Suspicious event scoring & highlighting.
   - Export to CSV/Excel.
   - Time extensions & force-end.

3. **Phase 3**:
   - Advanced analytics, charts, multi-language, dark mode.
   - Admin role, platform metrics dashboard.
   - Autosave and reconnect logic.

---

## 12. Summary

This specification describes a full replacement and extension of the original Google Apps Script quiz into a **multi-instructor, OTP-secured, anti-cheat quiz platform** using **Node.js, Next.js, and MongoDB**.

- **Theme**: Keep the Arch Quiz aesthetic.
- **Security**: OTP per student per quiz, hashed passwords, rate limiting.
- **Scalability**: Multi-instructor, multi-quiz, mobile-ready.
- **Control**: Instructors manage quizzes, invitations, monitoring, and exports.
- **Extensibility**: Clear data model and API design allow future features like analytics, multi-language, and advanced audits.

This `.md` file can be used as the **primary spec** for implementation, hand-off, or for feeding into **Codex / Speckit** to generate boilerplate code and scaffolding.
