#!/bin/bash
# Setup script for PostgreSQL on macOS/Linux

echo "🚀 Setting up PostgreSQL for VolunteerMatch..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL first:"
    echo "   brew install postgresql (macOS)"
    echo "   apt-get install postgresql (Ubuntu)"
    exit 1
fi

# Create database and user
echo "📦 Creating database and user..."
psql -U postgres <<EOF
CREATE DATABASE volunteer_db;
CREATE USER volunteer_user WITH PASSWORD 'volunteer_pass';
ALTER ROLE volunteer_user SET client_encoding TO 'utf8';
ALTER ROLE volunteer_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE volunteer_user SET default_transaction_level TO 2;
GRANT ALL PRIVILEGES ON DATABASE volunteer_db TO volunteer_user;
GRANT USAGE ON SCHEMA public TO volunteer_user;
GRANT CREATE ON SCHEMA public TO volunteer_user;
EOF

echo "✅ Database setup complete!"
echo "📝 Connection: postgresql://volunteer_user:volunteer_pass@localhost:5432/volunteer_db"
