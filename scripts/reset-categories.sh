#!/bin/bash
# ============================================================================
# Database Reset Script - Categories & Questions
# ============================================================================
# This script wipes the categories and related tables, then reseeds them
# with the updated 18 categories and sample questions.
#
# Usage: bash reset-categories.sh
# ============================================================================

set -e  # Exit on error

echo "🔄 Starting database reset for categories and questions..."

# Get the database connection details from docker compose
DB_CONTAINER="sydney_postgres"
DB_NAME="${POSTGRES_DB:-sydney_db}"
DB_USER="${POSTGRES_USER:-admin}"
DB_PASSWORD="${POSTGRES_PASSWORD:-admin123}"

# Check if container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "❌ Database container '$DB_CONTAINER' is not running"
    echo "Starting Docker containers..."
    cd /media/arielden/DATA-M2/Projects/Software/project_sydney
    docker compose up -d
    sleep 5
fi

echo "🗑️  Truncating tables..."
docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
    TRUNCATE TABLE question_categories CASCADE;
    TRUNCATE TABLE questions CASCADE;
    TRUNCATE TABLE categories CASCADE;
    SELECT 'Tables truncated' as status;
"

echo "📋 Seeding categories..."
cat /media/arielden/DATA-M2/Projects/Software/project_sydney/database/seeds/seed_categories.sql | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME

echo "❓ Seeding questions..."
cat /media/arielden/DATA-M2/Projects/Software/project_sydney/database/seeds/seed_development_m2m.sql | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME

echo ""
echo "✅ Database reset complete!"
echo ""
echo "Summary:"
docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
    SELECT 
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM questions) as total_questions,
        (SELECT COUNT(*) FROM question_categories) as total_mappings;
"

echo ""
echo "📊 Categories:"
docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
    SELECT display_order, name FROM categories ORDER BY display_order;
"

echo ""
echo "🎉 Done! Your database is ready with 18 categories and sample questions."
