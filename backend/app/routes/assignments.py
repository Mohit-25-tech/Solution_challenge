from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.database import get_db
from app.models import Assignment, AssignmentStatus, Request, Volunteer, RequestStatus
from app.schemas import AssignmentResponse, AssignmentDetailResponse
from app.services.matching import find_matching_volunteers, find_best_volunteer

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("/{assignment_id}/accept", response_model=AssignmentResponse)
def accept_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Volunteer accepts an assignment."""
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.status not in [AssignmentStatus.assigned, AssignmentStatus.rejected]:
        raise HTTPException(status_code=400, detail="Assignment cannot be accepted in current state")
    
    assignment.status = AssignmentStatus.accepted
    assignment.accepted_at = datetime.utcnow()
    
    # Update request status if not already
    request = db.query(Request).filter(Request.id == assignment.request_id).first()
    if request.status == RequestStatus.pending:
        request.status = RequestStatus.assigned
    
    db.commit()
    db.refresh(assignment)
    
    return assignment


@router.post("/{assignment_id}/reject", response_model=AssignmentResponse)
def reject_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Volunteer rejects an assignment."""
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.status != AssignmentStatus.assigned:
        raise HTTPException(status_code=400, detail="Only assigned assignments can be rejected")
    
    assignment.status = AssignmentStatus.rejected
    assignment.rejected_at = datetime.utcnow()
    
    # Decrease volunteer reliability score
    volunteer = db.query(Volunteer).filter(Volunteer.id == assignment.volunteer_id).first()
    volunteer.reliability_score = max(0, volunteer.reliability_score - 0.1)
    volunteer.tasks_rejected += 1
    
    db.commit()
    db.refresh(assignment)
    
    return assignment


@router.post("/{assignment_id}/complete", response_model=AssignmentResponse)
def complete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Mark assignment as completed."""
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.status != AssignmentStatus.accepted:
        raise HTTPException(status_code=400, detail="Only accepted assignments can be completed")
    
    assignment.status = AssignmentStatus.completed
    assignment.completed_at = datetime.utcnow()
    
    # Increase volunteer reliability score
    volunteer = db.query(Volunteer).filter(Volunteer.id == assignment.volunteer_id).first()
    volunteer.reliability_score = min(1.0, volunteer.reliability_score + 0.05)
    volunteer.tasks_completed += 1
    
    db.commit()
    db.refresh(assignment)
    
    return assignment


@router.get("/{assignment_id}", response_model=AssignmentDetailResponse)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Get assignment details."""
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return assignment
