import pool from '../config/database';
import UserQuestionHistoryModel from '../models/UserQuestionHistory';
import QuizQuestionModel from '../models/QuizQuestion';
import CategoryPracticePriorityModel from '../models/CategoryPracticePriority';

export interface QuizGenerationParams {
  userId: number;
  totalQuestions: number;
  sessionType?: string;
  targetCategories?: number[]; // Optional: specific categories to focus on
}

export interface SelectedQuestion {
  id: number;
  question_text: string;
  correct_answer: string;
  incorrect_answers: string[];
  explanation: string | null;
  elo_rating: number;
  category_id: number;
  category_name: string;
}

export interface QuizGenerationResult {
  sessionId: number;
  questions: SelectedQuestion[];
  categoryDistribution: { [categoryName: string]: number };
}

export class AdaptiveQuizGenerator {
  /**
   * Generate an adaptive quiz session for a user
   */
  static async generateQuiz(params: QuizGenerationParams): Promise<QuizGenerationResult> {
    const { userId, totalQuestions, sessionType = 'practice', targetCategories } = params;

    // Step 1: Recalculate category priorities
    await CategoryPracticePriorityModel.recalculateAllPriorities(userId);

    // Step 2: Get user's current ELO
    const userElo = await this.getUserElo(userId);

    // Step 3: Identify weak categories to focus on
    const priorityCategories = targetCategories 
      ? await this.getCategoriesByIds(targetCategories)
      : await CategoryPracticePriorityModel.getTopPriorities(userId, 3);

    if (priorityCategories.length === 0) {
      throw new Error('No categories available for quiz generation');
    }

    // Step 4: Calculate question distribution across categories
    const distribution = this.calculateDistribution(totalQuestions, priorityCategories);

    // Step 5: Select questions for each category
    const selectedQuestions: SelectedQuestion[] = [];
    
    for (const { categoryId, count } of distribution) {
      const questions = await this.selectQuestionsForCategory(
        userId,
        categoryId,
        count,
        userElo
      );
      selectedQuestions.push(...questions);
    }

    // Step 6: Shuffle questions for variety
    this.shuffleArray(selectedQuestions);

    // Step 7: Create quiz session
    const sessionId = await this.createQuizSession(userId, totalQuestions, sessionType);

    // Step 8: Link questions to session
    await this.linkQuestionsToSession(sessionId, selectedQuestions);

    // Step 9: Record questions as seen
    await this.recordQuestionsSeen(userId, sessionId, selectedQuestions);

    // Step 10: Calculate category distribution for response
    const categoryDistribution = this.getCategoryDistribution(selectedQuestions);

    return {
      sessionId,
      questions: selectedQuestions,
      categoryDistribution
    };
  }

  /**
   * Get user's current ELO rating
   */
  private static async getUserElo(userId: number): Promise<number> {
    const query = `
      SELECT overall_elo
      FROM player_ratings
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0]?.overall_elo || 1500; // Default to 1500 if not found
  }

  /**
   * Get categories by IDs
   */
  private static async getCategoriesByIds(categoryIds: number[]) {
    const query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        1.0 as selection_weight
      FROM categories c
      WHERE c.id = ANY($1)
    `;
    const result = await pool.query(query, [categoryIds]);
    return result.rows;
  }

  /**
   * Calculate question distribution across categories
   */
  private static calculateDistribution(
    totalQuestions: number,
    priorities: any[]
  ): Array<{ categoryId: number; count: number; categoryName: string }> {
    // Calculate total weight
    const totalWeight = priorities.reduce((sum, p) => sum + parseFloat(p.selection_weight), 0);

    // Distribute questions proportionally
    const distribution = priorities.map(p => {
      const proportion = parseFloat(p.selection_weight) / totalWeight;
      const count = Math.round(totalQuestions * proportion);
      return {
        categoryId: p.category_id,
        categoryName: p.category_name,
        count: Math.max(1, count) // At least 1 question per category
      };
    });

    // Adjust to match exact total
    const currentTotal = distribution.reduce((sum, d) => sum + d.count, 0);
    if (currentTotal !== totalQuestions) {
      const diff = totalQuestions - currentTotal;
      // Add/remove from highest priority category
      if (distribution.length > 0 && distribution[0]) {
        distribution[0].count += diff;
      }
    }

    return distribution;
  }

