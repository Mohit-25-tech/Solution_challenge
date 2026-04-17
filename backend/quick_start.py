#!/usr/bin/env python3
"""
Quick setup and run script for VolunteerMatch backend.
Run with: python quick_start.py
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description):
    """Run a shell command and report status."""
    print(f"\n📌 {description}")
    print(f"   $ {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, check=True)
        print(f"   ✅ Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Failed: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("   VolunteerMatch Backend - Quick Start")
    print("="*60)
    
    # Check Python version
    if sys.version_info < (3, 10):
        print("\n❌ Python 3.10+ required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    
    print("\n✅ Python version OK:", sys.version.split()[0])
    
    # Check requirements file
    if not os.path.exists("requirements.txt"):
        print("\n❌ requirements.txt not found")
        print("   Make sure you're in the backend directory")
        sys.exit(1)
    
    print("✅ requirements.txt found")
    
    # Install dependencies
    if not run_command(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        "Installing dependencies"
    ):
        print("\n❌ Failed to install dependencies")
        sys.exit(1)
    
    # Verify database connection
    print("\n📌 Verifying database connection...")
    try:
        from app.db.database import engine
        with engine.connect() as conn:
            print("   ✅ Database connection successful")
    except Exception as e:
        print(f"   ❌ Database connection failed: {e}")
        print("\n   Make sure PostgreSQL is running:")
        print("   - Linux/Mac: brew services start postgresql")
        print("   - Windows: Start PostgreSQL service")
        print("   - Docker: docker run -d -e POSTGRES_PASSWORD=volunteer_pass -p 5432:5432 postgres:15")
        sys.exit(1)
    
    # Seed database
    print("\n📌 Seeding database with demo data...")
    if not run_command([sys.executable, "seed.py"], "Running seed script"):
        print("   Note: Database may already be seeded")
    
    # Start server
    print("\n" + "="*60)
    print("   🚀 Starting VolunteerMatch Backend Server")
    print("="*60)
    print("\n📍 Server will be available at:")
    print("   API: http://localhost:8000")
    print("   Docs: http://localhost:8000/docs")
    print("   ReDoc: http://localhost:8000/redoc")
    print("\n⏱️  Press Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    # Run server
    run_command(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        "Starting Uvicorn server"
    )

if __name__ == "__main__":
    main()
