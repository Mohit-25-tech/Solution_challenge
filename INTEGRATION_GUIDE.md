# Integration Guide - New APIs & Components

## Quick Start Integration

### 1. NGO Create Request → Display Matches

```tsx
// coordinator/dashboard/page.tsx (excerpt)

import { requestAPI, matchingAPI } from '@/lib/api'
import { NGOMatchDisplay } from '@/components/ngo-match-display'

export default function NGODashboard() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([])
  const [matchLoading, setMatchLoading] = useState(false)

  // When NGO selects a request
  const handleRequestSelect = async (request: any) => {
    setSelectedRequest(request)
    setMatchLoading(true)

    try {
      // Get matches for this request
      const result = await matchingAPI.getMatches(request.id, 10)
      
      if ((result.data as any)?.candidates) {
        setMatchCandidates((result.data as any).candidates)
        // Now NGOMatchDisplay component shows matches with breakdown!
      }
    } finally {
      setMatchLoading(false)
    }
  }

  // When NGO clicks Assign on a candidate
  const handleAssignVolunteer = async (volunteerName: string) => {
    try {
      const result = await matchingAPI.autoAssign(selectedRequest.id)
      if (result.data?.success) {
        // Show success message
      }
    } catch (error) {
      // Show error
    }
  }

  return (
    <div className="space-y-6">
      {/* Request list */}
      <div>
        {requests.map(req => (
          <button
            key={req.id}
            onClick={() => handleRequestSelect(req)}
          >
            {req.title}
          </button>
        ))}
      </div>

      {/* Show matches when request selected */}
      {selectedRequest && (
        <NGOMatchDisplay
          candidates={matchCandidates}
          onAssign={handleAssignVolunteer}
          isLoading={matchLoading}
        />
      )}
    </div>
  )
}
```

### 2. Volunteer Portal Integration

```tsx
// volunteer/portal/page.tsx

import { volunteerAPI } from '@/lib/api'
import { VolunteerRecommended } from '@/components/volunteer-recommended'
import { VolunteerNearby } from '@/components/volunteer-nearby'
import { useAuth } from '@/lib/auth-context'

export default function VolunteerPortal() {
  const { user } = useAuth()
  const [recommended, setRecommended] = useState<MatchCandidate | null>(null)
  const [nearby, setNearby] = useState<MatchCandidate[]>([])

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      // Get best recommendation
      const recResult = await volunteerAPI.getRecommended(user.id)
      if (recResult.data?.request_id) {
        setRecommended(recResult.data as MatchCandidate)
      }

      // Get nearby tasks
      const nearbyResult = await volunteerAPI.getNearby(
        user.id,
        userLocation.latitude,
        userLocation.longitude,
        limit: 10
      )
      if (Array.isArray(nearbyResult.data)) {
        setNearby(nearbyResult.data)
      }
    }

    loadData()
  }, [user])

  const handleAcceptRecommended = async (taskId: number) => {
    try {
      const result = await assignmentAPI.accept(taskId)
      // Success! Show confirmation
    } catch (error) {
      // Show error
    }
  }

  const handleApplyForNearby = async (taskId: number) => {
    try {
      // Navigate to details or auto-accept
      await assignmentAPI.accept(taskId)
    } catch (error) {
      // Show error
    }
  }

  return (
    <div className="space-y-8">
      {/* Recommended Task Section */}
      <section>
        <h2>Your Best Match</h2>
        <VolunteerRecommended
          task={recommended}
          onAccept={handleAcceptRecommended}
          onViewDetails={() => {
            // Navigate to task details
          }}
        />
      </section>

      {/* Nearby Tasks Section */}
      <section>
        <h2>Nearby Opportunities</h2>
        <VolunteerNearby
          tasks={nearby}
          onApply={handleApplyForNearby}
        />
      </section>
    </div>
  )
}
```

---

## API Response Examples

### GET /volunteer/recommended

**Request:**
```
GET http://127.0.0.1:8000/volunteer/recommended?volunteer_id=5
```

**Response (200 OK):**
```json
{
  "volunteer_id": 5,
  "volunteer_name": "Alice Johnson",
  "match_score": 0.92,
  "reason": "has medical expertise; nearby; highly reliable",
  "distance_km": 2.1,
  "request_id": 12,
  "breakdown": {
    "skill": 1.0,
    "distance": 0.92,
    "urgency": 1.0,
    "reliability": 0.95
  },
  "volunteer": {
    "id": 5,
    "skills": ["medical training", "first aid"],
    "reliability_score": 0.95,
    "is_available": true
  }
}
```

**Response (404 No Match):**
```json
{
  "detail": "No suitable tasks found for you right now"
}
```

---

### GET /volunteer/nearby

**Request:**
```
GET http://127.0.0.1:8000/volunteer/nearby?volunteer_id=5&latitude=37.7749&longitude=-122.4194&limit=10
```

