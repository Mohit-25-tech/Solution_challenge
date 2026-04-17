# VolunteerMatch - Complete Project Documentation

## PROJECT OVERVIEW

**VolunteerMatch** is a smart volunteer coordination platform that intelligently matches volunteers with disaster relief requests based on skills, location, reliability, and urgency. The system helps NGOs efficiently allocate resources and volunteers during emergencies.

**Tech Stack:**
- **Frontend**: Next.js 16.2 + TypeScript + React + shadcn/ui components
- **Backend**: FastAPI + SQLAlchemy ORM
- **Database**: PostgreSQL 18
- **Authentication**: JWT Tokens
- **Password Hashing**: bcrypt

---

## PART 1: PROJECT STRUCTURE

```
Solution_challenge/
├── app/                          # FRONTEND (Next.js Application)
│   ├── layout.tsx               # Root layout wrapper
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   │
│   ├── login/
│   │   └── page.tsx             # User login page
│   │
│   ├── signup/
│   │   └── page.tsx             # User registration page
│   │
│   ├── coordinator/             # NGO Coordinator Dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Main dashboard with stats
│   │   ├── requests/
│   │   │   └── page.tsx         # Manage volunteer requests
│   │   ├── volunteers/
│   │   │   └── page.tsx         # View available volunteers
│   │   ├── analytics/
│   │   │   └── page.tsx         # Request analytics and heatmap
│   │   └── assignments/
│   │       └── page.tsx         # View assigned volunteers
│   │
│   └── volunteer/               # Volunteer Portal
│       ├── portal/
│       │   └── page.tsx         # Volunteer task assignments
│       ├── available/
│       │   └── page.tsx         # Available tasks to accept
│       └── profile/
│           └── page.tsx         # Volunteer profile management
│
├── components/                   # Reusable React Components
│   ├── theme-provider.tsx       # Dark/Light theme support
│   └── ui/                      # shadcn/ui Component Library
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── form.tsx
│       ├── dialog.tsx
│       ├── toast.tsx
│       ├── chart.tsx            # Chart/graph components
│       └── ... (50+ UI components)
│
├── hooks/                        # Custom React Hooks
│   ├── use-mobile.ts            # Detect mobile viewport
│   └── use-toast.ts             # Toast notification hook
│
├── lib/                         # Utility Functions
│   ├── utils.ts                 # Common helper functions
│   └── mock-data.ts             # Demo/seed data
│
├── styles/
│   └── globals.css              # Global CSS
│
├── backend/                     # BACKEND (FastAPI Application)
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── __init__.py
│   │   │
│   │   ├── core/
│   │   │   └── config.py        # Environment & settings configuration
│   │   │
│   │   ├── db/
│   │   │   └── database.py      # SQLAlchemy setup & connection
│   │   │
│   │   ├── models/
│   │   │   └── models.py        # SQLAlchemy ORM Models
│   │   │                         # - User, Volunteer, Request, Assignment
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py      # Pydantic schemas exports
│   │   │   ├── user.py          # User schemas
│   │   │   ├── volunteer.py     # Volunteer schemas
│   │   │   ├── request.py       # Request schemas
│   │   │   └── assignment.py    # Assignment schemas
│   │   │
│   │   ├── routes/              # API Route Handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Authentication routes
│   │   │   ├── volunteers.py    # Volunteer CRUD routes
│   │   │   ├── requests.py      # Request CRUD routes
│   │   │   ├── matching.py      # Matching engine routes
│   │   │   ├── assignments.py   # Assignment management routes
│   │   │   └── dashboard.py     # Dashboard stats/analytics routes
│   │   │
│   │   ├── services/
│   │   │   └── matching.py      # Core matching algorithm logic
│   │   │
│   │   └── utils/
│   │       └── geo.py           # Geographic distance calculations
│   │
│   ├── .env                     # Environment variables
│   ├── requirements.txt         # Python dependencies
│   ├── seed.py                  # Database seeding script
│   ├── setup_db.bat             # Windows DB setup (batch)
│   └── README.md
│
├── package.json                 # Frontend dependencies
├── tsconfig.json                # TypeScript configuration
├── next.config.mjs              # Next.js configuration
├── components.json              # shadcn/ui config
├── postcss.config.mjs           # PostCSS/Tailwind config
├── README.md                    # Root project documentation
└── pnpm-lock.yaml              # Dependency lock file
```

