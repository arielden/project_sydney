import pool from '../config/database';

// SAT Math Categories - 20 official SAT math categories (numeric IDs)
// Mapped to database category table IDs
const SAT_MATH_CATEGORIES = {
  1: 'Percentages',
  2: 'Areas and Volumes',
  3: 'Trig',
  4: 'Quadratic Equations',
  5: 'Special Triangles',
  6: 'Exponential Equations',
  7: 'Similar Triangles',
  8: 'Geometry Basics',
  9: 'Arcs',
  10: 'Circle Equations',
  11: 'Polynomials',
  12: 'Fractions',
  13: 'Exponents',
  14: 'Means and Medians',
  15: 'Probability and Statistics',
  16: 'Linear Equations',
  17: 'Unit Conversions',
  18: 'Function Transformations',
  19: 'Systems of Equations',
  20: 'Misc: Functions/Single Variable Equations'
} as const;

// Map old string IDs to numeric IDs for backward compatibility
const LEGACY_CATEGORY_MAP: Record<string, number> = {
  'problem-solving-percentages': 1,
  'geometry-measurement': 2,
  'advanced-trigonometry': 3,
  'algebra-quadratic': 4,
  'geometry-triangles': 5,
  'advanced-exponential': 6,
  'geometry-triangles-similar': 7,
  'geometry-fundamentals': 8,
  'geometry-circles': 9,
  'geometry-coordinate': 10,
  'algebra-polynomial': 11,
  'algebra-rational': 12,
  'algebra-exponents': 13,
  'statistics-central-tendency': 14,
  'statistics-probability': 15,
  'algebra-linear': 16,
  'problem-solving-units': 17,
  'algebra-functions': 18,
  'algebra-systems': 19,
  'algebra-miscellaneous': 20
};

const DEFAULT_ELO_RATING = 1200;

type CategoryColumnName = 'category_id' | 'category';

export interface MicroRating {
  id: string;
  user_id: string;
  category_id: number;
  category_name?: string;
  elo_rating: number;
  attempts: number;
  attempts_count?: number;
  correct_count?: number;
  success_rate?: number;
  last_attempt_date?: Date | null;
  created_at: Date;
  updated_at: Date;
}

class MicroRatingModel {
  private static categoryColumn: CategoryColumnName | null = null;
  private static questionCategoryColumn: CategoryColumnName | null = null;
  private static questionCategoryColumnResolved = false;
  private static categoryColumnResolved = false;
  private static subCategoryMetadataResolved = false;
  private static subCategoryExists: boolean | null = null;
  private static subCategoryIsNullable: boolean | null = null;

  private static async resolveCategoryColumn(): Promise<CategoryColumnName> {
    if (this.categoryColumnResolved) {
      return (this.categoryColumn ?? 'category') as CategoryColumnName;
    }

    try {
      const result = await pool.query<{
        column_name: 'category_id' | 'category';
      }>(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'micro_ratings'
            AND column_name IN ('category_id', 'category')
          ORDER BY CASE WHEN column_name = 'category_id' THEN 0 ELSE 1 END
          LIMIT 1
        `
      );

      this.categoryColumn = result.rows[0]?.column_name === 'category_id' ? 'category_id' : 'category';
    } catch (error) {
      console.error('Error resolving micro_ratings category column:', error);
      this.categoryColumn = 'category';
    }

    this.categoryColumnResolved = true;

    return (this.categoryColumn ?? 'category') as CategoryColumnName;
  }

  private static async getCategoryColumn(): Promise<CategoryColumnName> {
    return this.resolveCategoryColumn();
  }

  private static async resolveQuestionCategoryColumn(): Promise<CategoryColumnName | null> {
    if (this.questionCategoryColumnResolved) {
      return this.questionCategoryColumn;
    }

    try {
      const result = await pool.query<{
        column_name: 'category_id' | 'category';
      }>(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'questions'
            AND column_name IN ('category_id', 'category')
          ORDER BY CASE WHEN column_name = 'category_id' THEN 0 ELSE 1 END
          LIMIT 1
        `
      );

      if (result.rows.length === 0) {
        console.warn('Questions table missing category column; micro rating stats will be limited.');
        this.questionCategoryColumn = null;
      } else {
        this.questionCategoryColumn = result.rows[0]?.column_name === 'category_id' ? 'category_id' : 'category';
      }
    } catch (error) {
      console.error('Error resolving questions category column:', error);
      this.questionCategoryColumn = null;
    }

    this.questionCategoryColumnResolved = true;

    return this.questionCategoryColumn;
  }

