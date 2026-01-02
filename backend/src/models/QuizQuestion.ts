import pool from '../config/database';

export interface QuizQuestion {
  id: number;
  session_id: number;
  question_id: number;
  question_order: number;
  category_id: number | null;
  question_elo_at_selection: number | null;
  created_at: Date;
}

export interface QuizQuestionInsert {
  session_id: number;
  question_id: number;
  question_order: number;
  category_id?: number;
  question_elo_at_selection?: number;
}

export class QuizQuestionModel {
  /**
   * Insert multiple quiz questions for a session
   */
  static async bulkCreate(questions: QuizQuestionInsert[]): Promise<QuizQuestion[]> {
    if (questions.length === 0) {
      return [];
    }

    const values: any[] = [];
    const placeholders = questions.map((_, index) => {
      const baseIndex = index * 5;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`;
    }).join(', ');

    questions.forEach(q => {
      values.push(
        q.session_id,
        q.question_id,
        q.question_order,
        q.category_id || null,
        q.question_elo_at_selection || null
      );
    });

    const query = `
      INSERT INTO quiz_questions (session_id, question_id, question_order, category_id, question_elo_at_selection)
      VALUES ${placeholders}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get all questions for a specific session
   */
  static async getBySessionId(sessionId: number): Promise<QuizQuestion[]> {
    const query = `
      SELECT * FROM quiz_questions
      WHERE session_id = $1
      ORDER BY question_order ASC
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Get questions with full details for a session
   */
  static async getSessionQuestionsWithDetails(sessionId: number) {
    const query = `
      SELECT 
        qq.id,
        qq.session_id,
        qq.question_id,
        qq.question_order,
        qq.category_id,
        qq.question_elo_at_selection,
        q.question_text,
        q.correct_answer,
        q.incorrect_answers,
        q.explanation,
        q.elo_rating as current_elo,
        c.name as category_name
      FROM quiz_questions qq
      INNER JOIN questions q ON qq.question_id = q.id
      LEFT JOIN categories c ON qq.category_id = c.id
      WHERE qq.session_id = $1
      ORDER BY qq.question_order ASC
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Get count of questions in a session
   */
  static async getCountBySessionId(sessionId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM quiz_questions
      WHERE session_id = $1
    `;
    const result = await pool.query(query, [sessionId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Delete all questions for a session (cascades automatically)
   */
  static async deleteBySessionId(sessionId: number): Promise<void> {
    const query = `
      DELETE FROM quiz_questions
      WHERE session_id = $1
    `;
    await pool.query(query, [sessionId]);
  }

  /**
   * Get category distribution for a session
   */
  static async getCategoryDistribution(sessionId: number) {
    const query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(*) as question_count
      FROM quiz_questions qq
      INNER JOIN categories c ON qq.category_id = c.id
      WHERE qq.session_id = $1
      GROUP BY c.id, c.name
      ORDER BY question_count DESC
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  }
}

export default QuizQuestionModel;