---

## PART 2: DATABASE SCHEMA & MODELS

### Database Overview
- **Database Name**: `volunteer_db`
- **User**: `volunteer_user`
- **Password**: `volunteer_pass`
- **Connection**: `postgresql+psycopg://volunteer_user:volunteer_pass@localhost:5432/volunteer_db`

### Core Tables

#### 1. **USERS Table**
Stores all user accounts (NGOs and Volunteers)

```
users
├── id (Primary Key)
├── name (String)
├── email (Unique)
├── password_hash (bcrypt hash)
├── role (Enum: 'ngo', 'volunteer')
├── created_at (DateTime)
└── updated_at (DateTime)

Relationships:
- One-to-Many: users → requests (NGO creates requests)
- One-to-One: users → volunteers (Volunteer profile)
```

**Usage Example:**
- NGO account: `ngo@demo.com` password: `demo123`
- Volunteer account: `volunteer1@demo.com` password: `demo123`

---

#### 2. **VOLUNTEERS Table**
Stores volunteer profile information and tracking

```
volunteers
├── id (Primary Key)
├── user_id (Foreign Key → users.id)
├── latitude (Float)
├── longitude (Float)
├── skills (Array of Strings)
│   └── Examples: ["medical training", "first aid", "logistics"]
├── is_available (Boolean)
├── reliability_score (Float: 0.0-1.0)
│   └── Increases with task completion, decreases with rejection
├── tasks_completed (Integer)
├── tasks_rejected (Integer)
├── created_at (DateTime)
└── updated_at (DateTime)

Relationships:
- Many-to-One: volunteers → users
- One-to-Many: volunteers → assignments
```

**Demo Data:**
- 50 volunteer profiles pre-seeded
- Located in Bay Area (coordinates)
- Skills: medical, logistics, rescue, counseling, etc.
- Reliability scores: 0.7-0.97

---

#### 3. **REQUESTS Table**
Stores volunteer requests created by NGOs

```
requests
├── id (Primary Key)
├── type (Enum: 'medical', 'food', 'rescue', 'construction', 'logistics', 'counseling')
├── title (String)
├── description (Text)
├── latitude (Float)
├── longitude (Float)
├── urgency (Integer: 1-5 scale)
│   └── 5 = Critical, 1 = Low priority
├── status (Enum: 'pending', 'assigned', 'completed')
├── volunteers_needed (Integer)
├── created_by (Foreign Key → users.id)
├── deadline (DateTime - optional)
├── created_at (DateTime)
└── updated_at (DateTime)

Relationships:
- Many-to-One: requests → users (created_by)
- One-to-Many: requests → assignments
```

**Demo Data:**
- 15 requests pre-seeded
- Distributed across 6 types
- Various urgency levels (1-5)

---

#### 4. **ASSIGNMENTS Table**
Tracks volunteer assignments to requests (linking table)

```
assignments
├── id (Primary Key)
├── request_id (Foreign Key → requests.id)
├── volunteer_id (Foreign Key → volunteers.id)
├── match_score (Float: 0.0-1.0)
│   └── Quality score from matching algorithm
├── status (Enum: 'assigned', 'accepted', 'rejected', 'completed')
├── assigned_at (DateTime)
├── accepted_at (DateTime)
├── completed_at (DateTime)
├── rejected_at (DateTime)
├── created_at (DateTime)
└── updated_at (DateTime)

Relationships:
- Many-to-One: assignments → requests
- Many-to-One: assignments → volunteers
```

**State Machine:**
```
assigned → accepted → completed
    ↓
  rejected
```

---

### Enums

```python
UserRole:
  - "ngo"
  - "volunteer"

RequestType:
  - "medical"
  - "food"
  - "rescue"
  - "construction"
  - "logistics"
  - "counseling"

RequestStatus:
  - "pending"      # Not yet assigned
  - "assigned"     # Volunteers assigned
  - "completed"    # Request fulfilled

AssignmentStatus:
  - "assigned"     # Initial state
  - "accepted"     # Volunteer accepted
  - "rejected"     # Volunteer rejected
  - "completed"    # Task completed
```

