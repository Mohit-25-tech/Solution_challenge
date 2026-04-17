# VolunteerMatch Backend API

Smart Volunteer Coordination System built with FastAPI and PostgreSQL.

## 🎯 Overview

A production-ready backend for matching volunteers with community service requests using an intelligent matching algorithm that considers:
- Skills alignment
- Geographic proximity
- Urgency levels
- Volunteer reliability scores

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- PostgreSQL 12+
- pip/virtualenv

### 1. Setup PostgreSQL Database

```bash
# On Windows (using PostgreSQL installer)
# OR via Docker:
docker run --name volunteer_db -e POSTGRES_Password=volunteer_pass -e POSTGRES_DB=volunteer_db -p 5432:5432 -d postgres:15

# Create database and user manually (if not using Docker):
psql -U postgres
CREATE DATABASE volunteer_db;
CREATE USER volunteer_user WITH PASSWORD 'volunteer_pass';
ALTER ROLE volunteer_user SET client_encoding TO 'utf8';
ALTER ROLE volunteer_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE volunteer_user SET default_transaction_level TO 2;
GRANT ALL PRIVILEGES ON DATABASE volunteer_db TO volunteer_user;
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Seed Demo Data

```bash
python seed.py
```

Output:
```
✅ Database seeded successfully!
   - 50 volunteers
   - 15 requests
   - 1 NGO organization
```

### 4. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit: http://localhost:8000/docs

---

## 📊 Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI app & setup
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── routes/              # API endpoints
│   │   ├── auth.py         # Authentication
│   │   ├── volunteers.py   # Volunteer management
│   │   ├── requests.py     # Request management
│   │   ├── assignments.py  # Assignment actions
│   │   ├── matching.py     # Matching engine
│   │   └── dashboard.py    # Dashboard stats
│   ├── services/
│   │   └── matching.py     # Matching algorithm
│   ├── db/
│   │   └── database.py     # Database config
│   ├── core/
│   │   └── config.py       # Settings
│   └── utils/
│       └── geo.py          # Geolocation utilities
├── seed.py                  # Demo data generator
├── requirements.txt         # Dependencies
└── README.md               # This file
```

---

## 🔌 API Endpoints

### Authentication
```
POST /auth/register
POST /auth/login
```

### Volunteers
```
POST   /volunteers              # Create volunteer profile
GET    /volunteers              # List all volunteers
GET    /volunteers/{id}         # Get volunteer details
PATCH  /volunteers/{id}         # Update volunteer profile
```

### Requests
```
POST   /requests               # Create request (NGO only)
GET    /requests               # List all requests
GET    /requests/{id}          # Get request details
PATCH  /requests/{id}          # Update request
```

### Matching
```
POST   /match/{request_id}          # Get ranked volunteers for request
POST   /match/assign/{request_id}   # Auto-assign best volunteer
```

### Assignments
```
POST   /assignments/{id}/accept     # Volunteer accepts task
POST   /assignments/{id}/reject     # Volunteer rejects task
POST   /assignments/{id}/complete   # Mark task as completed
GET    /assignments/{id}            # Get assignment details
```

### Dashboard
```
GET    /dashboard/stats        # Get KPI metrics
GET    /dashboard/heatmap      # Get location data for map
```

---

## 📖 Example Workflows

### 1. Register as Volunteer

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure123",
    "role": "volunteer"
  }'
```

Response:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "volunteer",
  "created_at": "2024-01-15T10:30:00"
}
```

### 2. Create Volunteer Profile

```bash
curl -X POST http://localhost:8000/volunteers?user_id=1 \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "skills": ["Medical Training", "First Aid"],
    "is_available": true
  }'
```

### 3. Create Request (NGO)

```bash
curl -X POST http://localhost:8000/requests?user_id=1 \
  -H "Content-Type: application/json" \
  -d '{
    "type": "medical",
    "title": "Medical Support at Clinic",
    "description": "Need medical professionals for community clinic",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "urgency": 4,
    "volunteers_needed": 3,
    "deadline": "2024-02-15T00:00:00"
  }'
```

### 4. Find Matching Volunteers

```bash
curl -X POST http://localhost:8000/match/1?limit=5
```

Response:
```json
{
  "request_id": 1,
  "candidates": [
    {
      "volunteer_id": 15,
      "volunteer_name": "Sarah Chen",
      "match_score": 0.85,
      "reason": "has medical expertise; nearby; highly reliable",
      "distance_km": 3.2,
      "volunteer": { ... }
    },
    {
      "volunteer_id": 8,
      "volunteer_name": "James Martinez",
      "match_score": 0.72,
      "reason": "has related skills; reasonable distance",
      "distance_km": 8.5,
      "volunteer": { ... }
    }
  ]
}
```

### 5. Auto-Assign Best Volunteer

```bash
curl -X POST http://localhost:8000/match/assign/1
```

Response:
```json
{
  "success": true,
  "assignment_id": 1,
  "volunteer_id": 15,
  "match_score": 0.85,
  "message": "Successfully assigned Sarah Chen (score: 0.85)"
}
```

### 6. Volunteer Accepts Assignment

```bash
curl -X POST http://localhost:8000/assignments/1/accept
```

