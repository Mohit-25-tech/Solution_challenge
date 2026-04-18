from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.db.database import get_db
from app.models.models import Volunteer, User, Assignment, Request

router = APIRouter(prefix="/volunteers", tags=["volunteers"])

# ─────────────────────────────────────────────────────────────────
# FIX 2: Static paths MUST be registered BEFORE parameterized paths.
# GET /volunteers/leaderboard must come before GET /volunteers/{volunteer_id}
# or FastAPI will try to cast "leaderboard" as an integer and return 422.
# ─────────────────────────────────────────────────────────────────


@router.get("")
def get_volunteers(
    is_available: Optional[bool] = None,
    skill: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get paginated, filterable volunteer list.
    FIX 4: Returns {total, items} shape (consistent with GET /requests).
    """
    query = db.query(Volunteer)
    if is_available is not None:
        query = query.filter(Volunteer.is_available == is_available)
    if skill:
        # PostgreSQL ARRAY contains
        query = query.filter(Volunteer.skills.any(skill))

    total = query.count()
    volunteers = query.order_by(Volunteer.id).offset(offset).limit(limit).all()

    items = []
    for v in volunteers:
        user = db.query(User).filter(User.id == v.user_id).first()
        items.append({
            "id": v.id,
            "user_id": v.user_id,
            "name": user.name if user else "Unknown",
            "email": user.email if user else "",
            "latitude": v.latitude,
            "longitude": v.longitude,
            "skills": v.skills or [],
            "is_available": v.is_available,
            "reliability_score": v.reliability_score,
            "tasks_completed": v.tasks_completed,
            "tasks_rejected": v.tasks_rejected,
            "bio": v.bio,
            "phone": v.phone,
            "availability_slots": v.availability_slots,
            "badges": v.badges or [],
            "avg_response_time_minutes": v.avg_response_time_minutes,
            "profile_image_url": v.profile_image_url,
        })

    return {"total": total, "items": items}


# ─── FIX 2: leaderboard BEFORE /{volunteer_id} ───────────────────
@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """
    Top 10 volunteers ranked by tasks_completed × reliability_score.
    FIX 2: Must be registered before /{volunteer_id} to avoid 422 errors.
    """
    volunteers = (
        db.query(Volunteer)
        .order_by(
            (Volunteer.tasks_completed * Volunteer.reliability_score).desc()
        )
        .limit(10)
        .all()
    )
    result = []
    for v in volunteers:
        user = db.query(User).filter(User.id == v.user_id).first()
        result.append({
            "volunteer_id": v.id,
            "name": user.name if user else "Unknown",
            "tasks_completed": v.tasks_completed,
            "reliability_score": v.reliability_score,
            "badges": v.badges or [],
            "skills": v.skills or [],
            "avg_response_time_minutes": v.avg_response_time_minutes,
        })
    return result


@router.post("")
def create_volunteer(user_id: int, volunteer_data: dict, db: Session = Depends(get_db)):
    """Create volunteer profile for an existing user."""
    existing = db.query(Volunteer).filter(Volunteer.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Volunteer profile already exists for this user")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    volunteer = Volunteer(
        user_id=user_id,
        latitude=volunteer_data.get("latitude", 0.0),
        longitude=volunteer_data.get("longitude", 0.0),
        skills=volunteer_data.get("skills", []),
        is_available=volunteer_data.get("is_available", True),
        bio=volunteer_data.get("bio"),
        phone=volunteer_data.get("phone"),
        availability_slots=volunteer_data.get("availability_slots"),
    )
    db.add(volunteer)
    db.commit()
    db.refresh(volunteer)
    return {"id": volunteer.id, "user_id": volunteer.user_id}


# ─── Parameterized paths AFTER static paths ───────────────────────
@router.get("/{volunteer_id}")
def get_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Get single volunteer by ID with full profile data."""
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    user = db.query(User).filter(User.id == volunteer.user_id).first()
    return {
        "id": volunteer.id,
        "user_id": volunteer.user_id,
        "name": user.name if user else "Unknown",
        "email": user.email if user else "",
        "latitude": volunteer.latitude,
        "longitude": volunteer.longitude,
        "skills": volunteer.skills or [],
        "is_available": volunteer.is_available,
        "reliability_score": volunteer.reliability_score,
        "tasks_completed": volunteer.tasks_completed,
        "tasks_rejected": volunteer.tasks_rejected,
        "bio": volunteer.bio,
        "phone": volunteer.phone,
        "availability_slots": volunteer.availability_slots,
        "badges": volunteer.badges or [],
        "avg_response_time_minutes": volunteer.avg_response_time_minutes,
        "profile_image_url": volunteer.profile_image_url,
        "user": {
            "id": user.id if user else None,
            "name": user.name if user else "Unknown",
            "email": user.email if user else "",
            "role": user.role if user else "volunteer",
        }
    }


@router.patch("/{volunteer_id}")
def update_volunteer(volunteer_id: int, update_data: dict, db: Session = Depends(get_db)):
    """Update volunteer profile fields."""
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    allowed_fields = [
        "latitude", "longitude", "skills", "is_available",
        "bio", "phone", "availability_slots", "profile_image_url"
    ]
    for field in allowed_fields:
        if field in update_data:
            setattr(volunteer, field, update_data[field])

    volunteer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(volunteer)
    return {"success": True, "id": volunteer.id}


@router.patch("/{volunteer_id}/availability")
def toggle_availability(volunteer_id: int, body: dict, db: Session = Depends(get_db)):
    """Toggle volunteer availability status."""
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    volunteer.is_available = body.get("is_available", volunteer.is_available)
    volunteer.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True, "is_available": volunteer.is_available}


@router.get("/{volunteer_id}/history")
def get_history(volunteer_id: int, db: Session = Depends(get_db)):
    """Get last 50 assignments for a volunteer with request details."""
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    assignments = (
        db.query(Assignment)
        .filter(Assignment.volunteer_id == volunteer_id)
        .order_by(Assignment.created_at.desc())
        .limit(50)
        .all()
    )

    result = []
    for a in assignments:
        req = db.query(Request).filter(Request.id == a.request_id).first()
        result.append({
            "assignment_id": a.id,
            "request_id": a.request_id,
            "request_title": req.title if req else "Unknown",
            "request_type": req.type if req else "unknown",
            "match_score": a.match_score,
            "status": a.status,
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "accepted_at": a.accepted_at.isoformat() if a.accepted_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        })
    return result
