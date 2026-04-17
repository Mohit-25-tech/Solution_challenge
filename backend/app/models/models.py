from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ARRAY, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base


class UserRole(str, enum.Enum):
    ngo = "ngo"
    volunteer = "volunteer"


class RequestType(str, enum.Enum):
    medical = "medical"
    food = "food"
    rescue = "rescue"
    construction = "construction"
    logistics = "logistics"
    counseling = "counseling"


class RequestStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    completed = "completed"


class AssignmentStatus(str, enum.Enum):
    assigned = "assigned"
    accepted = "accepted"
    rejected = "rejected"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    volunteer = relationship("Volunteer", back_populates="user", uselist=False)
    requests = relationship("Request", back_populates="created_by_user")
    assignments = relationship("Assignment", back_populates="volunteer_user")


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    skills = Column(ARRAY(String), default=list, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    reliability_score = Column(Float, default=1.0, nullable=False)
    tasks_completed = Column(Integer, default=0, nullable=False)
    tasks_rejected = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="volunteer")
    assignments = relationship("Assignment", back_populates="volunteer")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(RequestType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    urgency = Column(Integer, default=3, nullable=False)  # 1-5 scale
    status = Column(Enum(RequestStatus), default=RequestStatus.pending, nullable=False)
    volunteers_needed = Column(Integer, default=1, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deadline = Column(DateTime, nullable=True)

    # Relationships
    created_by_user = relationship("User", back_populates="requests")
    assignments = relationship("Assignment", back_populates="request")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=False)
    match_score = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.assigned, nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    request = relationship("Request", back_populates="assignments")
    volunteer = relationship("Volunteer", back_populates="assignments")
    volunteer_user = relationship("User", foreign_keys=[volunteer_id], overlaps="volunteer,assignments")
