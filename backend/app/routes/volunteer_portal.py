from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models import Volunteer, Request, RequestStatus, Assignment, AssignmentStatus, User
from app.schemas import MatchCandidate
from app.services.matching import (
    find_matching_volunteers,
    find_best_volunteer,
    calculate_match_score,
    get_match_reason,
    calculate_proximity_score
)

router = APIRouter(prefix="/volunteer", tags=["volunteer-portal"])


@router.get("/recommended", response_model=MatchCandidate)
def get_recommended_task(volunteer_id: int, db: Session = Depends(get_db)):
    """
    Get the single best-recommended task for a volunteer.
    
    Uses the matching engine to find requests where this volunteer would be the best fit.
    """
    
    # Get volunteer
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    if not volunteer.is_available:
        raise HTTPException(status_code=400, detail="Volunteer is not available")
    
    # Get all active requests
    active_requests = db.query(Request).filter(
        Request.status.in_([RequestStatus.pending, RequestStatus.assigned])
    ).all()
    
    best_match = None
    best_score = 0
    
    for request in active_requests:
        # Check if already assigned with accepted status
        existing_accepted = db.query(Assignment).filter(
            Assignment.request_id == request.id,
            Assignment.volunteer_id == volunteer.id,
            Assignment.status == AssignmentStatus.accepted
        ).first()
        
        if existing_accepted:
            continue
        
        # Calculate proximity
        proximity_score, distance_km = calculate_proximity_score(
            volunteer.latitude, volunteer.longitude,
            request.latitude, request.longitude
        )
        
        # Filter by distance
        if distance_km > 25:
            continue
        
        # Calculate full match score
        match_score = calculate_match_score(volunteer, request)
        
        if match_score > best_score:
            best_score = match_score
            reason = get_match_reason(volunteer, request, match_score, distance_km)
            
            best_match = MatchCandidate(
                volunteer_id=volunteer.id,
                volunteer_name=volunteer.user.name,
                match_score=round(match_score, 3),
                reason=reason,
                distance_km=round(distance_km, 2),
                volunteer=volunteer,
                request_id=request.id
            )
    
    if not best_match:
        raise HTTPException(status_code=404, detail="No suitable tasks found for you right now")
    
    return best_match


@router.get("/nearby", response_model=List[MatchCandidate])
def get_nearby_tasks(
    volunteer_id: int,
    latitude: float,
    longitude: float,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get nearby active tasks for a volunteer.
    
    Filtered by:
    - Distance (within 25km)
    - Skill relevance
    - Urgency (sorted high-to-low)
    
    Returns ranked candidates by match score.
    """
    
    # Get volunteer
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Get all active requests
    active_requests = db.query(Request).filter(
        Request.status.in_([RequestStatus.pending, RequestStatus.assigned])
    ).all()
    
    candidates = []
    
    for request in active_requests:
        # Check if already has accepted assignment
        existing_accepted = db.query(Assignment).filter(
            Assignment.request_id == request.id,
            Assignment.volunteer_id == volunteer.id,
            Assignment.status == AssignmentStatus.accepted
        ).first()
        
        if existing_accepted:
            continue
        
        # Calculate proximity
        proximity_score, distance_km = calculate_proximity_score(
            latitude, longitude,
            request.latitude, request.longitude
        )
        
        # Filter by distance
        if distance_km > 25:
            continue
        
        # Calculate match score
        match_score = calculate_match_score(volunteer, request)
        
        if match_score > 0:
            reason = get_match_reason(volunteer, request, match_score, distance_km)
            
            candidate = MatchCandidate(
                volunteer_id=volunteer.id,
                volunteer_name=volunteer.user.name,
                match_score=round(match_score, 3),
                reason=reason,
                distance_km=round(distance_km, 2),
                volunteer=volunteer,
                request_id=request.id
            )
            candidates.append(candidate)
    
    # Sort by urgency (desc) then distance (asc)
    candidates.sort(
        key=lambda x: (-x.match_score, x.distance_km)
    )
    
    return candidates[:limit]


@router.get("/tasks", response_model=List[MatchCandidate])
def get_my_tasks(
    volunteer_id: int,
    status_filter: str = None,
    db: Session = Depends(get_db)
):
    """
    Get all tasks assigned to a volunteer.
    
    Optional status filter: 'assigned', 'accepted', 'completed', 'rejected'
    """
    
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Get assignments
    query = db.query(Assignment).filter(Assignment.volunteer_id == volunteer.id)
    
    if status_filter:
        try:
            from app.models import AssignmentStatus
            status_enum = AssignmentStatus[status_filter]
            query = query.filter(Assignment.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
    
    assignments = query.all()
    
    # Convert to MatchCandidate objects for consistent response
    candidates = []
    for assignment in assignments:
        request = db.query(Request).filter(Request.id == assignment.request_id).first()
        
        distance_km = 0  # Already assigned, distance less relevant
        candidate = MatchCandidate(
            volunteer_id=volunteer.id,
            volunteer_name=volunteer.user.name,
            match_score=assignment.match_score,
            reason=f"Task: {request.title}",
            distance_km=distance_km,
            volunteer=volunteer,
            request_id=assignment.request_id,
            assignment_id=assignment.id,
            assignment_status=assignment.status
        )
        candidates.append(candidate)
    
    return candidates