---

## PART 3: FRONTEND APPLICATION

### Pages & Routes

#### **Public Pages** (No authentication required)
- `/` - Home page
- `/login` - User login
- `/signup` - User registration

#### **NGO Coordinator Pages** (`/coordinator/*`)
Protected routes for NGO users to manage requests.

**1. `/coordinator/dashboard`**
- Overview of all requests and volunteers
- Key statistics:
  - Total volunteers available
  - Active requests (pending + assigned)
  - Completed tasks
  - Average volunteer reliability
  - Pending assignments count
- **Components**: Stats cards, charts, activity feeds

**2. `/coordinator/requests`**
- Create new volunteer requests
- View all requests with status filters
- Edit request details
- Monitor request status lifecycle
- **Features**:
  - Request type selection (medical, food, rescue, etc.)
  - Set location (latitude/longitude)
  - Urgency level (1-5 scale)
  - Number of volunteers needed
  - Deadline setting

**3. `/coordinator/volunteers`**
- Browse all available volunteers
- Filter by skills
- View volunteer profiles
- See reliability scores
- **Columns**: Name, Skills, Distance, Availability, Reliability Score

**4. `/coordinator/analytics`**
- Geographic heatmap of volunteers & requests
- Request analytics and trends
- Volunteer performance metrics
- Response time statistics
- **Visualizations**: Maps, Charts, Graphs

**5. `/coordinator/assignments`**
- View all task assignments
- Monitor acceptance status
- See match scores for each assignment
- Track completion status
- Accept/reject actions

#### **Volunteer Pages** (`/volunteer/*`)
Protected routes for volunteer users.

**1. `/volunteer/portal`**
- View assigned tasks
- Tasks assigned to the volunteer
- Status: accepted, pending, rejected, completed
- Deadline information
- **Actions**: Accept, Reject, Mark Complete

**2. `/volunteer/available`**
- Browse available tasks matching their skills
- Filter by:
  - Task type
  - Distance
  - Urgency
- **Display**: Match score, distance, urgency, required skills

**3. `/volunteer/profile`**
- Edit volunteer profile
- Update location (latitude/longitude)
- Add/remove skills
- Update availability status
- View reliability score history

---

### Frontend Dependencies & Components

**Key UI Libraries Installed:**
```json
{
  "@radix-ui": "50+ components",
  "next": "^16.2.0",
  "react": "latest",
  "next-themes": "Dark/Light mode",
  "@hookform/resolvers": "Form validation",
  "lucide-react": "Icon library",
  "class-variance-authority": "Component styling",
  "date-fns": "Date utilities",
  "embla-carousel": "Carousel component"
}
```

**Custom Hooks:**
- `use-mobile`: Detect mobile viewport for responsive design
- `use-toast`: Toast notification system

**Styling:**
- Tailwind CSS
- shadcn/ui component system
- PostCSS for processing

---

## PART 4: BACKEND API ENDPOINTS

### API Base URL
```
http://127.0.0.1:8000
```

### Swagger Documentation
```
http://127.0.0.1:8000/docs
```

---

### **1. AUTHENTICATION ROUTES** (`/auth`)

#### **POST /auth/register**
Register a new user

```
Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "role": "volunteer"  // or "ngo"
}

Response (200 OK):
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "volunteer",
  "created_at": "2026-04-17T10:30:00"
}

Errors:
- 400: Email already registered
- 422: Validation error
```

#### **POST /auth/login**
Login user and get JWT token

```
Request Body:
{
  "email": "ngo@demo.com",
  "password": "demo123"
}

Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Demo NGO",
    "email": "ngo@demo.com",
    "role": "ngo"
  }
}

Errors:
- 401: Invalid email or password
```

---

### **2. VOLUNTEER ROUTES** (`/volunteers`)

#### **POST /volunteers**
Create volunteer profile (after user registration)

