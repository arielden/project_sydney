import pool from '../config/database';

export interface UserQuestionHistory {
  id: number;
  user_id: number;
  question_id: number;
  category_id: number | null;
  times_seen: number;
  times_correct: number;
  times_incorrect: number;
  first_seen_at: Date;
  last_seen_at: Date | null;
  last_session_id: number | null;
  is_retired: boolean;
  retirement_date: Date | null;
  queue_priority: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserQuestionHistoryInsert {
  user_id: number;
  question_id: number;
  category_id?: number;
  times_seen?: number;
  last_session_id?: number;
}

export class UserQuestionHistoryModel {
  /**
   * Record that a user has seen a question
   */
  static async recordQuestionSeen(
    userId: number,
    questionId: number,
    categoryId: number | null,
    sessionId: number
  ): Promise<UserQuestionHistory> {
    const query = `
      INSERT INTO user_question_history 
        (user_id, question_id, category_id, times_seen, last_seen_at, last_session_id)
      VALUES ($1, $2, $3, 1, NOW(), $4)
      ON CONFLICT (user_id, question_id) 
      DO UPDATE SET 
        times_seen = user_question_history.times_seen + 1,
        last_seen_at = NOW(),
        last_session_id = $4,
        updated_at = NOW()
      RETURNING *
    `;
    const result = await pool.query(query, [userId, questionId, categoryId, sessionId]);
    return result.rows[0];
  }

  /**
   * Bulk record multiple questions as seen
   */
  static async bulkRecordQuestionsSeen(
    userId: number,
    questionIds: number[],
    categoryIds: (number | null)[],
    sessionId: number
  ): Promise<void> {
    if (questionIds.length === 0) return;

    const values: any[] = [];
    const placeholders = questionIds.map((_, index) => {
      const baseIndex = index * 4;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`;
    }).join(', ');

    questionIds.forEach((qId, index) => {
      values.push(userId, qId, categoryIds[index], sessionId);
    });

    const query = `
      INSERT INTO user_question_history 
        (user_id, question_id, category_id, times_seen, last_seen_at, last_session_id)
      VALUES ${placeholders}
      ON CONFLICT (user_id, question_id) 
      DO UPDATE SET 
        times_seen = user_question_history.times_seen + 1,
        last_seen_at = NOW(),
        last_session_id = EXCLUDED.last_session_id,
        updated_at = NOW()
    `;

    await pool.query(query, values);
  }

  /**
   * Update history after question attempt
   */
  static async updateAfterAttempt(
    userId: number,
    questionId: number,
    isCorrect: boolean
  ): Promise<UserQuestionHistory> {
    const query = `
      UPDATE user_question_history
      SET 
        times_correct = times_correct + CASE WHEN $3 THEN 1 ELSE 0 END,
        times_incorrect = times_incorrect + CASE WHEN NOT $3 THEN 1 ELSE 0 END,
        is_retired = CASE WHEN $3 THEN true ELSE false END,
        retirement_date = CASE WHEN $3 THEN NOW() ELSE NULL END,
        queue_priority = CASE 
          WHEN $3 THEN 0 
          ELSE LEAST(queue_priority + 1, 3)
        END,
        updated_at = NOW()
      WHERE user_id = $1 AND question_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [userId, questionId, isCorrect]);
    return result.rows[0];
  }

  /**
   * Bulk update history after multiple attempts
   */
  static async bulkUpdateAfterAttempts(
    userId: number,
    attempts: Array<{ question_id: number; is_correct: boolean }>
  ): Promise<void> {
    if (attempts.length === 0) return;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const attempt of attempts) {
        await client.query(`
          UPDATE user_question_history
          SET 
            times_correct = times_correct + CASE WHEN $3 THEN 1 ELSE 0 END,
            times_incorrect = times_incorrect + CASE WHEN NOT $3 THEN 1 ELSE 0 END,
            is_retired = CASE WHEN $3 THEN true ELSE false END,
            retirement_date = CASE WHEN $3 THEN NOW() ELSE NULL END,
            queue_priority = CASE 
              WHEN $3 THEN 0 
              ELSE LEAST(queue_priority + 1, 3)
            END,
            updated_at = NOW()
          WHERE user_id = $1 AND question_id = $2
        `, [userId, attempt.question_id, attempt.is_correct]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get questions that should be excluded (recently seen or retired)
   */
  static async getExcludedQuestionIds(
    userId: number,
    categoryId?: number,
    sessionsToAvoid: number = 3
  ): Promise<number[]> {
    let query = `
      SELECT question_id
      FROM user_question_history
      WHERE user_id = $1
      AND (
        is_retired = true
        OR last_seen_at > NOW() - INTERVAL '${sessionsToAvoid} days'
      )
    `;

    const params: any[] = [userId];
    
    if (categoryId !== undefined) {
      query += ` AND category_id = $2`;
      params.push(categoryId);
    }

    const result = await pool.query(query, params);
    return result.rows.map(row => row.question_id);
  }

  /**
   * Get queued questions (with priority > 0)
   */
  static async getQueuedQuestions(
    userId: number,
    categoryId?: number
  ): Promise<Array<{ question_id: number; queue_priority: number }>> {
    let query = `
      SELECT question_id, queue_priority
      FROM user_question_history
      WHERE user_id = $1
      AND queue_priority > 0
      AND is_retired = false
    `;

    const params: any[] = [userId];
    
    if (categoryId !== undefined) {
      query += ` AND category_id = $2`;
      params.push(categoryId);
    }

    query += ` ORDER BY queue_priority DESC, last_seen_at ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get mastered question count for a user in a category
   */
  static async getMasteredCount(userId: number, categoryId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM user_question_history
      WHERE user_id = $1
      AND category_id = $2
      AND is_retired = true
    `;
    const result = await pool.query(query, [userId, categoryId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get user's question history summary
   */
  static async getUserSummary(userId: number) {
    const query = `
      SELECT 
        COUNT(*) as total_questions_seen,
        SUM(times_correct) as total_correct,
        SUM(times_incorrect) as total_incorrect,
        COUNT(CASE WHEN is_retired THEN 1 END) as questions_mastered,
        COUNT(CASE WHEN queue_priority > 0 THEN 1 END) as questions_in_queue
      FROM user_question_history
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Reset retired status (for testing or re-learning)
   */
  static async resetRetiredQuestions(userId: number): Promise<void> {
    const query = `
      UPDATE user_question_history
      SET is_retired = false, retirement_date = NULL, updated_at = NOW()
      WHERE user_id = $1 AND is_retired = true
    `;
    await pool.query(query, [userId]);
  }
}

export default UserQuestionHistoryModel;
