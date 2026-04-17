# Smart Resource Allocation System for Volunteer Coordination

Full-stack volunteer coordination platform with role-based UX for NGOs and volunteers.

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL

## Current Project Structure

```text
Solution_challenge/
|- app/                          # Next.js App Router pages
|  |- page.tsx                   # Landing page
|  |- login/page.tsx
|  |- signup/page.tsx
|  |- coordinator/
|  |  |- dashboard/page.tsx
|  |  |- analytics/page.tsx
|  |  |- requests/page.tsx
|  |  |- volunteers/page.tsx
|  |- volunteer/
|     |- portal/page.tsx
|     |- available/page.tsx
|     |- profile/page.tsx
|- components/                   # Shared UI + feature components
|- lib/                          # API layer, auth context, utils
|- hooks/
|- backend/
|  |- app/
|  |  |- main.py                 # FastAPI app + route registration
|  |  |- routes/                 # auth, volunteers, requests, matching, assignments, dashboard, volunteer_portal
|  |  |- services/               # Matching engine
|  |  |- models/                 # SQLAlchemy models
|  |  |- schemas/                # Pydantic schemas
|  |  |- db/                     # DB session/engine setup
|  |  |- core/                   # Settings/config
|  |- seed.py                    # Demo data seeding
|  |- requirements.txt
|  |- setup_db.bat / setup_db.sh
|- README.md
```

## Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL 15+ (18 works as well)

## Environment Variables

Frontend:

- `NEXT_PUBLIC_API_URL` (optional)
- Default if missing: `http://127.0.0.1:8000`

Backend:

- Reads from `backend/.env` (via pydantic-settings)
- Default DB URL in code:
  `postgresql+psycopg://volunteer_user:volunteer_pass@localhost:5432/volunteer_db`

## Setup and Run

### 1) Install Frontend Dependencies

From project root:

```powershell
npm install
```

### 2) Setup Backend

```powershell
cd backend
python -m pip install -r requirements.txt
```

Create DB/user (Windows):

```powershell
.\setup_db.bat
```

Or on macOS/Linux:

```bash
bash setup_db.sh
```

Seed demo data:

```powershell
python seed.py
```

### 3) Start Backend API

From `backend` folder:

```powershell
uvicorn app.main:app --reload
```

Or from project root:

```powershell
uvicorn --app-dir backend app.main:app --reload
```

### 4) Start Frontend

From project root in a second terminal:

```powershell
npm run dev
```

## Local URLs

- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Available Scripts

Frontend (root `package.json`):

- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm run start` - Run production build
- `npm run lint` - ESLint

Backend:

- `python quick_start.py` - Installs deps, checks DB, seeds, and starts API
- `python seed.py` - Reseed demo data

## API Surface (Current)

Auth:

- `POST /auth/register`
- `POST /auth/login`

Volunteers:

- `POST /volunteers`
- `GET /volunteers`
- `GET /volunteers/{volunteer_id}`
- `PATCH /volunteers/{volunteer_id}`

Requests:

- `POST /requests?user_id=...`
- `GET /requests`
- `GET /requests/{request_id}`
- `PATCH /requests/{request_id}`

Matching:

- `POST /match/{request_id}`
- `POST /match/assign/{request_id}`

Assignments:

- `POST /assignments/{assignment_id}/accept`
- `POST /assignments/{assignment_id}/reject`
- `POST /assignments/{assignment_id}/complete`
- `GET /assignments/{assignment_id}`

Volunteer Portal:

- `GET /volunteer/recommended?volunteer_id=...`
- `GET /volunteer/nearby?volunteer_id=...&latitude=...&longitude=...&limit=...`
- `GET /volunteer/tasks?volunteer_id=...&status_filter=...`

Dashboard:

- `GET /dashboard/stats`
- `GET /dashboard/heatmap`

Health:

- `GET /`
- `GET /health`

## Demo Credentials

- NGO:
  - Email: ngo@demo.com
  - Password: demo123
- Volunteers:
  - Email range: volunteer1@demo.com to volunteer50@demo.com
  - Password: demo123

## Common Issues

1. Frontend cannot reach backend

- Confirm backend is running on port 8000
- Set `NEXT_PUBLIC_API_URL` if using a different host/port

2. Database connection errors during seed/run

- Ensure PostgreSQL service is running
- Re-run `backend/setup_db.bat` (Windows) or `backend/setup_db.sh` (macOS/Linux)
- Verify credentials in `backend/.env`

3. Uvicorn import error from root folder

- Use: `uvicorn --app-dir backend app.main:app --reload`

## Notes

- Seed script creates demo NGO, volunteers, and sample requests.
- Matching logic is implemented in `backend/app/services/matching.py`.
- Main frontend API wrapper is in `lib/api.ts`.
