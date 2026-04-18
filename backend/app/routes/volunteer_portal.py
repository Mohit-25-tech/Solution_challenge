from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Volunteer, Request, Assignment, User
from app.services.matching import (
    find_matching_volunteers,
    find_best_volunteer,
    calculate_match_score,
    get_match_reason,
    calculate_proximity_score
)

router = APIRouter(prefix="/volunteer", tags=["volunteer-portal"])


@router.get("/recommended")
def get_recommended_task(volunteer_id: int, db: Session = Depends(get_db)):
    """
    Get the single best-recommended task for a volunteer.
    Uses the matching engine to find requests where this volunteer would be the best fit.
    """
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    if not volunteer.is_available:
        raise HTTPException(status_code=400, detail="Volunteer is not available")

    # Get all active requests (pending or assigned but not fully filled)
    active_requests = db.query(Request).filter(
        Request.status.in_(["pending", "assigned"])
    ).all()

    best_match = None
    best_score = 0

    for request in active_requests:
        # Skip if already accepted by this volunteer for this request
        existing_accepted = db.query(Assignment).filter(
            Assignment.request_id == request.id,
            Assignment.volunteer_id == volunteer.id,
            Assignment.status == "accepted"
        ).first()
        if existing_accepted:
            continue

        proximity_score, distance_km = calculate_proximity_score(
            volunteer.latitude, volunteer.longitude,
            request.latitude, request.longitude
        )
        if distance_km > 25:
            continue

        match_score = calculate_match_score(volunteer, request)

        if match_score > best_score:
            best_score = match_score
            reason = get_match_reason(volunteer, request, match_score, distance_km)
            best_match = {
                "volunteer_id": volunteer.id,
                "volunteer_name": volunteer.user.name if volunteer.user else "Volunteer",
                "match_score": round(match_score, 3),
                "reason": reason,
                "distance_km": round(distance_km, 2),
                "request_id": request.id,
                "request": {
                    "id": request.id,
                    "type": request.type,
                    "title": request.title,
                    "description": request.description,
                    "urgency": request.urgency,
                    "status": request.status,
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "volunteers_needed": request.volunteers_needed,
                    "fulfilled_count": request.fulfilled_count or 0,
                    "source": request.source or "internal",
                    "deadline": request.deadline.isoformat() if request.deadline else None,
                }
            }

    if not best_match:
        raise HTTPException(status_code=404, detail="No suitable tasks found for you right now")

    return best_match


@router.get("/nearby")
def get_nearby_tasks(
    volunteer_id: int,
    latitude: float,
    longitude: float,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get nearby active tasks for a volunteer within 25km radius.
    Sorted by match score (urgency + proximity + skill fit).
    """
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    active_requests = db.query(Request).filter(
        Request.status.in_(["pending", "assigned"])
    ).all()

    candidates = []
    for request in active_requests:
        existing_accepted = db.query(Assignment).filter(
            Assignment.request_id == request.id,
            Assignment.volunteer_id == volunteer.id,
            Assignment.status == "accepted"
        ).first()
        if existing_accepted:
            continue

        proximity_score, distance_km = calculate_proximity_score(
            latitude, longitude,
            request.latitude, request.longitude
        )
        if distance_km > 25:
            continue

        match_score = calculate_match_score(volunteer, request)
        if match_score > 0:
            reason = get_match_reason(volunteer, request, match_score, distance_km)
            candidates.append({
                "volunteer_id": volunteer.id,
                "volunteer_name": volunteer.user.name if volunteer.user else "Volunteer",
                "match_score": round(match_score, 3),
                "reason": reason,
                "distance_km": round(distance_km, 2),
                "request_id": request.id,
                "request": {
                    "id": request.id,
                    "type": request.type,
                    "title": request.title,
                    "description": request.description,
                    "urgency": request.urgency,
                    "status": request.status,
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "volunteers_needed": request.volunteers_needed,
                    "fulfilled_count": request.fulfilled_count or 0,
                    "source": request.source or "internal",
                }
            })

    candidates.sort(key=lambda x: (-x["match_score"], x["distance_km"]))
    return candidates[:limit]


@router.get("/tasks")
def get_my_tasks(
    volunteer_id: int,
    status_filter: str = None,
    db: Session = Depends(get_db)
):
    """
    Get all tasks assigned to a volunteer.
    Optional status_filter: 'assigned' | 'accepted' | 'completed' | 'rejected' | 'expired'
    """
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    query = db.query(Assignment).filter(Assignment.volunteer_id == volunteer.id)
    if status_filter:
        valid_statuses = ["assigned", "accepted", "completed", "rejected", "expired"]
        if status_filter not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status filter. Use one of: {valid_statuses}")
        query = query.filter(Assignment.status == status_filter)

    assignments = query.order_by(Assignment.created_at.desc()).all()

    results = []
    for a in assignments:
        request = db.query(Request).filter(Request.id == a.request_id).first()
        results.append({
            "assignment_id": a.id,
            "volunteer_id": volunteer.id,
            "volunteer_name": volunteer.user.name if volunteer.user else "Volunteer",
            "match_score": a.match_score,
            "reason": f"Task: {request.title}" if request else "Unknown task",
            "distance_km": 0,
            "request_id": a.request_id,
            "assignment_status": a.status,
            "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
            "accepted_at": a.accepted_at.isoformat() if a.accepted_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "request": {
                "id": request.id if request else None,
                "type": request.type if request else "unknown",
                "title": request.title if request else "Unknown",
                "description": request.description if request else "",
                "urgency": request.urgency if request else 0,
                "status": request.status if request else "unknown",
            } if request else None
        })

    return results
