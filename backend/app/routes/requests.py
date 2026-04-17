from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models import Request, RequestStatus, User
from app.schemas import RequestCreate, RequestUpdate, RequestResponse, RequestDetailResponse

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("", response_model=RequestResponse)
def create_request(request_data: RequestCreate, user_id: int, db: Session = Depends(get_db)):
    """Create a new volunteer request (NGO only)."""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate urgency
    if not (1 <= request_data.urgency <= 5):
        raise HTTPException(status_code=400, detail="Urgency must be between 1-5")
    
    db_request = Request(
        type=request_data.type,
        title=request_data.title,
        description=request_data.description,
        latitude=request_data.latitude,
        longitude=request_data.longitude,
        urgency=request_data.urgency,
        volunteers_needed=request_data.volunteers_needed,
        created_by=user_id,
        deadline=request_data.deadline
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request


@router.get("", response_model=List[RequestResponse])
def get_requests(db: Session = Depends(get_db), skip: int = 0, limit: int = 100, status_filter: str = None):
    """Get all requests with optional status filter."""
    query = db.query(Request)
    
    if status_filter:
        try:
            status_enum = RequestStatus[status_filter]
            query = query.filter(Request.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    requests = query.offset(skip).limit(limit).all()
    return requests


@router.get("/{request_id}", response_model=RequestDetailResponse)
def get_request(request_id: int, db: Session = Depends(get_db)):
    """Get specific request with details."""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


@router.patch("/{request_id}", response_model=RequestResponse)
def update_request(
    request_id: int,
    request_data: RequestUpdate,
    db: Session = Depends(get_db)
):
    """Update request status."""
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request_data.status is not None:
        request.status = request_data.status
    if request_data.urgency is not None:
        if not (1 <= request_data.urgency <= 5):
            raise HTTPException(status_code=400, detail="Urgency must be between 1-5")
        request.urgency = request_data.urgency
    if request_data.volunteers_needed is not None:
        request.volunteers_needed = request_data.volunteers_needed
    
    db.commit()
    db.refresh(request)
    
    return request
