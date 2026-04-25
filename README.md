# VolunteerMatch - Smart Resource Allocation System

Full-stack volunteer coordination platform with role-based UX for NGOs and volunteers.

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS (located in `/frontend`)
- **Backend:** FastAPI, SQLAlchemy, Pydantic (located in `/backend`)
- **Database:** PostgreSQL

## Current Project Structure

```text
Solution_challenge/
|- frontend/                     # Next.js Application
|  |- app/                       # Next.js App Router pages
|  |- components/                # Shared UI + feature components
|  |- lib/                       # API layer, auth context, utils
|  |- hooks/                     # Custom React hooks
|  |- package.json
|  |- next.config.mjs
|
|- backend/                      # FastAPI Backend
|  |- app/
|  |  |- main.py                 # FastAPI app + route registration
|  |  |- routes/                 # APIs: auth, volunteers, requests, matching...
|  |  |- services/               # Matching engine, badges, external feeds
|  |  |- models/                 # SQLAlchemy models
|  |  |- schemas/                # Pydantic schemas
|  |  |- core/                   # Settings/config
|  |- seed.py                    # Demo data seeding
|  |- requirements.txt
|  |- .env                       # Backend settings 
|
|- README.md
```

## Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL 15+ 

## Setup and Run Instructions

### 1) Start the Backend API

Open your **first terminal window**:

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Install Python dependencies
python -m pip install -r requirements.txt

# 3. Secure your Database (Optional: seed dummy data)
# Make sure your PostgreSQL server matches the connection in backend/.env
python seed.py

# 4. Start the FastAPI Server
python -m uvicorn app.main:app --reload
```

The Backend API will now run natively on `http://127.0.0.1:8000`

### 2) Start the Frontend Client

Open your **second terminal window**:

```powershell
# 1. Navigate to the frontend directory
cd frontend

# 2. Install NPM dependencies
npm install

# 3. Start the Next.js Development Server
npm run dev
```

The Frontend Web Client will now run natively on `http://localhost:3000`

## Available Scripts

**Frontend (`frontend/package.json`):**
- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm run lint` - ESLint

**Backend (`backend/`):**
- `python seed.py` - Reseed demo data into PostgreSQL database

## API Documentation
Once the backend is running, you can view the fully interactive Swagger Interface:
- **Swagger:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

## Demo Credentials

You can use the following real credentials from the seeded database to test the application:

**Coordinators (NGO / Organizers)**:
- **Priya Kapoor**
  - Email: `ngo1@volunteermatch.com`
  - Password: `password123`
- **Arjun Singh**
  - Email: `ngo2@volunteermatch.com`
  - Password: `password123`
- **Prayan Foundation**
  - Email: `prayan@foundation.org` (or your registered email)
  - Password: *(Lost/Unknown - please use the 'Forgot password?' option on the login page to securely reset it)*

**Volunteers**:
- **Tirth Patel**
  - Email: `vol1@volunteermatch.com`
  - Password: `password123`
- **Rajan Mehta**
  - Email: `rajan@mail.com`
  - Password: `password123`
- **Sunita Patel**
  - Email: `sunita@mail.com`
  - Password: `password123`
- **Amit Kumar**
  - Email: `amit@mail.com`
  - Password: `password123`
