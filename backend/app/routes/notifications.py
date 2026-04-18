from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def get_notifications(user_id: int, limit: int = 20, db: Session = Depends(get_db)):
    """Get paginated notifications for a user with unread count."""
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    unread_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

    return {
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "reference_id": n.reference_id,
                "created_at": n.created_at.isoformat()
            }
            for n in notifs
        ],
        "unread_count": unread_count
    }


@router.post("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark a single notification as read."""
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"success": True}


@router.post("/read-all")
def mark_all_read(user_id: int, db: Session = Depends(get_db)):
    """Mark all notifications as read for a user."""
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True}
