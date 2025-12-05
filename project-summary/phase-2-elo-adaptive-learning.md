# Phase 2: ELO-Based Adaptive Learning System

**Completed:** December 5, 2025  
**Branch:** `phase2`  
**Commit:** `e952953`

---

## Overview

Phase 2 implements a complete ELO rating system for adaptive learning in the SAT Math preparation platform. The system dynamically adjusts question difficulty based on user performance, tracks progress across 22 SAT Math categories, and provides personalized learning paths.

---

## Project Structure

```
project_sydney/
├── backend/                          # Express.js API Server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts           # PostgreSQL connection pool configuration
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT authentication middleware
│   │   ├── models/
│   │   │   ├── MicroRating.ts        # [NEW] Category-specific ELO ratings (22 categories)
│   │   │   ├── Question.ts           # Question model with adaptive selection
│   │   │   ├── QuestionAttempt.ts    # [UPDATED] Full ELO calculations on attempts
│   │   │   ├── QuizSession.ts        # Quiz session management
│   │   │   └── User.ts               # User authentication model
│   │   ├── routes/
│   │   │   ├── auth.ts               # Authentication endpoints (login, register)
│   │   │   ├── quiz.ts               # [UPDATED] Quiz flow with adaptive selection
│   │   │   └── ratings.ts            # [NEW] ELO ratings & leaderboard endpoints
│   │   ├── utils/
│   │   │   ├── adaptiveSelection.ts  # [NEW] Intelligent question selection algorithm
│   │   │   ├── eloCalculator.ts      # [NEW] Complete ELO mathematical implementation
│   │   │   └── helpers.ts            # Response formatting utilities
│   │   └── server.ts                 # [UPDATED] Added ratings routes
│   ├── package.json
│   └── tsconfig.json
│
├── database/                         # PostgreSQL Database
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # Base tables (users, questions, sessions)
│   │   └── 002_elo_ratings.sql       # [NEW] ELO system tables & triggers
│   ├── seeds/
│   │   ├── seed_micro_categories.sql # [NEW] 22 SAT Math category definitions
│   │   ├── seed_question_types.sql   # Question type metadata
│   │   └── seed_sample_questions.sql # Sample quiz questions
│   ├── init.sql                      # Database initialization script
│   └── schema.sql                    # Complete schema reference
│
├── src/                              # React Frontend (Vite + TypeScript)
│   ├── components/
│   │   └── common/
│   │       ├── Card.tsx              # Reusable card component
│   │       ├── ErrorBoundary.tsx     # Error handling wrapper
│   │       ├── Header.tsx            # Navigation header
│   │       └── ProtectedRoute.tsx    # Auth route guard
│   ├── contexts/
│   │   ├── AuthContext.tsx           # Authentication state management
│   │   └── QuizContext.tsx           # [UPDATED] Enhanced error handling
│   ├── hooks/
│   │   └── useTimer.ts               # Quiz timer hook
│   ├── pages/
│   │   ├── Dashboard.tsx             # User dashboard
│   │   ├── Home.tsx                  # Landing page
│   │   ├── Login.tsx                 # Login form
│   │   ├── Profile.tsx               # User profile
│   │   ├── QuizPage.tsx              # Active quiz interface
│   │   ├── QuizResultsPage.tsx       # [UPDATED] Null-safe rating display
│   │   ├── QuizStartPage.tsx         # Quiz configuration
│   │   └── Register.tsx              # Registration form
│   ├── services/
│   │   ├── api.ts                    # Axios instance with interceptors
│   │   ├── authService.ts            # Authentication API calls
│   │   ├── eloRatingService.ts       # [NEW] ELO ratings API client
│   │   └── quizService.ts            # [UPDATED] Quiz API with ELO fields
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   ├── App.tsx                       # Main app with routing
│   └── main.tsx                      # React entry point
│
├── project-summary/                  # [NEW] Project documentation
│   └── phase-2-elo-adaptive-learning.md
│
├── docker-compose.yml                # Docker services configuration
├── package.json                      # Frontend dependencies
├── tsconfig.json                     # TypeScript configuration
└── vite.config.ts                    # Vite build configuration
```

