from sqlalchemy.orm import Session
from app.models.models import Volunteer
from app.services.notifications import create_notification

# Badge eligibility rules
BADGE_RULES = {
    "first_task":       lambda v: v.tasks_completed >= 1,
    "10_tasks":         lambda v: v.tasks_completed >= 10,
    "top_rated":        lambda v: v.reliability_score >= 0.95,
    "rapid_responder":  lambda v: (v.avg_response_time_minutes or 999) <= 5,
    "veteran":          lambda v: v.tasks_completed >= 50,
}

BADGE_LABELS = {
    "first_task":      "First Mission",
    "10_tasks":        "10 Missions",
    "top_rated":       "Top Rated",
    "rapid_responder": "Rapid Responder",
    "veteran":         "Veteran",
}


def evaluate_and_award_badges(volunteer: Volunteer, db: Session) -> list:
    """
    Check all badge rules for the volunteer.
    Award any newly earned badges and fire a notification for each.
    Returns list of newly awarded badge keys.
    """
    current = set(volunteer.badges or [])
    earned = {badge for badge, rule in BADGE_RULES.items() if rule(volunteer)}
    new_badges = earned - current

    if new_badges:
        volunteer.badges = list(current | new_badges)
        db.commit()
        for badge in new_badges:
            label = BADGE_LABELS.get(badge, badge)
            create_notification(
                db=db,
                user_id=volunteer.user_id,
                title="🏅 Badge Earned!",
                message=f"Congratulations! You earned the '{label}' badge. Keep up the great work!",
                notif_type="badge_earned",
                reference_id=volunteer.id
            )

    return list(new_badges)