### 7. Mark Complete & Update Reliability

```bash
curl -X POST http://localhost:8000/assignments/1/complete
```

---

## 🧠 Matching Algorithm

### Formula
```
MATCH_SCORE = 0.4*skill + 0.25*proximity + 0.2*urgency + 0.15*reliability
```

### Components

**Skill Score (40%)**
- Exact match: 1.0
- Related skills: 0.6
- No match: 0.2

**Proximity Score (25%)**
- Distance via Haversine formula
- Score = max(0, 1 - distance_km / 25km)
- Filters out volunteers >25km away

**Urgency Score (20%)**
- Score = urgency / 5 (1-5 scale)

**Reliability Score (15%)**
- Stored per volunteer
- Increases on completion: +0.05
- Decreases on rejection: -0.10
- Clamped between 0-1

### Filters (Pre-Scoring)
- Volunteer must be available (is_available=true)
- Not already assigned to request
- Within 25km radius
- Match score > 0

---

## 📦 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role ENUM('ngo', 'volunteer'),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Volunteers Table
```sql
CREATE TABLE volunteers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER FOREIGN KEY,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  skills TEXT[] NOT NULL,
  is_available BOOLEAN DEFAULT true,
  reliability_score FLOAT DEFAULT 1.0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_rejected INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
```

### Requests Table
```sql
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  type ENUM('medical', 'food', 'rescue', 'construction', 'logistics', 'counseling'),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  urgency INTEGER (1-5) DEFAULT 3,
  status ENUM('pending', 'assigned', 'completed') DEFAULT 'pending',
  volunteers_needed INTEGER DEFAULT 1,
  created_by INTEGER FOREIGN KEY,
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

### Assignments Table
```sql
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  request_id INTEGER FOREIGN KEY,
  volunteer_id INTEGER FOREIGN KEY,
  match_score FLOAT DEFAULT 0.0,
  status ENUM('assigned', 'accepted', 'rejected', 'completed'),
  assigned_at TIMESTAMP DEFAULT now(),
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  rejected_at TIMESTAMP
);
```

---

## 🛠️ Configuration

### Environment Variables (.env)

```env
DATABASE_URL=postgresql://volunteer_user:volunteer_pass@localhost:5432/volunteer_db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
```

### Default Demo Credentials

**NGO Account:**
- Email: `ngo@demo.com`
- Password: `demo123`

**Volunteer Accounts:**
- Email: `volunteer1@demo.com` - `volunteer50@demo.com`
- Password: `demo123` (all)

---

## 📊 Dashboard Data

### Stats Endpoint
```
GET /dashboard/stats
```

Returns:
- Total volunteers
- Active requests
- Completed tasks
- Average reliability score
- Pending assignments

### Heatmap Endpoint
```
GET /dashboard/heatmap
```

Returns location data for:
- All volunteers with skills & availability
- All active requests with urgency levels
- Ready for map visualization on frontend

---

## 🔄 Reliability Score Updates

```
Volunteer completes task → +0.05 (max 1.0)
Volunteer rejects task  → -0.10 (min 0.0)
```

Scores persist and affect future matching.

---

## ✅ Testing the API

### Using Interactive Docs
```
http://localhost:8000/docs
```

### Using Postman/Insomnia
Import the endpoints from the documentation above.

### Using curl (examples in "Workflows" section)

---

## 🚨 Error Handling

All endpoints return standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `404` - Not found
- `500` - Server error

Error response format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## 🔐 Security Notes

⚠️ **For Hackathon Demo Only:**
- CORS is open to all origins
- JWT secret is default (change in production)
- No rate limiting
- No request validation fully hardened

For production:
1. Restrict CORS to frontend domain
2. Use strong secret keys from environment
3. Add rate limiting
4. Add comprehensive input validation
5. Use HTTPS
6. Add audit logging

---

## 📈 Performance Tips

1. **Indexes**: Database has indexes on frequently queried fields
2. **Pagination**: Use `skip` and `limit` parameters for large datasets
3. **Caching**: Consider caching volunteer lists and request stats
4. **Batch Operations**: Implement bulk assignment endpoints if needed

---

## 🐛 Troubleshooting

### Database Connection Error
```
Check PostgreSQL is running: psql -U postgres
Verify connection string in config.py
```

### Port Already in Use
```
lsof -i :8000
kill -9 <PID>
# Or use different port: uvicorn app.main:app --port 8001
```

### Import Errors
```
pip install -r requirements.txt --force-reinstall
```

### Seed Script Fails
```
Drop and recreate database:
dropdb volunteer_db
createdb -U volunteer_user volunteer_db
python seed.py
```

---

## 📝 API Documentation

Full interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎯 Key Features

✅ Intelligent matching algorithm
✅ Real-time volunteer availability
✅ Geographic proximity matching
✅ Reliability scoring system
✅ Multi-role authentication
✅ Request prioritization by urgency
✅ Dashboard analytics
✅ Heatmap data for visualization
✅ Full demo data (50 volunteers, 15 requests)
✅ Production-ready error handling

---

## 📄 License

Built for hackathon. Use freely.

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API docs at `/docs`
3. Check database connection
4. Verify all dependencies installed

---

**Ready to match volunteers with impact! 🚀**
