# Quiz Platform

Monorepo with a Next.js 14 frontend and a Node/Express API backend for managing quizzes, students, and live monitoring.

## Structure
- `apps/frontend` - Next.js App Router UI
- `apps/backend` - Express + MongoDB API

## Features
- Instructor dashboard to create and manage quizzes
- CSV uploads for questions and students
- Live monitor with attempt stats and controls
- OTP invitations (dev mode or SMTP)
- Optional webcam snapshots (start/middle/end) stored in MongoDB with 5-day TTL

## Tech Stack
- Next.js 14 (App Router)
- Node.js 20
- Express
- MongoDB + Mongoose
- JWT auth for instructors

## Setup

1) Install dependencies
```bash
npm install
```

2) Create environment files
- `apps/backend/.env` (see `apps/backend/.env.example`)
- `apps/frontend/.env` (see `apps/frontend/.env.example`)

3) Run the apps (two terminals)
```bash
npm run dev:backend
```
```bash
npm run dev:frontend
```

Frontend default: `http://localhost:3000`  
Backend default: `http://localhost:4000`

## Environment Variables

Backend (`apps/backend/.env`):
- `MONGODB_URI` (required): MongoDB connection string
- `JWT_SECRET` (required): JWT signing secret
- `APP_BASE_URL` (required when sending real emails): Public quiz URL base
- `DEV_EMAIL_MODE` (true/false): Logs OTPs to server console when true
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (required when `DEV_EMAIL_MODE=false`)
- `CORS_ORIGIN` (comma-separated list or `*`): Allowed frontend origins
- `PORT` (optional): API port, default `4000`

Frontend (`apps/frontend/.env`):
- `NEXT_PUBLIC_API_BASE_URL` (required): Base URL of the backend API (ex: `http://localhost:4000`)

## Scripts
- `npm run dev:frontend` - Start Next.js dev server
- `npm run dev:backend` - Start Express dev server
- `npm run build` - Build both apps
- `npm run lint` - Lint frontend
- `npm test` - Run frontend tests

## Notes
- Uploads accept CSV only for students and questions.
- Webcam snapshots are optional per-quiz and shown in attempt details.
