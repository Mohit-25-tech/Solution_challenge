from sqlalchemy.orm import Session
from app.models.models import Notification


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str,
    reference_id: int = None
) -> Notification:
    """
    Create and persist a notification for a user.

    Types: 'assigned' | 'accepted' | 'rejected' | 'completed'
           | 'escalated' | 'badge_earned' | 'weather_alert'
    """
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        reference_id=reference_id
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
