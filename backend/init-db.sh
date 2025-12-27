#!/bin/bash
set -e

DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-sidney_db}
DB_USER=${DB_USER:-admin}
DB_PASSWORD=${DB_PASSWORD:-admin123}

# Install postgresql client if needed
if ! command -v psql &> /dev/null; then
  echo "Installing postgresql client..."
  apk add --no-cache postgresql-client
fi

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..60}; do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; then
    echo "PostgreSQL is ready!"
    break
  fi
  echo "Attempt $i: Waiting for PostgreSQL..."
  sleep 2
done

echo "PostgreSQL is ready. Initializing database schema..."

# Check if database exists, if not create it
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME"

# Run schema initialization from schema.sql file (idempotent)
# If the 'users' table exists, we assume schema is initialized and skip importing
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename = 'users'" | grep -q 1; then
  echo "Schema already initialized, skipping schema.sql"
else
  echo "Running schema.sql..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/schema.sql
  echo "Database schema initialized successfully!"
fi