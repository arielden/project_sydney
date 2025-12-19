# Sydney SAT Learning Platform - Database Setup Guide

## Overview

This directory contains all database files for the Sydney SAT Learning Platform, including:
- **Schema**: Complete database structure definition
- **Seeds**: Reference data and optional development data
- **Documentation**: Setup and deployment guides

## Directory Structure

```
database/
├── schema.sql        # Complete database schema (758 lines)
├── init_database.sh               # Automated initialization script
├── seeds/
│   ├── seed_reference_data.sql    # Question types & categories (20 types)
│   ├── seed_development.sql       # Sample questions for testing (30 questions)
│   └── 22_SAT_CATEGORIES_REFERENCE.md  # Micro-rating categories documentation
├── backups/                       # (For database backups)
└── README.md                      # This file
```

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Development environment (with sample data)
./database/init_database.sh --dev

# Production environment (reference data only)
./database/init_database.sh --prod
```

### Option 2: Manual Setup

#### Step 1: Create Empty Database
```bash
docker exec sydney_postgres psql -U admin -d sydney_db \
  -f /path/to/database/schema_from_scratch.sql
```

#### Step 2: Seed Reference Data
```bash
docker exec sydney_postgres psql -U admin -d sydney_db \
  -f /path/to/database/seeds/seed_reference_data.sql
```

#### Step 3: Optional - Seed Development Data
```bash
docker exec sydney_postgres psql -U admin -d sydney_db \
  -f /path/to/database/seeds/seed_development.sql
```

## File Descriptions

### Core Files

#### `schema_from_scratch.sql` (22.5 KB)
**Complete database schema with no data**

Contents:
- 8 tables (users, player_ratings, micro_ratings, question_types, questions, quiz_sessions, question_attempts, admin_activity_log)
- 8 custom functions (ELO calculation, K-factor, reliability)
- 30+ indexes for query optimization
- 8 triggers for automatic updates
- All constraints and relationships

Features:
- Fully idempotent (can run multiple times safely)
- Includes all comments for documentation
- Optimized for performance
- Supports the adaptive ELO rating system

**Line Count**: 758 lines
**Execution Time**: < 2 seconds

#### `init_database.sh` (Executable)
**Automated database initialization script**

Features:
- Validates database connection
- Runs schema creation
- Seeds reference data
- Optionally seeds development data
- Verifies completion
- Supports both dev and production modes

Usage:
```bash
chmod +x database/init_database.sh
./database/init_database.sh --dev   # Development
./database/init_database.sh --prod  # Production
```

Environment Variables:
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_USER` (default: admin)
- `DB_NAME` (default: sydney_db)
- `DB_PASSWORD` (optional)

### Seed Files

#### `seed_reference_data.sql` (7.3 KB)
**Reference data required for platform operation**

Contents:
- 20 SAT Math question types
- Micro-rating category definitions
- All metadata for the adaptive learning system

Execution Time: < 1 second

#### `seed_development.sql` (9.8 KB)
**Sample questions for development and testing**

Contents:
- 30 realistic SAT-style sample questions
- Various difficulty levels (easy, medium, hard)
- Complete with explanations
- Covers all 20 question types

⚠️ **Warning**: For development only. Do NOT use in production.

Execution Time: < 1 second

#### `22_SAT_CATEGORIES_REFERENCE.md` (4.1 KB)
**Documentation of micro-rating categories**

Contents:
- 22 standard SAT math categories
- Organized into 4 groups
- Descriptions and scope for each category
- Used by adaptive learning algorithm

## Database Architecture

### Tables (8 total)

```
users (1:1 relationships)
├── player_ratings (overall ELO)
├── micro_ratings (category-specific ELO)
├── quiz_sessions (quiz history)
├── question_attempts (individual answers)
└── admin_activity_log (audit trail)

question_types (categories)
└── questions (question repository)
    └── question_attempts (usage tracking)
```

### Key Features

1. **ELO Rating System**
   - Player ELO (overall ability)
   - Question ELO (question difficulty)
   - Micro-ratings (category-specific mastery)
   - Dynamic K-factors for accurate ratings

2. **Adaptive Learning**
   - Tracks user performance by category
   - Selects next questions based on user ability
   - Adjusts difficulty in real-time
   - Maintains question reliability metrics

3. **Audit Trail**
   - Admin activity logging
   - Complete JSONB details storage
   - IP address tracking
   - Compliance ready

4. **Performance Optimization**
   - 30+ strategic indexes
   - Optimized for common queries
   - Supports high-volume user sessions
   - Automatic timestamp updates

## Deployment Workflows

### Development Environment

