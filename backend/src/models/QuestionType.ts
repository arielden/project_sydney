import pool from '../config/database';

/** Question type database entity interface */
export interface QuestionType {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'mixed' | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

/** Question type with statistics */
export interface QuestionTypeWithStats extends QuestionType {
  question_count: number;
  avg_difficulty: number | null;
  avg_success_rate: number | null;
}

/** Question type grouped by category */
export interface QuestionTypesByCategory {
  category_id: string;
  types: QuestionType[];
}

/**
 * Question Type model for database operations
 */
class QuestionTypeModel {
  /**
   * Get all question types
   * @param activeOnly - Whether to return only active types
   * @returns Promise<QuestionType[]> - Array of question types
   */
  static async getAll(activeOnly: boolean = true): Promise<QuestionType[]> {
    const query = `
      SELECT * FROM question_types 
      ${activeOnly ? 'WHERE is_active = true' : ''}
      ORDER BY display_order ASC, name ASC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching question types:', error);
      throw new Error('Failed to fetch question types');
    }
  }

  /**
   * Get question type by ID
   * @param id - Question type ID
   * @returns Promise<QuestionType | null> - Question type or null if not found
   */
  static async getById(id: string): Promise<QuestionType | null> {
    const query = 'SELECT * FROM question_types WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching question type by ID:', error);
      throw new Error('Failed to fetch question type');
    }
  }

  /**
   * Get question type by name
   * @param name - Question type name
   * @returns Promise<QuestionType | null> - Question type or null if not found
   */
  static async getByName(name: string): Promise<QuestionType | null> {
    const query = 'SELECT * FROM question_types WHERE name = $1';
    
    try {
      const result = await pool.query(query, [name]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching question type by name:', error);
      throw new Error('Failed to fetch question type');
    }
  }

  /**
   * Get question types by category
   * @param categoryId - Category identifier
   * @param activeOnly - Whether to return only active types
   * @returns Promise<QuestionType[]> - Array of question types in category
   */
  static async getByCategory(
    categoryId: string, 
    activeOnly: boolean = true
  ): Promise<QuestionType[]> {
    const query = `
      SELECT * FROM question_types 
      WHERE category_id = $1 ${activeOnly ? 'AND is_active = true' : ''}
      ORDER BY display_order ASC, name ASC
    `;
    
    try {
      const result = await pool.query(query, [categoryId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching question types by category:', error);
      throw new Error('Failed to fetch question types by category');
    }
  }

  /**
   * Get question types grouped by category
   * @param activeOnly - Whether to return only active types
   * @returns Promise<QuestionTypesByCategory[]> - Question types grouped by category
   */
  static async getGroupedByCategory(
    activeOnly: boolean = true
  ): Promise<QuestionTypesByCategory[]> {
    const query = `
      SELECT * FROM question_types 
      ${activeOnly ? 'WHERE is_active = true' : ''}
      ORDER BY category_id ASC, display_order ASC, name ASC
    `;
    
    try {
      const result = await pool.query(query);
      
      // Group by category
      const grouped: Map<string, QuestionType[]> = new Map();
      for (const row of result.rows) {
        const categoryId = row.category_id || 'uncategorized';
        if (!grouped.has(categoryId)) {
          grouped.set(categoryId, []);
        }
        grouped.get(categoryId)!.push(row);
      }
      
      // Convert to array format
      return Array.from(grouped.entries()).map(([category_id, types]) => ({
        category_id,
        types
      }));
    } catch (error) {
      console.error('Error fetching grouped question types:', error);
      throw new Error('Failed to fetch grouped question types');
    }
  }

  /**
   * Get question types with statistics
   * @param activeOnly - Whether to return only active types
   * @returns Promise<QuestionTypeWithStats[]> - Question types with question statistics
   */
  static async getWithStats(
    activeOnly: boolean = true
  ): Promise<QuestionTypeWithStats[]> {
    const query = `
      SELECT 
        qt.*,
        COUNT(q.id) as question_count,
        AVG(q.difficulty_rating)::numeric(10,2) as avg_difficulty,
        CASE 
          WHEN SUM(q.times_answered) > 0 
          THEN (SUM(q.times_correct)::numeric / SUM(q.times_answered) * 100)::numeric(10,2)
          ELSE NULL 
        END as avg_success_rate
      FROM question_types qt
      LEFT JOIN questions q ON q.question_type_id = qt.id
      ${activeOnly ? 'WHERE qt.is_active = true' : ''}
      GROUP BY qt.id
      ORDER BY qt.display_order ASC, qt.name ASC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => ({
        ...row,
        question_count: parseInt(row.question_count, 10),
        avg_difficulty: row.avg_difficulty ? parseFloat(row.avg_difficulty) : null,
        avg_success_rate: row.avg_success_rate ? parseFloat(row.avg_success_rate) : null
      }));
    } catch (error) {
      console.error('Error fetching question types with stats:', error);
      throw new Error('Failed to fetch question types with stats');
    }
  }

  /**
   * Create a new question type
   * @param data - Question type data
   * @returns Promise<QuestionType> - Created question type
   */
  static async create(data: Partial<QuestionType>): Promise<QuestionType> {
    const query = `
      INSERT INTO question_types (name, description, category_id, difficulty_level, is_active, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [
        data.name,
        data.description || null,
        data.category_id || null,
        data.difficulty_level || null,
        data.is_active ?? true,
        data.display_order ?? 0
      ]);
      return result.rows[0];
    } catch (error: any) {
      console.error('Error creating question type:', error);
      if (error.code === '23505') {
        throw new Error('Question type name already exists');
      }
      throw new Error('Failed to create question type');
    }
  }

  /**
   * Update a question type
   * @param id - Question type ID
   * @param data - Fields to update
   * @returns Promise<QuestionType | null> - Updated question type or null if not found
   */
  static async update(id: string, data: Partial<QuestionType>): Promise<QuestionType | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Build dynamic update query
    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.category_id !== undefined) {
      fields.push(`category_id = $${paramIndex++}`);
      values.push(data.category_id);
    }
    if (data.difficulty_level !== undefined) {
      fields.push(`difficulty_level = $${paramIndex++}`);
      values.push(data.difficulty_level);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }
    if (data.display_order !== undefined) {
      fields.push(`display_order = $${paramIndex++}`);
      values.push(data.display_order);
    }
    
    if (fields.length === 0) {
      return this.getById(id);
    }
    
    values.push(id);
    const query = `
      UPDATE question_types 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error updating question type:', error);
      if (error.code === '23505') {
        throw new Error('Question type name already exists');
      }
      throw new Error('Failed to update question type');
    }
  }

  /**
   * Delete a question type
   * @param id - Question type ID
   * @returns Promise<boolean> - True if deleted, false if not found
   */
  static async delete(id: string): Promise<boolean> {
    // First check if any questions reference this type
    const checkQuery = 'SELECT COUNT(*) FROM questions WHERE question_type_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    const questionCount = parseInt(checkResult.rows[0].count, 10);
    
    if (questionCount > 0) {
      throw new Error(`Cannot delete question type: ${questionCount} questions reference this type`);
    }
    
    const query = 'DELETE FROM question_types WHERE id = $1 RETURNING id';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting question type:', error);
      throw new Error('Failed to delete question type');
    }
  }

  /**
   * Get distinct categories
   * @returns Promise<string[]> - Array of unique category IDs
   */
  static async getCategories(): Promise<string[]> {
    const query = `
      SELECT DISTINCT category_id 
      FROM question_types 
      WHERE category_id IS NOT NULL AND is_active = true
      ORDER BY category_id ASC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.category_id);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get question types for a specific difficulty level
   * @param difficultyLevel - The difficulty level to filter by
   * @returns Promise<QuestionType[]> - Array of question types at that difficulty
   */
  static async getByDifficultyLevel(
    difficultyLevel: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<QuestionType[]> {
    const query = `
      SELECT * FROM question_types 
      WHERE difficulty_level = $1 AND is_active = true
      ORDER BY category_id ASC, display_order ASC, name ASC
    `;
    
    try {
      const result = await pool.query(query, [difficultyLevel]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching question types by difficulty:', error);
      throw new Error('Failed to fetch question types by difficulty');
    }
  }
}

export default QuestionTypeModel;
