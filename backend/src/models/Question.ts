import pool from '../config/database';
import { DEFAULT_ELO, MIN_ELO, MAX_ELO } from '../config/eloConstants';

/** Question database entity interface */
export interface Question {
  id: string;
  question_text: string;
  options: Array<{ id: string; text: string }>;
  correct_answer: string;
  explanation: string;
  difficulty_rating: number;
  stem_id?: string;
  clone_number: number;
  times_answered: number;
  times_correct: number;
  is_diagnostic: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Filters for question queries */
export interface QuestionFilters {
  questionTypes?: string[];
  minDifficulty?: number;
  maxDifficulty?: number;
  minEloRating?: number;
  maxEloRating?: number;
  excludeIds?: string[];
  isDiagnostic?: boolean;
}

/**
 * Question model for database operations
 */
class QuestionModel {
  /**
   * Get random questions with optional filters (optimized version)
   * @param count - Number of questions to retrieve
   * @param filters - Optional filters to apply
   * @returns Promise<Question[]> - Array of questions
   */
  static async getRandomQuestions(
    count: number, 
    filters: QuestionFilters = {}
  ): Promise<Question[]> {
    const { 
      questionTypes, 
      minDifficulty, 
      maxDifficulty,
      minEloRating,
      maxEloRating,
      excludeIds, 
      isDiagnostic 
    } = filters;
    
    // First, get total count of matching questions for efficient sampling
    let countQuery = `
      SELECT COUNT(*) as total
      FROM questions 
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    // Apply same filters to count query
    if (questionTypes && questionTypes.length > 0) {
      countQuery += ` AND question_type = ANY($${countParamIndex})`;
      countParams.push(questionTypes);
      countParamIndex++;
    }
    
    if (minDifficulty !== undefined) {
      countQuery += ` AND difficulty_rating >= $${countParamIndex}`;
      countParams.push(minDifficulty);
      countParamIndex++;
    }
    
    if (maxDifficulty !== undefined) {
      countQuery += ` AND difficulty_rating <= $${countParamIndex}`;
      countParams.push(maxDifficulty);
      countParamIndex++;
    }
    
    if (minEloRating !== undefined) {
      countQuery += ` AND elo_rating >= $${countParamIndex}`;
      countParams.push(minEloRating);
      countParamIndex++;
    }
    
    if (maxEloRating !== undefined) {
      countQuery += ` AND elo_rating <= $${countParamIndex}`;
      countParams.push(maxEloRating);
      countParamIndex++;
    }
    
    if (excludeIds && excludeIds.length > 0) {
      countQuery += ` AND id != ALL($${countParamIndex})`;
      countParams.push(excludeIds);
      countParamIndex++;
    }
    
    if (isDiagnostic !== undefined) {
      countQuery += ` AND is_diagnostic = $${countParamIndex}`;
      countParams.push(isDiagnostic);
      countParamIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalQuestions = parseInt(countResult.rows[0].total);
    
    if (totalQuestions === 0) {
      return [];
    }
    
    // Use TABLESAMPLE for better performance on large tables
    // Limit sample size to avoid too many results
    const sampleSize = Math.min(totalQuestions, Math.max(count * 3, 50));
    const samplePercentage = Math.min((sampleSize / totalQuestions) * 100, 100);
    
    let query = `
      SELECT * FROM questions TABLESAMPLE BERNOULLI($1)
      WHERE 1=1
    `;
    const queryParams: any[] = [samplePercentage];
    let paramIndex = 2;
    
    // Apply filters
    if (questionTypes && questionTypes.length > 0) {
      query += ` AND question_type = ANY($${paramIndex})`;
      queryParams.push(questionTypes);
      paramIndex++;
    }
    
    if (minDifficulty !== undefined) {
      query += ` AND difficulty_rating >= $${paramIndex}`;
      queryParams.push(minDifficulty);
      paramIndex++;
    }
    
    if (maxDifficulty !== undefined) {
      query += ` AND difficulty_rating <= $${paramIndex}`;
      queryParams.push(maxDifficulty);
      paramIndex++;
    }
    
    if (minEloRating !== undefined) {
      query += ` AND elo_rating >= $${paramIndex}`;
      queryParams.push(minEloRating);
      paramIndex++;
    }
    
    if (maxEloRating !== undefined) {
      query += ` AND elo_rating <= $${paramIndex}`;
      queryParams.push(maxEloRating);
      paramIndex++;
    }
    
    if (excludeIds && excludeIds.length > 0) {
      query += ` AND id != ALL($${paramIndex})`;
      queryParams.push(excludeIds);
      paramIndex++;
    }
    
    if (isDiagnostic !== undefined) {
      query += ` AND is_diagnostic = $${paramIndex}`;
      queryParams.push(isDiagnostic);
      paramIndex++;
    }
    
    // Limit to desired count
    query += ` LIMIT $${paramIndex}`;
    queryParams.push(count);
    
    try {
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error('Error fetching random questions:', error);
      throw new Error('Failed to fetch questions');
    }
  }

  /**
   * Get a single question by ID
   */
  static async getQuestionById(id: string): Promise<Question | null> {
    const query = `
      SELECT * FROM questions 
      WHERE id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching question by ID:', error);
      throw new Error('Failed to fetch question');
    }
  }