```
Request Body:
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "skills": ["medical training", "first aid", "logistics"],
  "is_available": true
}

Query Parameters:
- user_id: 5 (required)

Response (200 OK):
{
  "id": 1,
  "user_id": 5,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "skills": ["medical training", "first aid", "logistics"],
  "is_available": true,
  "reliability_score": 1.0,
  "tasks_completed": 0,
  "tasks_rejected": 0
}

Errors:
- 404: User not found
- 400: Volunteer profile already exists
```

#### **GET /volunteers**
Get all volunteers with pagination

```
Query Parameters:
- skip: 0 (default)
- limit: 100 (default, max 100)

Response (200 OK):
[
  {
    "id": 1,
    "user_id": 5,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "skills": ["medical training"],
    "is_available": true,
    "reliability_score": 0.95
  },
  // ... more volunteers
]
```

#### **GET /volunteers/{volunteer_id}**
Get specific volunteer profile

```
Path Parameters:
- volunteer_id: 5

Response (200 OK):
{
  "id": 5,
  "user_id": 10,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "skills": ["rescue", "construction"],
  "is_available": true,
  "reliability_score": 0.87,
  "tasks_completed": 8,
  "tasks_rejected": 1
}
```

#### **PATCH /volunteers/{volunteer_id}**
Update volunteer profile

```
Path Parameters:
- volunteer_id: 5

Request Body (all optional):
{
  "latitude": 37.7800,
  "longitude": -122.4100,
  "skills": ["medical training", "first aid", "counseling"],
  "is_available": false
}

Response (200 OK):
{
  "id": 5,
  "user_id": 10,
  "latitude": 37.7800,
  "longitude": -122.4100,
  "skills": ["medical training", "first aid", "counseling"],
  "is_available": false,
  "reliability_score": 0.87
}
```

---

### **3. REQUEST ROUTES** (`/requests`)

#### **POST /requests**
Create a new volunteer request (NGO only)

```
Request Body:
{
  "type": "medical",
  "title": "Medical Assistance Needed",
  "description": "Required healthcare support for affected area",
  "latitude": 37.8044,
  "longitude": -122.2712,
  "urgency": 5,
  "volunteers_needed": 3,
  "deadline": "2026-04-18T18:00:00"
}

Query Parameters:
- user_id: 1 (NGO creating request)

Response (200 OK):
{
  "id": 1,
  "type": "medical",
  "title": "Medical Assistance Needed",
  "description": "Required healthcare support for affected area",
  "latitude": 37.8044,
  "longitude": -122.2712,
  "urgency": 5,
  "status": "pending",
  "volunteers_needed": 3,
  "created_by": 1,
  "created_at": "2026-04-17T12:30:00"
}

Errors:
- 404: User not found
- 400: Urgency must be between 1-5, Validation errors
```

#### **GET /requests**
Get all requests with optional filters

```
Query Parameters:
- skip: 0 (default)
- limit: 100 (default)
- status_filter: "pending" (optional)
  Options: "pending", "assigned", "completed"

Response (200 OK):
[
  {
    "id": 1,
    "type": "medical",
    "title": "Medical Assistance",
    "latitude": 37.8044,
    "longitude": -122.2712,
    "urgency": 5,
    "status": "pending",
    "volunteers_needed": 3
  },
  // ... more requests
]
```

#### **GET /requests/{request_id}**
Get specific request with details

```
Path Parameters:
- request_id: 1

Response (200 OK):
{
  "id": 1,
  "type": "medical",
  "title": "Medical Assistance Needed",
  "description": "Full description...",
  "latitude": 37.8044,
  "longitude": -122.2712,
  "urgency": 5,
  "status": "pending",
  "volunteers_needed": 3,
  "created_by": 1,
  "deadline": "2026-04-18T18:00:00",
  "created_at": "2026-04-17T12:30:00",
  "assignments": [
    {
      "id": 10,
      "volunteer_id": 5,
      "status": "accepted",
      "match_score": 0.89
    }
  ]
}
```

#### **PATCH /requests/{request_id}**
Update request status or details

```
Path Parameters:
- request_id: 1

Request Body (all optional):
{
  "status": "assigned",
  "urgency": 4,
  "volunteers_needed": 2
}

Response (200 OK):
{
  "id": 1,
  "status": "assigned",
  "urgency": 4,
  "volunteers_needed": 2
}
```

---

