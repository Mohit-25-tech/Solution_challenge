from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime


# ====== Enum-like String Aliases (kept for schema compatibility) ======
class UserRole:
    ngo = "ngo"
    volunteer = "volunteer"
    admin = "admin"


class RequestType:
    medical = "medical"
    food = "food"
    rescue = "rescue"
    construction = "construction"
    logistics = "logistics"
    counseling = "counseling"


class RequestStatus:
    pending = "pending"
    assigned = "assigned"
    completed = "completed"
    cancelled = "cancelled"


class AssignmentStatus:
    assigned = "assigned"
    accepted = "accepted"
    rejected = "rejected"
    completed = "completed"
    expired = "expired"


# ====== User Schemas ======
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    volunteer_id: Optional[int] = None   # ← Fix 1: needed for volunteer-side features

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ====== Volunteer Schemas ======
class VolunteerCreate(BaseModel):
    latitude: float
    longitude: float
    skills: List[str]
    is_available: bool = True
    bio: Optional[str] = None
    phone: Optional[str] = None


class VolunteerUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    skills: Optional[List[str]] = None
    is_available: Optional[bool] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    availability_slots: Optional[Dict[str, List[str]]] = None
    profile_image_url: Optional[str] = None


class VolunteerResponse(BaseModel):
    id: int
    user_id: int
    latitude: float
    longitude: float
    skills: List[str]
    is_available: bool
    reliability_score: float
    tasks_completed: int
    tasks_rejected: int
    bio: Optional[str] = None
    phone: Optional[str] = None
    availability_slots: Optional[Dict[str, List[str]]] = None
    badges: Optional[List[str]] = None
    avg_response_time_minutes: Optional[float] = None
    profile_image_url: Optional[str] = None
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True


# ====== Request Schemas ======
class RequestCreate(BaseModel):
    type: str
    title: str
    description: str
    latitude: float
    longitude: float
    urgency: int  # 1-5
    volunteers_needed: int = 1
    deadline: Optional[datetime] = None
    tags: Optional[List[str]] = None
    source: str = "internal"


class RequestUpdate(BaseModel):
    status: Optional[str] = None
    urgency: Optional[int] = None
    volunteers_needed: Optional[int] = None


class RequestResponse(BaseModel):
    id: int
    type: str
    title: str
    description: str
    latitude: float
    longitude: float
    urgency: int
    status: str
    volunteers_needed: int
    fulfilled_count: int = 0
    tags: Optional[List[str]] = None
    source: str = "internal"
    created_by: int
    created_at: datetime
    updated_at: datetime
    deadline: Optional[datetime]

    class Config:
        from_attributes = True


class RequestDetailResponse(RequestResponse):
    creator: Optional[UserResponse] = None
    assignments: List["AssignmentResponse"] = []


# ====== Assignment Schemas ======
class AssignmentCreate(BaseModel):
    request_id: int
    volunteer_id: int
    match_score: float = 0.0


class AssignmentResponse(BaseModel):
    id: int
    request_id: int
    volunteer_id: int
    match_score: float
    status: str
    assigned_at: datetime
    accepted_at: Optional[datetime]
    completed_at: Optional[datetime]
    rejected_at: Optional[datetime]

    class Config:
        from_attributes = True


class AssignmentDetailResponse(AssignmentResponse):
    volunteer: VolunteerResponse
    request: RequestResponse


# ====== Matching Schemas ======
class MatchScoreBreakdown(BaseModel):
    """Breakdown of how match score is calculated."""
    skill: float
    distance: float
    urgency: float
    reliability: float


class MatchCandidate(BaseModel):
    volunteer_id: int
    volunteer_name: str
    match_score: float
    reason: str
    distance_km: float
    volunteer: VolunteerResponse
    request_id: Optional[int] = None
    assignment_id: Optional[int] = None
    assignment_status: Optional[str] = None
    breakdown: Optional[MatchScoreBreakdown] = None


class MatchResult(BaseModel):
    request_id: int
    candidates: List[MatchCandidate]
    success: bool = True
    message: Optional[str] = None


class AutoAssignResult(BaseModel):
    success: bool
    assignment_id: Optional[int] = None
    volunteer_id: Optional[int] = None
    match_score: Optional[float] = None
    message: str


# ====== Dashboard Schemas ======
class DashboardStats(BaseModel):
    total_volunteers: int
    active_requests: int
    completed_tasks: int
    total_assignments: int
    average_reliability: float
    pending_assignments: int
    active_assignments_now: Optional[int] = 0
    volunteers_on_ground: Optional[int] = 0
    completed_requests: Optional[int] = 0


class VolunteerHeatmapPoint(BaseModel):
    volunteer_id: int
    latitude: float
    longitude: float
    skills: List[str]
    is_available: bool
    reliability_score: float


class RequestHeatmapPoint(BaseModel):
    request_id: int
    latitude: float
    longitude: float
    type: str
    urgency: int
    status: str


class HeatmapData(BaseModel):
    volunteers: List[VolunteerHeatmapPoint]
    requests: List[RequestHeatmapPoint]


# ====== Notification Schemas ======
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    reference_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Update forward references
RequestDetailResponse.model_rebuild()
AssignmentDetailResponse.model_rebuild()
