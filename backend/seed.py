#!/usr/bin/env python3
"""
VolunteerMatch v2.0 — Database Reset & Seed Script
Run from backend/ directory: python seed.py

STRATEGY: DROP all tables first, then recreate + seed.
This handles schema changes (Enum→String, new columns, new tables).
"""
import sys
import os
import random
from datetime import datetime, timedelta

# Add backend to path so `from app.xxx` imports work
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.db.database import engine, Base
from app.models import models     # Must import to register all models with Base
from app.core.config import settings
from sqlalchemy.orm import Session


def random_past_date(max_days=14):
    """Return a datetime randomly in the past max_days days."""
    delta = timedelta(
        days=random.randint(0, max_days),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )
    return datetime.utcnow() - delta


def reset_and_seed():
    print("=" * 60)
    print("VolunteerMatch v2.0 — DB Reset & Seed")
    print("=" * 60)
    print(f"DB URL: {settings.get_database_url()[:50]}...")

    # ─── A5: Safe re-run — drop everything first ──────────────
    print("\n[1/4] Dropping tables...")
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS notifications CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS assignments CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS requests CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS volunteers CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        for enum_type in ["userrole", "requesttype", "requeststatus", "assignmentstatus"]:
            try:
                conn.execute(text(f"DROP TYPE IF EXISTS {enum_type} CASCADE"))
            except Exception:
                pass
    print("   [OK] All tables dropped")

    print("\n[2/4] Recreating tables from models...")
    Base.metadata.create_all(bind=engine)
    print("   [OK] Tables created")
    print("   Tables:", list(Base.metadata.tables.keys()))

    print("\n[3/4] Seeding data...")
    import bcrypt
    from app.models.models import User, Volunteer, Request, Assignment, Notification

    def hash_pw(pw: str) -> str:
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

    with Session(engine) as db:
        # ─── E4: Users — 2 NGO + 1 primary vol + 8 extra vols ────
        ngo1 = User(name="Priya Kapoor", email="ngo1@volunteermatch.com",
                     password_hash=hash_pw("password123"), role="ngo")
        ngo2 = User(name="Arjun Singh", email="ngo2@volunteermatch.com",
                     password_hash=hash_pw("password123"), role="ngo")

        vol1_user = User(name="Tirth Patel", email="vol1@volunteermatch.com",
                          password_hash=hash_pw("password123"), role="volunteer")

        extra_vol_users = [
            User(name="Rajan Mehta",     email="rajan@mail.com",     password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Sunita Patel",    email="sunita@mail.com",    password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Amit Kumar",      email="amit@mail.com",      password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Kavya Nair",      email="kavya@mail.com",     password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Deepak Sharma",   email="deepak@mail.com",    password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Meena John",      email="meena@mail.com",     password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Vikas Thakur",    email="vikas@mail.com",     password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Anjali Das",      email="anjali@mail.com",    password_hash=hash_pw("password123"), role="volunteer"),
        ]

        all_users = [ngo1, ngo2, vol1_user] + extra_vol_users
        db.add_all(all_users)
        db.flush()

        # ─── Volunteers — A3: wider offsets, vol1 pinned ──────────
        # vol1 (Tirth Patel) — pinned to Ahmedabad exact coords
        vol1 = Volunteer(
            user_id=vol1_user.id,
            latitude=23.022,
            longitude=72.571,
            skills=["medical", "first_aid", "counseling"],
            is_available=True,
            reliability_score=0.96,
            tasks_completed=14,
            tasks_rejected=1,
            badges=["rapid_responder", "top_rated", "first_task"],
            bio="Experienced medical volunteer based in Ahmedabad. First responder certified.",
            phone="+91-9876543210",
            availability_slots={"mon": ["morning", "afternoon"], "tue": ["morning"], "wed": ["afternoon"], "thu": ["morning", "afternoon"], "fri": ["morning"], "sat": ["morning", "afternoon", "evening"], "sun": ["morning"]},
            avg_response_time_minutes=4.2
        )
        db.add(vol1)

        # 8 additional volunteers with A3: ±0.10 offset for spread
        extra_volunteer_data = [
            (extra_vol_users[0], [28.63 + random.uniform(-0.10, 0.10), 77.22 + random.uniform(-0.10, 0.10)], ["medical", "first_aid"],            0.95, 12, ["first_task", "10_tasks"]),
            (extra_vol_users[1], [19.08 + random.uniform(-0.10, 0.10), 72.88 + random.uniform(-0.10, 0.10)], ["construction", "logistics"],       0.88, 7,  ["first_task"]),
            (extra_vol_users[2], [12.97 + random.uniform(-0.10, 0.10), 77.59 + random.uniform(-0.10, 0.10)], ["first_aid", "counseling"],         0.92, 8,  ["first_task"]),
            (extra_vol_users[3], [17.39 + random.uniform(-0.10, 0.10), 78.48 + random.uniform(-0.10, 0.10)], ["food_distribution", "logistics"],  0.79, 3,  []),
            (extra_vol_users[4], [22.57 + random.uniform(-0.10, 0.10), 88.36 + random.uniform(-0.10, 0.10)], ["rescue", "construction"],          0.97, 15, ["first_task", "10_tasks", "top_rated"]),
            (extra_vol_users[5], [13.08 + random.uniform(-0.10, 0.10), 80.27 + random.uniform(-0.10, 0.10)], ["counseling", "medical"],           0.85, 5,  ["first_task"]),
            (extra_vol_users[6], [23.05 + random.uniform(-0.10, 0.10), 72.60 + random.uniform(-0.10, 0.10)], ["logistics", "driving"],            0.91, 10, ["first_task", "10_tasks"]),
            (extra_vol_users[7], [18.52 + random.uniform(-0.10, 0.10), 73.85 + random.uniform(-0.10, 0.10)], ["rescue", "first_aid"],             0.82, 6,  ["first_task"]),
        ]

        extra_volunteers = []
        for user, (lat, lng), skills, reliability, tasks_completed, badges in extra_volunteer_data:
            v = Volunteer(
                user_id=user.id,
                latitude=lat,
                longitude=lng,
                skills=skills,
                is_available=True,
                reliability_score=reliability,
                tasks_completed=tasks_completed,
                tasks_rejected=0,
                badges=badges,
                bio=f"Experienced {skills[0].replace('_', ' ')} volunteer.",
                phone="+91-9000000001",
                availability_slots={"mon": ["morning", "afternoon"], "wed": ["afternoon"], "sat": ["morning", "afternoon", "evening"]},
                avg_response_time_minutes=round(random.uniform(3.0, 15.0), 1)
            )
            db.add(v)
            extra_volunteers.append(v)
        db.flush()

        all_volunteers = [vol1] + extra_volunteers

        # ─── A1: 5 Nearby requests for vol1 (within 2-3km of Ahmedabad) ──
        nearby_requests_data = [
            dict(type="medical",     title="Emergency Blood Camp — Navrangpura",
                 description="Urgent need for medical volunteers at blood donation camp near Navrangpura area",
                 lat=23.037, lng=72.560, urgency=5, volunteers_needed=2,
                 deadline_hours=6),
            dict(type="food",        title="Food Kit Distribution — Sabarmati",
                 description="Distribute food kits to 500 flood-affected families near Sabarmati riverfront",
                 lat=23.040, lng=72.580, urgency=4, volunteers_needed=3,
                 deadline_hours=12),
            dict(type="rescue",      title="Search & Rescue — Paldi Area",
                 description="Rescue team needed for trapped residents after waterlogging in Paldi",
                 lat=23.010, lng=72.556, urgency=5, volunteers_needed=4,
                 deadline_hours=8),
            dict(type="logistics",   title="Relief Supply Transport — Maninagar",
                 description="Logistics volunteers needed to transport relief supplies from warehouse to camps",
                 lat=23.005, lng=72.585, urgency=3, volunteers_needed=2,
                 deadline_hours=18),
            dict(type="counseling",  title="Trauma Counseling — SG Highway",
                 description="Mental health support volunteers needed for displaced families at SG Highway shelter",
                 lat=23.030, lng=72.530, urgency=3, volunteers_needed=2,
                 deadline_hours=24),
        ]

        nearby_requests = []
        for rd in nearby_requests_data:
            req = Request(
                type=rd["type"],
                title=rd["title"],
                description=rd["description"],
                latitude=rd["lat"],
                longitude=rd["lng"],
                urgency=rd["urgency"],
                volunteers_needed=rd["volunteers_needed"],
                status="pending",
                fulfilled_count=0,
                source="internal",
                tags=[rd["type"], "disaster-relief"],
                deadline=datetime.utcnow() + timedelta(hours=rd["deadline_hours"]),
                created_by=ngo1.id,
                created_at=random_past_date(3)  # A2: spread across recent days
            )
            db.add(req)
            nearby_requests.append(req)

        # ─── 15 other requests spread across India (A2: dates spread over 14 days) ──
        other_requests_data = [
            dict(type="medical",      title="Flood Camp Medical Aid — Ahmedabad",      description="Medical volunteers needed for flood relief camp in Ahmedabad",    lat=23.02+random.uniform(-0.10,0.10),  lng=72.57+random.uniform(-0.10,0.10),  urgency=5, vn=3, status="pending",   source="ndma_feed"),
            dict(type="rescue",       title="Search & Rescue — Chennai",               description="Cyclone rescue operations along Chennai coast",                    lat=13.08+random.uniform(-0.10,0.10),  lng=80.27+random.uniform(-0.10,0.10),  urgency=5, vn=4, status="pending",   source="ndma_feed"),
            dict(type="food",         title="Food Distribution — Delhi",                description="Food drive for 2000 displaced families in North Delhi",            lat=28.71+random.uniform(-0.10,0.10),  lng=77.31+random.uniform(-0.10,0.10),  urgency=3, vn=2, status="pending",   source="internal"),
            dict(type="construction", title="Shelter Build — Hyderabad",               description="Temporary shelter construction for earthquake victims",            lat=17.28+random.uniform(-0.10,0.10),  lng=78.39+random.uniform(-0.10,0.10),  urgency=4, vn=2, status="assigned",  source="internal"),
            dict(type="counseling",   title="Trauma Counseling — Mumbai",              description="Mental health support volunteers needed for survivors",             lat=19.18+random.uniform(-0.10,0.10),  lng=72.94+random.uniform(-0.10,0.10),  urgency=4, vn=2, status="pending",   source="internal"),
            dict(type="logistics",    title="Supply Chain — Kolkata",                  description="Logistics volunteers needed for relief goods distribution",         lat=22.57+random.uniform(-0.10,0.10),  lng=88.36+random.uniform(-0.10,0.10),  urgency=3, vn=2, status="completed", source="internal"),
            dict(type="medical",      title="First Aid Camp — Bangalore",              description="First aid station volunteers for IT park flood relief",             lat=12.97+random.uniform(-0.10,0.10),  lng=77.59+random.uniform(-0.10,0.10),  urgency=3, vn=2, status="pending",   source="internal"),
            dict(type="rescue",       title="River Search — Pune",                     description="Search teams needed for missing persons after river flooding",      lat=18.52+random.uniform(-0.10,0.10),  lng=73.85+random.uniform(-0.10,0.10),  urgency=5, vn=3, status="pending",   source="ndma_feed"),
            dict(type="food",         title="Community Kitchen — Jaipur",              description="Set up and run community kitchen for 1000 affected people",         lat=26.91+random.uniform(-0.10,0.10),  lng=75.78+random.uniform(-0.10,0.10),  urgency=4, vn=3, status="pending",   source="internal"),
            dict(type="construction", title="Bridge Repair — Patna",                   description="Temporary bridge construction for flood-affected village access",   lat=25.61+random.uniform(-0.10,0.10),  lng=85.14+random.uniform(-0.10,0.10),  urgency=4, vn=5, status="pending",   source="internal"),
            dict(type="logistics",    title="Medical Supply Airlift — Guwahati",       description="Coordinate medical supply delivery to remote flood areas",          lat=26.14+random.uniform(-0.10,0.10),  lng=91.74+random.uniform(-0.10,0.10),  urgency=5, vn=2, status="pending",   source="ndma_feed"),
            dict(type="counseling",   title="Child Welfare — Lucknow",                 description="Counselors needed for unaccompanied minors at relief center",       lat=26.85+random.uniform(-0.10,0.10),  lng=80.95+random.uniform(-0.10,0.10),  urgency=3, vn=2, status="pending",   source="internal"),
            dict(type="medical",      title="Vaccination Drive — Bhopal",              description="Emergency vaccination drive for flood-affected communities",        lat=23.26+random.uniform(-0.10,0.10),  lng=77.41+random.uniform(-0.10,0.10),  urgency=4, vn=3, status="completed", source="internal"),
            dict(type="rescue",       title="Landslide Response — Shimla",             description="Search and rescue teams for landslide zone clearance",              lat=31.10+random.uniform(-0.10,0.10),  lng=77.17+random.uniform(-0.10,0.10),  urgency=5, vn=4, status="assigned",  source="ndma_feed"),
            dict(type="food",         title="Emergency Rations — Varanasi",            description="Distribute emergency ration packs to stranded families",            lat=25.32+random.uniform(-0.10,0.10),  lng=83.01+random.uniform(-0.10,0.10),  urgency=3, vn=2, status="pending",   source="internal"),
        ]

        other_requests = []
        for i, rd in enumerate(other_requests_data):
            req = Request(
                type=rd["type"],
                title=rd["title"],
                description=rd["description"],
                latitude=rd["lat"],
                longitude=rd["lng"],
                urgency=rd["urgency"],
                volunteers_needed=rd["vn"],
                status=rd["status"],
                fulfilled_count=1 if rd["status"] == "completed" else 0,
                source=rd.get("source", "internal"),
                tags=[rd["type"], "disaster-relief"],
                deadline=datetime.utcnow() + timedelta(hours=72 - i * 4),
                created_by=ngo1.id if i % 2 == 0 else ngo2.id,
                created_at=random_past_date(14)  # A2: spread across 14 days
            )
            db.add(req)
            other_requests.append(req)
        db.flush()

        all_requests = nearby_requests + other_requests

        # ─── Assignments — 8 completed with spread timestamps ──
        completed_assignments = []
        # Use some requests that have completed/assigned status
        assignment_pairs = [
            (other_requests[5], extra_volunteers[6]),   # Supply Chain — Kolkata (completed)
            (other_requests[12], extra_volunteers[0]),  # Vaccination Drive — Bhopal (completed)
            (other_requests[3], extra_volunteers[1]),   # Shelter Build — Hyderabad (assigned)
            (other_requests[13], extra_volunteers[4]),  # Landslide Response — Shimla (assigned)
        ]

        for req, vol in assignment_pairs:
            days_ago = random.randint(1, 13)
            assigned = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 12))
            accepted = assigned + timedelta(hours=random.randint(1, 4))
            completed = accepted + timedelta(hours=random.randint(2, 24)) if req.status == "completed" else None

            a = Assignment(
                request_id=req.id,
                volunteer_id=vol.id,
                match_score=round(random.uniform(0.70, 0.98), 2),
                status=req.status if req.status in ["completed", "assigned"] else "assigned",
                assigned_at=assigned,
                accepted_at=accepted if req.status != "assigned" else None,
                completed_at=completed,
                created_at=assigned,
            )
            db.add(a)
            completed_assignments.append(a)

        # 4 more completed assignments for vol1 (to show history)
        completed_req_types = ["medical", "food", "rescue", "logistics"]
        for i, rtype in enumerate(completed_req_types):
            days_ago = random.randint(2, 13)
            assigned = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 12))
            accepted = assigned + timedelta(hours=random.randint(1, 3))
            completed = accepted + timedelta(hours=random.randint(2, 12))

            # Create a past request for this assignment
            past_req = Request(
                type=rtype,
                title=f"Past {rtype.title()} Mission #{i+1}",
                description=f"Completed {rtype} assignment for vol1 history",
                latitude=23.022 + random.uniform(-0.05, 0.05),
                longitude=72.571 + random.uniform(-0.05, 0.05),
                urgency=random.randint(3, 5),
                volunteers_needed=2,
                status="completed",
                fulfilled_count=1,
                source="internal",
                tags=[rtype, "disaster-relief"],
                deadline=completed + timedelta(hours=24),
                created_by=ngo1.id,
                created_at=assigned - timedelta(hours=2),
            )
            db.add(past_req)
            db.flush()

            a = Assignment(
                request_id=past_req.id,
                volunteer_id=vol1.id,
                match_score=round(random.uniform(0.80, 0.98), 2),
                status="completed",
                assigned_at=assigned,
                accepted_at=accepted,
                completed_at=completed,
                created_at=assigned,
            )
            db.add(a)
            completed_assignments.append(a)

        db.flush()

        # ─── Notifications ─────────────────────────────────
        # 3 unread for ngo1
        db.add(Notification(
            user_id=ngo1.id,
            title="New volunteer registered",
            message="Tirth Patel has joined VolunteerMatch and is available for assignments.",
            type="assigned",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=2),
        ))
        db.add(Notification(
            user_id=ngo1.id,
            title="Task completed",
            message="Supply Chain — Kolkata has been marked as completed by Vikas Thakur.",
            type="completed",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=5),
        ))
        db.add(Notification(
            user_id=ngo1.id,
            title="NDMA Alert: Cyclone Warning",
            message="IMD has issued cyclone warning for Chennai coast. Consider deploying rescue teams.",
            type="weather_alert",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=1),
        ))

        # 2 unread for vol1
        db.add(Notification(
            user_id=vol1_user.id,
            title="New task assigned",
            message="You have been assigned to Emergency Blood Camp — Navrangpura. Please review and accept.",
            type="assigned",
            is_read=False,
            reference_id=nearby_requests[0].id if nearby_requests else None,
            created_at=datetime.utcnow() - timedelta(minutes=30),
        ))
        db.add(Notification(
            user_id=vol1_user.id,
            title="Badge earned: Rapid Responder",
            message="Congratulations! You've earned the Rapid Responder badge for fast task acceptance.",
            type="badge_earned",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=3),
        ))

        db.commit()

    print("   [OK] Data seeded successfully")
    print("\n   NGO accounts:")
    print("     ngo1@volunteermatch.com / password123")
    print("     ngo2@volunteermatch.com / password123")
    print("\n   Primary demo volunteer:")
    print("     vol1@volunteermatch.com / password123 (Tirth Patel)")
    print("\n   Additional volunteers:")
    emails = [
        "rajan@mail.com", "sunita@mail.com", "amit@mail.com", "kavya@mail.com",
        "deepak@mail.com", "meena@mail.com", "vikas@mail.com", "anjali@mail.com"
    ]
    for e in emails:
        print(f"     {e} / password123")

    print("\n[4/4] Verification...")
    with Session(engine) as db:
        from app.models.models import User, Volunteer, Request, Assignment, Notification, AuditLog
        counts = {
            "users": db.query(User).count(),
            "volunteers": db.query(Volunteer).count(),
            "requests": db.query(Request).count(),
            "assignments": db.query(Assignment).count(),
            "notifications": db.query(Notification).count(),
            "audit_logs": db.query(AuditLog).count(),
        }
    for table, count in counts.items():
        print(f"   [OK] {table}: {count} rows")

    print(f"\n{'=' * 60}")
    print("[OK] VolunteerMatch v2.0 DB ready!")
    print("   Run: cd backend && uvicorn app.main:app --reload")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    reset_and_seed()
