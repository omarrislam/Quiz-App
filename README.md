# Quiz App

A Next.js 14 quiz platform with instructor dashboard, question/student management, live monitoring, and OTP-based quiz access.

## Features
- Instructor dashboard to create and manage quizzes
- CSV uploads for questions and students
- Live monitor with attempt stats and controls
- OTP invitations (dev mode or SMTP)
- Optional webcam snapshots (start/middle/end) stored in MongoDB with 5-day TTL

## Tech Stack
- Next.js 14 (App Router)
- Node.js 20
- MongoDB + Mongoose
- NextAuth (credentials)

## Getting Started

1) Install dependencies
```bash
npm install
```

2) Create a `.env` file
```bash
MONGODB_URI=mongodb://localhost:27017/quiz-app
NEXTAUTH_SECRET=replace-with-a-long-random-string
NEXTAUTH_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000
DEV_EMAIL_MODE=true
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

3) Run the dev server
```bash
npm run dev
```

## Environment Variables
- `MONGODB_URI` (required): MongoDB connection string
- `NEXTAUTH_SECRET` (required in production): NextAuth secret
- `NEXTAUTH_URL` (recommended): Base URL for auth callbacks
- `APP_BASE_URL` (required when sending real emails): Public base URL
- `DEV_EMAIL_MODE` (true/false): Logs OTPs to server console when true
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (required when `DEV_EMAIL_MODE=false`)

## Scripts
- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Lint
- `npm test` - Run tests

## Notes
- Uploads accept CSV only for students and questions.
- Webcam snapshots are optional per-quiz and shown in attempt details.