---

## New & Updated Files - Detailed Description

### Backend

#### `backend/src/utils/eloCalculator.ts` (NEW)
Complete ELO rating algorithm implementation:
- `calculateExpectedScore()` - ELO formula: E = 1 / (1 + 10^((Rq - Rp) / 400))
- `calculateNewRating()` - Rating update: R' = R + K(S - E)
- `calculatePlayerKFactor()` - Dynamic K-factor (100→40→10 based on games played)
- `calculateQuestionKFactor()` - Question stability factor
- `performELOCalculation()` - Complete calculation for an attempt
- `isQuestionAppropriate()` - Difficulty matching within ±200 ELO

#### `backend/src/utils/adaptiveSelection.ts` (NEW)
Intelligent question selection service:
- `selectAdaptiveQuestions()` - Score candidates by appropriateness and category weights
- `getRecommendedDifficulty()` - Suggest easy/medium/hard based on user rating
- `getCategoryPriorities()` - Rank categories by improvement potential
- `selectNextBestQuestion()` - Pick optimal next question for focused practice

#### `backend/src/models/MicroRating.ts` (NEW)
Category-specific ELO tracking for 22 SAT Math categories:
- **Algebra (9):** Linear equations, systems, inequalities, functions (linear, quadratic, exponential, polynomial, rational)
- **Advanced Math (7):** Quadratic equations, polynomial/rational/radical expressions, exponential/logarithmic/trigonometric functions
- **Problem Solving (4):** Ratios, percentages, unit conversion, data interpretation
- **Geometry (2):** Coordinate geometry, trigonometry applications

Key methods:
- `initializeUserMicroRatings()` - Create all 22 categories for new users
- `getUserCategoryRating()` - Get rating for specific category
- `updateUserCategoryRating()` - Update rating after attempt
- `recordAttempt()` - Track attempts per category

#### `backend/src/routes/ratings.ts` (NEW)
RESTful API endpoints for ELO data:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ratings/overall` | GET | User's overall ELO rating |
| `/ratings/micro` | GET | All 22 category ratings |
| `/ratings/micro/:categoryId` | GET | Specific category rating |
| `/ratings/performance` | GET | Analytics with ELO progression |
| `/ratings/leaderboard/overall` | GET | Global leaderboard |
| `/ratings/leaderboard/category/:id` | GET | Category leaderboard |
| `/ratings/rank/overall` | GET | User's rank & percentile |
| `/ratings/rank/category/:id` | GET | Category-specific rank |

#### `backend/src/models/QuestionAttempt.ts` (UPDATED)
Enhanced with full ELO calculations:
- Fetches player rating before attempt
- Fetches question ELO rating
- Calls `ELOCalculator.performELOCalculation()`
- Updates `player_ratings` table with new ELO
- Updates `questions` table with adjusted difficulty
- Records attempt with ELO before/after values
- Updates `micro_ratings` for category tracking

#### `backend/src/routes/quiz.ts` (UPDATED)
Integrated adaptive question selection:
- `handleGetNextQuestion()` uses `AdaptiveSelectionService.selectNextBestQuestion()`
- Fallback to random selection if adaptive fails
- Returns `adaptive_info` with expected score and difficulty level
- Added adaptive endpoints: `/adaptive/priorities`, `/adaptive/question`, `/adaptive/recommendation/:categoryId`

### Database

#### `database/migrations/002_elo_ratings.sql` (NEW)
Schema additions for ELO system:
```sql
-- New table for category-specific ratings
CREATE TABLE micro_ratings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    category VARCHAR(50),
    elo_rating INTEGER DEFAULT 1200,
    k_factor DECIMAL(5,2) DEFAULT 100.0,
    attempts INTEGER DEFAULT 0,
    UNIQUE(user_id, category)
);

-- New columns on questions
ALTER TABLE questions ADD COLUMN elo_rating INTEGER DEFAULT 1200;
ALTER TABLE questions ADD COLUMN k_factor DECIMAL(5,2) DEFAULT 40.0;

