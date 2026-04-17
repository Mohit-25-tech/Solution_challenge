# VolunteerMatch Continuation Prompt (Copy Paste Ready)

START PROMPT

You are helping me continue a full-stack project called VolunteerMatch.
First read this full context carefully, then acknowledge what is already completed, then wait for my improvement requests.

## Project Goal
Build an intelligent volunteer coordination platform with strict dual-role experience:
1. NGO side for request management and volunteer assignment
2. Volunteer side for recommendations and nearby opportunities
3. Transparent matching logic with score breakdown

## Current Tech Stack
Frontend:
- Next.js App Router
- React
- TypeScript
- shadcn UI components

Backend:
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT auth
- bcrypt password hashing

## Current Source Folder Structure With Description

Root level:
- app: Next.js App Router pages and layouts
- backend: FastAPI backend service, models, routes, services, db config
- components: shared React components including role UI and shadcn ui primitives
- hooks: reusable frontend hooks
- lib: API client layer, auth context, mock data, utilities
- public: static assets and icons
- styles: global style assets
- SYSTEM_UPGRADE.md: architecture and upgrade notes
- INTEGRATION_GUIDE.md: integration-level guide
- IMPROVEMENT_SUMMARY.md: completed improvements summary
- QUICK_REFERENCE.md: quick command and feature reference
- PROJECT_DOCUMENTATION.md: project docs

App folder details:
- app/layout.tsx: root layout and global providers
- app/page.tsx: landing page with role-based redirect logic
- app/login/page.tsx: login page using real backend auth
- app/signup/page.tsx: signup page using real backend register plus auto-login
- app/coordinator/layout.tsx: NGO role-protected layout
- app/coordinator/dashboard/page.tsx: API-driven NGO dashboard (stats, requests, matching, assignment)
- app/coordinator/requests/page.tsx: NGO requests view currently using mock data
- app/coordinator/volunteers/page.tsx: NGO volunteers view currently using mock data
- app/coordinator/analytics/page.tsx: NGO analytics view currently using mock data
- app/volunteer/layout.tsx: Volunteer role-protected layout
- app/volunteer/portal/page.tsx: API-driven volunteer portal (recommended plus nearby)
- app/volunteer/available/page.tsx: volunteer available opportunities page currently using mock data
- app/volunteer/profile/page.tsx: volunteer profile page currently using mock data

Components folder details:
- components/protected-layout.tsx: auth and role route guard
- components/sidebar.tsx: role-aware navigation sidebar
- components/ngo-match-display.tsx: NGO candidate ranking and score breakdown display
- components/volunteer-recommended.tsx: best-match task card for volunteer
- components/volunteer-nearby.tsx: nearby tasks list for volunteer
- components/ui: shadcn UI primitives

Lib folder details:
- lib/api.ts: centralized frontend API layer by domain
- lib/auth-context.tsx: authentication context, persistence, login/register/logout
- lib/mock-data.ts: temporary mock datasets used in pages not yet fully API-driven
- lib/utils.ts: utility helpers

Backend folder details:
- backend/app/main.py: FastAPI app bootstrap and router registration
- backend/app/core/config.py: environment-based settings
- backend/app/db/database.py: SQLAlchemy engine, session, base, db dependency
- backend/app/models/models.py: SQLAlchemy models and relationships
- backend/app/schemas/schemas.py: Pydantic request and response schemas
- backend/app/services/matching.py: matching and score logic
- backend/app/utils/geo.py: distance math and distance score conversion
- backend/app/routes/auth.py: auth APIs
- backend/app/routes/volunteers.py: volunteer APIs
- backend/app/routes/requests.py: request APIs
- backend/app/routes/assignments.py: assignment APIs
- backend/app/routes/matching.py: matching APIs
- backend/app/routes/dashboard.py: dashboard APIs
- backend/app/routes/volunteer_portal.py: volunteer recommendation and nearby APIs
- backend/seed.py: demo seed script
- backend/requirements.txt: backend dependencies

## Database Schema (Current)
Tables and key columns:
1. users
- id, name, email unique, password_hash, role ngo or volunteer, created_at, updated_at

2. volunteers
- id, user_id unique foreign key to users
- latitude, longitude
- skills array
- is_available
- reliability_score
- tasks_completed
- tasks_rejected
- created_at, updated_at

3. requests
- id
- type medical food rescue construction logistics counseling
- title, description
- latitude, longitude
- urgency 1 to 5
- status pending assigned completed
- volunteers_needed
- created_by foreign key to users
- deadline
- created_at, updated_at

4. assignments
- id
- request_id foreign key
- volunteer_id foreign key
- match_score
- status assigned accepted rejected completed
- assigned_at, accepted_at, rejected_at, completed_at
- created_at, updated_at

