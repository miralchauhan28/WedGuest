# WedGuest

Monorepo with a **React** (Vite) client in `frontend/` and an **Express** API in `backend/`. Each app has its own `package.json`, `package-lock.json`, and `node_modules`. The repo root only holds shared scripts in `package.json` and does **not** install dependencies (no root `node_modules`).

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/) — local install, [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), or another compatible URI

## Setup

1. Clone the repository and open the project folder.

2. Install dependencies **separately** (each app has its own `package.json`):
   - `cd frontend` → `npm install`
   - `cd backend` → `npm install`
   - Or from the repo root: `npm run install:all` (runs installs in both folders)

3. Configure the backend:
   - Copy `backend/.env.example` to `backend/.env`
   - Set `MONGODB_URI` (local or Atlas), `FRONTEND_URL` (default `http://localhost:5173`), `JWT_SECRET`
   - Set SMTP
   - Do **not** commit `.env`

4. Start MongoDB (local or Atlas) so `MONGODB_URI` is reachable.

5. Run the app from the repo root:

   ```bash
   npm run dev
   ```

6. Open:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## Admin login (credentials)

Admin is created on backend startup from **`backend/.env`**:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Use these on the login page; you will be routed to `/admin/dashboard`.

## User flows (sign up, login, password, support)

- **Sign up:** `/signup` → verify email at `/verify-email?token=...` → then **Login**
- **Login:** `/` or `/login` → user goes to `/user/dashboard`, admin goes to `/admin/dashboard`
- **Forgot password:** `/forgot-password` → email contains `/reset-password?token=...`
- **Contact support:** on Login, Sign up, Forgot password, and Reset password pages, use **Reach Out To Support** (opens email client). 


## CI / GitHub Actions

Workflow files live under `.github/workflows/` (see repo tree below).

## Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Runs Vite + Express via `npx concurrently` (no root `node_modules`) |

## Project layout

```
├── .github/workflows/   # CI
├── frontend/              # React + Vite
├── backend/               # Express + Mongoose
├── package.json
├── package-lock.json
└── README.md
```