-- New columns on question_attempts
ALTER TABLE question_attempts ADD COLUMN expected_score DECIMAL(4,3);
ALTER TABLE question_attempts ADD COLUMN elo_change INTEGER;

-- Triggers for automatic K-factor updates
CREATE TRIGGER trigger_update_player_k_factor ...
CREATE TRIGGER trigger_update_question_stats ...
```

### Frontend

#### `src/services/eloRatingService.ts` (NEW)
Frontend API client for ELO endpoints:
- `getOverallRating()` - Fetch user's overall ELO
- `getMicroRatings()` - Fetch all category ratings
- `getPerformanceAnalytics()` - Detailed performance data
- `getOverallLeaderboard()` - Global rankings
- `getCategoryLeaderboard()` - Category-specific rankings
- `getOverallRank()` - User's rank and percentile

#### `src/contexts/QuizContext.tsx` (UPDATED)
Enhanced error handling:
- `submitAnswer()` - Better validation, error message extraction
- `getNextQuestion()` - Added loading states, error recovery
- `nextQuestion()` - Improved error messages from API responses

#### `src/pages/QuizResultsPage.tsx` (UPDATED)
Null-safe rating display:
- Optional chaining for `previousRating`, `newRating`, `ratingChange`
- Graceful fallback to "N/A" when ratings unavailable

#### `src/services/quizService.ts` (UPDATED)
Extended interfaces with ELO fields:
- Added `elo_rating`, `category_id`, `expected_score`, `appropriateness_score` to `QuizQuestion`

---

## Key Features Implemented

### 1. ELO Rating Algorithm
- Standard ELO formula adapted for educational context
- Player ratings start at 1200, range 100-2000+
- Dynamic K-factor: 100 (< 10 games) → 40 (10-30 games) → 10 (30+ games)
- Questions also have ELO ratings that adjust based on user performance

### 2. Adaptive Question Selection
- Questions matched within ±200 ELO of user's rating
- Category prioritization based on:
  - Lower ratings = higher priority (areas needing improvement)
  - Recent performance trends
  - Question availability in category
- Appropriateness scoring for optimal difficulty matching

### 3. MicroRating System
- 22 distinct SAT Math categories tracked independently
- Allows focused practice on weak areas
- Per-category leaderboards and rankings

### 4. Performance Analytics
- ELO progression over time
- Accuracy by category
- Average time per question type
- Rating change trends

---

## Database Changes Applied

```sql
-- Fix for K-factor overflow (K=100 didn't fit in numeric(4,2))
ALTER TABLE player_ratings ALTER COLUMN k_factor TYPE numeric(5,2);

-- Required for UPSERT operations
ALTER TABLE player_ratings ADD CONSTRAINT player_ratings_user_id_unique UNIQUE (user_id);
```

---

## API Response Examples

### GET /api/quiz/:sessionId/next (Adaptive)
```json
{
  "success": true,
  "data": {
    "question": {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "question_text": "What is 2/3 + 1/6?",
      "difficulty_rating": 1080,
      "elo_rating": 1200,
      "expected_score": 0.5,
      "appropriateness_score": 0.8
    },
    "adaptive_info": {
      "expected_score": 0.5,
      "appropriateness": 0.8,
      "difficulty_level": "Easy"
    }
  }
}
```

### GET /api/ratings/performance
```json
{
  "overall_stats": {
    "total_questions_answered": 15,
    "total_correct": 10,
    "overall_accuracy": 66.67
  },
  "elo_progression": [
    { "player_rating_before": 1200, "player_rating_after": 1250, "rating_change": 50 }
  ]
}
```

---

## Testing Verification

✅ Quiz answer submission working  
✅ ELO calculations updating player ratings (1200 → 1250 after correct answer)  
✅ Next question retrieval with adaptive info  
✅ MicroRating tracking attempts per category  
✅ AdaptiveSelectionService returning prioritized questions  

---

## Next Steps (Phase 3 Candidates)

- [ ] Dashboard with ELO progression charts
- [ ] Category-specific practice mode
- [ ] Leaderboard UI components
- [ ] Study recommendations based on weak categories
- [ ] Question explanation review system
