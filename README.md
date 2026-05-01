# HireAI

HireAI is a production-oriented SaaS monorepo for AI-powered hiring, resume screening, and recruiting workflows.

## Monorepo Structure

```text
hireai/
  frontend/   React + Vite client
  backend/    Node.js + Express API
```

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: Node.js, Express, Mongoose, Redis

## Phase 1 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment files

Copy the root `.env.example` values into:

- `backend/.env`
- `frontend/.env`

Recommended split:

- Frontend should use `VITE_API_BASE_URL`
- Backend should use `NODE_ENV`, `BACKEND_PORT`, `MONGODB_URI`, `REDIS_URL`, and `CORS_ORIGIN`

### 3. Start the development environment

```bash
npm run dev
```

This runs:

- Frontend at `http://localhost:5173`
- Backend at `http://localhost:4000`

### 4. Verify services

- Frontend loads the initial HireAI app shell
- Backend health endpoint responds at `GET /api/health`

## Notes

- Redis is initialized through a shared client connection helper.
- MongoDB uses Mongoose with strict query mode enabled.
- Path aliases are configured in the frontend for `@/`.
