from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.models import Volunteer, Request, Assignment

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Full analytics overview for coordinator dashboard charts.
    Returns stat cards, requests-per-day timeseries, skill demand breakdown,
    and heatmap data for pending requests.
    """
    total_volunteers = db.query(Volunteer).count()
    active_volunteers = db.query(Volunteer).filter(Volunteer.is_available == True).count()
    total_requests = db.query(Request).count()
    completed_requests = db.query(Request).filter(Request.status == "completed").count()
    pending_requests = db.query(Request).filter(Request.status == "pending").count()

    fulfillment_rate = round((completed_requests / total_requests * 100), 1) if total_requests > 0 else 0.0

    avg_score_row = db.query(func.avg(Assignment.match_score)).scalar()
    avg_match_score = round(float(avg_score_row), 3) if avg_score_row else 0.0

    # Requests per day — last 14 days
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
    daily_counts = (
        db.query(
            cast(Request.created_at, Date).label("date"),
            func.count(Request.id).label("count")
        )
        .filter(Request.created_at >= fourteen_days_ago)
        .group_by(cast(Request.created_at, Date))
        .order_by(cast(Request.created_at, Date))
        .all()
    )
    requests_by_day = [{"date": str(r.date), "count": r.count} for r in daily_counts]

    # Top skill demand (by request type occurrence)
    all_requests = db.query(Request.type).all()
    skill_counts: dict = {}
    for (t,) in all_requests:
        if t:
            skill_counts[t] = skill_counts.get(t, 0) + 1
    top_skills_demand = sorted(
        [{"skill": k, "count": v} for k, v in skill_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )

    # Heatmap — pending requests only  
    heatmap_rows = db.query(Request.latitude, Request.longitude, Request.urgency).filter(
        Request.status == "pending"
    ).all()
    heatmap_data = [
        {"lat": r.latitude, "lng": r.longitude, "intensity": r.urgency}
        for r in heatmap_rows
    ]

    return {
        "total_volunteers": total_volunteers,
        "active_volunteers": active_volunteers,
        "total_requests": total_requests,
        "completed_requests": completed_requests,
        "pending_requests": pending_requests,
        "fulfillment_rate": fulfillment_rate,
        "avg_match_score": avg_match_score,
        "requests_by_day": requests_by_day,
        "top_skills_demand": top_skills_demand,
        "heatmap_data": heatmap_data,
    }


@router.get("/volunteer/{volunteer_id}")
def get_volunteer_analytics(volunteer_id: int, db: Session = Depends(get_db)):
    """Per-volunteer analytics including acceptance rate and badge list."""
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        return {"error": "Volunteer not found"}

    total = (volunteer.tasks_completed or 0) + (volunteer.tasks_rejected or 0)
    acceptance_rate = round(
        (volunteer.tasks_completed / total * 100), 1
    ) if total > 0 else 100.0

    return {
        "tasks_completed": volunteer.tasks_completed or 0,
        "tasks_rejected": volunteer.tasks_rejected or 0,
        "acceptance_rate": acceptance_rate,
        "reliability_score": volunteer.reliability_score,
        "avg_response_time_minutes": volunteer.avg_response_time_minutes,
        "badges": volunteer.badges or [],
    }