### **4. MATCHING ROUTES** (`/match`)

#### **POST /match/{request_id}**
Get ranked list of matching volunteers for a request

```
Path Parameters:
- request_id: 1

Query Parameters:
- limit: 10 (default, max results)

Response (200 OK):
{
  "request_id": 1,
  "candidates": [
    {
      "volunteer_id": 5,
      "volunteer_name": "Alice Johnson",
      "match_score": 0.92,
      "reason": "has medical expertise; nearby; highly reliable",
      "distance_km": 3.45,
      "volunteer": {
        "id": 5,
        "skills": ["medical training", "first aid"],
        "reliability_score": 0.96,
        "is_available": true
      }
    },
    {
      "volunteer_id": 8,
      "volunteer_name": "Bob Smith",
      "match_score": 0.78,
      "reason": "reasonable distance; reliable",
      "distance_km": 8.92,
      "volunteer": {
        "id": 8,
        "skills": ["logistics", "medical training"],
        "reliability_score": 0.85,
        "is_available": true
      }
    }
  ]
}

Errors:
- 404: Request not found
```

#### **POST /match/assign/{request_id}**
Auto-assign the best matching volunteer to a request

```
Path Parameters:
- request_id: 1

Response (200 OK - Success):
{
  "success": true,
  "assignment_id": 45,
  "volunteer_id": 5,
  "match_score": 0.92,
  "message": "Successfully assigned Alice Johnson (score: 0.92)"
}

Response (200 OK - Failure):
{
  "success": false,
  "message": "No matching volunteers available"
  // OR
  "message": "Request already fully assigned"
  // OR
  "message": "Request not found"
}
```

---

### **5. ASSIGNMENT ROUTES** (`/assignments`)

#### **GET /assignments**
Get all assignments with optional filters

```
Query Parameters:
- skip: 0 (default)
- limit: 100 (default)
- status_filter: "accepted" (optional)
  Options: "assigned", "accepted", "rejected", "completed"

Response (200 OK):
[
  {
    "id": 45,
    "request_id": 1,
    "volunteer_id": 5,
    "match_score": 0.92,
    "status": "accepted",
    "assigned_at": "2026-04-17T12:35:00",
    "accepted_at": "2026-04-17T13:00:00"
  }
]
```

#### **GET /assignments/{assignment_id}**
Get specific assignment

```
Path Parameters:
- assignment_id: 45

Response (200 OK):
{
  "id": 45,
  "request_id": 1,
  "volunteer_id": 5,
  "match_score": 0.92,
  "status": "accepted",
  "assigned_at": "2026-04-17T12:35:00",
  "accepted_at": "2026-04-17T13:00:00",
  "completed_at": null,
  "rejected_at": null
}
```

#### **PATCH /assignments/{assignment_id}**
Update assignment status

```
Path Parameters:
- assignment_id: 45

Request Body:
{
  "status": "completed"
}

Response (200 OK):
{
  "id": 45,
  "status": "completed",
  "completed_at": "2026-04-17T18:30:00"
}

Status Transitions:
- assigned → accepted
- assigned → rejected
- accepted → completed
- accepted → rejected
```

---

### **6. DASHBOARD ROUTES** (`/dashboard`)

#### **GET /dashboard/stats**
Get dashboard statistics

```
Response (200 OK):
{
  "total_volunteers": 50,
  "active_requests": 8,
  "completed_tasks": 23,
  "total_assignments": 45,
  "average_reliability": 0.87,
  "pending_assignments": 12
}
```

#### **GET /dashboard/heatmap**
Get heatmap data for map visualization

```
Response (200 OK):
{
  "volunteers": [
    {
      "volunteer_id": 5,
      "latitude": 37.7749,
      "longitude": -122.4194,
      "skills": ["medical training", "first aid"],
      "is_available": true,
      "reliability_score": 0.96
    }
  ],
  "requests": [
    {
      "request_id": 1,
      "latitude": 37.8044,
      "longitude": -122.2712,
      "type": "medical",
      "urgency": 5,
      "status": "pending"
    }
  ]
}
```

---

## PART 5: MATCHING ALGORITHM LOGIC

### Algorithm Overview

