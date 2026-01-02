# Adaptive Quiz System - Schema Optimization Implementation

## Overview
This implementation provides a comprehensive database schema optimization for adaptive quiz sessions with intelligent question selection, tracking, and performance analytics.

## Database Changes

### New Tables

#### 1. `quiz_questions` (Migration 008)
**Purpose:** Junction table linking quiz sessions to their selected questions.

**Key Features:**
- Maintains question order for consistent display
- Prevents duplicate questions in same session
- Tracks historical ELO at selection time
- Enables retrieval of all questions for a session

**Columns:**
- `session_id` - Reference to quiz session
- `question_id` - Reference to question
- `question_order` - Display order (1-20)
- `category_id` - Denormalized for performance
- `question_elo_at_selection` - Historical ELO tracking

#### 2. Enhanced `quiz_sessions` (Migration 009)
**Purpose:** Cache session-level statistics for fast retrieval.

**New Columns:**
- `correct_answers` - Count of correct answers
- `incorrect_answers` - Count of incorrect answers
- `skipped_answers` - Count of skipped questions
- `accuracy_percentage` - Percentage score (0-100)
- `avg_time_per_question` - Average time in seconds
- `elo_change` - Total ELO change from session
- `questions_json` - JSONB array of question IDs

#### 3. `user_question_history` (Migration 010)
**Purpose:** Track user interaction history with questions.

**Key Features:**
- Prevents question repetition
- Tracks mastery (retirement) status
- Implements queue system for incorrect answers
- Temporal tracking of question usage

**Columns:**
- `times_seen` - Total views
- `times_correct` / `times_incorrect` - Performance tracking
- `is_retired` - Mastery flag (answered correctly)
- `queue_priority` - Priority for re-showing (0-3)
- `last_seen_at` - Temporal filtering

#### 4. Enhanced `micro_ratings` (Migration 011)
**Purpose:** Better track category weakness and prioritize practice.

**New Columns:**
- `recent_accuracy` - Last 10 attempts accuracy
- `trend` - Performance trend (improving/declining/stable)
- `questions_mastered` - Count of retired questions
- `questions_available` - Total active questions
- `priority_score` - Calculated selection priority
- `last_practice_date` - Last practice timestamp

#### 5. `category_practice_priority` (Migration 012)
**Purpose:** Pre-calculated weights for category selection.

**Columns:**
- `selection_weight` - Higher = more likely to select
- `questions_needed` - Estimated questions to practice
- `elo_deficit` - Gap from target ELO
- `accuracy_deficit` - Gap from 80% target
- `next_practice_recommended` - Scheduled practice date

## Implementation Files

### Backend Models

1. **`QuizQuestion.ts`** - CRUD for quiz_questions table
   - `bulkCreate()` - Insert multiple questions efficiently
   - `getBySessionId()` - Retrieve session questions
   - `getSessionQuestionsWithDetails()` - Full question data with joins
   - `getCategoryDistribution()` - Category breakdown

2. **`UserQuestionHistory.ts`** - Question usage tracking
   - `recordQuestionSeen()` - Mark question as viewed
   - `bulkRecordQuestionsSeen()` - Batch recording
   - `updateAfterAttempt()` - Update history post-answer
   - `getExcludedQuestionIds()` - Get recently seen/retired questions
   - `getQueuedQuestions()` - Get priority queue questions
   - `getMasteredCount()` - Count retired questions

3. **`CategoryPracticePriority.ts`** - Category selection weights
   - `upsert()` - Create/update priority
   - `getTopPriorities()` - Get weakest categories
   - `recalculateAllPriorities()` - Batch recalculation
   - `getAllForUser()` - Get all priorities

### Services

1. **`adaptiveQuizGenerator.ts`** - Main quiz generation algorithm
   ```typescript
   AdaptiveQuizGenerator.generateQuiz({
     userId: number,
     totalQuestions: number,
     sessionType: 'practice' | 'diagnostic' | 'timed' | 'quick-test',
     targetCategories?: number[]
   })
   ```

   **Algorithm Steps:**
   1. Recalculate category priorities
   2. Get user's current ELO
   3. Identify weak categories (top 3)
   4. Calculate question distribution (40/30/30 split)
   5. Select questions for each category:
      - Prioritize queued questions (incorrect answers)
      - Select new questions near user ELO (±200)
      - Exclude recently seen questions (last 3 sessions)
      - Exclude retired questions
   6. Shuffle for variety
   7. Create session and link questions
   8. Record questions as seen

2. **`quizCompletionService.ts`** - Post-quiz statistics updates
   ```typescript
   QuizCompletionService.completeSession(
     sessionId: number,
     userId: number,
     attempts: QuestionAttemptData[]
   )
   ```

   **Completion Steps:**
   1. Calculate session statistics
   2. Update `quiz_sessions` with cached stats
   3. Update `user_question_history`:
      - Mark correct answers as retired
      - Increment queue_priority for incorrect (cap at 3)
   4. Calculate and update ELO ratings:
      - User overall ELO
      - Question ELO (inverse change)
      - Category ELO (micro_ratings)
   5. Update micro_ratings:
      - Attempts, success_rate
      - Recent_accuracy (last 10)
      - Trend analysis
      - Priority_score
   6. Generate category breakdown

