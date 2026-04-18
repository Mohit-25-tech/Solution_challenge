#!/usr/bin/env python3
"""
VolunteerMatch v2.0 — Database Reset & Seed Script
Run from backend/ directory: python seed.py

STRATEGY: DROP all tables first, then recreate + seed.
This handles schema changes (Enum→String, new columns, new tables).
"""
import sys
import os

# Add backend to path so `from app.xxx` imports work
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.db.database import engine, Base
from app.models import models     # Must import to register all models with Base
from app.core.config import settings

# Import after registering models
from sqlalchemy.orm import Session


def reset_and_seed():
    print("=" * 55)
    print("VolunteerMatch v2.0 — DB Reset & Seed")
    print("=" * 55)
    print(f"DB URL: {settings.get_database_url()[:50]}...")

    print("\n[1/4] Dropping all existing tables (clean slate)...")
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS notifications CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS assignments CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS requests CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS volunteers CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        # Drop old enum types if they exist (from previous schema)
        for enum_type in ["userrole", "requesttype", "requeststatus", "assignmentstatus"]:
            try:
                conn.execute(text(f"DROP TYPE IF EXISTS {enum_type} CASCADE"))
            except Exception:
                pass
    print("   [OK] All tables dropped")

    print("\n[2/4] Creating tables from models...")
    Base.metadata.create_all(bind=engine)
    print("   [OK] Tables created")
    print("   Tables:", list(Base.metadata.tables.keys()))

    print("\n[3/4] Seeding data...")
    import bcrypt
    from app.models.models import User, Volunteer, Request, Assignment

    def hash_pw(pw: str) -> str:
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

    with Session(engine) as db:
        # ─── Users ─────────────────────────────────────────────────
        coord1 = User(name="Priya Kapoor", email="priya@ngo.org",
                      password_hash=hash_pw("password123"), role="ngo")
        coord2 = User(name="Arjun Singh", email="arjun@ngo.org",
                      password_hash=hash_pw("password123"), role="ngo")

        vol_users = [
            User(name="Rajan Mehta",     email="rajan@mail.com",     password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Sunita Patel",    email="sunita@mail.com",    password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Amit Kumar",      email="amit@mail.com",      password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Kavya Nair",      email="kavya@mail.com",     password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Deepak Sharma",   email="deepak@mail.com",    password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Meena John",      email="meena@mail.com",     password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Vikas Thakur",    email="vikas@mail.com",     password_hash=hash_pw("password123"), role="volunteer"),
            User(name="Anjali Das",      email="anjali@mail.com",    password_hash=hash_pw("password123"), role="volunteer"),
        ]

        db.add_all([coord1, coord2] + vol_users)
        db.flush()  # Get IDs

        # ─── Volunteers ─────────────────────────────────────────────
        volunteer_profiles = [
            (vol_users[0], [28.63, 77.22], ["medical", "first_aid"],            0.95, 12, ["first_task", "10_tasks"]),
            (vol_users[1], [19.08, 72.88], ["construction", "logistics"],       0.88, 7,  ["first_task"]),
            (vol_users[2], [12.97, 77.59], ["first_aid", "counseling"],         0.92, 8,  ["first_task"]),
            (vol_users[3], [17.39, 78.48], ["food_distribution", "logistics"],  0.79, 3,  []),
            (vol_users[4], [22.57, 88.36], ["rescue", "construction"],          0.97, 15, ["first_task", "10_tasks", "top_rated"]),
            (vol_users[5], [13.08, 80.27], ["counseling", "medical"],           0.85, 5,  ["first_task"]),
            (vol_users[6], [23.02, 72.57], ["logistics", "driving"],            0.91, 10, ["first_task", "10_tasks"]),
            (vol_users[7], [18.52, 73.85], ["rescue", "first_aid"],             0.82, 6,  ["first_task"]),
        ]

        volunteers = []
        for user, (lat, lng), skills, reliability, tasks_completed, badges in volunteer_profiles:
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
                avg_response_time_minutes=6.5
            )
            db.add(v)
            volunteers.append(v)
        db.flush()

        # ─── Requests ───────────────────────────────────────────────
        from datetime import datetime, timedelta

        requests_data = [
            dict(type="medical",     title="Flood Camp Medical Aid",        description="Medical volunteers needed for flood relief camp in Ahmedabad",  lat=23.02, lng=72.57, urgency=5, volunteers_needed=3, status="pending",  source="ndma_feed"),
            dict(type="rescue",      title="Search & Rescue — Chennai",     description="Cyclone rescue operations along Chennai coast",                  lat=13.08, lng=80.27, urgency=5, volunteers_needed=4, status="pending",  source="ndma_feed"),
            dict(type="food",        title="Food Distribution — Delhi",      description="Food drive for 2000 displaced families in North Delhi",          lat=28.71, lng=77.31, urgency=3, volunteers_needed=2, status="pending",  source="internal"),
            dict(type="construction",title="Shelter Build — Hyderabad",     description="Temporary shelter construction for earthquake victims",          lat=17.28, lng=78.39, urgency=4, volunteers_needed=2, status="assigned", source="internal"),
            dict(type="counseling",  title="Trauma Counseling — Mumbai",    description="Mental health support volunteers needed for survivors",           lat=19.18, lng=72.94, urgency=4, volunteers_needed=2, status="pending",  source="internal"),
            dict(type="logistics",   title="Supply Chain — Kolkata",        description="Logistics volunteers needed for relief goods distribution",       lat=22.57, lng=88.36, urgency=3, volunteers_needed=2, status="completed",source="internal"),
            dict(type="medical",     title="First Aid Camp — Bangalore",    description="First aid station volunteers for IT park flood relief",           lat=12.97, lng=77.59, urgency=3, volunteers_needed=2, status="pending",  source="internal"),
            dict(type="rescue",      title="River Search — Pune",           description="Search teams needed for missing persons after river flooding",    lat=18.52, lng=73.85, urgency=5, volunteers_needed=3, status="pending",  source="ndma_feed"),
        ]

        requests = []
        for i, rd in enumerate(requests_data):
            req = Request(
                type=rd["type"],
                title=rd["title"],
                description=rd["description"],
                latitude=rd["lat"],
                longitude=rd["lng"],
                urgency=rd["urgency"],
                volunteers_needed=rd["volunteers_needed"],
                status=rd["status"],
                fulfilled_count=0,
                source=rd.get("source", "internal"),
                tags=[rd["type"], "disaster-relief"],
                deadline=datetime.utcnow() + timedelta(hours=72 - i * 5),
                created_by=coord1.id
            )
            db.add(req)
            requests.append(req)
        db.flush()

        # ─── Assignments ─────────────────────────────────────────────
        db.add(Assignment(
            request_id=requests[3].id,  # Shelter Build — has assigned status
            volunteer_id=volunteers[1].id,
            match_score=0.78,
            status="accepted"
        ))
        db.add(Assignment(
            request_id=requests[5].id,  # Supply Chain — completed
            volunteer_id=volunteers[6].id,
            match_score=0.85,
            status="completed"
        ))

        db.commit()

    print("   [OK] Data seeded successfully")
    print("\n   Coordinator accounts (role: ngo):")
    print("     priya@ngo.org / password123")
    print("     arjun@ngo.org / password123")
    print("\n   Volunteer accounts (role: volunteer):")
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

    print(f"\n{'=' * 55}")
    print("[OK] VolunteerMatch v2.0 DB ready!")
    print("   Run: cd backend && uvicorn app.main:app --reload")
    print(f"{'=' * 55}")


if __name__ == "__main__":
    reset_and_seed()
