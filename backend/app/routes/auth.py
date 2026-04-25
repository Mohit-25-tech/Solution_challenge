from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
import bcrypt
from app.db.database import get_db
from app.models.models import User, Volunteer
from app.schemas import UserRegister, UserLogin, PasswordReset
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.get_token_expire_minutes())
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.get_secret_key(),
        algorithm=settings.algorithm
    )
    return encoded_jwt


@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user (NGO or Volunteer). Returns user object with volunteer_id if applicable."""

    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # volunteer_id is null at register time — volunteer profile created separately
    return {
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "role": db_user.role,
        "volunteer_id": None,
        "created_at": db_user.created_at.isoformat()
    }


@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and return JWT token.
    FIX 1: volunteer_id is included in both the JWT payload and the response body.
    This is critical for all volunteer-side features (profile, portal, QR, analytics).
    """
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Look up volunteer record — needed by frontend for volunteer-side features
    volunteer_id = None
    if user.role == "volunteer":
        volunteer = db.query(Volunteer).filter(Volunteer.user_id == user.id).first()
        if volunteer:
            volunteer_id = volunteer.id

    # Include volunteer_id in JWT payload
    token_data = {
        "sub": str(user.id),
        "role": user.role,
        "email": user.email,
        "volunteer_id": volunteer_id,
        "exp": datetime.utcnow() + timedelta(minutes=settings.get_token_expire_minutes())
    }
    access_token = jwt.encode(
        token_data,
        settings.get_secret_key(),
        algorithm=settings.algorithm
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "volunteer_id": volunteer_id  # ← critical for volunteer-side features
        }
    }


@router.post("/reset-password")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)):
    """
    Reset password for a user if their email exists in the database.
    """
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address"
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )

    user.password_hash = get_password_hash(data.new_password)
    db.commit()

    return {"success": True, "message": "Password reset successfully"}

