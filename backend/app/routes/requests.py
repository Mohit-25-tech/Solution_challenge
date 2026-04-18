from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.db.database import get_db
from app.models.models import Request, User

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get("")
def get_requests(
    status: Optional[str] = None,
    type: Optional[str] = None,
    urgency: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Paginated, filterable request list.
    Returns {total, items} shape (consistent with GET /volunteers).
    """
    query = db.query(Request)

    if status and status != "all":
        query = query.filter(Request.status == status)
    if type and type != "all":
        query = query.filter(Request.type == type)
    if urgency:
        query = query.filter(Request.urgency == urgency)

    total = query.count()
    items = query.order_by(Request.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": r.id,
                "type": r.type,
                "title": r.title,
                "description": r.description,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "urgency": r.urgency,
                "status": r.status,
                "volunteers_needed": r.volunteers_needed,
                "fulfilled_count": r.fulfilled_count or 0,
                "tags": r.tags or [],
                "source": r.source or "internal",
                "deadline": r.deadline.isoformat() if r.deadline else None,
                "created_by": r.created_by,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in items
        ]
    }


@router.post("")
def create_request(user_id: int, request_data: dict, db: Session = Depends(get_db)):
    """Create a new volunteer request."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deadline = None
    if request_data.get("deadline"):
        try:
            deadline = datetime.fromisoformat(request_data["deadline"].replace("Z", "+00:00"))
        except Exception:
            deadline = None

    req = Request(
        type=request_data["type"],
        title=request_data["title"],
        description=request_data.get("description", ""),
        latitude=request_data["latitude"],
        longitude=request_data["longitude"],
        urgency=request_data.get("urgency", 3),
        volunteers_needed=request_data.get("volunteers_needed", 1),
        fulfilled_count=0,
        tags=request_data.get("tags", []),
        source=request_data.get("source", "internal"),
        deadline=deadline,
        created_by=user_id
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return {
        "id": req.id,
        "type": req.type,
        "title": req.title,
        "status": req.status,
        "urgency": req.urgency,
        "created_at": req.created_at.isoformat()
    }


@router.get("/{request_id}")
def get_request(request_id: int, db: Session = Depends(get_db)):
    """Get a single request by ID."""
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    return {
        "id": req.id,
        "type": req.type,
        "title": req.title,
        "description": req.description,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "urgency": req.urgency,
        "status": req.status,
        "volunteers_needed": req.volunteers_needed,
        "fulfilled_count": req.fulfilled_count or 0,
        "tags": req.tags or [],
        "source": req.source or "internal",
        "deadline": req.deadline.isoformat() if req.deadline else None,
        "created_by": req.created_by,
        "created_at": req.created_at.isoformat(),
        "updated_at": req.updated_at.isoformat() if req.updated_at else None,
    }


@router.patch("/{request_id}")
def update_request(request_id: int, update_data: dict, db: Session = Depends(get_db)):
    """Update request fields (urgency, volunteers_needed)."""
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    for field in ["urgency", "volunteers_needed", "title", "description"]:
        if field in update_data:
            setattr(req, field, update_data[field])

    req.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True, "id": req.id}


@router.patch("/{request_id}/status")
def update_request_status(request_id: int, body: dict, db: Session = Depends(get_db)):
    """Update request status (pending → assigned → completed → cancelled)."""
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = body.get("status", req.status)
    req.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True, "status": req.status}


@router.delete("/{request_id}")
def cancel_request(request_id: int, db: Session = Depends(get_db)):
    """Soft-cancel a request (sets status to 'cancelled')."""
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = "cancelled"
    req.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True}
