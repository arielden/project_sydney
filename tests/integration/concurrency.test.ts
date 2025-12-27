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

    // Pick an existing question from DB
    const qRes = await pool.query('SELECT id FROM questions LIMIT 1');
    const questionId = qRes.rows[0].id;

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
