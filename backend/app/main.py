from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.models import User, Volunteer, Request, Assignment
from app.routes import auth, volunteers, requests, assignments, matching, dashboard, volunteer_portal
from app.core.config import settings
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="Smart Volunteer Coordination Backend"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(volunteers.router)
app.include_router(requests.router)
app.include_router(assignments.router)
app.include_router(matching.router)
app.include_router(volunteer_portal.router)
app.include_router(dashboard.router)


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {
        "message": "VolunteerMatch API is running",
        "status": "healthy",
        "version": settings.api_version
    }


@app.get("/health")
def health_check():
    """Health check for load balancers."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
