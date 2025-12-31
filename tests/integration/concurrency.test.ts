import QuizSessionModel from '../../backend/src/models/QuizSession';
import QuestionAttemptModel from '../../backend/src/models/QuestionAttempt';
import pool from '../../backend/src/config/database';

describe('Concurrent submissions', () => {
  it('prevents duplicate attempts for same session/question', async () => {
    // Create a real user in the DB for this test
    const email = `concurrency_test_${Date.now()}@example.com`;
    const username = `concurrency_${Date.now()}`;
    const userRes = await pool.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [email, username, 'hashedpw']
    );
    const userId = userRes.rows[0].id;

    // Create a real session for the user
    const session = await QuizSessionModel.createSession({ userId, sessionType: 'practice' });

    // Pick an existing question from DB, or create one if none exists
    let qRes = await pool.query('SELECT id FROM questions LIMIT 1');
    let questionId: string;
    
    if (qRes.rows.length === 0) {
      // Create a test question if none exists
      const questionInsert = await pool.query(
        `INSERT INTO questions (question_text, options, correct_answer, elo_rating) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Test question?', '[{"id": "A", "text": "Answer A"}]', 'A', 500]
      );
      questionId = questionInsert.rows[0].id;
      
      // Also create a category and link it
      await pool.query(
        `INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        ['test-category', 'Test category for concurrency test']
      );
      const catRes = await pool.query('SELECT id FROM categories WHERE name = $1', ['test-category']);
      if (catRes.rows.length > 0) {
        await pool.query(
          'INSERT INTO question_categories (question_id, category_id, is_primary) VALUES ($1, $2, $3)',
          [questionId, catRes.rows[0].id, true]
        );
      }
    } else {
      questionId = qRes.rows[0].id;
    }

    // Clean up any existing attempts for safety
    await pool.query('DELETE FROM question_attempts WHERE session_id = $1 AND question_id = $2', [session.id, questionId]);

    // Fire 10 concurrent attempts
    const promises = Array.from({ length: 10 }).map(() =>
      QuestionAttemptModel.recordAttempt({
        sessionId: session.id,
        questionId,
        userId,
        userAnswer: 'A',
        timeSpent: 5
      }).then(() => ({ ok: true })).catch(err => ({ ok: false, msg: err.message }))
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.ok).length;
    const failureCount = results.filter(r => !r.ok).length;

    // Expect exactly one success and the rest failures
    expect(successCount).toBe(1);
    expect(failureCount).toBe(9);

    // Verify only one attempt exists in DB
    const { rows } = await pool.query('SELECT count(*) FROM question_attempts WHERE session_id = $1 AND question_id = $2', [session.id, questionId]);
    expect(Number(rows[0].count)).toBe(1);
  });
});