  private static async getQuestionCategoryColumn(): Promise<CategoryColumnName | null> {
    return this.resolveQuestionCategoryColumn();
  }

  private static async resolveSubCategoryMetadata(): Promise<{ exists: boolean; isNullable: boolean }> {
    if (this.subCategoryMetadataResolved) {
      return {
        exists: this.subCategoryExists ?? false,
        isNullable: this.subCategoryIsNullable ?? true
      };
    }

    try {
      const result = await pool.query<{
        is_nullable: 'YES' | 'NO';
      }>(
        `
          SELECT is_nullable
          FROM information_schema.columns
          WHERE table_name = 'micro_ratings'
            AND column_name = 'sub_category'
            AND table_schema = 'public'
          LIMIT 1
        `
      );

      const columnInfo = result.rows[0];

      if (columnInfo) {
        this.subCategoryExists = true;
        this.subCategoryIsNullable = columnInfo.is_nullable === 'YES';
      } else {
        this.subCategoryExists = false;
        this.subCategoryIsNullable = true;
      }
    } catch (error) {
      console.error('Error resolving micro_ratings sub_category column:', error);
      this.subCategoryExists = false;
      this.subCategoryIsNullable = true;
    }

    this.subCategoryMetadataResolved = true;

    return {
      exists: this.subCategoryExists ?? false,
      isNullable: this.subCategoryIsNullable ?? true
    };
  }

  private static async getSubCategoryMetadata(): Promise<{ exists: boolean; isNullable: boolean }> {
    return this.resolveSubCategoryMetadata();
  }

  /**
   * Initialize all 22 micro-rating categories for a new user
   */
  static async initializeUserMicroRatings(userId: string): Promise<void> {
    const categoryIds = Object.keys(SAT_MATH_CATEGORIES).map(k => Number(k));
    
    try {
      const insertQuery = `
        INSERT INTO micro_ratings (user_id, category_id, elo_rating, attempts)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, category_id) DO NOTHING
      `;
      
      const insertPromises = categoryIds.map(categoryId => {
        return pool.query(insertQuery, [userId, categoryId, DEFAULT_ELO_RATING, 0]);
      });
      
      await Promise.all(insertPromises);
    } catch (error) {
      console.error('Error initializing micro ratings:', error);
      throw new Error('Failed to initialize micro ratings');
    }
  }

  /**
   * Get a specific user's rating for a category
   */
  static async getUserCategoryRating(userId: string, categoryId: string): Promise<number> {
    const categoryColumn = await this.getCategoryColumn();
    const query = `
      SELECT elo_rating 
      FROM micro_ratings 
      WHERE user_id = $1 AND ${categoryColumn} = $2
    `;
    
    try {
      const result = await pool.query(query, [userId, categoryId]);
      
      if (result.rows.length === 0) {
        // Initialize if not exists and return default
        await this.initializeUserMicroRatings(userId);
        return DEFAULT_ELO_RATING;
      }
      
      return result.rows[0]?.elo_rating || DEFAULT_ELO_RATING;
    } catch (error) {
      console.error('Error getting user category rating:', error);
      return DEFAULT_ELO_RATING;
    }
  }

  /**
   * Update a user's rating for a specific category
   */
  static async updateUserCategoryRating(
    userId: string, 
    categoryId: string, 
    newRating: number,
    client?: any
  ): Promise<void> {
    const poolOrClient = client || pool;
    const categoryColumn = await this.getCategoryColumn();
    
    const updateQuery = `
      UPDATE micro_ratings 
      SET elo_rating = $3, updated_at = NOW()
      WHERE user_id = $1 AND ${categoryColumn} = $2
    `;
    
    try {
      await poolOrClient.query(updateQuery, [userId, categoryId, newRating]);
      
      // Also increment attempts count
      await poolOrClient.query(
        `UPDATE micro_ratings SET attempts = attempts + 1 WHERE user_id = $1 AND ${categoryColumn} = $2`,
        [userId, categoryId]
      );
    } catch (error) {
      console.error('Error updating user category rating:', error);
      throw new Error('Failed to update category rating');
    }
  }

