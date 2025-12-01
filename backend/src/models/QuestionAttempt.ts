import pool from '../config/database';
import { PoolClient } from 'pg';

export interface QuestionAttempt {
  id: string;
  session_id: string;
  question_id: string;
  user_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent: number; // seconds
  player_rating_before: number;
  player_rating_after: number;
  question_rating_before: number;
  question_rating_after: number;
  answered_at: Date;
}

export interface CreateAttemptData {
  sessionId: string;
  questionId: string;
  userId: string;
  userAnswer: string;
  timeSpent: number;
}

export interface SessionScore {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number; // percentage
  totalTimeSpent: number; // seconds
  averageTimePerQuestion: number; // seconds
}

class QuestionAttemptModel {
  /**
   * Record a new question attempt
   */
  static async recordAttempt(data: CreateAttemptData): Promise<QuestionAttempt> {
    const { sessionId, questionId, userId, userAnswer, timeSpent } = data;
    
    const client: PoolClient = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get question details to check correct answer
      const questionQuery = 'SELECT correct_answer, difficulty_rating FROM questions WHERE id = $1';
      const questionResult = await client.query(questionQuery, [questionId]);
      
      if (questionResult.rows.length === 0) {
        throw new Error('Question not found');
      }
      
      const question = questionResult.rows[0];
      const isCorrect = question.correct_answer.toLowerCase() === userAnswer.toLowerCase();
      
      // Get current player rating (for now, use default 1200 if no rating exists)
      const playerRatingQuery = `
        SELECT overall_elo FROM player_ratings WHERE user_id = $1
      `;
      const ratingResult = await client.query(playerRatingQuery, [userId]);
      const currentRating = ratingResult.rows[0]?.overall_elo || 1200;
      
      // For now, ratings don't change (ELO will be implemented later)
      const playerRatingBefore = currentRating;
      const playerRatingAfter = currentRating;
      const questionRatingBefore = question.difficulty_rating;
      const questionRatingAfter = question.difficulty_rating;
      
      // Insert the attempt
      const attemptQuery = `
        INSERT INTO question_attempts (
          session_id, question_id, user_id, user_answer, is_correct, time_spent,
          player_rating_before, player_rating_after, 
          question_rating_before, question_rating_after
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const attemptResult = await client.query(attemptQuery, [
        sessionId, questionId, userId, userAnswer, isCorrect, timeSpent,
        playerRatingBefore, playerRatingAfter, 
        questionRatingBefore, questionRatingAfter
      ]);
      
      // Update question statistics
      const updateQuestionQuery = `
        UPDATE questions 
        SET times_answered = times_answered + 1,
            times_correct = times_correct + $1,
            updated_at = NOW()
        WHERE id = $2
      `;
      
      await client.query(updateQuestionQuery, [isCorrect ? 1 : 0, questionId]);
      
      await client.query('COMMIT');
      return attemptResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error recording question attempt:', error);
      throw new Error('Failed to record question attempt');
    } finally {
      client.release();
    }
  }

  /**
   * Check if an answer is correct
   */
  static async checkAnswer(questionId: string, userAnswer: string): Promise<boolean> {
    const query = 'SELECT correct_answer FROM questions WHERE id = $1';
    
    try {
      const result = await pool.query(query, [questionId]);
      
      if (result.rows.length === 0) {
        throw new Error('Question not found');
      }
      
      const correctAnswer = result.rows[0].correct_answer;
      return correctAnswer.toLowerCase() === userAnswer.toLowerCase();
      
    } catch (error) {
      console.error('Error checking answer:', error);
      throw new Error('Failed to check answer');
    }
  }

  /**
   * Get all attempts for a session
   */
  static async getSessionAttempts(sessionId: string): Promise<any[]> {
    const query = `
      SELECT qa.*, q.question_text, q.correct_answer, q.explanation, q.options
      FROM question_attempts qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.session_id = $1
      ORDER BY qa.answered_at ASC
    `;
    
    try {
      const result = await pool.query(query, [sessionId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching session attempts:', error);
      throw new Error('Failed to fetch session attempts');
    }
  }

  /**
   * Calculate score for a session
   */
  static async calculateScore(sessionId: string): Promise<SessionScore> {
    const query = `
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
        SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as incorrect_answers,
        SUM(time_spent) as total_time_spent,
        AVG(time_spent) as average_time_per_question
      FROM question_attempts
      WHERE session_id = $1
    `;
    
    try {
      const result = await pool.query(query, [sessionId]);
      const row = result.rows[0];
      
      const totalQuestions = parseInt(row.total_questions) || 0;
      const correctAnswers = parseInt(row.correct_answers) || 0;
      const incorrectAnswers = parseInt(row.incorrect_answers) || 0;
      const totalTimeSpent = parseInt(row.total_time_spent) || 0;
      const averageTimePerQuestion = parseFloat(row.average_time_per_question) || 0;
      
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      
      return {
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        totalTimeSpent,
        averageTimePerQuestion: Math.round(averageTimePerQuestion * 100) / 100
      };
      
    } catch (error) {
      console.error('Error calculating score:', error);
      throw new Error('Failed to calculate score');
    }
  }

  /**
   * Get user's attempt history for a question
   */
  static async getUserQuestionHistory(
    userId: string, 
    questionId: string
  ): Promise<QuestionAttempt[]> {
    const query = `
      SELECT qa.*, qs.session_type
      FROM question_attempts qa
      JOIN quiz_sessions qs ON qa.session_id = qs.id
      WHERE qa.user_id = $1 AND qa.question_id = $2
      ORDER BY qa.answered_at DESC
    `;
    
    try {
      const result = await pool.query(query, [userId, questionId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching user question history:', error);
      throw new Error('Failed to fetch user question history');
    }
  }

  /**
   * Get user's performance by question type
   */
  static async getUserPerformanceByType(userId: string): Promise<any[]> {
    const query = `
      SELECT 
        q.question_type,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
        ROUND(
          (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
          2
        ) as accuracy_percentage,
        AVG(qa.time_spent) as avg_time_spent
      FROM question_attempts qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_id = $1
      GROUP BY q.question_type
      ORDER BY accuracy_percentage DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching user performance by type:', error);
      throw new Error('Failed to fetch user performance by type');
    }
  }

