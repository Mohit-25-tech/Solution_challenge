@echo off
REM Setup script for PostgreSQL on Windows
echo.
echo 🚀 Setting up PostgreSQL for VolunteerMatch...
echo.

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL not found. Please install PostgreSQL and add it to PATH
    echo.
    echo To add to PATH:
    echo   1. Open Environment Variables
    echo   2. Add PostgreSQL bin folder (usually C:\Program Files\PostgreSQL\15\bin)
    echo   3. Restart Command Prompt
    echo.
    pause
    exit /b 1
)

echo 📦 Creating database and user...
echo.

set "PSQL=C:\Program Files\PostgreSQL\18\bin\psql.exe"
if not exist "%PSQL%" set "PSQL=psql"

REM Create user and database (safe to re-run)
"%PSQL%" -U postgres -h localhost -d postgres -c "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='volunteer_user') THEN CREATE ROLE volunteer_user LOGIN PASSWORD 'volunteer_pass'; END IF; END $$;"
"%PSQL%" -U postgres -h localhost -d postgres -c "SELECT 'CREATE DATABASE volunteer_db OWNER volunteer_user' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'volunteer_db')\gexec"
"%PSQL%" -U postgres -h localhost -d volunteer_db -c "GRANT ALL PRIVILEGES ON SCHEMA public TO volunteer_user;"

echo.
echo ✅ Database setup complete!
echo 📝 Connection: postgresql://volunteer_user:volunteer_pass@localhost:5432/volunteer_db
echo.
pause
