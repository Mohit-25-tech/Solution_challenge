from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.db.database import get_db
from app.models.models import Assignment, Volunteer, Request, User, AuditLog
from app.services.badges import evaluate_and_award_badges
from app.services.notifications import create_notification
from app.core.config import settings

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("/{assignment_id}/accept")
def accept_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Volunteer accepts an assignment."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.status not in ["assigned", "rejected"]:
        raise HTTPException(status_code=400, detail="Assignment cannot be accepted in current state")

    assignment.status = "accepted"
    assignment.accepted_at = datetime.utcnow()

    # Update request status
    request = db.query(Request).filter(Request.id == assignment.request_id).first()
    if request and request.status == "pending":
        request.status = "assigned"

    # Notify NGO
    if request:
        volunteer = db.query(Volunteer).filter(Volunteer.id == assignment.volunteer_id).first()
        vol_user = db.query(User).filter(User.id == volunteer.user_id).first() if volunteer else None
        create_notification(
            db=db,
            user_id=request.created_by,
            title="✅ Assignment Accepted",
            message=f"{vol_user.name if vol_user else 'A volunteer'} accepted '{request.title}'.",
            notif_type="accepted",
            reference_id=assignment.id
        )

    db.commit()
    db.refresh(assignment)
    return {
        "id": assignment.id,
        "status": assignment.status,
        "accepted_at": assignment.accepted_at.isoformat()
    }


@router.post("/{assignment_id}/reject")
def reject_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Volunteer rejects an assignment."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.status != "assigned":
        raise HTTPException(status_code=400, detail="Only assigned assignments can be rejected")

    assignment.status = "rejected"
    assignment.rejected_at = datetime.utcnow()

    # Penalize volunteer reliability
    volunteer = db.query(Volunteer).filter(Volunteer.id == assignment.volunteer_id).first()
    if volunteer:
        volunteer.reliability_score = max(0.0, volunteer.reliability_score - 0.10)
        volunteer.tasks_rejected = (volunteer.tasks_rejected or 0) + 1

    db.commit()
    db.refresh(assignment)
    return {
        "id": assignment.id,
        "status": assignment.status,
        "rejected_at": assignment.rejected_at.isoformat()
    }


@router.post("/{assignment_id}/complete")
def complete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Mark assignment as completed and update volunteer stats."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.status != "accepted":
        raise HTTPException(status_code=400, detail="Only accepted assignments can be completed")

    assignment.status = "completed"
    assignment.completed_at = datetime.utcnow()

    volunteer = db.query(Volunteer).filter(Volunteer.id == assignment.volunteer_id).first()
    if volunteer:
        volunteer.reliability_score = min(1.0, volunteer.reliability_score + 0.05)
        volunteer.tasks_completed = (volunteer.tasks_completed or 0) + 1

        # Update avg response time
        if assignment.accepted_at and assignment.assigned_at:
            delta = (assignment.accepted_at - assignment.assigned_at).total_seconds() / 60
            if volunteer.avg_response_time_minutes:
                volunteer.avg_response_time_minutes = (
                    volunteer.avg_response_time_minutes * 0.8 + delta * 0.2
                )
            else:
                volunteer.avg_response_time_minutes = delta

        evaluate_and_award_badges(volunteer, db)

    # Update request fulfilled count
    request = db.query(Request).filter(Request.id == assignment.request_id).first()
    if request:
        request.fulfilled_count = (request.fulfilled_count or 0) + 1
        if request.fulfilled_count >= request.volunteers_needed:
            request.status = "completed"

    db.commit()
    db.refresh(assignment)
    return {
        "id": assignment.id,
        "status": assignment.status,
        "completed_at": assignment.completed_at.isoformat()
    }


@router.get("/{assignment_id}")
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Get assignment details."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return {
        "id": assignment.id,
        "request_id": assignment.request_id,
        "volunteer_id": assignment.volunteer_id,
        "match_score": assignment.match_score,
        "status": assignment.status,
        "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
        "accepted_at": assignment.accepted_at.isoformat() if assignment.accepted_at else None,
        "completed_at": assignment.completed_at.isoformat() if assignment.completed_at else None,
        "rejected_at": assignment.rejected_at.isoformat() if assignment.rejected_at else None,
    }


@router.get("/{assignment_id}/qr-data")
def get_qr_data(assignment_id: int, db: Session = Depends(get_db)):
    """
    Generate a signed JWT token for QR code check-in.
    The coordinator displays this QR; the volunteer scans it to confirm arrival.
    Token expires in 24 hours.
    """
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    payload = {
        "assignment_id": assignment_id,
        "volunteer_id": assignment.volunteer_id,
        "request_id": assignment.request_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, settings.get_secret_key(), algorithm=settings.algorithm)

    return {"token": token, "assignment_id": assignment_id}


@router.post("/verify-qr")
def verify_qr(body: dict, db: Session = Depends(get_db)):
    """
    Verify QR token from volunteer scan.
    Marks assignment 'completed', updates scores, fires badge evaluation.
    On success returns volunteer name + request title for confetti display.
    """
    token = body.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    try:
        payload = jwt.decode(token, settings.get_secret_key(), algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired QR token")

    assignment_id = payload.get("assignment_id")
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.status == "completed":
        return {
            "success": True,
            "message": "Already completed",
            "volunteer_name": "Volunteer",
            "request_title": "Task",
            "completed_at": assignment.completed_at.isoformat() if assignment.completed_at else None
        }

    assignment.status = "completed"
    assignment.completed_at = datetime.utcnow()

    volunteer = db.query(Volunteer).filter(Volunteer.id == assignment.volunteer_id).first()
    request = db.query(Request).filter(Request.id == assignment.request_id).first()

    if volunteer:
        volunteer.tasks_completed = (volunteer.tasks_completed or 0) + 1
        volunteer.reliability_score = min(1.0, volunteer.reliability_score + 0.05)

        if assignment.accepted_at and assignment.assigned_at:
            delta = (assignment.accepted_at - assignment.assigned_at).total_seconds() / 60
            if volunteer.avg_response_time_minutes:
                volunteer.avg_response_time_minutes = (
                    volunteer.avg_response_time_minutes * 0.8 + delta * 0.2
                )
            else:
                volunteer.avg_response_time_minutes = delta

        evaluate_and_award_badges(volunteer, db)

    if request:
        request.fulfilled_count = (request.fulfilled_count or 0) + 1
        if request.fulfilled_count >= request.volunteers_needed:
            request.status = "completed"

    # Audit log
    db.add(AuditLog(
        actor_id=volunteer.user_id if volunteer else 0,
        action="complete",
        target_type="assignment",
        target_id=assignment.id,
        extra_data={"method": "qr_scan", "request_id": request.id if request else None}
    ))

    db.commit()

    vol_user = db.query(User).filter(User.id == volunteer.user_id).first() if volunteer else None

    return {
        "success": True,
        "volunteer_name": vol_user.name if vol_user else "Volunteer",
        "request_title": request.title if request else "Task",
        "completed_at": assignment.completed_at.isoformat()
    }
