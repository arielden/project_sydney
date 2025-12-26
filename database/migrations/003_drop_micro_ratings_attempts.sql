-- ==========================================================================
-- Migration: Drop legacy `attempts` column from micro_ratings
-- ==========================================================================
-- This migration removes the `attempts` integer column and its check
-- constraint from the `micro_ratings` table. The application now derives
-- attempt counts from the `question_attempts` table, so the stored column
-- is no longer necessary.
--
-- IMPORTANT: This is destructive. Back up your database before running.

BEGIN;

-- Drop the constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'micro_ratings' AND tc.constraint_type = 'CHECK' AND tc.constraint_name = 'micro_ratings_attempts_check'
  ) THEN
    ALTER TABLE micro_ratings DROP CONSTRAINT IF EXISTS micro_ratings_attempts_check;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore errors
  NULL;
END
$$ LANGUAGE plpgsql;

-- Drop the column if present
ALTER TABLE micro_ratings DROP COLUMN IF EXISTS attempts;

COMMIT;

-- ==========================================================================
-- End Migration
-- ==========================================================================
