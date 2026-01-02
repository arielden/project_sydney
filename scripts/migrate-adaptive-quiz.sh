#!/bin/bash

# Adaptive Quiz Schema Migration Script
# This script applies all schema optimizations for the adaptive quiz system

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Adaptive Quiz Schema Migration"
echo "========================================"
echo ""

# Check if database credentials are provided
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo -e "${RED}Error: Database credentials not set${NC}"
    echo "Please set the following environment variables:"
    echo "  DB_HOST - Database host"
    echo "  DB_NAME - Database name"
    echo "  DB_USER - Database user"
    echo "  DB_PASSWORD - Database password (optional if using .pgpass)"
    exit 1
fi

# Set PGPASSWORD if provided
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

DB_PORT="${DB_PORT:-5432}"

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Function to run SQL file
run_migration() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}Running: $description${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Success${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Check if migrations directory exists
MIGRATIONS_DIR="$(dirname "$0")/../database/migrations"
SEEDS_DIR="$(dirname "$0")/../database/seeds"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Error: Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

echo "Step 1: Creating backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠ Backup failed, continuing anyway...${NC}"
fi
echo ""

echo "Step 2: Applying schema migrations..."
echo ""

# Run migrations in order
migrations=(
    "008_quiz_questions_table.sql:Create quiz_questions junction table"
    "009_quiz_session_stats.sql:Add session performance columns"
    "010_question_usage_history.sql:Create question usage history table"
    "011_enhanced_micro_ratings.sql:Enhance micro_ratings table"
    "012_category_selection_weights.sql:Create category priority table"
)

failed=0
for migration in "${migrations[@]}"; do
    IFS=':' read -r file description <<< "$migration"
    
    if [ -f "$MIGRATIONS_DIR/$file" ]; then
        if ! run_migration "$MIGRATIONS_DIR/$file" "$description"; then
            failed=$((failed + 1))
        fi
    else
        echo -e "${RED}✗ Migration file not found: $file${NC}"
        failed=$((failed + 1))
    fi
    echo ""
done

if [ $failed -gt 0 ]; then
    echo -e "${RED}Migration failed with $failed error(s)${NC}"
    echo "You can restore from backup: $BACKUP_FILE"
    exit 1
fi

echo "Step 3: Seeding initial data..."
echo ""

if [ -f "$SEEDS_DIR/seed_adaptive_quiz_data.sql" ]; then
    if run_migration "$SEEDS_DIR/seed_adaptive_quiz_data.sql" "Initialize adaptive quiz data from existing records"; then
        echo -e "${GREEN}✓ Seed data applied${NC}"
    else
        echo -e "${YELLOW}⚠ Seed data failed (may be expected for fresh database)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Seed file not found, skipping...${NC}"
fi
echo ""

echo "Step 4: Verifying schema..."
echo ""

# Check if tables exist
tables=("quiz_questions" "user_question_history" "category_practice_priority")
all_tables_exist=true

for table in "${tables[@]}"; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt $table" | grep -q "$table"; then
        echo -e "${GREEN}✓ Table exists: $table${NC}"
    else
        echo -e "${RED}✗ Table missing: $table${NC}"
        all_tables_exist=false
    fi
done

echo ""

if [ "$all_tables_exist" = true ]; then
    echo -e "${GREEN}========================================"
    echo "Migration completed successfully!"
    echo "========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update backend server to include new routes"
    echo "2. Run integration tests: npm test tests/integration/adaptiveQuizGeneration.test.ts"
    echo "3. Deploy backend changes"
    echo ""
    echo "See database/ADAPTIVE_QUIZ_IMPLEMENTATION.md for full documentation"
else
    echo -e "${RED}Migration completed with errors${NC}"
    echo "Please check the database and review logs"
    exit 1
fi

# Cleanup backup if everything succeeded
if [ -f "$BACKUP_FILE" ]; then
    read -p "Migration successful. Delete backup file? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$BACKUP_FILE"
        echo "Backup deleted"
    else
        echo "Backup kept: $BACKUP_FILE"
    fi
fi
