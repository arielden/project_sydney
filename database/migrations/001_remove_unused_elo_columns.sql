-- ============================================================================
-- Migration: Remove unused ELO columns from question_attempts table
-- ============================================================================
-- These columns (player_elo_before, player_elo_after, question_elo_before, 
-- question_elo_after) were never used in the application code.
-- The actual ELO data is stored in player_rating_* and question_rating_* columns.
-- 
-- Database: sidney_db
-- User: admin (or your configured POSTGRES_USER)
-- ============================================================================

-- Step 1: Drop the unused index that references these columns
-- This must be done before dropping the columns
DROP INDEX IF EXISTS idx_question_attempts_elo;

-- Step 2: Drop the unused columns one by one
ALTER TABLE question_attempts DROP COLUMN IF EXISTS player_elo_before;
ALTER TABLE question_attempts DROP COLUMN IF EXISTS player_elo_after;
ALTER TABLE question_attempts DROP COLUMN IF EXISTS question_elo_before;
ALTER TABLE question_attempts DROP COLUMN IF EXISTS question_elo_after;

-- Verify the table structure after migration
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'question_attempts' 
-- ORDER BY ordinal_position;