### Routes

**`quizAdaptive.ts`** - New adaptive quiz endpoints

- **POST `/api/quiz/start-adaptive`** - Start adaptive quiz
  ```json
  {
    "sessionType": "practice",
    "totalQuestions": 20,
    "targetCategories": [1, 2, 3]
  }
  ```

- **GET `/api/quiz/:sessionId/questions`** - Get session questions

- **POST `/api/quiz/:sessionId/answer`** - Submit single answer
  ```json
  {
    "questionId": 123,
    "userAnswer": "A",
    "timeSpent": 45
  }
  ```

- **POST `/api/quiz/:sessionId/complete`** - Complete session
  ```json
  {
    "attempts": [
      {
        "question_id": 123,
        "user_answer": "A",
        "is_correct": true,
        "time_taken": 45
      }
    ]
  }
  ```

- **GET `/api/quiz/:sessionId/summary`** - Get completion summary

## Migration & Deployment

### Running Migrations

```bash
# Connect to database
psql -U your_user -d sidney_db

# Run migrations in order
\i database/migrations/008_quiz_questions_table.sql
\i database/migrations/009_quiz_session_stats.sql
\i database/migrations/010_question_usage_history.sql
\i database/migrations/011_enhanced_micro_ratings.sql
\i database/migrations/012_category_selection_weights.sql

# Seed initial data from existing records
\i database/seeds/seed_adaptive_quiz_data.sql
```

### Server Integration

Update `backend/src/server.ts`:
```typescript
import quizAdaptiveRouter from './routes/quizAdaptive';

// Add route
app.use('/api/quiz', quizAdaptiveRouter);
```

## Testing

### Integration Tests

Run tests:
```bash
npm test tests/integration/adaptiveQuizGeneration.test.ts
```

**Test Coverage:**
- ✅ Quiz generation with correct question count
- ✅ Weak category prioritization
- ✅ Target category filtering
- ✅ ELO-based question selection
- ✅ No duplicate questions
- ✅ Question history tracking
- ✅ Recently seen question avoidance
- ✅ Queued question prioritization
- ✅ Session statistics calculation
- ✅ ELO rating updates
- ✅ Micro-ratings updates
- ✅ Category priority calculation

## Performance Optimizations

### Indexes Created
- `idx_quiz_questions_session` - Fast session lookups
- `idx_user_question_history_queue` - Queued questions
- `idx_user_question_history_retired` - Retired questions
- `idx_micro_ratings_priority` - Priority-based selection
- `idx_category_priority_user_weight` - Category selection
- `idx_quiz_sessions_questions_json` - GIN index for JSONB

### Denormalization
- `category_id` in `quiz_questions` (faster queries)
- `questions_json` in `quiz_sessions` (fast access)
- `questions_available` in `micro_ratings` (avoid COUNT)

### Query Optimizations
- Batch inserts for `quiz_questions`
- Bulk updates for `user_question_history`
- Pre-calculated `category_practice_priority`
- Cached statistics in `quiz_sessions`

## Benefits Summary

### ✅ Functional Benefits
- **No Question Repetition** - Tracks seen questions per user
- **Adaptive Difficulty** - Matches questions to user ELO
- **Weak Category Focus** - Prioritizes areas needing improvement
- **Queue System** - Re-shows incorrect answers with priority
- **Mastery Tracking** - Retires correctly answered questions
- **Category Distribution** - Balanced question selection

### ✅ Performance Benefits
- **Fast Quiz Retrieval** - Single query for all session questions
- **Cached Statistics** - No aggregation on session queries
- **Efficient Selection** - Indexed queries for question picking
- **Batch Operations** - Bulk inserts/updates reduce round trips
- **Pre-calculated Priorities** - No real-time calculation needed

### ✅ Analytics Benefits
- **Historical Tracking** - Question ELO at selection time
- **Trend Analysis** - Improving/declining/stable trends
- **Category Breakdown** - Performance per category
- **Progress Metrics** - Questions mastered vs available
- **Session History** - Complete record of quiz sessions

## Usage Examples

### Frontend Integration

```typescript
// Start adaptive quiz
const response = await fetch('/api/quiz/start-adaptive', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionType: 'practice',
    totalQuestions: 20
  })
});

const { data } = await response.json();
// data.sessionId, data.questions, data.categoryDistribution

// Complete quiz
await fetch(`/api/quiz/${sessionId}/complete`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    attempts: userAttempts
  })
});
```

## Monitoring & Maintenance

### Key Metrics to Monitor
- Average quiz generation time
- Question pool exhaustion per category
- User mastery rates
- ELO distribution
- Category priority distribution

### Maintenance Tasks
- Recalculate priorities weekly
- Archive old quiz_sessions (>6 months)
- Reset retired questions on user request
- Rebalance question ELO periodically

## Future Enhancements

### Potential Additions
- Spaced repetition algorithm (SRS)
- Difficulty adjustment based on time taken
- Multi-category questions
- Question recommendation system
- Personalized learning paths
- Collaborative filtering for question quality

---

**Implementation Date:** January 2026  
**Database Version:** PostgreSQL 14+  
**Backend:** Node.js + TypeScript + Express  
**Status:** Production Ready
