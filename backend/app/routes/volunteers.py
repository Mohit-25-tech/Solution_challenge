from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models import Volunteer, User
from app.schemas import VolunteerCreate, VolunteerUpdate, VolunteerResponse

router = APIRouter(prefix="/volunteers", tags=["volunteers"])


@router.post("", response_model=VolunteerResponse)
def create_volunteer(volunteer_data: VolunteerCreate, user_id: int, db: Session = Depends(get_db)):
    """Create volunteer profile (called after user registration)."""
    
    # Check if user exists and is a volunteer
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if volunteer already exists
    existing = db.query(Volunteer).filter(Volunteer.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Volunteer profile already exists")
    
    db_volunteer = Volunteer(
        user_id=user_id,
        latitude=volunteer_data.latitude,
        longitude=volunteer_data.longitude,
        skills=volunteer_data.skills,
        is_available=volunteer_data.is_available
    )
    
    db.add(db_volunteer)
    db.commit()
    db.refresh(db_volunteer)
    
    return db_volunteer


@router.get("", response_model=List[VolunteerResponse])
def get_volunteers(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """Get all volunteers."""
    volunteers = db.query(Volunteer).offset(skip).limit(limit).all()
    return volunteers


@router.get("/{volunteer_id}", response_model=VolunteerResponse)
def get_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Get specific volunteer by ID."""
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer


@router.patch("/{volunteer_id}", response_model=VolunteerResponse)
def update_volunteer(
    volunteer_id: int,
    volunteer_data: VolunteerUpdate,
    db: Session = Depends(get_db)
):
    """Update volunteer profile."""
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    if volunteer_data.latitude is not None:
        volunteer.latitude = volunteer_data.latitude
    if volunteer_data.longitude is not None:
        volunteer.longitude = volunteer_data.longitude
    if volunteer_data.skills is not None:
        volunteer.skills = volunteer_data.skills
    if volunteer_data.is_available is not None:
        volunteer.is_available = volunteer_data.is_available
    
    db.commit()
    db.refresh(volunteer)
    
    return volunteer
