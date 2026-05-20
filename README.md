# Personalized Aptitude Preparation Platform for Placements

A full-stack web application for college students to prepare for campus placements through structured aptitude practice, mock tests, company-specific preparation, and AI-generated study plans.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS v4, React Router v6, Zustand, Recharts, Axios
- **Backend:** Node.js + Express, PostgreSQL, JWT authentication, Nodemailer
- **Security:** bcrypt (12 rounds), helmet, CORS, rate limiting, proctoring

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

---

## Installation

### 1. Clone / open the project

```bash
cd d:\apti-project
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Environment Setup

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` with your values:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `DB_HOST` | PostgreSQL host (default: localhost) |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `DB_NAME` | Database name (e.g., aptitude_platform) |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Random string for access tokens |
| `JWT_REFRESH_SECRET` | Random string for refresh tokens |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port (587) |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASS` | SMTP password |
| `FROM_EMAIL` | Sender email address |
| `CLIENT_URL` | Frontend URL (default: http://localhost:5173) |

---

## Database Setup

### Create the database

```bash
psql -U postgres -c "CREATE DATABASE aptitude_platform;"
```

### Run migrations (creates all tables + seed data)

```bash
cd backend
npm run migrate
```

This creates all 25+ tables, seeds subject/topic taxonomy, companies, and an admin user.

---

## Running Development Servers

### Start the backend (port 5000)

```bash
cd backend
npm run dev
```

### Start the frontend (port 5173)

```bash
cd frontend
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aptitudeplatform.com | Admin@123 |

---

## Features

### Student
- **Dashboard** — Stats overview, performance charts, upcoming tests
- **Study Materials** — Browse PDF/video/link materials, bookmark, mark as learned
- **Practice** — Topic-wise practice with instant feedback and explanations
- **Tests** — Proctored mock tests (fullscreen, tab-switch detection, violation logging)
- **Reports** — Score history, topic-wise accuracy breakdown
- **Study Plan** — AI-generated personalized weekly study plan
- **Company Corner** — Company profiles, test patterns, past papers
- **Leaderboard** — Batch rankings
- **Doubts** — Forum to post and answer doubts

### Admin / Teacher
- **Dashboard** — Platform stats, top performers, violation alerts
- **Test Builder** — Multi-step wizard with AI question generation
- **Question Bank** — CRUD for MCQ questions with difficulty/topic tagging
- **Materials** — Upload and manage study materials (file or URL)
- **Users & Batches** — Create/manage students, teachers, and batches
- **Reports** — Per-test score reports with distribution charts

---

## Project Structure

```
apti-project/
├── backend/
│   ├── migrations/
│   │   ├── 001_core_tables.sql
│   │   └── 002_seed_data.sql
│   ├── src/
│   │   ├── config/        # database, email config
│   │   ├── controllers/   # auth, student, admin logic
│   │   ├── db/            # migrate runner
│   │   ├── middleware/    # auth, errorHandler
│   │   ├── routes/        # auth, student, admin routes
│   │   ├── utils/         # jwt, helpers
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/Layout/
    │   ├── pages/
    │   │   ├── auth/
    │   │   ├── student/
    │   │   └── admin/
    │   ├── services/      # axios api client
    │   ├── stores/        # zustand auth store
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```