```bash
# Initial setup
./database/init_database.sh --dev

# Features:
# ✓ Full schema
# ✓ Reference data
# ✓ 30 sample questions
# ✓ Ready for testing
```

### Staging Environment

```bash
# Run with reference data only
./database/init_database.sh --prod

# Then import staging question set:
psql -U admin -d sydney_db -f staging_questions.sql
```

### Production Environment

```bash
# Run with reference data only
./database/init_database.sh --prod

# Then import production questions:
psql -U admin -d sydney_db -f production_questions.sql

# Verify:
psql -U admin -d sydney_db -c "SELECT COUNT(*) FROM questions;"
```

## Resetting the Database

### Option 1: Drop and Recreate (Clean)

```bash
# Drop database
docker exec sydney_postgres psql -U admin -d postgres \
  -c "DROP DATABASE IF EXISTS sydney_db;"

# Recreate database
docker exec sydney_postgres psql -U admin -d postgres \
  -c "CREATE DATABASE sydney_db;"

# Reinitialize
./database/init_database.sh --dev
```

### Option 2: Truncate Tables (Keep Structure)

```bash
# Truncate user data only
docker exec sydney_postgres psql -U admin -d sydney_db -c "
  TRUNCATE TABLE question_attempts CASCADE;
  TRUNCATE TABLE quiz_sessions CASCADE;
  TRUNCATE TABLE player_ratings CASCADE;
  TRUNCATE TABLE micro_ratings CASCADE;
  TRUNCATE TABLE users CASCADE;
"

# Reference data remains intact
```

## Backup and Recovery

### Backup Full Database

```bash
docker exec sydney_postgres pg_dump -U admin -d sydney_db \
  > backups/sydney_db_$(date +%Y%m%d_%H%M%S).sql
```

### Backup Schema Only

```bash
docker exec sydney_postgres pg_dump -U admin -d sydney_db --schema-only \
  > backups/sydney_db_schema_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
docker exec -i sydney_postgres psql -U admin -d sydney_db \
  < backups/sydney_db_20250114_120000.sql
```

## Monitoring and Validation

### Check Database Size

```bash
docker exec sydney_postgres psql -U admin -d sydney_db -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Verify Table Counts

```bash
docker exec sydney_postgres psql -U admin -d sydney_db -c "
  SELECT 
    'users' as table_name, COUNT(*) FROM users UNION ALL
  SELECT 'player_ratings', COUNT(*) FROM player_ratings UNION ALL
  SELECT 'question_types', COUNT(*) FROM question_types UNION ALL
  SELECT 'questions', COUNT(*) FROM questions UNION ALL
  SELECT 'quiz_sessions', COUNT(*) FROM quiz_sessions UNION ALL
  SELECT 'question_attempts', COUNT(*) FROM question_attempts;
"
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
docker exec sydney_postgres psql -U admin -d sydney_db -c "SELECT 1;"

# Check if postgres is running
docker ps | grep postgres
```

### Schema Errors

```bash
# Check for syntax errors
psql -U admin -d sydney_db -f schema_from_scratch.sql --echo-all

# View last error messages
docker logs sydney_postgres | tail -50
```

### Data Integrity Issues

```bash
# Check referential integrity
docker exec sydney_postgres psql -U admin -d sydney_db -c "
  SELECT * FROM question_attempts 
  WHERE question_id NOT IN (SELECT id FROM questions);
"

# Check for orphaned records
docker exec sydney_postgres psql -U admin -d sydney_db -c "
  SELECT * FROM micro_ratings 
  WHERE user_id NOT IN (SELECT id FROM users);
"
```

## Performance Tuning

### Analyze Query Performance

```bash
EXPLAIN ANALYZE
  SELECT q.id, q.question_text, COUNT(qa.id) as attempts
  FROM questions q
  LEFT JOIN question_attempts qa ON q.id = qa.question_id
  GROUP BY q.id
  ORDER BY attempts DESC;
```

### Reindex if Performance Degrades

```bash
docker exec sydney_postgres psql -U admin -d sydney_db -c "REINDEX DATABASE sydney_db;"
```

## Related Documentation

- **DATABASE_SCHEMA.md** - Detailed schema documentation with diagrams
- **DATABASE_DEPLOYMENT_STRATEGY.md** - Deployment strategy and best practices
- **.env.example** - Environment variable template

## Support

For issues or questions:
1. Check this README
2. Review DATABASE_SCHEMA.md for table structures
3. Check DATABASE_DEPLOYMENT_STRATEGY.md for deployment guidance
4. Review Docker logs: `docker logs sydney_postgres`

---

**Last Updated**: December 14, 2025
**Schema Version**: 1.0
**Database**: PostgreSQL 15+
