-- ==========================================================================
-- Migration: Sync micro_ratings.attempts with question_attempts counts
-- ==========================================================================
-- This migration updates the attempts column in the micro_ratings table
-- to reflect the actual count of attempts recorded in question_attempts.
-- It supports schemas where the category column on micro_ratings is either
-- category_id (numeric) or category (text legacy). The script determines
-- which column exists and updates rows accordingly.
--
-- Important: Run this during a maintenance window if your DB is heavily used.
-- Always back up your database before running migrations that modify data.
--
BEGIN;

-- Use a DO block to choose the correct category column dynamically
DO $$
DECLARE
  has_category_id boolean;
  sql text;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'micro_ratings' AND column_name = 'category_id'
  ) INTO has_category_id;

  IF has_category_id THEN
    -- micro_ratings uses numeric category_id
    sql := $sql$
      UPDATE micro_ratings mr
      SET
        attempts = COALESCE(
          (
            SELECT COUNT(*)
            FROM question_attempts qa
            JOIN questions q ON qa.question_id = q.id
            LEFT JOIN question_categories qc ON q.id = qc.question_id AND qc.is_primary = true
            WHERE qa.user_id = mr.user_id AND qc.category_id = mr.category_id
          ), 0
        ),
        updated_at = NOW();
    $sql$;
  ELSE
    -- micro_ratings uses legacy text `category` column; compare as text
    sql := $sql$
      UPDATE micro_ratings mr
      SET
        attempts = COALESCE(
          (
            SELECT COUNT(*)
            FROM question_attempts qa
            JOIN questions q ON qa.question_id = q.id
            LEFT JOIN question_categories qc ON q.id = qc.question_id AND qc.is_primary = true
            WHERE qa.user_id = mr.user_id AND qc.category_id::text = mr.category
          ), 0
        ),
        updated_at = NOW();
    $sql$;
  END IF;

  EXECUTE sql;
END
$$ LANGUAGE plpgsql;

-- Ensure there are no NULL or negative attempts values
UPDATE micro_ratings SET attempts = 0 WHERE attempts IS NULL OR attempts < 0;

COMMIT;

-- ==========================================================================
-- End Migration
-- ==========================================================================