  /**
   * Select questions for a specific category
   */
  private static async selectQuestionsForCategory(
    userId: number,
    categoryId: number,
    count: number,
    userElo: number
  ): Promise<SelectedQuestion[]> {
    // ELO range: ±200 points from user's rating
    const eloMin = userElo - 200;
    const eloMax = userElo + 200;

    // Get queued questions (incorrect answers with priority)
    const queuedQuestions = await UserQuestionHistoryModel.getQueuedQuestions(userId, categoryId);
    const queuedQuestionIds = queuedQuestions.map(q => q.question_id);

    // Get excluded questions (recently seen or mastered)
    const excludedQuestionIds = await UserQuestionHistoryModel.getExcludedQuestionIds(
      userId,
      categoryId,
      3 // Avoid questions from last 3 sessions (approximated as 3 days)
    );

    // Build query for question selection
    const query = `
      SELECT 
        q.id,
        q.question_text,
        q.correct_answer,
        q.options,
        q.explanation,
        q.elo_rating,
        qc.category_id,
        c.name as category_name,
        CASE 
          WHEN q.id = ANY($4) THEN uqh.queue_priority
          ELSE 0
        END as priority,
        ABS(q.elo_rating - $3) as elo_distance
      FROM questions q
      INNER JOIN question_categories qc ON q.id = qc.question_id
      INNER JOIN categories c ON qc.category_id = c.id
      LEFT JOIN user_question_history uqh ON q.id = uqh.question_id AND uqh.user_id = $1
      WHERE qc.category_id = $2
        AND q.is_active = true
        AND q.elo_rating BETWEEN $5 AND $6
        AND (q.id = ANY($4) OR q.id != ALL($7))  -- Include queued OR not excluded
      ORDER BY 
        priority DESC,  -- Queued questions first
        elo_distance ASC,  -- Closest to user ELO
        RANDOM()  -- Add randomness
      LIMIT $8
    `;

    const result = await pool.query(query, [
      userId,
      categoryId,
      userElo,
      queuedQuestionIds.length > 0 ? queuedQuestionIds : [-1], // Ensure array is not empty
      eloMin,
      eloMax,
      excludedQuestionIds.length > 0 ? excludedQuestionIds : [-1],
      count
    ]);

    return result.rows;
  }

  /**
   * Create a new quiz session
   */
  private static async createQuizSession(
    userId: number,
    totalQuestions: number,
    sessionType: string
  ): Promise<number> {
    const query = `
      INSERT INTO quiz_sessions (user_id, session_type, total_questions, status, start_time)
      VALUES ($1, $2, $3, 'active', NOW())
      RETURNING id
    `;
    const result = await pool.query(query, [userId, sessionType, totalQuestions]);
    return result.rows[0].id;
  }

  /**
   * Link selected questions to session
   */
  private static async linkQuestionsToSession(
    sessionId: number,
    questions: SelectedQuestion[]
  ): Promise<void> {
    const quizQuestions = questions.map((q, index) => ({
      session_id: sessionId,
      question_id: q.id,
      question_order: index + 1,
      category_id: q.category_id,
      question_elo_at_selection: q.elo_rating
    }));

    await QuizQuestionModel.bulkCreate(quizQuestions);

    // Also update questions_json for fast access
    const questionIds = questions.map(q => q.id);
    const updateQuery = `
      UPDATE quiz_sessions 
      SET questions_json = $1
      WHERE id = $2
    `;
    await pool.query(updateQuery, [JSON.stringify(questionIds), sessionId]);
  }

  /**
   * Record questions as seen by user
   */
  private static async recordQuestionsSeen(
    userId: number,
    sessionId: number,
    questions: SelectedQuestion[]
  ): Promise<void> {
    const questionIds = questions.map(q => q.id);
    const categoryIds = questions.map(q => q.category_id);
    
    await UserQuestionHistoryModel.bulkRecordQuestionsSeen(
      userId,
      questionIds,
      categoryIds,
      sessionId
    );
  }

  /**
   * Calculate category distribution
   */
  private static getCategoryDistribution(questions: SelectedQuestion[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    questions.forEach(q => {
      const categoryName = q.category_name;
      distribution[categoryName] = (distribution[categoryName] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Shuffle array in place (Fisher-Yates algorithm)
   */
  private static shuffleArray(array: SelectedQuestion[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i]!;
      array[i] = array[j]!;
      array[j] = temp;
    }
  }

  /**
   * Get questions for an existing session
   */
  static async getSessionQuestions(sessionId: number): Promise<SelectedQuestion[]> {
    const query = `
      SELECT 
        q.id,
        q.question_text,
        q.correct_answer,
        q.incorrect_answers,
        q.explanation,
        q.elo_rating,
        qq.category_id,
        c.name as category_name
      FROM quiz_questions qq
      INNER JOIN questions q ON qq.question_id = q.id
      INNER JOIN categories c ON qq.category_id = c.id
      WHERE qq.session_id = $1
      ORDER BY qq.question_order ASC
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  }
}

export default AdaptiveQuizGenerator;
