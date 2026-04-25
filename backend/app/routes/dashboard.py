from fastapi import APIRouter, Depends
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.models import Volunteer, Request, Assignment
from app.schemas import DashboardStats, HeatmapData, VolunteerHeatmapPoint, RequestHeatmapPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Dashboard statistics.
    Improvement 2: added active_assignments_now + volunteers_on_ground + completed_requests
    for the live command-center stats bar.
    """
    total_volunteers = db.query(func.count(Volunteer.id)).scalar() or 0

    # Base query for Requests filtered by user_id
    req_query = db.query(Request)
    if user_id:
        req_query = req_query.filter(Request.created_by == user_id)
        
    # Base query for Assignments joined with Request
    assign_query = db.query(Assignment)
    if user_id:
        assign_query = assign_query.join(Request).filter(Request.created_by == user_id)

    active_requests = req_query.filter(
        Request.status.in_(["pending", "assigned"])
    ).count() or 0

    completed_tasks = assign_query.filter(
        Assignment.status == "completed"
    ).count() or 0

    completed_requests = req_query.filter(
        Request.status == "completed"
    ).count() or 0

    total_assignments = assign_query.count() or 0

    pending_assignments = assign_query.filter(
        Assignment.status == "assigned"
    ).count() or 0

    # Active assignments now = assigned (not yet accepted or completed)
    active_assignments_now = assign_query.filter(
        Assignment.status == "assigned"
    ).count() or 0

    # Volunteers on ground = those with an accepted (in-progress) assignment
    volunteers_on_ground = assign_query.filter(
        Assignment.status == "accepted"
    ).count() or 0

    avg_reliability = db.query(func.avg(Volunteer.reliability_score)).scalar() or 0.0

    pending_requests_count = req_query.filter(
        Request.status == "pending"
    ).count() or 0

    return {
        "total_volunteers": total_volunteers,
        "active_requests": active_requests,
        "completed_tasks": completed_tasks,
        "completed_requests": completed_requests,
        "total_assignments": total_assignments,
        "average_reliability": round(float(avg_reliability), 2),
        "pending_assignments": pending_assignments,
        "active_assignments_now": active_assignments_now,
        "volunteers_on_ground": volunteers_on_ground,
        "pending_requests_count": pending_requests_count,
    }


@router.get("/heatmap")
def get_heatmap_data(db: Session = Depends(get_db)):
    """Get heatmap data for volunteer and request locations."""
    volunteers_data = db.query(Volunteer).all()
    volunteers_heatmap = [
        {
            "volunteer_id": v.id,
            "latitude": v.latitude,
            "longitude": v.longitude,
            "skills": v.skills or [],
            "is_available": v.is_available,
            "reliability_score": v.reliability_score
        }
        for v in volunteers_data
    ]

    requests_data = db.query(Request).filter(
        Request.status.in_(["pending", "assigned"])
    ).all()
    requests_heatmap = [
        {
            "request_id": r.id,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "type": r.type,
            "urgency": r.urgency,
            "status": r.status
        }
        for r in requests_data
    ]

    return {
        "volunteers": volunteers_heatmap,
        "requests": requests_heatmap
    }
