import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.db.database import engine, Base
from app.models import models  # Ensures all models are registered with Base
from app.routes import auth, volunteers, requests, assignments, matching
from app.routes import dashboard, volunteer_portal
from app.routes import analytics, notifications, external
from app.services.auto_reassign import auto_reassign_expired

# APScheduler — runs sync jobs in a thread pool
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup + shutdown lifecycle handler."""
    # Create all tables (safe to call multiple times — only creates missing tables)
    Base.metadata.create_all(bind=engine)

    # SAFETY GUARD: auto_reassign_expired must be a plain sync function
    assert not asyncio.iscoroutinefunction(auto_reassign_expired), (
        "auto_reassign_expired must be 'def', not 'async def'. "
        "APScheduler BackgroundScheduler runs sync jobs in threads."
    )

    # Schedule auto-reassignment job every 5 minutes
    scheduler.add_job(
        auto_reassign_expired,
        "interval",
        minutes=5,
        id="auto_reassign",
        replace_existing=True
    )
    scheduler.start()
    print("[scheduler] auto_reassign_expired scheduled every 5 minutes")

    yield  # App is running

    # Shutdown
    scheduler.shutdown(wait=False)
    print("[scheduler] Shutdown complete")


app = FastAPI(
    title="VolunteerMatch API",
    version="2.0.0",
    description="Intelligent volunteer coordination platform",
    lifespan=lifespan
)

# ─── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(volunteers.router)
app.include_router(requests.router)
app.include_router(assignments.router)
app.include_router(matching.router)
app.include_router(dashboard.router)
app.include_router(volunteer_portal.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(external.router)


@app.get("/")
def root():
    return {"message": "VolunteerMatch API v2.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy", "version": "2.0.0"}