The matching algorithm intelligently ranks volunteers for requests using a weighted scoring formula:

```
MATCH_SCORE = 0.4*skill + 0.25*proximity + 0.2*urgency + 0.15*reliability
```

### Weight Breakdown
- **40% - Skill Match**: Most important factor
- **25% - Proximity**: Distance-based matching
- **20% - Urgency**: Request priority level
- **15% - Reliability**: Volunteer track record

---

### 1. **Skill Score Calculation**

```python
def calculate_skill_score(volunteer_skills, request_type):
    """
    Returns:
    - 1.0 = Exact skill match (volunteer has required skill)
    - 0.6 = Related skill match (relevant to request type)
    - 0.2 = No skill match
    """
```

**Skill Relevance Mapping:**
```
medical      → ["medical training", "first aid", "nursing", "healthcare"]
food         → ["logistics", "supply chain", "organization", "cooking"]
rescue       → ["construction", "heavy equipment", "leadership", "rescue"]
construction → ["construction", "heavy equipment", "leadership"]
logistics    → ["logistics", "supply chain", "organization"]
counseling   → ["counseling", "mental health", "social services"]
```

**Example:**
- Request type: `medical`
- Volunteer skills: `["medical training", "logistics"]`
- Result: Match found on "medical training" → **Score: 1.0**

---

### 2. **Proximity Score Calculation**

**Uses Haversine formula** to calculate distance between two coordinates:

```python
def calculate_proximity_score(volunteer_lat, volunteer_lon, 
                             request_lat, request_lon, 
                             max_distance=25):
    """
    Filters volunteers outside 25km radius → score = 0.0
    
    For within 25km:
    score = 1 - (distance_km / 25)
    
    Examples:
    - 0km (same location) → 1.0
    - 5km → 0.8
    - 12.5km → 0.5
    - 20km → 0.2
    - 25km+ → 0.0 (filtered out)
    """
```

**Geographic Constraint:**
- Maximum matching distance: **25 km**
- Volunteers > 25km from request are **excluded** from matches

---

### 3. **Urgency Score Calculation**

```python
def calculate_urgency_score(urgency):
    """
    urgency_score = urgency / 5
    
    Scale 1-5:
    - 1 (low) → 0.2
    - 2 → 0.4
    - 3 (medium) → 0.6
    - 4 → 0.8
    - 5 (critical) → 1.0
    """
```

---

### 4. **Reliability Score**

```python
volunteer.reliability_score (0.0 - 1.0)

Increases by: +0.05 per task completion
Decreases by: -0.10 per task rejection
Range: Clamped to [0.0, 1.0]

Default: 1.0 (new volunteers)
```

**Example Timeline:**
1. New volunteer: `reliability = 1.0`
2. Completes task: `reliability = 1.0` (already max)
3. Completes 5 more tasks: `reliability = 1.0` (stays at max)
4. Rejects 1 task: `reliability = 0.90`
5. Completes 1 task: `reliability = 0.95`
6. Rejects 2 tasks: `reliability = 0.75`

---

### 5. **Final Match Score Formula**

```
MATCH_SCORE = (0.4 × skill_score) + 
              (0.25 × proximity_score) + 
              (0.2 × urgency_score) + 
              (0.15 × reliability_score)

Range: 0.0 - 1.0
```

### **Full Example Calculation:**

**Request:**
- Type: `medical`
- Location: (37.8044, -122.2712)
- Urgency: 5

**Volunteer:**
- Skills: ["medical training", "logistics"]
- Location: (37.7749, -122.4194)
- Reliability: 0.95

**Step 1: Skill Score**
- Volunteer has "medical training" for "medical" request
- **Skill Score = 1.0**

**Step 2: Proximity Score**
- Haversine distance: 8.5 km
- Within 25km ✓
- Proximity Score = 1 - (8.5/25) = 1 - 0.34 = **0.66**

**Step 3: Urgency Score**
- Urgency 5 / 5 = **1.0**

**Step 4: Reliability Score**
- **Reliability = 0.95**

**Step 5: Final Match Score**
```
MATCH = (0.4 × 1.0) + (0.25 × 0.66) + (0.2 × 1.0) + (0.15 × 0.95)
      = 0.4 + 0.165 + 0.2 + 0.1425
      = 0.9075
      = 0.91 (rounded)
```