  /**
   * Get detailed session results with question breakdown
   */
  static async getSessionResults(sessionId: string): Promise<any> {
    try {
      // Get basic score
      const score = await this.calculateScore(sessionId);
      
      // Get attempt details
      const attempts = await this.getSessionAttempts(sessionId);
      
      // Get session info
      const sessionQuery = `
        SELECT qs.*, u.username
        FROM quiz_sessions qs
        JOIN users u ON qs.user_id = u.id
        WHERE qs.id = $1
      `;
      
      const sessionResult = await pool.query(sessionQuery, [sessionId]);
      const session = sessionResult.rows[0];
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Calculate session duration (excluding pauses)
      const startTime = new Date(session.start_time);
      const endTime = session.end_time ? new Date(session.end_time) : new Date();
      const totalSessionTime = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const activeTime = totalSessionTime - (session.total_pause_duration || 0);
      
      return {
        session: {
          id: session.id,
          type: session.session_type,
          status: session.status,
          startTime: session.start_time,
          endTime: session.end_time,
          totalTime: totalSessionTime,
          activeTime: Math.max(0, activeTime),
          pauseTime: session.total_pause_duration || 0,
          username: session.username
        },
        score,
        attempts: attempts.map((attempt: any) => ({
          questionId: attempt.question_id,
          questionText: attempt.question_text,
          userAnswer: attempt.user_answer,
          correctAnswer: attempt.correct_answer,
          isCorrect: attempt.is_correct,
          timeSpent: attempt.time_spent,
          explanation: attempt.explanation,
          options: attempt.options
        }))
      };
      
    } catch (error) {
      console.error('Error getting session results:', error);
      throw new Error('Failed to get session results');
    }
  }

  /**
   * Check if user has already attempted a question in current session
   */
  static async hasAttempted(sessionId: string, questionId: string): Promise<boolean> {
    const query = `
      SELECT id FROM question_attempts 
      WHERE session_id = $1 AND question_id = $2
    `;
    
    try {
      const result = await pool.query(query, [sessionId, questionId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking if question attempted:', error);
      throw new Error('Failed to check attempt status');
    }
  }

  /**
   * Get questions already attempted in a session (for exclusion)
   */
  static async getAttemptedQuestionIds(sessionId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT question_id FROM question_attempts 
      WHERE session_id = $1
    `;
    
    try {
      const result = await pool.query(query, [sessionId]);
      return result.rows.map(row => row.question_id);
    } catch (error) {
      console.error('Error getting attempted question IDs:', error);
      throw new Error('Failed to get attempted question IDs');
    }
  }
}

export default QuestionAttemptModel;