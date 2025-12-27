import pool from '../config/database';
import { PoolClient } from 'pg';
import { ELOCalculator } from '../utils/eloCalculator';
import { DEFAULT_ELO } from '../config/eloConstants';
// Re-enable MicroRating for category-specific tracking
import MicroRatingModel from './MicroRating';

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
   * Record a new question attempt with simplified scoring
   */
  static async recordAttempt(data: CreateAttemptData): Promise<QuestionAttempt> {
    const { sessionId, questionId, userId, userAnswer, timeSpent } = data;
    
    console.log('🎯 Recording attempt (simplified):', { sessionId, questionId, userId, userAnswer, timeSpent });
    
    const client: PoolClient = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get question details to check correct answer (with primary category from junction table)
      const questionQuery = `
        SELECT 
          q.correct_answer, 
          q.difficulty_rating, 
          COALESCE(qc.category_id, 0) as category_id,
          q.elo_rating, 
          q.times_answered
        FROM questions q
        LEFT JOIN question_categories qc ON q.id = qc.question_id AND qc.is_primary = true
        WHERE q.id = $1
      `;
      const questionResult = await client.query(questionQuery, [questionId]);
      
      if (questionResult.rows.length === 0) {
        throw new Error('Question not found');
      }
      
      const question = questionResult.rows[0];
      const isCorrect = question.correct_answer.toLowerCase() === userAnswer.toLowerCase();
      
      console.log('📚 Question checked:', {
        questionId,
        correctAnswer: question.correct_answer,
        userAnswer,
        isCorrect,
        categoryId: question.category_id
      });
      
      // Initialize micro ratings for new users
      try {
        console.log('🎯 Ensuring micro ratings initialized for user:', userId);
        await MicroRatingModel.initializeUserMicroRatings(userId);
      } catch (initError) {
        console.log('ℹ️ Micro ratings already initialized or failed:', initError instanceof Error ? initError.message : 'Unknown error');
      }
      
      // Get current player rating and stats
      let playerRatingBefore = DEFAULT_ELO; // Default rating
      let playerGamesPlayed = 0;
      let playerKFactor = 100;
      
      try {
        const playerRatingQuery = `
          SELECT overall_elo, games_played, k_factor 
          FROM player_ratings 
          WHERE user_id = $1
        `;
        const playerResult = await client.query(playerRatingQuery, [userId]);
        if (playerResult.rows.length > 0) {
          const playerData = playerResult.rows[0];
          playerRatingBefore = playerData.overall_elo || DEFAULT_ELO;
          playerGamesPlayed = playerData.games_played || 0;
          playerKFactor = playerData.k_factor || ELOCalculator.calculatePlayerKFactor(playerGamesPlayed);
        }
      } catch (playerError) {
        console.log('⚠️ Could not fetch player rating, using defaults:', playerError instanceof Error ? playerError.message : 'Unknown error');
      }
      
      // Get question rating and stats
      const questionRatingBefore = question.elo_rating || DEFAULT_ELO;
      const questionTimesRated = question.times_answered || 0;
      const questionKFactor = ELOCalculator.calculateQuestionKFactor(questionTimesRated);
      
      // Perform complete ELO calculation
      const eloResult = ELOCalculator.performELOCalculation(
        {
          currentRating: playerRatingBefore,
          kFactor: playerKFactor,
          gamesPlayed: playerGamesPlayed
        },
        {
          currentRating: questionRatingBefore,
          kFactor: questionKFactor,
          timesRated: questionTimesRated
        },
        isCorrect
      );
      
      // Calculate player confidence based on games played and performance
      const playerConfidence = ELOCalculator.calculatePlayerConfidence(
        playerGamesPlayed,
        eloResult.expectedScore
      );
      
      console.log('🧮 ELO Calculation Results:', {
        playerRatingBefore,
        playerRatingAfter: eloResult.playerNewRating,
        playerEloChange: eloResult.playerEloChange,
        questionRatingBefore,
        questionRatingAfter: eloResult.questionNewRating,
        questionEloChange: eloResult.questionEloChange,
        expectedScore: eloResult.expectedScore,
        actualScore: eloResult.actualScore,
        playerConfidence
      });
      
      // Insert ELO-calculated attempt record
      const attemptQuery = `
        INSERT INTO question_attempts (
          session_id, question_id, user_id, user_answer, is_correct, time_spent,
          player_rating_before, player_rating_after, 
          question_rating_before, question_rating_after,
          expected_score, elo_change
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (session_id, question_id) DO NOTHING
        RETURNING *
      `;
      
      const attemptResult = await client.query(attemptQuery, [
        sessionId, questionId, userId, userAnswer, isCorrect, timeSpent,
        playerRatingBefore, eloResult.playerNewRating, 
        questionRatingBefore, eloResult.questionNewRating,
        eloResult.expectedScore, eloResult.playerEloChange
      ]);

      // If insert was skipped due to conflict, the question was already answered in this session
      if (attemptResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Question already answered');
      }
      
      // Update player rating in player_ratings table with all fields
      await client.query(`
        INSERT INTO player_ratings (
          user_id, overall_elo, games_played, k_factor, 
          wins, losses, streak, best_rating, confidence_level, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          overall_elo = $2,
          games_played = player_ratings.games_played + 1,
          k_factor = $4,
          wins = player_ratings.wins + $5,
          losses = player_ratings.losses + $6,
          streak = CASE 
            WHEN $5 = 1 THEN 
              CASE 
                WHEN player_ratings.streak >= 0 THEN player_ratings.streak + 1
                ELSE 1
              END
            ELSE
              CASE 
                WHEN player_ratings.streak <= 0 THEN player_ratings.streak - 1
                ELSE -1
              END
          END,
          best_rating = GREATEST(player_ratings.best_rating, $8),
          confidence_level = ROUND($9::numeric, 2),
          updated_at = NOW()
      `, [
        userId, 
        eloResult.playerNewRating, 
        playerGamesPlayed + 1, 
        eloResult.playerNewKFactor,
        isCorrect ? 1 : 0,  // wins increment
        isCorrect ? 0 : 1,  // losses increment
        0,  // streak parameter (calculated in UPDATE)
        eloResult.playerNewRating,  // best_rating
        playerConfidence  // confidence level
      ]);
      
      // Update question with ELO results
      await client.query(`
        UPDATE questions SET 
          elo_rating = $1,
          times_answered = times_answered + 1, 
          times_correct = times_correct + $2, 
          k_factor = $3,
          updated_at = NOW() 
        WHERE id = $4
      `, [eloResult.questionNewRating, isCorrect ? 1 : 0, eloResult.questionNewKFactor, questionId]);
      
      await client.query('COMMIT');
      console.log('✅ Attempt recorded successfully');
      
      // Update micro ratings for ALL categories linked to this question (not just primary)
      try {
        const categoriesQuery = `
          SELECT DISTINCT qc.category_id
          FROM question_categories qc
          WHERE qc.question_id = $1
        `;
        const categoriesResult = await client.query(categoriesQuery, [questionId]);
        
        if (categoriesResult.rows.length > 0) {
          console.log(`🎯 Updating micro ratings for ${categoriesResult.rows.length} categories`);
          
          for (const row of categoriesResult.rows) {
            const categoryId = row.category_id;
            try {
              console.log('📊 Updating micro rating for category:', categoryId);
              await MicroRatingModel.recordAttempt(userId, categoryId, isCorrect);
              console.log('✅ Micro rating updated for category:', categoryId);
            } catch (microError) {
              console.error(`⚠️ Failed to update micro rating for category ${categoryId}:`, 
                microError instanceof Error ? microError.message : 'Unknown error');
              // Don't throw error, just log it - micro rating is supplementary
            }
          }
        } else {
          console.log('ℹ️ No categories linked to question, micro ratings not updated');
        }
      } catch (categoriesError) {
        console.error('⚠️ Failed to fetch categories for question:', 
          categoriesError instanceof Error ? categoriesError.message : 'Unknown error');
        // Don't throw error, just log it
      }
      
      return attemptResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error recording attempt:', {
        error: errorMessage,
        userId,
        questionId,
        sessionId,
        userAnswer
      });
      throw new Error(`Failed to record question attempt: ${errorMessage}`);
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
        averageTimePerQuestion: Math.round(averageTimePerQuestion) // Round to whole seconds for time display
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
   * Get user's performance by question type with ELO insights
   */
  static async getUserPerformanceByType(userId: string): Promise<any[]> {
    const query = `
      SELECT 
        q.question_type,
        COALESCE(qc.category_id, 0) as category_id,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
        ROUND(
          (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
          2
        ) as accuracy_percentage,
        AVG(qa.time_spent) as avg_time_spent,
        AVG(qa.player_rating_before) as avg_player_rating,
        AVG(qa.question_rating_before) as avg_question_difficulty,
        AVG(qa.player_rating_after - qa.player_rating_before) as avg_rating_change
      FROM question_attempts qa
      JOIN questions q ON qa.question_id = q.id
      LEFT JOIN question_categories qc ON q.id = qc.question_id AND qc.is_primary = true
      WHERE qa.user_id = $1
      GROUP BY q.question_type, COALESCE(qc.category_id, 0)
      ORDER BY accuracy_percentage DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      
      // Return results without micro ratings (ELO temporarily disabled)
      const enhancedResults = result.rows.map((row) => {
        return {
          ...row,
          current_micro_rating: DEFAULT_ELO, // Default rating
          avg_rating_change: parseFloat(row.avg_rating_change) || 0
        };
      });
      
      return enhancedResults;
    } catch (error) {
      console.error('Error fetching user performance by type:', error);
      throw new Error('Failed to fetch user performance by type');
    }
  }

  /**
   * Get ELO progression for a user
   */
  static async getUserELOProgression(userId: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        qa.answered_at,
        qa.is_correct,
        qa.player_rating_before,
        qa.player_rating_after,
        qa.player_rating_after - qa.player_rating_before as rating_change,
        q.question_type,
        q.category_id
      FROM question_attempts qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_id = $1
      ORDER BY qa.answered_at DESC
      LIMIT $2
    `;
    
    try {
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching user ELO progression:', error);
      throw new Error('Failed to fetch user ELO progression');
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