  /**
   * Get all category ratings for a user
   */
  static async getUserAllCategoryRatings(userId: string): Promise<any[]> {
    const categoryColumn = await this.getCategoryColumn();
    const questionCategoryColumn = await this.getQuestionCategoryColumn();
    const { exists: hasSubCategory } = await this.getSubCategoryMetadata();
    const categorySelector = `mr.${categoryColumn}`;

    const query = questionCategoryColumn
      ? `
        WITH category_stats AS (
          SELECT 
            q.${questionCategoryColumn} AS category_id,
            COUNT(*) FILTER (WHERE qa.is_correct) AS correct_count,
            COUNT(*) AS total_attempts,
            MAX(qa.answered_at) AS last_attempt_date
          FROM question_attempts qa
          JOIN questions q ON qa.question_id = q.id
          WHERE qa.user_id = $1
          GROUP BY q.${questionCategoryColumn}
        )
        SELECT 
          ${categorySelector} AS category_id,
          ${hasSubCategory ? 'mr.sub_category,' : ''}
          mr.elo_rating,
          mr.attempts,
          mr.attempts AS attempts_count,
          COALESCE(cs.correct_count, 0) AS correct_count,
          CASE 
            WHEN mr.attempts > 0 
            THEN ROUND((COALESCE(cs.correct_count, 0)::DECIMAL / mr.attempts), 4)
            ELSE 0 
          END AS success_rate,
          cs.last_attempt_date,
          mr.updated_at
        FROM micro_ratings mr
        LEFT JOIN category_stats cs ON cs.category_id = ${categorySelector}
        WHERE mr.user_id = $1
        ORDER BY ${categorySelector}
      `
      : `
        SELECT 
          ${categorySelector} AS category_id,
          ${hasSubCategory ? 'mr.sub_category,' : ''}
          mr.elo_rating,
          mr.attempts,
          mr.attempts AS attempts_count,
          0 AS correct_count,
          0::DECIMAL AS success_rate,
          NULL::TIMESTAMP AS last_attempt_date,
          mr.updated_at
        FROM micro_ratings mr
        WHERE mr.user_id = $1
        ORDER BY ${categorySelector}
      `;
    
    try {
      const result = await pool.query(query, [userId]);
      
      // If no ratings exist, initialize them
      if (result.rows.length === 0) {
        await this.initializeUserMicroRatings(userId);
        // Return initialized ratings (convert numeric keys to numbers)
        return (Object.keys(SAT_MATH_CATEGORIES) as unknown as (keyof typeof SAT_MATH_CATEGORIES)[]).map(categoryId => {
          const numericId = Number(categoryId);
          return {
            category_id: numericId,
            category_name: SAT_MATH_CATEGORIES[categoryId],
            ...(hasSubCategory ? { sub_category: categoryId } : {}),
            elo_rating: DEFAULT_ELO_RATING,
            attempts: 0,
            attempts_count: 0,
            correct_count: 0,
            success_rate: 0,
            last_attempt_date: null,
            updated_at: new Date()
          };
        });
      }
      
      // Add category names
      return result.rows.map(row => {
        const attempts = typeof row.attempts === 'number' ? row.attempts : Number(row.attempts ?? 0);
        const attemptsCount = typeof row.attempts_count === 'number'
          ? row.attempts_count
          : Number(row.attempts_count ?? 0);
        const correctCount = typeof row.correct_count === 'number'
          ? row.correct_count
          : Number(row.correct_count ?? 0);
        const eloRating = typeof row.elo_rating === 'number'
          ? row.elo_rating
          : Number(row.elo_rating ?? DEFAULT_ELO_RATING);
        const successRate = row.success_rate !== null ? Number(row.success_rate) : 0;

        return {
          category_id: row.category_id,
          elo_rating: Number.isNaN(eloRating) ? DEFAULT_ELO_RATING : eloRating,
          attempts: Number.isNaN(attempts) ? 0 : attempts,
          attempts_count: Number.isNaN(attemptsCount) ? (Number.isNaN(attempts) ? 0 : attempts) : attemptsCount,
          correct_count: Number.isNaN(correctCount) ? 0 : correctCount,
          success_rate: Number.isNaN(successRate) ? 0 : successRate,
          last_attempt_date: row.last_attempt_date,
          updated_at: row.updated_at,
          category_name: SAT_MATH_CATEGORIES[row.category_id as keyof typeof SAT_MATH_CATEGORIES] || row.category_id,
          ...(hasSubCategory ? { sub_category: row.sub_category ?? row.category_id } : {})
        };
      });
    } catch (error) {
      console.error('Error getting user all category ratings:', error);
      throw new Error('Failed to get user category ratings');
    }
  }

