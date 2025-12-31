# Tasks: Arch Quiz Platform

**Input**: Design documents from `/specs/002-arch-quiz-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are optional and not included because they were not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per plan in `src/app/`, `src/server/`, `src/lib/`, `tests/`
- [x] T002 Initialize Next.js app and dependencies in `package.json`
- [x] T003 Add environment template in `.env.example`
- [x] T004 Configure linting basics in `eslint.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T005 [P] Add MongoDB connection helper in `src/server/db.ts`
- [x] T006 [P] Add base model utilities in `src/server/models/base.ts`
- [x] T007 [P] Configure instructor auth in `src/app/api/auth/[...nextauth]/route.ts`
- [x] T008 Add instructor access guard in `src/server/auth/requireInstructor.ts`
- [x] T009 [P] Add mailer service in `src/server/mail/mailer.ts`
- [x] T010 [P] Add OTP helper in `src/server/security/otp.ts`
- [x] T011 [P] Add rate limit helper in `src/server/security/rateLimit.ts`
- [x] T012 Add API error/response helpers in `src/server/http/errors.ts` and `src/server/http/response.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and publish a quiz (Priority: P1)

**Goal**: Enable instructors to create quizzes, upload students and questions, publish, and send invitations.

**Independent Test**: Create a quiz, upload a small CSV of students and questions, publish, and send invitations.

### Implementation for User Story 1

- [x] T013 [P] [US1] Create Quiz model in `src/server/models/Quiz.ts`
- [x] T014 [P] [US1] Create Question model in `src/server/models/Question.ts`
- [x] T015 [P] [US1] Create Student model in `src/server/models/Student.ts`
- [x] T016 [P] [US1] Create Invitation model in `src/server/models/Invitation.ts`
- [x] T017 [US1] Implement quiz service in `src/server/quizzes/quizService.ts`
- [x] T018 [US1] Implement student import service in `src/server/quizzes/studentService.ts`
- [x] T019 [US1] Implement question import service in `src/server/quizzes/questionService.ts`
- [x] T020 [US1] Implement invitation service in `src/server/quizzes/invitationService.ts`
- [x] T021 [US1] Implement quiz CRUD API in `src/app/api/quizzes/route.ts` and `src/app/api/quizzes/[quizId]/route.ts`
- [x] T022 [US1] Implement quiz status API in `src/app/api/quizzes/[quizId]/status/route.ts`
- [x] T023 [US1] Implement student upload API in `src/app/api/quizzes/[quizId]/students/upload/route.ts`
- [x] T024 [US1] Implement question upload API in `src/app/api/quizzes/[quizId]/questions/upload/route.ts`
- [x] T025 [US1] Implement invitation send/resend APIs in `src/app/api/quizzes/[quizId]/invitations/send/route.ts` and `src/app/api/quizzes/[quizId]/invitations/resend/route.ts`
- [x] T026 [US1] Build instructor UI for quiz creation and management in `src/app/dashboard/page.tsx`, `src/app/dashboard/quizzes/new/page.tsx`, `src/app/dashboard/quizzes/[quizId]/students/page.tsx`, `src/app/dashboard/quizzes/[quizId]/questions/page.tsx`

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: User Story 2 - Verify access and complete a quiz (Priority: P2)

**Goal**: Allow students to verify OTP and complete quizzes on desktop or mobile.

**Independent Test**: Verify OTP for a student, complete a quiz, and confirm submission.

### Implementation for User Story 2

- [x] T027 [P] [US2] Create Attempt model in `src/server/models/Attempt.ts`
- [x] T028 [P] [US2] Create Event model in `src/server/models/Event.ts`
- [x] T029 [US2] Implement OTP verification service in `src/server/quizzes/otpService.ts`
- [x] T030 [US2] Implement attempt service in `src/server/attempts/attemptService.ts`
- [x] T031 [US2] Implement verify OTP API in `src/app/api/quizzes/[quizId]/verify-otp/route.ts`
- [x] T032 [US2] Implement attempt event API in `src/app/api/attempts/[attemptId]/events/route.ts`
- [x] T033 [US2] Implement attempt finish API in `src/app/api/attempts/[attemptId]/finish/route.ts`
- [x] T034 [US2] Build student landing and OTP UI in `src/app/q/[quizIdOrCode]/page.tsx`
- [x] T035 [US2] Build quiz-taking client UI in `src/app/q/[quizIdOrCode]/QuizClient.tsx`
- [x] T036 [US2] Build quiz end screen UI in `src/app/q/[quizIdOrCode]/ResultScreen.tsx`

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Monitor and manage live attempts (Priority: P3)

**Goal**: Provide instructor monitoring, control actions, and exports.

**Independent Test**: Observe live attempts, end or extend a quiz, and export results.

### Implementation for User Story 3

- [x] T037 [US3] Implement dashboard metrics API in `src/app/api/quizzes/[quizId]/dashboard/route.ts`
- [x] T038 [US3] Implement attempts list API in `src/app/api/quizzes/[quizId]/attempts/route.ts`
- [x] T039 [US3] Implement terminate/extend APIs in `src/app/api/quizzes/[quizId]/terminate/route.ts` and `src/app/api/quizzes/[quizId]/extend/route.ts`
- [x] T040 [US3] Implement export service in `src/server/quizzes/exportService.ts`
- [x] T041 [US3] Build monitoring UI in `src/app/dashboard/quizzes/[quizId]/monitor/page.tsx`
- [x] T042 [US3] Build attempt detail UI in `src/app/dashboard/quizzes/[quizId]/monitor/[attemptId]/page.tsx`
- [x] T043 [US3] Wire monitoring components in `src/app/dashboard/quizzes/[quizId]/monitor/components/AttemptTable.tsx` and `src/app/dashboard/quizzes/[quizId]/monitor/components/Controls.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T044 [P] Add theme styles in `src/styles/theme.css`
- [x] T045 [P] Add shared UI components in `src/app/components/ui/`
- [x] T046 Harden OTP limits and rate limits in `src/server/security/otp.ts` and `src/server/security/rateLimit.ts`
- [x] T047 Add structured event logging in `src/server/attempts/eventLogger.ts`
- [x] T048 Update quickstart notes in `specs/002-arch-quiz-platform/quickstart.md`
- [x] T049 Record smoke test results in `specs/002-arch-quiz-platform/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 data but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses US1/US2 data but independently testable

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel
- After Foundational completion, US1, US2, and US3 can be worked in parallel by separate developers
- Model creation tasks marked [P] can be done concurrently within a story

---

## Parallel Example: User Story 1

```text
Task: "Create Quiz model in src/server/models/Quiz.ts"
Task: "Create Question model in src/server/models/Question.ts"
Task: "Create Student model in src/server/models/Student.ts"
Task: "Create Invitation model in src/server/models/Invitation.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (critical)
3. Complete Phase 3: User Story 1
4. Stop and validate User Story 1 independently

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate → demo
3. Add User Story 2 → validate → demo
4. Add User Story 3 → validate → demo

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Avoid vague tasks and cross-story dependencies that break independence
