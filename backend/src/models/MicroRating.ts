import pool from '../config/database';

// SAT Math Categories - Complete 22 categories from official College Board taxonomy
const SAT_MATH_CATEGORIES = {
  // Algebra (9 categories)
  'linear_equations_one_variable': 'Linear Equations (One Variable)',
  'linear_equations_systems': 'Linear Equations (Systems)',
  'linear_inequalities': 'Linear Inequalities',
  'functions_notation': 'Functions and Notation',
  'functions_linear': 'Linear Functions',
  'functions_quadratic': 'Quadratic Functions',
  'functions_exponential': 'Exponential Functions',
  'functions_polynomial': 'Polynomial Functions',
  'functions_rational': 'Rational Functions',
  
  // Advanced Math (7 categories)
  'quadratic_equations': 'Quadratic Equations',
  'polynomial_operations': 'Polynomial Operations',
  'rational_expressions': 'Rational Expressions',
  'radical_expressions': 'Radical Expressions and Equations',
  'exponential_equations': 'Exponential Equations',
  'logarithmic_functions': 'Logarithmic Functions',
  'trigonometric_functions': 'Trigonometric Functions',
  
  // Problem Solving and Data Analysis (4 categories)
  'ratios_proportions': 'Ratios and Proportions',
  'percentages': 'Percentages',
  'unit_conversion': 'Unit Conversion and Rates',
  'data_interpretation': 'Data Interpretation',
  
  // Geometry and Trigonometry (2 categories)
  'coordinate_geometry': 'Coordinate Geometry',
  'trigonometry_applications': 'Trigonometry Applications'
} as const;

const DEFAULT_ELO_RATING = 1200;

export interface MicroRating {
  id: string;
  user_id: string;
  category: string;
  category_name?: string;
  elo_rating: number;
  attempts: number;
  correct_count?: number;
  success_rate?: number;
  last_updated?: Date;
  created_at: Date;
  updated_at: Date;
}

