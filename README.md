# WedGuest

Monorepo with a **React** (Vite) client in `frontend/` and an **Express** API in `backend/`. Each app has its own `package.json`, `package-lock.json`, and `node_modules`. The repo root only holds shared scripts in `package.json` and does **not** install dependencies (no root `node_modules`).

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/) — local install, [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), or another compatible URI

## Setup

1. Install dependencies in `frontend/` and `backend/` (no packages are installed at the repo root):

   ```bash
   npm run install:all
   ```

2. Configure the backend. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` (see [MongoDB connection](#mongodb-connection)).

3. Start MongoDB if you use a local instance.

4. Run frontend and API together:

   ```bash
   npm run dev
   ```

- Frontend: Vite dev server (default [http://localhost:5173](http://localhost:5173))
- Backend: Express (default [http://localhost:5000](http://localhost:5000))

## Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Runs Vite + Express via `npx concurrently` (no root `node_modules`) |
| `npm run build` | Production build of the frontend |
| `npm run start:backend` | Start the API (production-style; build frontend separately if needed) |

## MongoDB connection

1. Create a cluster (Atlas) or run `mongod` locally.
2. Get a connection string, e.g. `mongodb://127.0.0.1:27017/wedguest` or Atlas `mongodb+srv://user:pass@cluster.mongodb.net/wedguest`.
3. Put it in `backend/.env` as `MONGODB_URI=...`.
4. Start the backend; it connects on boot using Mongoose.

## Auth flow implemented

- Frontend pages: `Login`, `Sign up`, `Forgot Password`, `Reset Password`
- Roles:
  - `admin`: pre-created by backend on startup from `ADMIN_*` env values
  - `user`: must sign up and verify email code before login
- Validations:
  - Email format
  - Name length
  - Password strength (min 8, uppercase, lowercase, number, special char)
  - Confirm password must match
- Email link flows:
  - Signup sends email verification link to `FRONTEND_URL/verify-email?token=...`
  - Forgot password sends reset link to `FRONTEND_URL/reset-password?token=...`

### Auth endpoints

- `POST /api/auth/signup`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/verify-email` (optional token in body)
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

In development mode, verification link and reset link are also returned in API responses to simplify testing.

## Project layout

```
├── .github/workflows/   # CI
├── frontend/              # React + Vite
├── backend/               # Express + Mongoose
├── package.json
├── package-lock.json
└── README.md
```
