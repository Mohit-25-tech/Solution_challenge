"""
Seed script to populate database with demo data.
Generates 50 volunteers and 15 requests with realistic data.
Run with: python seed.py
"""

import random
from datetime import datetime, timedelta
from app.db.database import SessionLocal, engine, Base
from app.models import User, Volunteer, Request, UserRole, RequestType, RequestStatus
from app.routes.auth import get_password_hash

# Sample data
VOLUNTEER_NAMES = [
    "Sarah Chen", "James Martinez", "Amanda Wilson", "David Lee", "Maria Garcia",
    "Robert Johnson", "Lisa Anderson", "Michael Brown", "Jennifer Taylor", "Daniel Rodriguez",
    "Emma Martinez", "Christopher Lee", "Olivia Davis", "Matthew Harris", "Sophia Clark",
    "Andrew White", "Ava Green", "Matthew King", "Isabella Scott", "Benjamin Lewis",
    "Charlotte Walker", "Lucas Hall", "Amelia Allen", "Oliver Young", "Mia Hernandez",
    "Ethan Moore", "Charlotte Jackson", "Benjamin Martin", "Amelia Perez", "Lucas Thompson",
    "Ava White", "Mason Harris", "Isabella Martin", "Logan Thompson", "Emma Garcia",
    "Liam Davis", "Olivia Rodriguez", "Noah Martinez", "Charlotte Hernandez", "Elijah Lopez",
    "Amelia Gonzalez", "James Wilson", "Ava Anderson", "Benjamin Taylor", "Isabella Brown",
    "Lucas Jones", "Emma Miller", "Mason Davis", "Charlotte Wilson", "Oliver Garcia"
]

SKILLS = [
    "Medical Training", "First Aid", "Nursing", "Healthcare",
    "Construction", "Heavy Equipment", "Leadership",
    "Logistics", "Supply Chain", "Organization",
    "Teaching", "Childcare", "Education",
    "Counseling", "Mental Health", "Social Services",
    "Cooking", "Food Preparation",
    "IT Support", "Technical Skills",
]

REQUEST_TYPES = [RequestType.medical, RequestType.food, RequestType.rescue, 
                 RequestType.construction, RequestType.logistics, RequestType.counseling]

REQUEST_TITLES = [
    "Medical Assistance at Community Clinic",
    "Community Center Renovation",
    "Food Distribution Network Coordination",
    "Youth Mentorship Program",
    "Crisis Counseling Support",
    "Emergency Rescue Operations",
    "Healthcare Mobile Van Support",
    "Elder Care Home Renovation",
    "School Supply Distribution",
    "Disaster Relief Coordination",
    "Community Kitchen Assistance",
    "Hospital Equipment Setup",
    "Education Center Construction",
    "Mental Health Awareness Campaign",
    "COVID-19 Testing Support"
]

REQUEST_DESCRIPTIONS = [
    "Help provide medical services to underserved communities.",
    "Assist with construction and renovation of community facilities.",
    "Organize and manage food distribution across multiple locations.",
    "Mentor local youth in educational and life skills programs.",
    "Provide emotional and crisis counseling support.",
    "Assist in emergency rescue and disaster relief operations.",
    "Support mobile healthcare delivery to remote areas.",
    "Help renovate and repair facilities for elderly residents.",
    "Help distribute educational materials and school supplies.",
    "Coordinate relief efforts for disaster-affected communities.",
    "Assist in meal preparation and distribution.",
    "Support hospital setup and equipment installation.",
    "Help construct educational facilities.",
    "Support mental health awareness and education.",
    "Assist with testing and health screening operations."
]

# Bay Area coordinates (rough radius)
BAY_AREA_CENTER = (37.7749, -122.4194)  # San Francisco
AREA_RANGE = 0.3  # Roughly 20-30km radius


def get_random_coordinates():
    """Generate random coordinates within Bay Area."""
    lat = BAY_AREA_CENTER[0] + random.uniform(-AREA_RANGE, AREA_RANGE)
    lon = BAY_AREA_CENTER[1] + random.uniform(-AREA_RANGE, AREA_RANGE)
    return lat, lon


def seed_database():
    """Create tables and seed with demo data."""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(Request).delete()
        db.query(Volunteer).delete()
        db.query(User).delete()
        db.commit()
        
        print("Deleted existing data...")
        
        # Create NGO users
        ngo_user = User(
            name="Demo NGO",
            email="ngo@demo.com",
            password_hash=get_password_hash("demo123"),
            role=UserRole.ngo
        )
        db.add(ngo_user)
        db.commit()
        print("Created NGO user...")
        
        # Create volunteer users and volunteers
        volunteers = []
        for i, name in enumerate(VOLUNTEER_NAMES):
            user = User(
                name=name,
                email=f"volunteer{i+1}@demo.com",
                password_hash=get_password_hash("demo123"),
                role=UserRole.volunteer
            )
            db.add(user)
            db.flush()
            
            # Create volunteer profile
            lat, lon = get_random_coordinates()
            volunteer_skills = random.sample(SKILLS, random.randint(1, 4))
            
            volunteer = Volunteer(
                user_id=user.id,
                latitude=lat,
                longitude=lon,
                skills=volunteer_skills,
                is_available=random.choice([True, True, True, False]),  # 75% available
                reliability_score=round(random.uniform(0.7, 1.0), 2),
                tasks_completed=random.randint(0, 30),
                tasks_rejected=random.randint(0, 5)
            )
            db.add(volunteer)
            volunteers.append((volunteer, user))
        
        db.commit()
        print(f"Created {len(VOLUNTEER_NAMES)} volunteer users...")
        
        # Create requests
        for i, title in enumerate(REQUEST_TITLES):
            lat, lon = get_random_coordinates()
            request_type = REQUEST_TYPES[i % len(REQUEST_TYPES)]
            
            request = Request(
                type=request_type,
                title=title,
                description=REQUEST_DESCRIPTIONS[i],
                latitude=lat,
                longitude=lon,
                urgency=random.randint(1, 5),
                status=random.choice([RequestStatus.pending, RequestStatus.assigned, RequestStatus.pending]),
                volunteers_needed=random.randint(1, 5),
                created_by=ngo_user.id,
                deadline=datetime.utcnow() + timedelta(days=random.randint(1, 30))
            )
            db.add(request)
        
        db.commit()
        print(f"Created {len(REQUEST_TITLES)} requests...")
        
        print("\n✅ Database seeded successfully!")
        print(f"   - {len(VOLUNTEER_NAMES)} volunteers")
        print(f"   - {len(REQUEST_TITLES)} requests")
        print(f"   - 1 NGO organization")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