**Response (200 OK):**
```json
[
  {
    "volunteer_id": 5,
    "volunteer_name": "Alice Johnson",
    "match_score": 0.92,
    "reason": "has medical expertise; nearby; highly reliable",
    "distance_km": 2.1,
    "request_id": 12,
    "breakdown": {
      "skill": 1.0,
      "distance": 0.92,
      "urgency": 1.0,
      "reliability": 0.95
    }
  },
  {
    "volunteer_id": 5,
    "volunteer_name": "Alice Johnson",
    "match_score": 0.78,
    "reason": "related rescue skills; reasonable distance; reliable",
    "distance_km": 8.5,
    "request_id": 15,
    "breakdown": {
      "skill": 0.6,
      "distance": 0.66,
      "urgency": 0.8,
      "reliability": 0.85
    }
  }
  // ... up to 10 total
]
```

---

### POST /match/{request_id}

**Request:**
```
POST http://127.0.0.1:8000/match/12?limit=3
```

**Response (200 OK - With Matches):**
```json
{
  "request_id": 12,
  "success": true,
  "message": "Found 3 matching volunteers",
  "candidates": [
    {
      "volunteer_id": 5,
      "volunteer_name": "Alice Johnson",
      "match_score": 0.92,
      "reason": "has medical expertise; nearby; highly reliable",
      "distance_km": 2.1,
      "breakdown": {
        "skill": 1.0,
        "distance": 0.92,
        "urgency": 1.0,
        "reliability": 0.95
      }
    },
    // ... more candidates ranked by score
  ]
}
```

**Response (200 OK - No Matches):**
```json
{
  "request_id": 12,
  "success": false,
  "message": "No suitable volunteers found. Escalating to manual assignment.",
  "candidates": []
}
```

---

## Component Props Reference

### NGOMatchDisplay

```typescript
interface NGOMatchDisplayProps {
  candidates: MatchCandidate[]     // List of matched volunteers
  onAssign: (volunteerName: string) => void  // Called when Assign clicked
  isLoading?: boolean              // Show loading state
}

// Usage:
<NGOMatchDisplay
  candidates={candidates}
  onAssign={(name) => console.log(`Assigned ${name}`)}
  isLoading={false}
/>
```

### VolunteerRecommended

```typescript
interface VolunteerRecommendedProps {
  task: MatchCandidate | null      // Best matching task or null
  isLoading?: boolean              // Show loading state
  onAccept?: (taskId: number) => void   // Called when Accept clicked
  onViewDetails?: () => void       // Called when View Details clicked
}

// Usage:
<VolunteerRecommended
  task={recommendedTask}
  onAccept={(id) => acceptTask(id)}
  onViewDetails={() => router.push(`/volunteer/task/${task.request_id}`)}
/>
```

### VolunteerNearby

```typescript
interface VolunteerNearbyProps {
  tasks: MatchCandidate[]          // List of nearby tasks
  isLoading?: boolean              // Show loading state
  onApply?: (taskId: number) => void   // Called when Apply clicked
}

// Usage:
<VolunteerNearby
  tasks={nearbyTasks}
  onApply={(id) => applyForTask(id)}
/>
```

---

## Error Handling Examples

### Handle API Errors

```typescript
// Safe API call with error handling
const handleGetMatches = async (requestId: number) => {
  const result = await matchingAPI.getMatches(requestId)

  if (result.error) {
    // Show error message
    setError(result.error)
    return
  }

  // Use data
  const matches = result.data as MatchResult
  if (matches.success) {
    setMatches(matches.candidates)
  } else {
    setError(matches.message)
  }
}
```

### Display Error in UI

```tsx
{error && (
  <Card className="p-4 bg-red-50 border-red-200">
    <div className="flex gap-2 text-red-800">
      <AlertCircle className="h-5 w-5" />
      <p>{error}</p>
    </div>
  </Card>
)}
```

---

## Data Flow Diagrams

### NGO Request → Matching → Assignment

```
NGO Creates Request
  │
  ├─ Title: "Medical Emergency"
  ├─ Location: (37.8044, -122.2712)
  ├─ Type: medical
  └─ Urgency: 5/5
  │
  ▼
Request Saved to DB (ID: 12)
  │
  ▼
NGO Selects Request #12
  │
  ▼
Call POST /match/12
  │
  ├─ Get all available volunteers
  ├─ Calculate match scores for each:
  │  ├─ Skill match (0-1.0)
  │  ├─ Distance match (0-1.0)
  │  ├─ Urgency score (0-1.0)
  │  └─ Reliability (0-1.0)
  ├─ Apply weights: 0.4*skill + 0.25*dist + 0.2*urg + 0.15*rel
  └─ Return top 3 candidates
  │
  ▼
Display NGOMatchDisplay Component
  │
  ├─ Candidate 1: Alice (92%)
  │  └─ Breakdown: Skill:1.0 Dist:0.92 Urg:1.0 Rel:0.95
  ├─ Candidate 2: Bob (78%)
  │  └─ Breakdown: Skill:0.6 Dist:0.66 Urg:0.8 Rel:0.85
  └─ Candidate 3: Charlie (65%)
  │
  ▼
NGO Clicks "Assign" on Candidate 1
  │
  ▼
Call POST /match/assign/12
  │
  ├─ Find best volunteer (top from ranked list)
  ├─ Create Assignment record
  ├─ Set status: "assigned"
  └─ Return success + assignment_id
  │
  ▼
Show Success Toast: "✓ Alice has been assigned!"
  │
  ▼
Volunteer sees new task in portal
  └─ Status: "assigned" (needs to accept/reject)
```

