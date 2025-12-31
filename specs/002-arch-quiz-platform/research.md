# Research Notes: Arch Quiz Platform

**Created**: 2025-12-29

## Decision 1: Application Architecture

- **Decision**: Use a single Next.js application with API routes for instructor and student flows.
- **Rationale**: Simplifies deployment and keeps frontend and backend aligned with shared types and validation.
- **Alternatives considered**: Separate Next.js frontend with a standalone Express API.

## Decision 2: Authentication Approach

- **Decision**: Use NextAuth with credential-based auth for instructors; use OTP verification for students without accounts.
- **Rationale**: Provides secure, managed sessions for instructors while keeping student flow lightweight.
- **Alternatives considered**: Custom JWT sessions for instructors.

## Decision 3: Email Delivery

- **Decision**: Use SMTP delivery via a provider and queue invitation sends.
- **Rationale**: SMTP compatibility allows institutional or commercial providers; queueing prevents rate-limit bursts.
- **Alternatives considered**: Direct API-based email provider only (less portable).

## Decision 4: Monitoring Updates

- **Decision**: Use polling for instructor monitoring updates at a short interval (e.g., 5 to 10 seconds).
- **Rationale**: Meets the 10-second freshness goal with lower complexity than WebSockets.
- **Alternatives considered**: WebSockets or server-sent events for live streaming.

## Decision 5: Anti-Cheat Signals

- **Decision**: Log client events (visibility, blur, fullscreen exit, copy/paste) and surface suspicious counts to instructors.
- **Rationale**: Provides lightweight deterrence without invasive proctoring.
- **Alternatives considered**: Webcam-based proctoring (out of scope).
