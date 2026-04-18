from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Request, Assignment
from app.schemas import MatchResult, AutoAssignResult
from app.services.matching import find_matching_volunteers, find_best_volunteer
from app.services.notifications import create_notification

router = APIRouter(prefix="/match", tags=["matching"])


@router.post("/{request_id}")
def get_matching_volunteers(request_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Get ranked list of matching volunteers for a request."""

    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    candidates = find_matching_volunteers(db, request, limit=limit)

    if not candidates:
        return {
            "request_id": request_id,
            "candidates": [],
            "success": False,
            "message": "No suitable volunteers found. Escalating to manual assignment."
        }

    return {
        "request_id": request_id,
        "candidates": [
            {
                "volunteer_id": c.volunteer_id,
                "volunteer_name": c.volunteer_name,
                "match_score": c.match_score,
                "reason": c.reason,
                "distance_km": c.distance_km,
                "breakdown": c.breakdown.model_dump() if c.breakdown else None,
            }
            for c in candidates
        ],
        "success": True,
        "message": f"Found {len(candidates)} matching volunteers"
    }


@router.post("/assign/{request_id}")
def auto_assign_volunteer(request_id: int, db: Session = Depends(get_db)):
    """
    Automatically assign the best matching volunteer to a request.
    Creates an Assignment record and notifies the volunteer.
    """
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        return {"success": False, "message": "Request not found"}

    # Check if already fully assigned
    accepted_count = db.query(Assignment).filter(
        Assignment.request_id == request_id,
        Assignment.status == "accepted"
    ).count()

    if accepted_count >= request.volunteers_needed:
        return {"success": False, "message": "Request already fully assigned"}

    # Find best volunteer
    best_candidate = find_best_volunteer(db, request)

    if not best_candidate:
        return {"success": False, "message": "No matching volunteers available"}

    # Create assignment
    assignment = Assignment(
        request_id=request_id,
        volunteer_id=best_candidate.volunteer_id,
        match_score=best_candidate.match_score,
        status="assigned"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Notify the volunteer
    try:
        create_notification(
            db=db,
            user_id=best_candidate.volunteer.user_id,
            title="⚡ New Assignment",
            message=f"You've been matched to '{request.title}' (urgency {request.urgency}/5). Score: {best_candidate.match_score:.2f}. Please accept within 15 minutes.",
            notif_type="assigned",
            reference_id=assignment.id
        )
    except Exception:
        pass  # Notification failure is non-fatal

    return {
        "success": True,
        "assignment_id": assignment.id,
        "volunteer_id": assignment.volunteer_id,
        "match_score": assignment.match_score,
        "message": f"Successfully assigned {best_candidate.volunteer_name} (score: {best_candidate.match_score:.3f})"
    }
