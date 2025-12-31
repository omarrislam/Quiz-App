# Data Model: Arch Quiz Platform

**Created**: 2025-12-29

## Instructor Account

- **Purpose**: Authenticated user who manages quizzes.
- **Fields**: id, name, email, passwordHash, role (instructor/admin), createdAt, updatedAt
- **Relationships**: Owns multiple Quizzes.

## Quiz

- **Purpose**: Configured assessment with timing and access rules.
- **Fields**: id, instructorId, title, description, quizCode, status (draft/published/closed), settings, createdAt, updatedAt
- **Settings**: questionTimeSeconds, totalTimeSeconds, startAt, endAt, shuffleQuestions, shuffleOptions, requireFullscreen, logSuspiciousActivity, allowMultipleAttempts, showScoreToStudent, mobileAllowed, requireStudentListMatch
- **Relationships**: Has many Questions, Students, Invitations, Attempts, and Events.

## Question

- **Purpose**: Question prompt and options for a quiz.
- **Fields**: id, quizId, text, options (2 to 4), correctIndex, order, metadata (difficulty, tags)
- **Relationships**: Belongs to a Quiz.

## Student

- **Purpose**: Per-quiz student registry entry.
- **Fields**: id, quizId, name, email, externalId, metadata, createdAt
- **Relationships**: Has Invitations and Attempts for the same Quiz.

## Invitation

- **Purpose**: Email invitation and OTP verification state.
- **Fields**: id, quizId, studentId, email, otpCodeHash, otpExpiresAt, lastOtpSentAt, maxOtpAttempts, verifiedAt, createdAt
- **Relationships**: Belongs to Student and Quiz; may link to an Attempt.

## Attempt

- **Purpose**: A quiz session with recorded answers and score.
- **Fields**: id, quizId, studentId, inviteId, studentName, studentEmail, startedAt, submittedAt, status, score, flags, clientInfo
- **Score**: correctCount, totalQuestions, details (questionId, selectedIndex, isCorrect)
- **Flags**: suspiciousEventsCount, forciblyEndedReason
- **ClientInfo**: userAgent, ip, deviceType
- **Relationships**: Belongs to Quiz and optionally Student/Invitation; has many Events.

## Event

- **Purpose**: Anti-cheat and activity log entry.
- **Fields**: id, quizId, attemptId, type, message, timestamp, extra
- **Relationships**: Belongs to an Attempt and Quiz.
