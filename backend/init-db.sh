#!/bin/bash
set -e

DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-sidney_db}
DB_USER=${DB_USER:-admin}
DB_PASSWORD=${DB_PASSWORD:-admin123}

# Install postgresql client if needed
if ! command -v psql &> /dev/null; then
  apk add --no-cache postgresql-client >/dev/null 2>&1
fi

# Wait for postgres to be ready
for i in {1..60}; do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; then
    break
  fi
  sleep 2
done

# Check if database exists, if not create it
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME" >/dev/null 2>&1

# Run schema initialization from schema.sql file (idempotent)
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tc "SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename = 'users'" 2>/dev/null | grep -q 1; then
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/database/schema.sql >/dev/null 2>&1
fi

# Run migrations (idempotent - each migration uses CREATE/ALTER IF NOT EXISTS)
echo "Running migrations..."

for migration in 008_quiz_questions_table 009_quiz_session_stats 010_question_usage_history 011_enhanced_micro_ratings 012_category_selection_weights; do
  migration_file="/app/database/migrations/${migration}.sql"
  if [ -f "$migration_file" ]; then
    echo "  Running $migration.sql..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" 2>&1; then
      echo "  ✓ $migration.sql completed"
    else
      echo "  ✗ $migration.sql failed"
    fi
  else
    echo "  ⚠ $migration.sql not found"
  fi
done

echo "Migrations completed."

# Run seed data (idempotent - safe to run multiple times)
if [ -f /app/database/seeds/seed_categories.sql ]; then
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/database/seeds/seed_categories.sql >/dev/null 2>&1
fi

if [ -f /app/database/seeds/seed_users.sql ]; then
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/database/seeds/seed_users.sql >/dev/null 2>&1
fi

if [ -f /app/database/seeds/seed_questions.sql ]; then
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/database/seeds/seed_questions.sql >/dev/null 2>&1
fi

if [ -f /app/database/seeds/seed_development_m2m.sql ]; then
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/database/seeds/seed_development_m2m.sql >/dev/null 2>&1
fi