  /**
   * Get user's statistics for a specific category
   */
  static async getUserCategoryStats(userId: string, categoryId: string): Promise<any> {
    const categoryColumn = await this.getCategoryColumn();
    const questionCategoryColumn = await this.getQuestionCategoryColumn();
    const questionCategorySelector = questionCategoryColumn ? `q.${questionCategoryColumn}` : null;
    const query = questionCategorySelector
      ? `
        SELECT 
          attempts,
          attempts AS attempts_count,
          COALESCE(
            (SELECT COUNT(*) FROM question_attempts qa 
             JOIN questions q ON qa.question_id = q.id 
             WHERE qa.user_id = $1 AND ${questionCategorySelector} = $2 AND qa.is_correct = true), 0
          ) as correct_count,
          CASE 
            WHEN attempts > 0 
            THEN ROUND((
              COALESCE(
                (SELECT COUNT(*) FROM question_attempts qa 
                 JOIN questions q ON qa.question_id = q.id 
                 WHERE qa.user_id = $1 AND ${questionCategorySelector} = $2 AND qa.is_correct = true), 0
              )::DECIMAL / attempts
            ), 4)
            ELSE 0 
          END as success_rate,
          (
            SELECT MAX(qa.answered_at)
            FROM question_attempts qa 
            JOIN questions q ON qa.question_id = q.id 
            WHERE qa.user_id = $1 AND ${questionCategorySelector} = $2
          ) as last_attempt_date,
          created_at,
          updated_at
        FROM micro_ratings 
        WHERE user_id = $1 AND ${categoryColumn} = $2
      `
      : `
        SELECT 
          attempts,
          attempts AS attempts_count,
          0 AS correct_count,
          0::DECIMAL AS success_rate,
          NULL::TIMESTAMP AS last_attempt_date,
          created_at,
          updated_at
        FROM micro_ratings 
        WHERE user_id = $1 AND ${categoryColumn} = $2
      `;
    
    try {
      const result = await pool.query(query, [userId, categoryId]);
      const stats = result.rows[0];

      if (!stats) {
        return {
          attempts: 0,
          attempts_count: 0,
          correct_count: 0,
          success_rate: 0,
          last_attempt_date: null,
          created_at: null,
          updated_at: null
        };
      }

      return {
        ...stats,
        success_rate: stats.success_rate !== null ? parseFloat(stats.success_rate) : 0
      };
    } catch (error) {
      console.error('Error getting user category stats:', error);
      throw new Error('Failed to get user category stats');
    }
  }

