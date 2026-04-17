from sqlalchemy.orm import Session
from app.models import Volunteer, Request, Assignment, AssignmentStatus
from app.schemas import MatchCandidate, MatchResult, MatchScoreBreakdown
from app.utils.geo import haversine_distance, get_distance_score
from typing import List, Tuple


SKILL_RELEVANCE = {
    "medical": ["medical training", "first aid", "nursing", "healthcare"],
    "food": ["logistics", "supply chain", "organization", "cooking"],
    "rescue": ["construction", "heavy equipment", "leadership", "rescue"],
    "construction": ["construction", "heavy equipment", "leadership"],
    "logistics": ["logistics", "supply chain", "organization"],
    "counseling": ["counseling", "mental health", "social services"],
}


def calculate_skill_score(volunteer_skills: List[str], request_type: str, required_skills: List[str] = None) -> float:
    """
    Calculate skill match score.
    - Exact match = 1.0
    - Related match = 0.6
    - No match = 0.2
    """
    volunteer_skills_lower = [s.lower() for s in volunteer_skills]
    
    # Check for exact matches
    if required_skills:
        required_lower = [s.lower() for s in required_skills]
        exact_matches = any(skill in volunteer_skills_lower for skill in required_lower)
        if exact_matches:
            return 1.0
    
    # Check for related matches based on request type
    related_skills = SKILL_RELEVANCE.get(request_type, [])
    related_match = any(skill in volunteer_skills_lower for skill in related_skills)
    
    if related_match:
        return 0.6
    
    return 0.2


def calculate_proximity_score(volunteer_lat: float, volunteer_lon: float, 
                             request_lat: float, request_lon: float, 
                             max_distance: float = 25) -> Tuple[float, float]:
    """
    Calculate proximity score based on distance.
    Returns (score, distance_km)
    """
    distance_km = haversine_distance(volunteer_lat, volunteer_lon, request_lat, request_lon)
    
    if distance_km > max_distance:
        return 0.0, distance_km
    
    score = get_distance_score(distance_km, max_distance)
    return score, distance_km


def calculate_urgency_score(urgency: int) -> float:
    """
    Calculate urgency score.
    urgency is 1-5, score should be urgency/5
    """
    return urgency / 5


def calculate_score_breakdown(volunteer: Volunteer, request: Request) -> MatchScoreBreakdown:
    """
    Calculate individual component scores for the match.
    
    Returns MatchScoreBreakdown with all individual scores.
    """
    skill_score = calculate_skill_score(volunteer.skills, request.type.value)
    proximity_score, _ = calculate_proximity_score(
        volunteer.latitude, volunteer.longitude,
        request.latitude, request.longitude
    )
    urgency_score = calculate_urgency_score(request.urgency)
    reliability_score = volunteer.reliability_score
    
    return MatchScoreBreakdown(
        skill=round(skill_score, 3),
        distance=round(proximity_score, 3),
        urgency=round(urgency_score, 3),
        reliability=round(reliability_score, 3)
    )


def calculate_match_score(volunteer: Volunteer, request: Request) -> float:
    """
    Calculate final match score using weighted formula.
    
    MATCH_SCORE = 0.4*skill + 0.25*proximity + 0.2*urgency + 0.15*reliability
    
    Returns score between 0 and 1.
    """
    # Calculate individual scores
    skill_score = calculate_skill_score(volunteer.skills, request.type.value)
    proximity_score, _ = calculate_proximity_score(
        volunteer.latitude, volunteer.longitude,
        request.latitude, request.longitude
    )
    urgency_score = calculate_urgency_score(request.urgency)
    reliability_score = volunteer.reliability_score
    
    # Weighted calculation
    match_score = (
        0.4 * skill_score +
        0.25 * proximity_score +
        0.2 * urgency_score +
        0.15 * reliability_score
    )
    
    return match_score


def get_match_reason(volunteer: Volunteer, request: Request, match_score: float, distance_km: float) -> str:
    """Generate a human-readable reason for the match."""
    reasons = []
    
    if any(skill in [s.lower() for s in volunteer.skills] 
           for skill in SKILL_RELEVANCE.get(request.type.value, [])):
        reasons.append(f"has {request.type.value} expertise")
    
    if distance_km < 5:
        reasons.append("nearby")
    elif distance_km < 15:
        reasons.append("reasonable distance")
    
    if volunteer.reliability_score > 0.95:
        reasons.append("highly reliable")
    elif volunteer.reliability_score > 0.8:
        reasons.append("reliable")
    
    reason = "; ".join(reasons) if reasons else "acceptable match"
    return reason


def find_matching_volunteers(db: Session, request: Request, limit: int = 10) -> List[MatchCandidate]:
    """
    Find and rank best matching volunteers for a request.
    
    Filtering criteria:
    - volunteer.is_available = true
    - not already assigned to this request
    - within 25km radius
    
    Returns sorted list of candidates by match score.
    """
    # Get all available volunteers not already assigned
    already_assigned = (
        db.query(Assignment.volunteer_id)
        .filter(Assignment.request_id == request.id)
        .filter(Assignment.status != AssignmentStatus.rejected)
        .all()
    )
    assigned_ids = [a[0] for a in already_assigned]
    
    available_volunteers = db.query(Volunteer).filter(
        Volunteer.is_available == True,
        ~Volunteer.id.in_(assigned_ids)
    ).all()
    
    # Calculate match scores and filter by distance
    candidates = []
    
    for volunteer in available_volunteers:
        proximity_score, distance_km = calculate_proximity_score(
            volunteer.latitude, volunteer.longitude,
            request.latitude, request.longitude
        )
        
        # Filter by distance threshold
        if distance_km > 25:
            continue
        
        # Calculate final score
        match_score = calculate_match_score(volunteer, request)
        
        if match_score > 0:  # Only include positive matches
            reason = get_match_reason(volunteer, request, match_score, distance_km)
            breakdown = calculate_score_breakdown(volunteer, request)
            
            candidate = MatchCandidate(
                volunteer_id=volunteer.id,
                volunteer_name=volunteer.user.name,
                match_score=round(match_score, 3),
                reason=reason,
                distance_km=round(distance_km, 2),
                volunteer=volunteer,  # Include full volunteer data
                breakdown=breakdown
            )
            candidates.append(candidate)
    
    # Sort by match score descending
    candidates.sort(key=lambda x: x.match_score, reverse=True)
    
    return candidates[:limit]


def find_best_volunteer(db: Session, request: Request) -> MatchCandidate:
    """Find and return the single best matching volunteer."""
    candidates = find_matching_volunteers(db, request, limit=1)
    return candidates[0] if candidates else None
