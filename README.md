# Smart Resource Allocation System for Volunteer Coordination

End-to-end hackathon project with:
- Frontend: Next.js + TypeScript
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL

## Project Structure

- frontend app: root folder
- backend API: backend

## Prerequisites

- Node.js 20+ (recommended: 20 or 22 LTS)
- Python 3.11+ (your current setup can work with 3.14 as configured)
- PostgreSQL 18 (or 15+)

## 1) Clone and Open Project

```powershell
git clone <your-repo-url>
cd Solution_challenge
```

## 2) Frontend Setup

Install dependencies:

```powershell
npm install
```

Run frontend:

```powershell
npm run dev
```

Frontend URL:
- http://localhost:3000

Build frontend:

```powershell
npm run build
npm start
```

## 3) PostgreSQL Setup

Make sure PostgreSQL service is running.

Default service name used in this project:

```powershell
Start-Service postgresql-x64-18
```

If needed, open PostgreSQL shell:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d postgres
```

## 4) Backend Setup

Open a new terminal and run:

```powershell
cd backend
python -m pip install -r requirements.txt
```

Environment file:
- backend/.env is already included for local setup

Create or verify DB user and DB (if not already done):

```powershell
.\setup_db.bat
```

Seed demo data:

```powershell
python seed.py
```

Run backend:

```powershell
uvicorn app.main:app --reload
```

If running from project root instead of backend folder:

```powershell
uvicorn --app-dir backend app.main:app --reload
```

Backend URLs:
- API: http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## 5) Run Full App Locally

Use 2 terminals:

Terminal A (backend):

```powershell
cd backend
uvicorn app.main:app --reload
```

Terminal B (frontend):

```powershell
npm run dev
```

Open:
- Frontend: http://localhost:3000
- Backend docs: http://127.0.0.1:8000/docs

## Demo Credentials

NGO:
- email: ngo@demo.com
- password: demo123

Volunteers:
- email: volunteer1@demo.com to volunteer50@demo.com
- password: demo123

## Common Issues

### npm run dev fails

Check Node version:

```powershell
node -v
```

Use Node 20+.

### python seed.py fails with DB error

Usually means DB/user/password mismatch. Re-run:

```powershell
.\setup_db.bat
python seed.py
```

### Backend import error from root folder

Run with app-dir:

```powershell
uvicorn --app-dir backend app.main:app --reload
```

## Important Backend Notes

- Seed data: 50 volunteers + 15 requests
- Matching logic implemented in backend/app/services/matching.py
- API routes are under backend/app/routes

## Production Notes (Later)

- Set a strong SECRET_KEY in backend/.env
- Restrict CORS origins
- Set DEBUG=False
- Use managed PostgreSQL and secure credentials
