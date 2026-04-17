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

REM Create database and user
psql -U postgres -h localhost <<EOF
CREATE DATABASE volunteer_db;
CREATE USER volunteer_user WITH PASSWORD 'volunteer_pass';
ALTER ROLE volunteer_user SET client_encoding TO 'utf8';
ALTER ROLE volunteer_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE volunteer_user SET default_transaction_level TO 2;
GRANT ALL PRIVILEGES ON DATABASE volunteer_db TO volunteer_user;
GRANT USAGE ON SCHEMA public TO volunteer_user;
GRANT CREATE ON SCHEMA public TO volunteer_user;
EOF

echo.
echo ✅ Database setup complete!
echo 📝 Connection: postgresql://volunteer_user:volunteer_pass@localhost:5432/volunteer_db
echo.
pause