Relationships:
- User one-to-one Volunteer
- User one-to-many Requests
- Request one-to-many Assignments
- Volunteer one-to-many Assignments

## Matching Logic (Current)
Weighted score formula:
- Skill 40 percent
- Distance 25 percent
- Urgency 20 percent
- Reliability 15 percent

Key behavior:
- Volunteers filtered by availability
- Already assigned volunteers excluded for same request where relevant
- Distance threshold is 25 km
- Score breakdown returned in response as:
  - skill
  - distance
  - urgency
  - reliability
- Failure case included when no candidates are found:
  - success false
  - message with escalation note

## Backend APIs (Current)
Health:
- GET /
- GET /health

Auth:
- POST /auth/register
- POST /auth/login

Volunteers:
- POST /volunteers?user_id=
- GET /volunteers
- GET /volunteers/{volunteer_id}
- PATCH /volunteers/{volunteer_id}

Requests:
- POST /requests?user_id=
- GET /requests
- GET /requests/{request_id}
- PATCH /requests/{request_id}

Assignments:
- POST /assignments/{assignment_id}/accept
- POST /assignments/{assignment_id}/reject
- POST /assignments/{assignment_id}/complete
- GET /assignments/{assignment_id}

Matching:
- POST /match/{request_id}?limit=
- POST /match/assign/{request_id}

Volunteer portal:
- GET /volunteer/recommended?volunteer_id=
- GET /volunteer/nearby?volunteer_id=&latitude=&longitude=&limit=
- GET /volunteer/tasks?volunteer_id=&status_filter=

Dashboard:
- GET /dashboard/stats
- GET /dashboard/heatmap

## Frontend API Layer (Current)
The frontend API layer is centralized in lib/api.ts and grouped into:
- authAPI
- volunteerAPI
- requestAPI
- matchingAPI
- assignmentAPI
- dashboardAPI

Auth base URL behavior:
- Uses NEXT_PUBLIC_API_URL if set
- Falls back to http://127.0.0.1:8000

## What Has Already Been Completed

### Backend completed
1. Volunteer portal routes added:
- GET /volunteer/recommended
- GET /volunteer/nearby
- GET /volunteer/tasks

2. Matching route improvements completed:
- score breakdown in responses
- success and message fields
- failure handling path

3. Router integration completed in backend app main.

### Frontend completed
1. Central API layer completed.
2. Auth context completed with localStorage persistence.
3. Protected role layouts completed.
4. Role-aware sidebar completed.
5. NGO match display component completed.
6. Volunteer recommended component completed.
7. Volunteer nearby component completed.
8. Root layout integrated with AuthProvider.
9. Landing page role-aware redirect completed.
10. Coordinator dashboard integrated with real APIs.
11. Volunteer portal integrated with real APIs.
12. Login and signup connected to real backend auth flow.

### Bugs fixed already
1. Parsing and build errors fixed by removing duplicated stale JSX blocks from:
- app/page.tsx
- app/coordinator/dashboard/page.tsx
- app/volunteer/portal/page.tsx

2. Authentication issue fixed:
- Login and signup were previously mock redirect behavior
- Now they call real auth context and backend APIs
- Session state is persisted, protected routes now work

3. Validation completed:
- frontend build passes
- backend reachable
- register plus login tested successfully end-to-end

## Current Runtime Behavior

Public pages:
- Landing page
- Login page
- Signup page

NGO role:
- Can access coordinator dashboard
- Dashboard loads stats and recent requests
- NGO can select request and view matching volunteers
- NGO can auto-assign best volunteer
- UI shows match score breakdown and reason

Volunteer role:
- Can access volunteer portal
- Portal loads recommended task
- Portal loads nearby opportunities
- UI shows score, reason, and distance

## Current Known Pending Items
The following are not fully API-driven and still rely on mock data or local-only behavior:
- app/coordinator/requests/page.tsx
- app/coordinator/volunteers/page.tsx
- app/coordinator/analytics/page.tsx
- app/volunteer/available/page.tsx
- app/volunteer/profile/page.tsx

Also pending:
- wire volunteer apply and accept actions to assignment APIs
- persist volunteer profile updates via volunteer update API
- harden production-grade validation and error states

## Constraints For Next Improvements
1. Do not change core stack.
2. Keep strict role separation.
3. Keep transparent score breakdown in UI.
4. Prefer minimal, safe, incremental changes.
5. After each implementation, always provide:
- files changed
- why each file changed
- exact behavior changes
- test steps

Now acknowledge this as the baseline current state.
Do not rewrite existing architecture from scratch.
Wait for my improvement requests and then implement step by step.

END PROMPT