### Volunteer Gets Recommendation Flow

```
Volunteer Opens Portal
  │
  ▼
useEffect(() => { loadData() }, [user])
  │
  ├─ Call GET /volunteer/recommended?volunteer_id=5
  │  │
  │  ├─ Check volunteer is available (is_available: true)
  │  ├─ Get all active requests
  │  ├─ For each request:
  │  │  ├─ Check distance (< 25km)
  │  │  └─ Calculate match score
  │  ├─ Find request with highest score
  │  └─ Return that single recommendation
  │
  └─ Call GET /volunteer/nearby?lat=37.77&lng=-122.42
     │
     ├─ Get all active requests
     ├─ Calculate match for each
     ├─ Filter by distance (< 25km)
     ├─ Sort by match score DESC
     └─ Return top 10
  │
  ▼
Display VolunteerRecommended Component
  │
  ├─ Shows: "Best Task for You"
  ├─ Task name + urgency
  ├─ Score breakdown (4 components)
  ├─ Why they're a good fit
  └─ "Accept Task" button (primary)
  │
  ▼
Display VolunteerNearby Component
  │
  ├─ Shows: "Nearby Opportunities"
  ├─ List of 10 tasks
  ├─ Distance for each
  ├─ Urgency indicator (color-coded)
  ├─ Match score %
  └─ "Apply" button for each
  │
  ▼
Volunteer Clicks "Accept Task"
  │
  ▼
Call POST /assignments/{assignment_id}/accept
  │
  ├─ Set status: "accepted"
  ├─ Record accepted_at timestamp
  └─ Return updated assignment
  │
  ▼
Show Success: "Task accepted! You're helping them now."
```

---

## Environment Setup

### Required Environment Variables

```env
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# backend/.env
DATABASE_URL=postgresql+psycopg://volunteer_user:volunteer_pass@localhost:5432/volunteer_db
SECRET_KEY=your-secret-key
```

---

## Testing Checklist

### Backend Testing

```bash
# 1. Start backend
cd backend
uvicorn --app-dir backend app.main:app --reload

# 2. Test new endpoints in Swagger
# Open: http://127.0.0.1:8000/docs

# 3. Try GET /volunteer/recommended
# Query: ?volunteer_id=1

# 4. Try GET /volunteer/nearby
# Query: ?volunteer_id=1&latitude=37.7749&longitude=-122.4194

# 5. Try POST /match/1 (get matches for request 1)

# 6. Verify response includes "breakdown" field
```

### Frontend Testing

```bash
# 1. Start frontend
npm run dev

# 2. Go to http://localhost:3000

# 3. Test NGO flow:
#    - Login: ngo@demo.com / demo123
#    - Go to dashboard
#    - Select a request
#    - See matches with breakdown
#    - Click Assign

# 4. Test Volunteer flow:
#    - Login: volunteer1@demo.com / demo123
#    - See recommended task
#    - See nearby tasks
#    - Click Accept
```

---

## Production Deployment

### Steps

1. **Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python seed.py
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Frontend**
   ```bash
   npm install
   npm run build
   npm start
   ```

3. **Environment**
   ```bash
   # Update NEXT_PUBLIC_API_URL to production backend URL
   NEXT_PUBLIC_API_URL=https://api.volunteermatch.com
   ```

---

## Support & Debugging

### Common Issues

**Issue**: "No suitable tasks found" always
```
Debug:
1. Check database has active requests
2. Run: SELECT * FROM requests WHERE status = 'pending';
3. Check volunteer location is within 25km of requests
4. Check requests have matching skill types
```

**Issue**: Match scores always 0.2
```
Debug:
1. Volunteer skills likely don't match request type
2. Verify volunteer.skills has values
3. Check SKILL_RELEVANCE dict in matching service
4. Update volunteer skills to add relevant ones
```

**Issue**: API calls returning 404
```
Debug:
1. Check volunteer/request IDs exist in database
2. Verify frontend is using correct IDs
3. Check NEXT_PUBLIC_API_URL is correct
4. Clear browser cache and localStorage
```

---

This integration guide provides everything needed to understand and extend the system!
