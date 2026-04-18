from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'ngo' | 'volunteer' | 'admin'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    volunteer = relationship("Volunteer", back_populates="user", uselist=False)
    requests = relationship("Request", back_populates="creator")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor")


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    latitude = Column(Float)
    longitude = Column(Float)
    skills = Column(ARRAY(String), default=list)
    is_available = Column(Boolean, default=True)
    reliability_score = Column(Float, default=1.0)
    tasks_completed = Column(Integer, default=0)
    tasks_rejected = Column(Integer, default=0)
    # New fields
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    availability_slots = Column(JSON, nullable=True)
    badges = Column(ARRAY(String), default=list)
    avg_response_time_minutes = Column(Float, nullable=True)
    profile_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="volunteer")
    assignments = relationship("Assignment", back_populates="volunteer")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # 'medical'|'food'|'rescue'|'construction'|'logistics'|'counseling'
    title = Column(String, nullable=False)
    description = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    urgency = Column(Integer, default=1)  # 1-5
    status = Column(String, default="pending")  # 'pending'|'assigned'|'completed'|'cancelled'
    volunteers_needed = Column(Integer, default=1)
    # New fields
    fulfilled_count = Column(Integer, default=0)
    tags = Column(ARRAY(String), default=list)
    source = Column(String, default="internal")  # 'internal'|'ndma_feed'|'weather_alert'
    deadline = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="requests")
    assignments = relationship("Assignment", back_populates="request")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"))
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))
    match_score = Column(Float)
    status = Column(String, default="assigned")  # 'assigned'|'accepted'|'rejected'|'completed'|'expired'
    assigned_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    request = relationship("Request", back_populates="assignments")
    volunteer = relationship("Volunteer", back_populates="assignments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # 'assigned'|'accepted'|'rejected'|'completed'|'escalated'|'badge_earned'|'weather_alert'
    is_read = Column(Boolean, default=False)
    reference_id = Column(Integer, nullable=True)  # assignment_id or request_id
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)   # 'assign'|'accept'|'reject'|'complete'|'escalate'|'auto_reassign'
    target_type = Column(String, nullable=False)  # 'request'|'assignment'|'volunteer'
    target_id = Column(Integer, nullable=False)
    extra_data = Column(JSON, nullable=True)   # 'metadata' is reserved by SQLAlchemy ORM
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    actor = relationship("User", back_populates="audit_logs")