  /**
   * Get top performers in a category
   */
  static async getTopPerformersInCategory(categoryId: string, limit: number = 10): Promise<any[]> {
    const categoryColumn = await this.getCategoryColumn();
    const questionCategoryColumn = await this.getQuestionCategoryColumn();
    const questionCategorySelector = questionCategoryColumn ? `q.${questionCategoryColumn}` : null;
    const query = questionCategorySelector
      ? `
        SELECT 
          mr.elo_rating,
          mr.attempts,
          mr.attempts AS attempts_count,
          COALESCE(
            (SELECT COUNT(*) FROM question_attempts qa 
             JOIN questions q ON qa.question_id = q.id 
             WHERE qa.user_id = mr.user_id AND ${questionCategorySelector} = $1 AND qa.is_correct = true), 0
          ) as correct_count,
          CASE 
            WHEN mr.attempts > 0 
            THEN ROUND((
              COALESCE(
                (SELECT COUNT(*) FROM question_attempts qa 
                 JOIN questions q ON qa.question_id = q.id 
                 WHERE qa.user_id = mr.user_id AND ${questionCategorySelector} = $1 AND qa.is_correct = true), 0
              )::DECIMAL / mr.attempts
            ), 4)
            ELSE 0 
          END as success_rate,
          u.username,
          u.id as user_id,
          mr.updated_at
        FROM micro_ratings mr
        JOIN users u ON mr.user_id = u.id
        WHERE mr.${categoryColumn} = $1 AND mr.attempts > 0
        ORDER BY mr.elo_rating DESC
        LIMIT $2
      `
      : `
        SELECT 
          mr.elo_rating,
          mr.attempts,
          mr.attempts AS attempts_count,
          0 AS correct_count,
          0::DECIMAL AS success_rate,
          u.username,
          u.id as user_id,
          mr.updated_at
        FROM micro_ratings mr
        JOIN users u ON mr.user_id = u.id
        WHERE mr.${categoryColumn} = $1 AND mr.attempts > 0
        ORDER BY mr.elo_rating DESC
        LIMIT $2
      `;
    
    try {
      const result = await pool.query(query, [categoryId, limit]);
      return result.rows.map(row => ({
        ...row,
        success_rate: row.success_rate !== null ? parseFloat(row.success_rate) : 0
      }));
    } catch (error) {
      console.error('Error getting top performers in category:', error);
      throw new Error('Failed to get top performers');
    }
  }

  /**
   * Record a correct or incorrect attempt for a category
   */
  static async recordAttempt(
    userId: string, 
    categoryId: string, 
    isCorrect: boolean,
    client?: any
  ): Promise<void> {
    const poolOrClient = client || pool;
    const categoryColumn = await this.getCategoryColumn();
    
    try {
      // Update attempt count and correct count if applicable
      const updateQuery = `
        UPDATE micro_ratings 
        SET 
          attempts = attempts + 1,
          updated_at = NOW()
        WHERE user_id = $1 AND ${categoryColumn} = $2
      `;
      
      await poolOrClient.query(updateQuery, [userId, categoryId]);
    } catch (error) {
      console.error('Error recording attempt for category:', error);
      throw new Error('Failed to record category attempt');
    }
  }

  /**
   * Get user's performance summary across all categories
   */
  static async getUserPerformanceSummary(userId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_categories,
        AVG(elo_rating) as avg_rating,
        SUM(attempts) as total_attempts,
        COALESCE(
          (SELECT COUNT(*) FROM question_attempts qa 
           WHERE qa.user_id = $1 AND qa.is_correct = true), 0
        ) as total_correct,
        CASE 
          WHEN SUM(attempts) > 0 
          THEN ROUND((
            COALESCE(
              (SELECT COUNT(*) FROM question_attempts qa 
               WHERE qa.user_id = $1 AND qa.is_correct = true), 0
            )::DECIMAL / SUM(attempts)
          ) * 100, 2)
          ELSE 0 
        END as overall_success_rate,
        MAX(elo_rating) as highest_rating,
        MIN(elo_rating) as lowest_rating
      FROM micro_ratings 
      WHERE user_id = $1
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0] || {
        total_categories: 0,
        avg_rating: DEFAULT_ELO_RATING,
        total_attempts: 0,
        total_correct: 0,
        overall_success_rate: 0,
        highest_rating: DEFAULT_ELO_RATING,
        lowest_rating: DEFAULT_ELO_RATING
      };
    } catch (error) {
      console.error('Error getting user performance summary:', error);
      throw new Error('Failed to get user performance summary');
    }
  }
}

export { SAT_MATH_CATEGORIES };
export default MicroRatingModel;