---

### 6. **Match Reason Generation**

The algorithm generates human-readable explanations:

```
Factors included in reason string:
✓ "has {request_type} expertise"      (if skill match)
✓ "nearby"                             (if < 5km)
✓ "reasonable distance"                (if < 15km)
✓ "highly reliable"                    (if reliability > 0.95)
✓ "reliable"                           (if reliability > 0.8)

Example outputs:
- "has medical expertise; nearby; highly reliable"
- "reasonable distance; reliable"
- "acceptable match"
```

---

### 7. **Candidate Ranking**

```
Steps:
1. Query all available volunteers (is_available = true)
2. Exclude already-assigned volunteers
3. Filter by geographic distance (> 25km excluded)
4. Calculate match score for each
5. Sort by match_score (descending)
6. Return top N candidates (limit parameter)

Result: List of MatchCandidate objects ranked by quality
```

---

## PART 6: COMPLETE DATA FLOW

### User Journey: NGO Creates Request & Matches Volunteers

```
┌─────────────────────────────────────────────────────────────┐
│                   NGO Coordinator                            │
│                                                              │
│  1. Login → POST /auth/login                               │
│     Response: JWT access_token                              │
│                                                              │
│  2. Create Request → POST /requests                         │
│     Body: {                                                 │
│       type: "medical",                                      │
│       title: "Emergency Medical Help",                      │
│       latitude: 37.8044,                                    │
│       longitude: -122.2712,                                 │
│       urgency: 5,                                           │
│       volunteers_needed: 3                                  │
│     }                                                       │
│     Response: Request ID = 1, status: "pending"            │
│                                                              │
│  3. Find Matches → POST /match/1?limit=10                  │
│     Response: List of 10 ranked candidate volunteers        │
│                                                              │
│  4. Auto-Assign Best → POST /match/assign/1                │
│     Response: Assignment created, volunteer assigned        │
│                                                              │
│  5. View Stats → GET /dashboard/stats                      │
│     Response: Total volunteers, active requests, etc.       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### User Journey: Volunteer Accepts Assignment

```
┌─────────────────────────────────────────────────────────────┐
│                      Volunteer                              │
│                                                              │
│  1. Login → POST /auth/login                               │
│     Response: JWT access_token                              │
│                                                              │
│  2. View Available Tasks → GET /requests                   │
│     (Tasks within 25km, matching skills)                   │
│                                                              │
│  3. Get Task Details → GET /requests/1                     │
│     View all assignments for this request                   │
│                                                              │
│  4. Accept Assignment → PATCH /assignments/45              │
│     Body: { status: "accepted" }                           │
│     Updates requested_at timestamp                         │
│                                                              │
│  5. Complete Task → PATCH /assignments/45                  │
│     Body: { status: "completed" }                          │
│     Reliability score +0.05                                │
│                                                              │
│  6. Update Profile → PATCH /volunteers/5                  │
│     Update location, skills, availability                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 7: AUTHENTICATION & SECURITY

### JWT Token Flow

```
1. User Registration
   POST /auth/register
   → Password hashed with bcrypt
   → User stored in database

2. User Login
   POST /auth/login
   → Email & password verified with bcrypt.checkpw()
   → JWT token generated with user ID & email
   → Token expires in 15 minutes (configurable)

3. Subsequent Requests
   Header: Authorization: Bearer {access_token}
   → Token validated with jose library
   → User ID extracted from token claims
   → Request processed with user context
```

### Password Security

```python
# Hashing (on registration)
password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

# Verification (on login)
is_valid = bcrypt.checkpw(plain_password.encode("utf-8"), hashed.encode("utf-8"))

# Properties:
- One-way hashing
- Salt included
- Cannot reverse to plaintext
- Resistant to rainbow tables
```

---

## PART 8: DEMO DATA

### Pre-seeded Data (from seed.py)

**50 Volunteer Profiles:**
- Names: volunteer1, volunteer2, volunteer3, ... volunteer50
- Email: volunteer{N}@demo.com
- Password: demo123
- Location: Bay Area (37.0° to 38.0° latitude, -123.0° to -121.0° longitude)
- Skills: Various combinations (medical, logistics, rescue, counseling, etc.)
- Reliability Score: 0.7 to 0.97
- Availability: All available

