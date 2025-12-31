# Feature Specification: Arch Quiz Platform

**Feature Branch**: 002-arch-quiz-platform  
**Created**: 2025-12-29  
**Status**: Draft  
**Input**: User description: "arch-quiz-platform-spec.md (contents ingested)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and publish a quiz (Priority: P1)

An instructor creates a new quiz, uploads a student list and questions, configures timing and access rules, and sends invitations with one-time codes.

**Why this priority**: This is the core workflow that enables any student to take a quiz.

**Independent Test**: Can be fully tested by creating a quiz, uploading inputs, publishing, and sending invitations to a small test list.

**Acceptance Scenarios**:

1. **Given** an authenticated instructor, **When** they create and publish a quiz with a student list and questions, **Then** the quiz becomes available and invitations can be sent.
2. **Given** a published quiz, **When** the instructor sends invitations, **Then** each listed student receives a unique quiz link and one-time code.

---

### User Story 2 - Verify access and complete a quiz (Priority: P2)

A student opens the quiz link, verifies their identity with a one-time code, and completes the quiz within the allowed time window on desktop or mobile.

**Why this priority**: Students must be able to securely access and complete the quiz for the platform to deliver value.

**Independent Test**: Can be tested by inviting a student, verifying the code, completing a quiz, and seeing a submission confirmation.

**Acceptance Scenarios**:

1. **Given** a student with a valid invitation, **When** they enter the correct one-time code, **Then** they can start the quiz.
2. **Given** an active quiz attempt, **When** time expires, **Then** the system submits the attempt with the answers recorded so far.

---

### User Story 3 - Monitor and manage live attempts (Priority: P3)

An instructor monitors live attempts, views suspicious activity indicators, and can end or extend a quiz, then export results.

**Why this priority**: Instructors need visibility and control to uphold integrity and finalize results.

**Independent Test**: Can be tested by starting multiple student attempts, observing live status changes, ending or extending the quiz, and exporting results.

**Acceptance Scenarios**:

1. **Given** a quiz with active attempts, **When** the instructor opens the monitoring view, **Then** they see up-to-date attempt statuses and suspicious event counts.
2. **Given** a quiz in progress, **When** the instructor ends the quiz, **Then** all active attempts are submitted and marked as ended.

---

### Edge Cases

- What happens when a student tries to verify with an expired one-time code?
- How does the system handle a student who is not on the uploaded list when list matching is required?
- What happens when a student opens the quiz after the allowed time window has closed?
- How does the system handle a brief connectivity drop during an attempt?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow instructors to create, edit, publish, and close quizzes.
- **FR-002**: System MUST support multiple instructors, each managing multiple quizzes.
- **FR-003**: System MUST allow instructors to upload and manage a per-quiz student list.
- **FR-004**: System MUST allow instructors to create a per-quiz question bank and optionally shuffle question order and answer options.
- **FR-005**: System MUST send quiz invitations by email containing a quiz link and a one-time access code.
- **FR-006**: System MUST verify one-time codes with an expiration window and a retry limit.
- **FR-007**: System MUST allow students to complete quizzes on desktop and mobile; fullscreen enforcement applies only on desktop when enabled.
- **FR-008**: System MUST enforce per-question timing and optional overall quiz timing, and auto-submit when time expires.
- **FR-009**: System MUST record answers, calculate scores, and optionally show scores to students based on quiz settings.
- **FR-010**: System MUST record suspicious activity events during attempts and associate them with the attempt.
- **FR-011**: System MUST prevent instructors from accessing quizzes, students, or attempts that they do not own.
- **FR-012**: System MUST allow instructors to resend one-time codes with rate limiting.
- **FR-013**: System MUST enforce attempt limits per student based on quiz settings.
- **FR-014**: System MUST provide an instructor monitoring view with live status, suspicious indicators, and exportable results.
- **FR-015**: System MUST provide a consistent Arch-style visual theme across student and instructor views.
- **FR-016**: System MUST include a clear quickstart guide for setup and a basic smoke-test checklist.

### Key Entities *(include if feature involves data)*

- **Instructor Account**: A user who creates and manages quizzes and views results.
- **Quiz**: A configured assessment with timing, access rules, and status.
- **Question**: A prompt with multiple options and a correct answer reference.
- **Student**: A person invited to take a specific quiz.
- **Invitation**: A record of a quiz link and one-time access code issued to a student.
- **Attempt**: A student's in-progress or completed quiz session with recorded answers and score.
- **Suspicious Event**: An activity signal captured during a quiz attempt.
- **Result Export**: A downloadable summary of attempts, scores, and flags.

## Assumptions

- Instructors can self-register unless the organization requires admin-created accounts.
- One-time codes expire within a short, configurable window (assume 10 to 30 minutes).
- Mobile access is allowed by default; fullscreen enforcement is optional and desktop-only.
- Default per-question timer is set to a standard short duration (assume 30 to 45 seconds).

## Dependencies

- The organization can deliver email messages to student and instructor addresses.
- Instructors have access to accurate student email lists for invitations.
- Students can access the quiz from a modern browser on desktop or mobile.

## Out of Scope

- Webcam or biometric proctoring.
- Payments, billing, or subscription management.
- Automated question generation.
- Cross-quiz analytics beyond per-quiz reporting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of instructors can create and publish a quiz with students and questions in under 15 minutes in usability testing.
- **SC-002**: 99% of invitations are delivered within 2 minutes and 95% of students verify access on the first attempt.
- **SC-003**: 90% of students complete a quiz on the first try without requesting support.
- **SC-004**: The monitoring view reflects attempt status changes within 10 seconds in 95% of cases.
- **SC-005**: The platform supports at least 500 concurrent active attempts with no visible delays (page actions respond within 2 seconds).
