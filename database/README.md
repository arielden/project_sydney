# Sydney SAT Learning Platform - Database Schema

## Overview

The Sydney database schema is designed to support an adaptive learning platform with ELO rating system for SAT math preparation. The system tracks user progress, question performance, and dynamically adjusts difficulty based on student ability.

## Core Tables

### Users Table
**Purpose**: User account management and profile information
- **Primary Key**: UUID `id`
- **Unique Fields**: `email`, `username`
- **Key Features**: Account status tracking, login timestamps
- **Relationships**: One-to-one with `player_ratings`, one-to-many with `quiz_sessions` and `question_attempts`

### Player_Ratings Table
**Purpose**: ELO rating system for player skill tracking
- **Primary Key**: UUID `id`
- **Foreign Key**: `user_id` → `users(id)`
- **Key Metrics**: `overall_elo`, `k_factor`, `games_played`
- **ELO System**: Starting at 1200, K-factor of 100 for new players

### Questions Table
**Purpose**: SAT math question repository with difficulty ratings
- **Primary Key**: UUID `id`
- **Key Features**: Question variations via `stem_id`, performance tracking
- **JSONB Storage**: Answer options stored as flexible JSON
- **Difficulty System**: ELO-based question ratings (800-2000 range)

### Quiz_Sessions Table
**Purpose**: Track practice sessions with timing and pause functionality
- **Primary Key**: UUID `id`
- **Foreign Key**: `user_id` → `users(id)`
- **Session Types**: practice, diagnostic, timed
- **Timing**: Start/end times, pause tracking, duration calculations

### Question_Attempts Table
**Purpose**: Record individual question attempts with rating changes
- **Primary Key**: UUID `id`
- **Foreign Keys**: `session_id`, `question_id`, `user_id`
- **Rating Tracking**: Before/after ratings for both player and question
- **Performance**: Correctness, time spent, timestamp

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│     USERS       │──────▶│  PLAYER_RATINGS  │
│                 │ 1:1   │                  │
│ • id (PK)       │       │ • id (PK)        │
│ • email (UQ)    │       │ • user_id (FK)   │
│ • username (UQ) │       │ • overall_elo    │
│ • password_hash │       │ • k_factor       │
│ • first_name    │       │ • games_played   │
│ • last_name     │       └──────────────────┘
│ • created_at    │
│ • updated_at    │
│ • last_login    │       ┌──────────────────┐
│ • is_active     │──────▶│  QUIZ_SESSIONS   │
└─────────────────┘ 1:M   │                  │
                          │ • id (PK)        │
                          │ • user_id (FK)   │
                          │ • session_type   │
                          │ • start_time     │
                          │ • end_time       │
                          │ • is_paused      │
                          │ • status         │
                          └─────────┬────────┘
                                    │ 1:M
┌─────────────────┐                 ▼
│   QUESTIONS     │       ┌──────────────────┐
│                 │──────▶│ QUESTION_ATTEMPTS│
│ • id (PK)       │ 1:M   │                  │
│ • question_type │       │ • id (PK)        │
│ • question_text │       │ • session_id (FK)│
│ • options (JSON)│       │ • question_id(FK)│
│ • correct_answer│       │ • user_id (FK)   │
│ • explanation   │       │ • user_answer    │
│ • difficulty_rating     │ • is_correct     │
│ • stem_id (FK)  │       │ • time_spent     │
│ • clone_number  │       │ • player_rating_ │
│ • times_answered│       │   before/after   │
│ • times_correct │       │ • question_rating│
│ • is_diagnostic │       │   before/after   │
└─────────┬───────┘       │ • answered_at    │
          │               └──────────────────┘
          │ (self-reference)
          └─────────────────┐
                           ▼
                    ┌──────────────┐
                    │  QUESTIONS   │
                    │ (variations) │
                    │ stem_id → id │
                    └──────────────┘
```

## ELO Rating System

### Core Principles
- **Initial Rating**: 1200 for both players and questions
- **K-Factor**: 100 for new players, adjusts based on experience
- **Rating Range**: 800-2000 for practical SAT difficulty levels
- **Bidirectional**: Both player and question ratings update after each attempt

### Rating Calculation Formula
```
Expected Score = 1 / (1 + 10^((Rating_B - Rating_A) / 400))
New Rating = Old Rating + K * (Actual Score - Expected Score)
```

## Database Operations

### Running Migrations
```bash
# Navigate to backend directory
cd backend

# Run all migrations
npm run db:migrate

# Run specific migration
npm run migration -- 001_initial_schema.sql
```

### Seeding Data
```bash
# Seed question types
npm run db:seed

# Seed specific file
npm run seed -- seed_question_types.sql
```

### Development Reset
```bash
# Reset database (development only)
npm run db:reset
```

## Quick Database Access

### Using pgAdmin (Web Interface)
1. Open browser to `http://localhost:5050`
2. Login: `admin@sydney.com` / `admin123`
3. Connect to server: `postgres:5432`

### Using psql (Command Line)
```bash
# Connect via Docker
docker-compose exec postgres psql -U admin -d sydney_db

# Connect from host
psql -h localhost -p 5432 -U admin -d sydney_db
```

---

**Database Version**: 1.0.0  
**Schema Version**: 001_initial_schema  
**Last Updated**: November 29, 2024  
**Compatibility**: PostgreSQL 12+