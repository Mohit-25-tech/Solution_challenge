from sqlalchemy.orm import Session
from app.models import Volunteer, Request, Assignment
from app.schemas import MatchCandidate, MatchResult, MatchScoreBreakdown
from app.utils.geo import haversine_distance, get_distance_score
from typing import List, Tuple, Optional


# Skill adjacency map for tiered matching (not binary)
SKILL_ADJACENCY = {
    "medical":      ["first_aid", "counseling", "nursing", "healthcare"],
    "rescue":       ["first_aid", "construction", "search_rescue", "heavy_equipment", "leadership"],
    "food":         ["logistics", "driving", "cooking", "supply_chain"],
    "logistics":    ["driving", "construction", "supply_chain"],
    "counseling":   ["medical", "mental_health", "social_services"],
    "construction": ["logistics", "heavy_equipment", "leadership"],
}


def _get_request_type(request: Request) -> str:
    """Safely get request type as plain string (handles both str and old enum)."""
    t = request.type
    return t.value if hasattr(t, "value") else str(t)


def calculate_skill_score(volunteer_skills: List[str], request_type: str) -> float:
    """
    Tiered skill scoring:
    - Exact match to request type → 1.0
    - Adjacent/related skill → 0.6
    - No match → 0.2
    """
    volunteer_skills_lower = [s.lower().replace(" ", "_") for s in volunteer_skills]
    req_type = request_type.lower()

    # Exact match — volunteer skill matches request type exactly
    if req_type in volunteer_skills_lower:
        return 1.0

    # Adjacent match — volunteer has a skill adjacent to the request type
    adjacent = SKILL_ADJACENCY.get(req_type, [])
    if any(skill in volunteer_skills_lower for skill in adjacent):
        return 0.6

    return 0.2


def calculate_proximity_score(
    volunteer_lat: float, volunteer_lon: float,
    request_lat: float, request_lon: float,
    max_distance: float = 25
) -> Tuple[float, float]:
    """
    Calculate proximity score: MAX(0, 1 - distance_km / 25)
    Returns (score, distance_km). Volunteers beyond 25km get score=0.
    """
    distance_km = haversine_distance(volunteer_lat, volunteer_lon, request_lat, request_lon)
    if distance_km > max_distance:
        return 0.0, distance_km
    score = get_distance_score(distance_km, max_distance)
    return score, distance_km


def calculate_urgency_score(urgency: int) -> float:
    """urgency 1-5 → score = urgency/5"""
    return urgency / 5


def calculate_score_breakdown(volunteer: Volunteer, request: Request) -> MatchScoreBreakdown:
    """Calculate individual component scores for display in the UI."""
    req_type = _get_request_type(request)
    skill_score = calculate_skill_score(volunteer.skills or [], req_type)
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
    Final match score:
    MATCH_SCORE = (skill × 0.40) + (distance × 0.25) + (urgency × 0.20) + (reliability × 0.15)
    """
    req_type = _get_request_type(request)
    skill_score = calculate_skill_score(volunteer.skills or [], req_type)
    proximity_score, _ = calculate_proximity_score(
        volunteer.latitude, volunteer.longitude,
        request.latitude, request.longitude
    )
    urgency_score = calculate_urgency_score(request.urgency)
    reliability_score = volunteer.reliability_score

    return (
        0.40 * skill_score +
        0.25 * proximity_score +
        0.20 * urgency_score +
        0.15 * reliability_score
    )


def get_match_reason(volunteer: Volunteer, request: Request, match_score: float, distance_km: float) -> str:
    """Generate transparent, human-readable score explanation for the UI."""
    req_type = _get_request_type(request)
    volunteer_skills_lower = [s.lower().replace(" ", "_") for s in (volunteer.skills or [])]
    parts = []

    if req_type in volunteer_skills_lower:
        parts.append(f"Exact skill match ({req_type})")
    elif any(s in volunteer_skills_lower for s in SKILL_ADJACENCY.get(req_type, [])):
        parts.append(f"Adjacent skill match")

    if distance_km < 5:
        parts.append(f"{distance_km:.1f}km away")
    elif distance_km < 15:
        parts.append(f"{distance_km:.1f}km away")
    else:
        parts.append(f"{distance_km:.1f}km away")

    parts.append(f"urgency {request.urgency}/5")

    if volunteer.reliability_score >= 0.95:
        parts.append("highly reliable")
    elif volunteer.reliability_score >= 0.80:
        parts.append("reliable")

    return ", ".join(parts) if parts else "acceptable match"


def get_ranked_volunteers(db: Session, request_id: int, limit: int = 10) -> List[dict]:
    """
    Used by auto_reassign service. Returns raw dicts (not Pydantic models).
    """
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        return []

    already_assigned = (
        db.query(Assignment.volunteer_id)
        .filter(Assignment.request_id == request.id)
        .filter(Assignment.status.notin_(["rejected", "expired"]))
        .all()
    )
    assigned_ids = [a[0] for a in already_assigned]

    available_volunteers = db.query(Volunteer).filter(
        Volunteer.is_available == True,
        ~Volunteer.id.in_(assigned_ids)
    ).all()

    results = []
    for vol in available_volunteers:
        proximity_score, distance_km = calculate_proximity_score(
            vol.latitude, vol.longitude,
            request.latitude, request.longitude
        )
        if distance_km > 25:
            continue
        total = calculate_match_score(vol, request)
        results.append({"volunteer_id": vol.id, "total_score": total, "distance_km": distance_km})

    results.sort(key=lambda x: x["total_score"], reverse=True)
    return results[:limit]


def find_matching_volunteers(db: Session, request: Request, limit: int = 10) -> List[MatchCandidate]:
    """
    Find and rank best matching volunteers for a request.
    Pre-filters:
    - is_available = True
    - not already in an active assignment for this request
    - distance ≤ 25km
    """
    already_assigned = (
        db.query(Assignment.volunteer_id)
        .filter(Assignment.request_id == request.id)
        .filter(Assignment.status.notin_(["rejected", "expired"]))
        .all()
    )
    assigned_ids = [a[0] for a in already_assigned]

    available_volunteers = db.query(Volunteer).filter(
        Volunteer.is_available == True,
        ~Volunteer.id.in_(assigned_ids)
    ).all()

    candidates = []
    for volunteer in available_volunteers:
        proximity_score, distance_km = calculate_proximity_score(
            volunteer.latitude, volunteer.longitude,
            request.latitude, request.longitude
        )
        if distance_km > 25:
            continue

        match_score = calculate_match_score(volunteer, request)
        if match_score > 0:
            reason = get_match_reason(volunteer, request, match_score, distance_km)
            breakdown = calculate_score_breakdown(volunteer, request)

            candidate = MatchCandidate(
                volunteer_id=volunteer.id,
                volunteer_name=volunteer.user.name,
                match_score=round(match_score, 3),
                reason=reason,
                distance_km=round(distance_km, 2),
                volunteer=volunteer,
                breakdown=breakdown
            )
            candidates.append(candidate)

    candidates.sort(key=lambda x: x.match_score, reverse=True)
    return candidates[:limit]


def find_best_volunteer(db: Session, request: Request) -> Optional[MatchCandidate]:
    """Find and return the single best matching volunteer."""
    candidates = find_matching_volunteers(db, request, limit=1)
    return candidates[0] if candidates else None
