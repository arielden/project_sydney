import pool from '../config/database';
import UserQuestionHistoryModel from '../models/UserQuestionHistory';
import ELOCalculator from '../utils/eloCalculator';

export interface QuestionAttemptData {
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  time_taken: number;
  category_id: number;
  question_elo: number;
}

export interface SessionCompletionResult {
  sessionId: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  accuracyPercentage: number;
  avgTimePerQuestion: number;
  eloChange: number;
  newEloRating: number;
  categoryBreakdown: Array<{
    category_id: number;
    category_name: string;
    correct: number;
    total: number;
    accuracy: number;
  }>;
}

export class QuizCompletionService {
  /**
   * Complete a quiz session and update all statistics
   */
  static async completeSession(
    sessionId: number,
    userId: number,
    attempts: QuestionAttemptData[]
  ): Promise<SessionCompletionResult> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Step 1: Calculate session statistics
      const sessionStats = this.calculateSessionStats(attempts);

      // Step 2: Update quiz_sessions table with cached statistics
      await this.updateSessionStats(client, sessionId, sessionStats);

      // Step 3: Update user_question_history for each attempt
      await this.updateQuestionHistory(client, userId, attempts);

      // Step 4: Calculate and update ELO ratings
      const eloResult = await this.updateEloRatings(client, userId, attempts);

      // Step 5: Update micro_ratings for each category
      await this.updateMicroRatings(client, userId, attempts);

      // Step 6: Get category breakdown
      const categoryBreakdown = await this.getCategoryBreakdown(client, sessionId);

      await client.query('COMMIT');

      return {
        sessionId,
        totalQuestions: sessionStats.totalQuestions,
        correctAnswers: sessionStats.correctAnswers,
        incorrectAnswers: sessionStats.incorrectAnswers,
        skippedAnswers: sessionStats.skippedAnswers,
        accuracyPercentage: sessionStats.accuracyPercentage,
        avgTimePerQuestion: sessionStats.avgTimePerQuestion,
        eloChange: eloResult.eloChange,
        newEloRating: eloResult.newEloRating,
        categoryBreakdown
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate session-level statistics
   */
  private static calculateSessionStats(attempts: QuestionAttemptData[]) {
    const totalQuestions = attempts.length;
    const correctAnswers = attempts.filter(a => a.is_correct).length;
    const incorrectAnswers = attempts.filter(a => !a.is_correct && a.user_answer !== '').length;
    const skippedAnswers = attempts.filter(a => a.user_answer === '').length;
    const accuracyPercentage = totalQuestions > 0 
      ? (correctAnswers / totalQuestions) * 100 
      : 0;
    const totalTime = attempts.reduce((sum, a) => sum + a.time_taken, 0);
    const avgTimePerQuestion = totalQuestions > 0 
      ? totalTime / totalQuestions 
      : 0;

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      skippedAnswers,
      accuracyPercentage,
      avgTimePerQuestion
    };
  }

  /**
   * Update quiz_sessions table with statistics
   */
  private static async updateSessionStats(client: any, sessionId: number, stats: any) {
    const query = `
      UPDATE quiz_sessions
      SET 
        correct_answers = $1,
        incorrect_answers = $2,
        skipped_answers = $3,
        accuracy_percentage = $4,
        avg_time_per_question = $5,
        status = 'completed',
        end_time = NOW()
      WHERE id = $6
    `;
    await client.query(query, [
      stats.correctAnswers,
      stats.incorrectAnswers,
      stats.skippedAnswers,
      stats.accuracyPercentage.toFixed(2),
      stats.avgTimePerQuestion.toFixed(2),
      sessionId
    ]);
  }