**15 Requests:**
- Types: medical (3), food (2), rescue (3), construction (2), logistics (3), counseling (2)
- Locations: Distributed across Bay Area
- Urgency: Varied (1-5 scale)
- Volunteers Needed: 1-3 each
- Status: All pending (before any assignments)

**1 NGO Organization:**
- Name: Demo NGO
- Email: ngo@demo.com
- Password: demo123

---

## PART 9: PROJECT SETUP & EXECUTION

### Prerequisites
```
- Node.js 20+ (or 22 LTS)
- Python 3.11+ (tested with 3.14)
- PostgreSQL 18
```

### Environment Setup

**1. PostgreSQL Setup**
```powershell
# Start PostgreSQL service
Start-Service postgresql-x64-18

# Create database and user (if not done)
cd backend
.\setup_db.bat
```

**2. Backend Setup**
```powershell
cd backend
python -m pip install -r requirements.txt

# Seed demo data
python seed.py

# Run backend
uvicorn app.main:app --reload
# or from project root:
uvicorn --app-dir backend app.main:app --reload
```

**3. Frontend Setup**
```powershell
npm install
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **Swagger Docs**: http://127.0.0.1:8000/docs
- **Database**: postgresql://volunteer_user:volunteer_pass@localhost:5432/volunteer_db

---

## PART 10: KEY FILES OVERVIEW

| File | Purpose  |
|------|---------|
| `backend/app/main.py` | FastAPI initialization, route registration |
| `backend/app/models/models.py` | SQLAlchemy ORM models (User, Volunteer, Request, Assignment) |
| `backend/app/services/matching.py` | Core matching algorithm implementation |
| `backend/app/routes/*.py` | 6 route modules (auth, volunteers, requests, matching, assignments, dashboard) |
| `backend/app/core/config.py` | Environment variables & settings |
| `backend/requirements.txt` | Python dependencies |
| `backend/seed.py` | Database seeding script |
| `app/layout.tsx` | Root layout wrapper |
| `app/coordinator/*` | NGO dashboard pages |
| `app/volunteer/*` | Volunteer portal pages |
| `components/ui/*` | shadcn/ui component library |
| `package.json` | Frontend dependencies |

---

## PART 11: COMMON WORKFLOWS

### Workflow 1: Create Request & Auto-Assign

```
1. NGO logs in with: ngo@demo.com / demo123
2. POST /requests with medical emergency details
3. GET /match/{request_id} to see candidates
4. POST /match/assign/{request_id} to auto-assign best
5. Volunteer gets assigned (status: "assigned")
6. Volunteer accepts/rejects on /volunteer/available
7. Upon completion, reliability score updates
```

### Workflow 2: Matching Algorithm in Action

```
Request: Medical, Urgency 5, at (37.8, -122.27)

Candidates ranked by score:
1. Volunteer 5: Score 0.92
   - Medical training (1.0)
   - 3.4km away (0.86)
   - Urgency 5 (1.0)
   - Reliability 0.95 (0.95)

2. Volunteer 12: Score 0.78
   - Logistics (0.6)
   - 8.9km away (0.64)
   - Urgency 5 (1.0)
   - Reliability 0.80 (0.80)

3. Volunteer 8: Score 0.65
   - First aid (0.6)
   - 15.2km away (0.39)
   - Urgency 5 (1.0)
   - Reliability 0.70 (0.70)
```

---

## SUMMARY

**VolunteerMatch** is a complete volunteer coordination platform with intelligent matching. The system:
- ✅ Matches volunteers by skills, distance, urgency & reliability
- ✅ Manages requests, assignments, and task tracking
- ✅ Provides NGO dashboard for resource management
- ✅ Offers volunteer portal for task acceptance
- ✅ Maintains volunteer reliability scoring
- ✅ Visualizes geographic distribution via heatmaps
- ✅ Generates actionable insights via analytics

**Core Features:** Smart matching, real-time assignment, reliability tracking, geographic filtering, role-based dashboards.

