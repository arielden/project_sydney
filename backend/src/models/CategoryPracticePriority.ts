import pool from '../config/database';

export interface CategoryPracticePriority {
  id: number;
  user_id: number;
  category_id: number;
  selection_weight: number;
  questions_needed: number;
  elo_deficit: number;
  accuracy_deficit: number;
  last_calculated_at: Date;
  next_practice_recommended: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryPriorityUpdate {
  user_id: number;
  category_id: number;
  selection_weight: number;
  questions_needed: number;
  elo_deficit: number;
  accuracy_deficit: number;
  next_practice_recommended?: Date;
}

export class CategoryPracticePriorityModel {
  /**
   * Upsert category priority
   */
  static async upsert(data: CategoryPriorityUpdate): Promise<CategoryPracticePriority> {
    const query = `
      INSERT INTO category_practice_priority 
        (user_id, category_id, selection_weight, questions_needed, elo_deficit, accuracy_deficit, next_practice_recommended, last_calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id, category_id) 
      DO UPDATE SET 
        selection_weight = $3,
        questions_needed = $4,
        elo_deficit = $5,
        accuracy_deficit = $6,
        next_practice_recommended = $7,
        last_calculated_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;
    const result = await pool.query(query, [
      data.user_id,
      data.category_id,
      data.selection_weight,
      data.questions_needed,
      data.elo_deficit,
      data.accuracy_deficit,
      data.next_practice_recommended || null
    ]);
    return result.rows[0];
  }

  /**
   * Get top priority categories for a user
   */
  static async getTopPriorities(userId: number, limit: number = 3) {
    const query = `
      SELECT 
        cpp.*,
        c.name as category_name,
        mr.elo_rating as current_elo,
        mr.success_rate as current_accuracy
      FROM category_practice_priority cpp
      INNER JOIN categories c ON cpp.category_id = c.id
      LEFT JOIN micro_ratings mr ON cpp.user_id = mr.user_id AND cpp.category_id = mr.category_id
      WHERE cpp.user_id = $1
      ORDER BY cpp.selection_weight DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Calculate and update priorities for all categories for a user
   */
  static async recalculateAllPriorities(userId: number): Promise<void> {
    const query = `
      WITH category_stats AS (
        SELECT 
          mr.category_id,
          mr.elo_rating,
          mr.success_rate,
          mr.attempts,
          COALESCE(uqh_stats.mastered_count, 0) as questions_mastered,
          cat_count.total_questions as questions_available
        FROM micro_ratings mr
        LEFT JOIN (
          SELECT category_id, COUNT(*) as mastered_count
          FROM user_question_history
          WHERE user_id = $1 AND is_retired = true
          GROUP BY category_id
        ) uqh_stats ON mr.category_id = uqh_stats.category_id
        LEFT JOIN (
          SELECT qc.category_id, COUNT(DISTINCT q.id) as total_questions
          FROM question_categories qc
          INNER JOIN questions q ON qc.question_id = q.id
          WHERE q.is_active = true
          GROUP BY qc.category_id
        ) cat_count ON mr.category_id = cat_count.category_id
        WHERE mr.user_id = $1
      ),
      priority_calc AS (
        SELECT 
          category_id,
          -- Calculate weight based on:
          -- 1. Low ELO = higher weight
          -- 2. Low success rate = higher weight
          -- 3. More questions available = higher weight
          CASE 
            WHEN elo_rating < 1200 THEN 3.0
            WHEN elo_rating < 1400 THEN 2.0
            ELSE 1.0
          END * 
          CASE 
            WHEN success_rate < 50 THEN 2.5
            WHEN success_rate < 70 THEN 1.5
            ELSE 0.5
          END as selection_weight,
          GREATEST(0, questions_available - questions_mastered) as questions_needed,
          1500 - elo_rating as elo_deficit,
          80.0 - success_rate as accuracy_deficit
        FROM category_stats
      )
      INSERT INTO category_practice_priority 
        (user_id, category_id, selection_weight, questions_needed, elo_deficit, accuracy_deficit, last_calculated_at)
      SELECT 
        $1,
        category_id,
        selection_weight,
        questions_needed,
        elo_deficit,
        accuracy_deficit,
        NOW()
      FROM priority_calc
      ON CONFLICT (user_id, category_id) 
      DO UPDATE SET 
        selection_weight = EXCLUDED.selection_weight,
        questions_needed = EXCLUDED.questions_needed,
        elo_deficit = EXCLUDED.elo_deficit,
        accuracy_deficit = EXCLUDED.accuracy_deficit,
        last_calculated_at = NOW(),
        updated_at = NOW()
    `;
    await pool.query(query, [userId]);
  }

  /**
   * Get all priorities for a user
   */
  static async getAllForUser(userId: number) {
    const query = `
      SELECT 
        cpp.*,
        c.name as category_name
      FROM category_practice_priority cpp
      INNER JOIN categories c ON cpp.category_id = c.id
      WHERE cpp.user_id = $1
      ORDER BY cpp.selection_weight DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Delete priorities for a user
   */
  static async deleteForUser(userId: number): Promise<void> {
    const query = `DELETE FROM category_practice_priority WHERE user_id = $1`;
    await pool.query(query, [userId]);
  }
}

export default CategoryPracticePriorityModel;