  /**
   * Update user_question_history for all attempts
   */
  private static async updateQuestionHistory(
    client: any,
    userId: number,
    attempts: QuestionAttemptData[]
  ) {
    for (const attempt of attempts) {
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
      `;
      await client.query(query, [userId, attempt.question_id, attempt.is_correct]);
    }
  }

  /**
   * Update ELO ratings for user and questions
   */
  private static async updateEloRatings(
    client: any,
    userId: number,
    attempts: QuestionAttemptData[]
  ) {
    // Get current user ELO
    const userEloQuery = `
      SELECT overall_elo FROM player_ratings WHERE user_id = $1
    `;
    const userEloResult = await client.query(userEloQuery, [userId]);
    let currentUserElo = userEloResult.rows[0]?.overall_elo || 1500;
    let totalEloChange = 0;

    // Process each attempt
    for (const attempt of attempts) {
      const questionElo = attempt.question_elo;
      
      // Calculate ELO change using ELO Calculator
      const eloResult = ELOCalculator.performELOCalculation(
        {
          currentRating: currentUserElo,
          kFactor: 32, // Standard K-factor
          gamesPlayed: 0
        },
        {
          currentRating: questionElo,
          kFactor: 16,
          timesRated: 0
        },
        attempt.is_correct
      );

      const eloChange = eloResult.playerEloChange;
      totalEloChange += eloChange;
      currentUserElo += eloChange;

      // Update question ELO
      const questionEloChange = eloResult.questionEloChange;
      const updateQuestionQuery = `
        UPDATE questions
        SET elo_rating = elo_rating + $1
        WHERE id = $2
      `;
      await client.query(updateQuestionQuery, [questionEloChange, attempt.question_id]);
    }

    // Update player_ratings
    const updatePlayerQuery = `
      UPDATE player_ratings
      SET 
        overall_elo = $1,
        games_played = games_played + $2,
        wins = wins + $3
      WHERE user_id = $4
    `;
    const correctCount = attempts.filter(a => a.is_correct).length;
    await client.query(updatePlayerQuery, [
      currentUserElo,
      attempts.length,
      correctCount,
      userId
    ]);

    // Update session with ELO change
    const updateSessionEloQuery = `
      UPDATE quiz_sessions
      SET elo_change = $1
      WHERE id = $2
    `;
    await client.query(updateSessionEloQuery, [totalEloChange, attempts[0]?.question_id]); // Assuming we have session_id in context

    return {
      eloChange: totalEloChange,
      newEloRating: currentUserElo
    };
  }

  /**
   * Update micro_ratings for each category
   */
  private static async updateMicroRatings(
    client: any,
    userId: number,
    attempts: QuestionAttemptData[]
  ) {
    // Group attempts by category
    const categoryMap = new Map<number, QuestionAttemptData[]>();
    attempts.forEach(attempt => {
      if (!categoryMap.has(attempt.category_id)) {
        categoryMap.set(attempt.category_id, []);
      }
      categoryMap.get(attempt.category_id)!.push(attempt);
    });

    // Update each category
    for (const [categoryId, categoryAttempts] of categoryMap) {
      const correctCount = categoryAttempts.filter(a => a.is_correct).length;
      const totalCount = categoryAttempts.length;

      // Calculate ELO change for category
      let categoryEloChange = 0;
      for (const attempt of categoryAttempts) {
        const currentCategoryElo = await this.getCategoryElo(client, userId, categoryId);
        const eloResult = ELOCalculator.performELOCalculation(
          {
            currentRating: currentCategoryElo,
            kFactor: 24, // Slightly lower K-factor for categories
            gamesPlayed: 0
          },
          {
            currentRating: attempt.question_elo,
            kFactor: 16,
            timesRated: 0
          },
          attempt.is_correct
        );
        categoryEloChange += eloResult.playerEloChange;
      }

      // Update micro_ratings
      const query = `
        UPDATE micro_ratings
        SET 
          elo_rating = elo_rating + $1,
          attempts = attempts + $2,
          correct_attempts = correct_attempts + $3,
          success_rate = ROUND(
            (CAST(correct_attempts + $3 AS DECIMAL) / (attempts + $2)) * 100, 
            2
          ),
          last_practice_date = NOW(),
          updated_at = NOW()
        WHERE user_id = $4 AND category_id = $5
      `;
      await client.query(query, [
        categoryEloChange,
        totalCount,
        correctCount,
        userId,
        categoryId
      ]);

      // Update recent_accuracy (last 10 attempts)
      await this.updateRecentAccuracy(client, userId, categoryId);

      // Update trend
      await this.updateTrend(client, userId, categoryId);

      // Update mastered count
      const masteredCount = await UserQuestionHistoryModel.getMasteredCount(userId, categoryId);
      const updateMasteredQuery = `
        UPDATE micro_ratings
        SET questions_mastered = $1
        WHERE user_id = $2 AND category_id = $3
      `;
      await client.query(updateMasteredQuery, [masteredCount, userId, categoryId]);

      // Update priority score
      await this.updatePriorityScore(client, userId, categoryId);
    }
  }

  /**
   * Get current category ELO
   */
  private static async getCategoryElo(client: any, userId: number, categoryId: number): Promise<number> {
    const query = `
      SELECT elo_rating FROM micro_ratings
      WHERE user_id = $1 AND category_id = $2
    `;
    const result = await client.query(query, [userId, categoryId]);
    return result.rows[0]?.elo_rating || 1500;
  }

  /**
   * Update recent_accuracy (last 10 attempts)
   */
  private static async updateRecentAccuracy(client: any, userId: number, categoryId: number) {
    const query = `
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
          INNER JOIN quiz_questions qq ON qa.question_id = qq.question_id AND qa.session_id = qq.session_id
          WHERE qa.user_id = $1 AND qq.category_id = $2
          ORDER BY qa.answered_at DESC
          LIMIT 10
        ) recent_attempts
      )
      WHERE mr.user_id = $1 AND mr.category_id = $2
    `;
    await client.query(query, [userId, categoryId]);
  }

  /**
   * Update trend based on recent performance
   */
  private static async updateTrend(client: any, userId: number, categoryId: number) {
    const query = `
      UPDATE micro_ratings
      SET trend = CASE
        WHEN recent_accuracy > success_rate + 10 THEN 'improving'
        WHEN recent_accuracy < success_rate - 10 THEN 'declining'
        ELSE 'stable'
      END
      WHERE user_id = $1 AND category_id = $2
    `;
    await client.query(query, [userId, categoryId]);
  }

  /**
   * Update priority score for a category
   */
  private static async updatePriorityScore(client: any, userId: number, categoryId: number) {
    const query = `
      UPDATE micro_ratings
      SET priority_score = (
        -- Lower ELO = higher priority (max 3.0)
        CASE 
          WHEN elo_rating < 1200 THEN 3.0
          WHEN elo_rating < 1400 THEN 2.0
          ELSE 1.0
        END *
        -- Lower accuracy = higher priority (max 2.5)
        CASE 
          WHEN success_rate < 50 THEN 2.5
          WHEN success_rate < 70 THEN 1.5
          ELSE 0.5
        END
      )
      WHERE user_id = $1 AND category_id = $2
    `;
    await client.query(query, [userId, categoryId]);
  }

  /**
   * Get category breakdown for session
   */
  private static async getCategoryBreakdown(client: any, sessionId: number) {
    const query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(*) as total,
        SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct,
        ROUND(
          (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
          2
        ) as accuracy
      FROM quiz_questions qq
      INNER JOIN categories c ON qq.category_id = c.id
      INNER JOIN question_attempts qa ON qq.question_id = qa.question_id AND qq.session_id = qa.session_id
      WHERE qq.session_id = $1
      GROUP BY c.id, c.name
      ORDER BY c.name
    `;
    const result = await client.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Get session completion summary
   */
  static async getSessionSummary(sessionId: number): Promise<SessionCompletionResult | null> {
    const query = `
      SELECT 
        qs.id as session_id,
        qs.total_questions,
        qs.correct_answers,
        qs.incorrect_answers,
        qs.skipped_answers,
        qs.accuracy_percentage,
        qs.avg_time_per_question,
        qs.elo_change,
        pr.elo_rating as new_elo_rating
      FROM quiz_sessions qs
      INNER JOIN player_ratings pr ON qs.user_id = pr.user_id
      WHERE qs.id = $1
    `;
    const result = await pool.query(query, [sessionId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const session = result.rows[0];
    const categoryBreakdown = await this.getCategoryBreakdown(pool, sessionId);

    return {
      sessionId: session.session_id,
      totalQuestions: session.total_questions,
      correctAnswers: session.correct_answers,
      incorrectAnswers: session.incorrect_answers,
      skippedAnswers: session.skipped_answers,
      accuracyPercentage: parseFloat(session.accuracy_percentage),
      avgTimePerQuestion: parseFloat(session.avg_time_per_question),
      eloChange: session.elo_change,
      newEloRating: session.new_elo_rating,
      categoryBreakdown
    };
  }
}

export default QuizCompletionService;
