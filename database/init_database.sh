#!/bin/bash
# ============================================================================
# Database Initialization Script
# Sydney SAT Learning Platform
# ============================================================================
# This script initializes a fresh PostgreSQL database with the complete schema
# and optional seed data.
#
# Usage:
#   ./init_database.sh [--dev|--prod]
#   ./init_database.sh --dev    # Initialize with development seed data
#   ./init_database.sh --prod   # Initialize with reference data only
#
# Prerequisites:
#   - PostgreSQL running and accessible
#   - Database 'sydney_db' already created
#   - Credentials configured via environment variables or command line
# ============================================================================

set -e  # Exit on error

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-admin}"
DB_NAME="${DB_NAME:-sydney_db}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT="${1:---dev}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Display header
echo "============================================================================"
echo "Sydney SAT Learning Platform - Database Initialization"
echo "============================================================================"
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Environment: $ENVIRONMENT"
echo "============================================================================"
echo ""

# Verify connection
log_info "Verifying database connection..."
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    log_error "Cannot connect to database. Ensure PostgreSQL is running and credentials are correct."
    exit 1
fi
log_info "✓ Database connection successful"
echo ""

# Step 1: Create schema
log_info "Step 1/3: Creating database schema..."
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/schema.sql" > /dev/null 2>&1; then
    log_info "✓ Schema created successfully"
else
    log_error "Failed to create schema"
    exit 1
fi
echo ""

# Step 2: Seed reference data
log_info "Step 2/3: Seeding reference data..."
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/seeds/seed_reference_data.sql" > /dev/null 2>&1; then
    log_info "✓ Reference data seeded successfully"
else
    log_error "Failed to seed reference data"
    exit 1
fi
echo ""

# Step 3: Optional development seed data
log_info "Step 3/3: Seeding additional data..."
if [ "$ENVIRONMENT" = "--dev" ]; then
    log_info "Loading development data..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/seeds/seed_development.sql" > /dev/null 2>&1; then
        log_info "✓ Development sample questions loaded"
    else
        log_error "Failed to seed development data"
        exit 1
    fi
elif [ "$ENVIRONMENT" = "--prod" ]; then
    log_warn "Production mode: Skipping development data"
    log_info "Ready for production question import"
else
    log_error "Invalid environment flag: $ENVIRONMENT"
    log_info "Usage: $0 [--dev|--prod]"
    exit 1
fi
echo ""

# Verification
log_info "Verifying database structure..."
TABLES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
QUESTION_TYPES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM question_types")

if [ "$ENVIRONMENT" = "--dev" ]; then
    QUESTIONS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM questions")
    log_info "✓ Database Structure Verified:"
    log_info "  - Tables: $TABLES"
    log_info "  - Question Types: $QUESTION_TYPES"
    log_info "  - Sample Questions: $QUESTIONS"
else
    log_info "✓ Database Structure Verified:"
    log_info "  - Tables: $TABLES"
    log_info "  - Question Types: $QUESTION_TYPES"
fi

echo ""
echo "============================================================================"
log_info "Database initialization complete!"
echo "============================================================================"
echo ""
if [ "$ENVIRONMENT" = "--dev" ]; then
    log_info "Development Mode: Sample data loaded"
    log_info "Next steps:"
    echo "  1. Start your application"
    echo "  2. Test with sample questions"
    echo "  3. Before production: Replace with real questions"
else
    log_info "Production Mode: Ready for data import"
    log_info "Next steps:"
    echo "  1. Import production questions"
    echo "  2. Verify data integrity"
    echo "  3. Run final tests"
fi
echo ""