  /**
   * Get questions by type
   */
  static async getQuestionsByType(
    questionType: string, 
    count: number,
    excludeIds: string[] = []
  ): Promise<Question[]> {
    return this.getRandomQuestions(count, {
      questionTypes: [questionType],
      excludeIds
    });
  }

  /**
   * Get questions by difficulty range
   */
  static async getQuestionsByDifficulty(
    minRating: number,
    maxRating: number,
    count: number,
    excludeIds: string[] = []
  ): Promise<Question[]> {
    return this.getRandomQuestions(count, {
      minEloRating: minRating,
      maxEloRating: maxRating,
      excludeIds
    });
  }

  /**
   * Get diagnostic questions
   */
  static async getDiagnosticQuestions(count: number = 44): Promise<Question[]> {
    return this.getRandomQuestions(count, {
      isDiagnostic: true
    });
  }

  /**
   * Get all question types
   */
  static async getQuestionTypes(): Promise<string[]> {
    const query = `
      SELECT DISTINCT question_type 
      FROM questions 
      ORDER BY question_type
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.question_type);
    } catch (error) {
      console.error('Error fetching question types:', error);
      throw new Error('Failed to fetch question types');
    }
  }

  /**
   * Get questions with adaptive selection (basic implementation)
   * This will be enhanced later with ELO calculations
   */
  static async getAdaptiveQuestions(
    userRating: number,
    count: number,
    excludeIds: string[] = []
  ): Promise<Question[]> {
    // Basic adaptive selection: get questions near user's rating
    const difficultyRange = 200; // ±200 points from user rating
    const minDifficulty = Math.max(MIN_ELO, userRating - difficultyRange);
    const maxDifficulty = Math.min(MAX_ELO, userRating + difficultyRange);
    
    return this.getQuestionsByDifficulty(
      minDifficulty,
      maxDifficulty,
      count,
      excludeIds
    );
  }

  /**
   * Update question statistics after an attempt
   */
  static async updateQuestionStats(
    questionId: string,
    wasCorrect: boolean
  ): Promise<void> {
    const query = `
      UPDATE questions 
      SET times_answered = times_answered + 1,
          times_correct = times_correct + $1,
          updated_at = NOW()
      WHERE id = $2
    `;
    
    try {
      await pool.query(query, [wasCorrect ? 1 : 0, questionId]);
    } catch (error) {
      console.error('Error updating question stats:', error);
      throw new Error('Failed to update question statistics');
    }
  }

  /**
   * Get question difficulty distribution
   */
  static async getDifficultyDistribution(): Promise<any[]> {
    const query = `
      SELECT 
        CASE 
          WHEN difficulty_rating < 400 THEN 'Easy'
          WHEN difficulty_rating < 600 THEN 'Medium'
          WHEN difficulty_rating < 700 THEN 'Hard'
          ELSE 'Very Hard'
        END as difficulty_level,
        COUNT(*) as count,
        AVG(difficulty_rating) as avg_rating
      FROM questions
      GROUP BY 
        CASE 
          WHEN difficulty_rating < 400 THEN 'Easy'
          WHEN difficulty_rating < 600 THEN 'Medium'
          WHEN difficulty_rating < 700 THEN 'Hard'
          ELSE 'Very Hard'
        END
      ORDER BY avg_rating
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting difficulty distribution:', error);
      throw new Error('Failed to get difficulty distribution');
    }
  }

  /**
   * Search questions by text content
   */
  static async searchQuestions(
    searchTerm: string,
    limit: number = 20
  ): Promise<Question[]> {
    const query = `
      SELECT * FROM questions 
      WHERE question_text ILIKE $1 
         OR explanation ILIKE $1
      ORDER BY difficulty_rating
      LIMIT $2
    `;
    
    try {
      const result = await pool.query(query, [`%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error searching questions:', error);
      throw new Error('Failed to search questions');
    }
  }

  /**
   * Get questions for practice mode (mixed difficulty and types)
   */
  static async getPracticeQuestions(
    count: number = 20,
    userRating: number = DEFAULT_ELO
  ): Promise<Question[]> {
    // Mix of questions: 60% at user level, 20% easier, 20% harder
    const easyCount = Math.floor(count * 0.2);
    const normalCount = Math.floor(count * 0.6);
    const hardCount = count - easyCount - normalCount;
    
    const promises = [
      // Easier questions
      this.getQuestionsByDifficulty(
        Math.max(200, userRating - 300),
        Math.max(200, userRating - 100),
        easyCount
      ),
      // Normal level questions
      this.getQuestionsByDifficulty(
        Math.max(200, userRating - 100),
        Math.min(800, userRating + 100),
        normalCount
      ),
      // Harder questions
      this.getQuestionsByDifficulty(
        Math.min(800, userRating + 100),
        Math.min(800, userRating + 300),
        hardCount
      )
    ];
    
    try {
      const [easy, normal, hard] = await Promise.all(promises);
      
      // Shuffle the combined array with null checks
      const allQuestions = [
        ...(easy || []), 
        ...(normal || []), 
        ...(hard || [])
      ];
      return this.shuffleArray(allQuestions);
      
    } catch (error) {
      console.error('Error getting practice questions:', error);
      throw new Error('Failed to get practice questions');
    }
  }

  /**
   * Utility function to shuffle an array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }
    return shuffled;
  }
}

export default QuestionModel;