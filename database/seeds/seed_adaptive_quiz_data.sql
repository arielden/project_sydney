-- Seed file for initializing user_question_history for existing users
-- This should be run after migrations 008-012 are applied

-- Initialize user_question_history for existing question attempts
-- This creates historical data based on past quiz sessions

INSERT INTO user_question_history (
  user_id,
  question_id,
  category_id,
  times_seen,
  times_correct,
  times_incorrect,
  first_seen_at,
  last_seen_at,
  last_session_id,
  is_retired,
  retirement_date,
  queue_priority
)
SELECT 
  qa.user_id,
  qa.question_id,
  qc.category_id,
  COUNT(*) as times_seen,
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as times_correct,
  SUM(CASE WHEN NOT qa.is_correct THEN 1 ELSE 0 END) as times_incorrect,
  MIN(qa.answered_at) as first_seen_at,
  MAX(qa.answered_at) as last_seen_at,
  MAX(qa.session_id) as last_session_id,
  -- Mark as retired if last attempt was correct
  BOOL_OR(
    qa.is_correct AND qa.answered_at = (
      SELECT MAX(answered_at) 
      FROM question_attempts 
      WHERE user_id = qa.user_id AND question_id = qa.question_id
    )
  ) as is_retired,
  CASE 
    WHEN BOOL_OR(
      qa.is_correct AND qa.answered_at = (
        SELECT MAX(answered_at) 
        FROM question_attempts 
        WHERE user_id = qa.user_id AND question_id = qa.question_id
      )
    ) THEN MAX(qa.answered_at)
    ELSE NULL
  END as retirement_date,
  -- Set queue priority based on recent incorrect answers
  CASE 
    WHEN SUM(CASE WHEN NOT qa.is_correct THEN 1 ELSE 0 END) >= 3 THEN 3
    WHEN SUM(CASE WHEN NOT qa.is_correct THEN 1 ELSE 0 END) >= 2 THEN 2
    WHEN SUM(CASE WHEN NOT qa.is_correct THEN 1 ELSE 0 END) >= 1 THEN 1
    ELSE 0
  END as queue_priority
FROM question_attempts qa
LEFT JOIN question_categories qc ON qa.question_id = qc.question_id AND qc.is_primary = true
GROUP BY qa.user_id, qa.question_id, qc.category_id
ON CONFLICT (user_id, question_id) DO NOTHING;

-- Update micro_ratings with enhanced fields
-- Calculate questions_available for each category
UPDATE micro_ratings mr
SET questions_available = (
  SELECT COUNT(DISTINCT q.id)
  FROM questions q
  INNER JOIN question_categories qc ON q.id = qc.question_id
  WHERE qc.category_id = mr.category_id
  AND q.is_active = true
);

-- Calculate questions_mastered for each user/category
UPDATE micro_ratings mr
SET questions_mastered = (
  SELECT COUNT(*)
  FROM user_question_history uqh
  WHERE uqh.user_id = mr.user_id
  AND uqh.category_id = mr.category_id
  AND uqh.is_retired = true
);

-- Calculate recent_accuracy (last 10 attempts per category)
UPDATE micro_ratings mr
SET recent_accuracy = (
  SELECT COALESCE(
    ROUND(
      (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
      2
    ),
    0
  )
  FROM (
    SELECT qa.is_correct
    FROM question_attempts qa
    INNER JOIN question_categories qc ON qa.question_id = qc.question_id
    WHERE qa.user_id = mr.user_id 
    AND qc.category_id = mr.category_id
    ORDER BY qa.answered_at DESC
    LIMIT 10
  ) recent_attempts
);

-- Calculate trend
UPDATE micro_ratings
SET trend = CASE
  WHEN recent_accuracy > success_rate + 10 THEN 'improving'
  WHEN recent_accuracy < success_rate - 10 THEN 'declining'
  ELSE 'stable'
END;

-- Calculate priority_score
UPDATE micro_ratings
SET priority_score = (
  CASE 
    WHEN elo_rating < 1200 THEN 3.0
    WHEN elo_rating < 1400 THEN 2.0
    ELSE 1.0
  END *
  CASE 
    WHEN success_rate < 50 THEN 2.5
    WHEN success_rate < 70 THEN 1.5
    ELSE 0.5
  END
);

-- Initialize category_practice_priority for all users
INSERT INTO category_practice_priority (
  user_id,
  category_id,
  selection_weight,
  questions_needed,
  elo_deficit,
  accuracy_deficit,
  last_calculated_at
)
SELECT 
  mr.user_id,
  mr.category_id,
  mr.priority_score as selection_weight,
  GREATEST(0, mr.questions_available - mr.questions_mastered) as questions_needed,
  1500 - mr.elo_rating as elo_deficit,
  80.0 - mr.success_rate as accuracy_deficit,
  NOW() as last_calculated_at
FROM micro_ratings mr
ON CONFLICT (user_id, category_id) DO UPDATE SET
  selection_weight = EXCLUDED.selection_weight,
  questions_needed = EXCLUDED.questions_needed,
  elo_deficit = EXCLUDED.elo_deficit,
  accuracy_deficit = EXCLUDED.accuracy_deficit,
  last_calculated_at = NOW();

-- Output summary statistics
SELECT 
  'User Question History Records' as metric,
  COUNT(*) as count
FROM user_question_history
UNION ALL
SELECT 
  'Retired Questions' as metric,
  COUNT(*) as count
FROM user_question_history
WHERE is_retired = true
UNION ALL
SELECT 
  'Queued Questions' as metric,
  COUNT(*) as count
FROM user_question_history
WHERE queue_priority > 0
UNION ALL
SELECT 
  'Category Practice Priorities' as metric,
  COUNT(*) as count
FROM category_practice_priority;