class MicroRatingModel {
  /**
   * Initialize all 22 micro-rating categories for a new user
   */
  static async initializeUserMicroRatings(userId: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertPromises = Object.keys(SAT_MATH_CATEGORIES).map(categoryId =>
        client.query(
          `INSERT INTO micro_ratings (user_id, category, elo_rating, attempts)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, category) DO NOTHING`,
          [userId, categoryId, DEFAULT_ELO_RATING, 0]
        )
      );
      
      await Promise.all(insertPromises);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error initializing micro ratings:', error);
      throw new Error('Failed to initialize micro ratings');
    } finally {
      client.release();
    }
  }

  /**
   * Get a specific user's rating for a category
   */
  static async getUserCategoryRating(userId: string, categoryId: string): Promise<number> {
    const query = `
      SELECT elo_rating 
      FROM micro_ratings 
      WHERE user_id = $1 AND category = $2
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
    
    const updateQuery = `
      UPDATE micro_ratings 
      SET elo_rating = $3, updated_at = NOW()
      WHERE user_id = $1 AND category = $2
    `;
    
    try {
      await poolOrClient.query(updateQuery, [userId, categoryId, newRating]);
      
      // Also increment attempts count
      await poolOrClient.query(
        'UPDATE micro_ratings SET attempts = attempts + 1 WHERE user_id = $1 AND category = $2',
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
    const query = `
      SELECT 
        category as category_id,
        elo_rating,
        attempts,
        -- Calculate correct_count from question_attempts table
        COALESCE(
          (SELECT COUNT(*) FROM question_attempts qa 
           JOIN questions q ON qa.question_id = q.id 
           WHERE qa.user_id = $1 AND q.category_id = mr.category AND qa.is_correct = true), 0
        ) as correct_count,
        CASE 
          WHEN attempts > 0 
          THEN ROUND((
            COALESCE(
              (SELECT COUNT(*) FROM question_attempts qa 
               JOIN questions q ON qa.question_id = q.id 
               WHERE qa.user_id = $1 AND q.category_id = mr.category AND qa.is_correct = true), 0
            )::DECIMAL / attempts
          ) * 100, 2)
          ELSE 0 
        END as success_rate,
        last_updated as last_attempt_date,
        updated_at
      FROM micro_ratings mr
      WHERE user_id = $1
      ORDER BY category
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      
      // If no ratings exist, initialize them
      if (result.rows.length === 0) {
        await this.initializeUserMicroRatings(userId);
        // Return initialized ratings
        return Object.keys(SAT_MATH_CATEGORIES).map(categoryId => ({
          category_id: categoryId,
          category_name: SAT_MATH_CATEGORIES[categoryId as keyof typeof SAT_MATH_CATEGORIES],
          elo_rating: DEFAULT_ELO_RATING,
          attempts: 0,
          correct_count: 0,
          success_rate: 0,
          last_attempt_date: null,
          updated_at: new Date()
        }));
      }
      
      // Add category names
      return result.rows.map(row => ({
        ...row,
        category_name: SAT_MATH_CATEGORIES[row.category_id as keyof typeof SAT_MATH_CATEGORIES] || row.category_id
      }));
    } catch (error) {
      console.error('Error getting user all category ratings:', error);
      throw new Error('Failed to get user category ratings');
    }
  }

  /**
   * Get user's statistics for a specific category
   */
  static async getUserCategoryStats(userId: string, categoryId: string): Promise<any> {
    const query = `
      SELECT 
        attempts,
        COALESCE(
          (SELECT COUNT(*) FROM question_attempts qa 
           JOIN questions q ON qa.question_id = q.id 
           WHERE qa.user_id = $1 AND q.category_id = $2 AND qa.is_correct = true), 0
        ) as correct_count,
        CASE 
          WHEN attempts > 0 
          THEN ROUND((
            COALESCE(
              (SELECT COUNT(*) FROM question_attempts qa 
               JOIN questions q ON qa.question_id = q.id 
               WHERE qa.user_id = $1 AND q.category_id = $2 AND qa.is_correct = true), 0
            )::DECIMAL / attempts
          ) * 100, 2)
          ELSE 0 
        END as success_rate,
        last_updated as last_attempt_date,
        created_at,
        updated_at
      FROM micro_ratings 
      WHERE user_id = $1 AND category = $2
    `;
    
    try {
      const result = await pool.query(query, [userId, categoryId]);
      return result.rows[0] || {
        attempts: 0,
        correct_count: 0,
        success_rate: 0,
        last_attempt_date: null,
        created_at: null,
        updated_at: null
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
    const query = `
      SELECT 
        mr.elo_rating,
        mr.attempts,
        COALESCE(
          (SELECT COUNT(*) FROM question_attempts qa 
           JOIN questions q ON qa.question_id = q.id 
           WHERE qa.user_id = mr.user_id AND q.category_id = $1 AND qa.is_correct = true), 0
        ) as correct_count,
        CASE 
          WHEN mr.attempts > 0 
          THEN ROUND((
            COALESCE(
              (SELECT COUNT(*) FROM question_attempts qa 
               JOIN questions q ON qa.question_id = q.id 
               WHERE qa.user_id = mr.user_id AND q.category_id = $1 AND qa.is_correct = true), 0
            )::DECIMAL / mr.attempts
          ) * 100, 2)
          ELSE 0 
        END as success_rate,
        u.username,
        u.id as user_id,
        mr.updated_at
      FROM micro_ratings mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.category = $1 AND mr.attempts > 0
      ORDER BY mr.elo_rating DESC
      LIMIT $2
    `;
    
    try {
      const result = await pool.query(query, [categoryId, limit]);
      return result.rows;
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
    
    try {
      // Update attempt count and correct count if applicable
      const updateQuery = `
        UPDATE micro_ratings 
        SET 
          attempts = attempts + 1,
          last_updated = NOW(),
          updated_at = NOW()
        WHERE user_id = $1 AND category = $2
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