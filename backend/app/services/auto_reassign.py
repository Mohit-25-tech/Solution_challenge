"""
Auto-reassignment background job.

IMPORTANT: This function MUST be a plain `def`, NOT `async def`.
APScheduler's BackgroundScheduler runs jobs in a thread pool, not an asyncio event loop.
If this is accidentally changed to async def, it will be scheduled but never awaited
= silent failure with no error messages. Use AsyncIOScheduler if you ever need async.
"""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Assignment, Volunteer, Request, AuditLog
from app.services.notifications import create_notification
from app.services.badges import evaluate_and_award_badges

# Assignment is considered "timed out" if not accepted within this window
TIMEOUT_MINUTES = 15


def auto_reassign_expired():
    """
    Background job (runs every 5 minutes via APScheduler BackgroundScheduler).

    For each assignment stuck in 'assigned' status for > TIMEOUT_MINUTES:
    1. Mark it 'expired'
    2. Penalize the volunteer (-0.05 reliability)
    3. Try to find next-best volunteer → create new assignment + notify
    4. If no volunteer found → escalate to NGO coordinator
    5. Evaluate badges for the penalized volunteer
    """
    # SAFETY GUARD: must never be async
    if asyncio.iscoroutinefunction(auto_reassign_expired):
        raise RuntimeError(
            "auto_reassign_expired must be a regular def, not async def. "
            "APScheduler BackgroundScheduler runs sync jobs in threads. "
            "If you need async, switch to AsyncIOScheduler."
        )

    db: Session = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(minutes=TIMEOUT_MINUTES)

        expired_assignments = db.query(Assignment).filter(
            Assignment.status == "assigned",
            Assignment.assigned_at < cutoff
        ).all()

        if not expired_assignments:
            return

        print(f"[auto_reassign] Found {len(expired_assignments)} timed-out assignment(s)")

        for assignment in expired_assignments:
            volunteer = db.query(Volunteer).filter(
                Volunteer.id == assignment.volunteer_id
            ).first()
            request = db.query(Request).filter(
                Request.id == assignment.request_id
            ).first()

            # Step 1: Mark assignment expired
            assignment.status = "expired"

            # Step 2: Penalize volunteer reliability (-0.05 for non-response)
            if volunteer:
                volunteer.reliability_score = max(0.0, volunteer.reliability_score - 0.05)

            # Step 3: Log the action
            log = AuditLog(
                actor_id=volunteer.user_id if volunteer else 0,
                action="auto_reassign",
                target_type="assignment",
                target_id=assignment.id,
                extra_data={
                    "reason": f"timeout_{TIMEOUT_MINUTES}min",
                    "request_id": request.id if request else None,
                    "original_volunteer_id": assignment.volunteer_id
                }
            )
            db.add(log)
            db.commit()

            if not request:
                continue

            # Step 4: Find next-best volunteer (import here to avoid circular imports)
            from app.services.matching import get_ranked_volunteers
            candidates = get_ranked_volunteers(db, assignment.request_id, limit=5)

            # Exclude the volunteer who just expired
            candidates = [c for c in candidates if c["volunteer_id"] != assignment.volunteer_id]

            if candidates:
                best = candidates[0]
                new_vol = db.query(Volunteer).filter(
                    Volunteer.id == best["volunteer_id"]
                ).first()

                if new_vol:
                    new_assignment = Assignment(
                        request_id=request.id,
                        volunteer_id=new_vol.id,
                        match_score=best["total_score"],
                        status="assigned"
                    )
                    db.add(new_assignment)
                    db.commit()

                    print(f"[auto_reassign] Reassigned request {request.id} to volunteer {new_vol.id}")

                    create_notification(
                        db=db,
                        user_id=new_vol.user_id,
                        title="⚡ New Assignment",
                        message=(
                            f"You have been assigned to '{request.title}' "
                            f"(urgency {request.urgency}/5). "
                            f"Please respond within {TIMEOUT_MINUTES} minutes."
                        ),
                        notif_type="assigned",
                        reference_id=new_assignment.id
                    )
            else:
                # Step 5: No volunteer found — escalate to NGO coordinator
                print(f"[auto_reassign] No volunteer found for request {request.id} — escalating")
                create_notification(
                    db=db,
                    user_id=request.created_by,
                    title="⚠️ Escalation Alert",
                    message=(
                        f"No volunteer could be found for '{request.title}' after auto-reassignment. "
                        f"Manual coordinator action is needed urgently."
                    ),
                    notif_type="escalated",
                    reference_id=request.id
                )

            # Step 6: Evaluate badges for penalized volunteer
            if volunteer:
                evaluate_and_award_badges(volunteer, db)

    except Exception as e:
        print(f"[auto_reassign] ERROR: {e}")
        db.rollback()
    finally:
        db.close()
