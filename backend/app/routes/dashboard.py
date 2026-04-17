from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models import Volunteer, Request, Assignment, RequestStatus, AssignmentStatus
from app.schemas import DashboardStats, HeatmapData, VolunteerHeatmapPoint, RequestHeatmapPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    
    total_volunteers = db.query(func.count(Volunteer.id)).scalar() or 0
    
    active_requests = db.query(func.count(Request.id)).filter(
        Request.status.in_([RequestStatus.pending, RequestStatus.assigned])
    ).scalar() or 0
    
    completed_tasks = db.query(func.count(Assignment.id)).filter(
        Assignment.status == AssignmentStatus.completed
    ).scalar() or 0
    
    total_assignments = db.query(func.count(Assignment.id)).scalar() or 0
    
    pending_assignments = db.query(func.count(Assignment.id)).filter(
        Assignment.status == AssignmentStatus.assigned
    ).scalar() or 0
    
    # Calculate average reliability
    avg_reliability = db.query(func.avg(Volunteer.reliability_score)).scalar() or 0.0
    
    return DashboardStats(
        total_volunteers=total_volunteers,
        active_requests=active_requests,
        completed_tasks=completed_tasks,
        total_assignments=total_assignments,
        average_reliability=round(float(avg_reliability), 2),
        pending_assignments=pending_assignments
    )


@router.get("/heatmap", response_model=HeatmapData)
def get_heatmap_data(db: Session = Depends(get_db)):
    """Get heatmap data for volunteer and request locations."""
    
    # Get all volunteers
    volunteers_data = db.query(Volunteer).all()
    volunteers_heatmap = [
        VolunteerHeatmapPoint(
            volunteer_id=v.id,
            latitude=v.latitude,
            longitude=v.longitude,
            skills=v.skills,
            is_available=v.is_available,
            reliability_score=v.reliability_score
        )
        for v in volunteers_data
    ]
    
    # Get all active requests
    requests_data = db.query(Request).filter(
        Request.status.in_([RequestStatus.pending, RequestStatus.assigned])
    ).all()
    requests_heatmap = [
        RequestHeatmapPoint(
            request_id=r.id,
            latitude=r.latitude,
            longitude=r.longitude,
            type=r.type,
            urgency=r.urgency,
            status=r.status
        )
        for r in requests_data
    ]
    
    return HeatmapData(
        volunteers=volunteers_heatmap,
        requests=requests_heatmap
    )
