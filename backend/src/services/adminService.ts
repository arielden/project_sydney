import pool from '../config/database';
import { hashPassword } from '../utils/helpers';

/**
 * Tables that are manageable through admin interface
 * Excludes system tables and sensitive tables
 */
const MANAGEABLE_TABLES = [
  'users',
  'questions',
  'question_types',
  'question_attempts',
  'quiz_sessions',
  'player_ratings',
  'micro_ratings',
  'admin_activity_log'
];

/**
 * Fields to exclude from display/editing for security
 */
const EXCLUDED_FIELDS: Record<string, string[]> = {
  users: ['password_hash']
};

/**
 * Fields that should be read-only (auto-generated)
 */
const READ_ONLY_FIELDS: Record<string, string[]> = {
  '*': ['id', 'created_at', 'updated_at']
};

export interface TableSchema {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_table?: string;
  foreign_column?: string;
}

export interface TableInfo {
  name: string;
  recordCount: number;
  columns: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AdminService {
  /**
   * Get list of all manageable tables with record counts
   */
  async getTableList(): Promise<TableInfo[]> {
    const tables: TableInfo[] = [];

    for (const tableName of MANAGEABLE_TABLES) {
      try {
        // Get record count
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const recordCount = parseInt(countResult.rows[0].count, 10);

        // Get column names
        const columnsResult = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);

        const columns = columnsResult.rows
          .map(row => row.column_name)
          .filter(col => !EXCLUDED_FIELDS[tableName]?.includes(col));

        tables.push({
          name: tableName,
          recordCount,
          columns
        });
      } catch (error) {
        console.error(`Error getting info for table ${tableName}:`, error);
      }
    }

    return tables;
  }

  /**
   * Get detailed schema for a specific table
   */
  async getTableSchema(tableName: string): Promise<TableSchema[]> {
    if (!MANAGEABLE_TABLES.includes(tableName)) {
      throw new Error(`Table '${tableName}' is not manageable`);
    }

    // Get column information
    const columnsQuery = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = $1 
          AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_name = $1 AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `;

    const columnsResult = await pool.query(columnsQuery, [tableName]);

    // Get foreign key relationships
    const fkQuery = `
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
    `;

    const fkResult = await pool.query(fkQuery, [tableName]);
    const foreignKeys = new Map(
      fkResult.rows.map(row => [
        row.column_name,
        { table: row.foreign_table, column: row.foreign_column }
      ])
    );

    // Filter out excluded fields and add FK info
    const excludedFields = EXCLUDED_FIELDS[tableName] || [];
    
    return columnsResult.rows
      .filter(row => !excludedFields.includes(row.column_name))
      .map(row => ({
        column_name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable,
        column_default: row.column_default,
        character_maximum_length: row.character_maximum_length,
        is_primary_key: row.is_primary_key,
        is_foreign_key: foreignKeys.has(row.column_name),
        foreign_table: foreignKeys.get(row.column_name)?.table,
        foreign_column: foreignKeys.get(row.column_name)?.column
      }));
  }

  /**
   * Get paginated data from a table
   */
  async getTableData(
    tableName: string,
    page: number = 1,
    limit: number = 25,
    search?: string,
    sortColumn?: string,
    sortDirection: 'ASC' | 'DESC' = 'DESC',
    filters?: Record<string, any>
  ): Promise<PaginatedResult<any>> {
    if (!MANAGEABLE_TABLES.includes(tableName)) {
      throw new Error(`Table '${tableName}' is not manageable`);
    }

    const offset = (page - 1) * limit;
    const excludedFields = EXCLUDED_FIELDS[tableName] || [];

    // Build SELECT columns (excluding sensitive fields)
    const schema = await this.getTableSchema(tableName);
    const columns = schema
      .map(col => col.column_name)
      .filter(col => !excludedFields.includes(col));

    // Build WHERE clause for search
    let whereClause = '';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      const searchableColumns = schema
        .filter(col => 
          ['character varying', 'text', 'varchar'].includes(col.data_type) &&
          !excludedFields.includes(col.column_name)
        )
        .map(col => col.column_name);

      if (searchableColumns.length > 0) {
        const searchConditions = searchableColumns
          .map(col => `${col}::text ILIKE $${paramIndex}`)
          .join(' OR ');
        whereClause = `WHERE (${searchConditions})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }
    }

    // Add filters
    if (filters && Object.keys(filters).length > 0) {
      const filterConditions: string[] = [];
      for (const [key, value] of Object.entries(filters)) {
        if (columns.includes(key) && value !== undefined && value !== '') {
          filterConditions.push(`${key} = $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
        }
      }
      if (filterConditions.length > 0) {
        whereClause = whereClause
          ? `${whereClause} AND ${filterConditions.join(' AND ')}`
          : `WHERE ${filterConditions.join(' AND ')}`;
      }
    }

    // Validate sort column - default to 'id' ascending
    const validSortColumn = sortColumn && columns.includes(sortColumn) 
      ? sortColumn 
      : 'id';
    
    // Default sort direction to ASC for id column
    const effectiveSortDirection = !sortColumn ? 'ASC' : sortDirection;
    
    // Check if sort column exists
    const hasSortColumn = schema.some(col => col.column_name === validSortColumn);
    const orderBy = hasSortColumn 
      ? `ORDER BY ${validSortColumn} ${effectiveSortDirection}` 
      : 'ORDER BY id ASC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated data
    const dataQuery = `
      SELECT ${columns.join(', ')} 
      FROM ${tableName} 
      ${whereClause} 
      ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get a single record by ID
   */
  async getRecord(tableName: string, id: string): Promise<any> {
    if (!MANAGEABLE_TABLES.includes(tableName)) {
      throw new Error(`Table '${tableName}' is not manageable`);
    }

    // Validate ID is a valid integer
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || id === 'undefined' || id === 'null') {
      throw new Error(`Invalid record ID: ${id}`);
    }

    const excludedFields = EXCLUDED_FIELDS[tableName] || [];
    const schema = await this.getTableSchema(tableName);
    const columns = schema
      .map(col => col.column_name)
      .filter(col => !excludedFields.includes(col));

    const query = `SELECT ${columns.join(', ')} FROM ${tableName} WHERE id = $1`;
    const result = await pool.query(query, [numericId]);

    if (result.rows.length === 0) {
      throw new Error(`Record not found in ${tableName} with id ${id}`);
    }

    return result.rows[0];
  }

  /**
   * Create a new record
   */
  async createRecord(tableName: string, data: Record<string, any>): Promise<any> {
    if (!MANAGEABLE_TABLES.includes(tableName)) {
      throw new Error(`Table '${tableName}' is not manageable`);
    }

    // Special handling for users table - require and hash password
    if (tableName === 'users') {
      if (!data.password || data.password.trim() === '') {
        throw new Error('Password is required for new users');
      }
      if (data.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      // Hash the password
      data.password_hash = await hashPassword(data.password);
      delete data.password; // Remove plain password from data
    }

    const excludedFields = EXCLUDED_FIELDS[tableName] || [];
    const readOnlyFields = [...(READ_ONLY_FIELDS['*'] || []), ...(READ_ONLY_FIELDS[tableName] || [])];

    // Get schema to check column types
    const schema = await this.getTableSchema(tableName);
    const columnTypes: Record<string, string> = {};
    schema.forEach(col => {
      columnTypes[col.column_name] = col.data_type;
    });

    // Filter out excluded, read-only fields, and invalid values
    // But allow password_hash for users table (it was just hashed above)
    const filteredData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Allow password_hash for users table since we just hashed it
      const isPasswordHash = tableName === 'users' && key === 'password_hash';
      
      if (!isPasswordHash && (excludedFields.includes(key) || readOnlyFields.includes(key))) {
        continue;
      }
      
      // Skip undefined, null, "undefined" string, and empty strings for non-text columns
      if (value === undefined || value === null || value === 'undefined') {
        continue;
      }
      
      // Skip empty strings for integer columns
      const colType = columnTypes[key] || '';
      if (value === '' && (colType.includes('int') || colType.includes('numeric'))) {
        continue;
      }
      
      filteredData[key] = value;
    }

    if (Object.keys(filteredData).length === 0) {
      throw new Error('No valid fields provided for insert');
    }

    const columns = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    // Remove excluded fields from returned data
    const record = result.rows[0];
    for (const field of excludedFields) {
      delete record[field];
    }

    return record;
  }

  /**
   * Update an existing record
   */
  async updateRecord(tableName: string, id: string, data: Record<string, any>): Promise<any> {
    if (!MANAGEABLE_TABLES.includes(tableName)) {
      throw new Error(`Table '${tableName}' is not manageable`);
    }

    // Validate ID is a valid integer
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || id === 'undefined' || id === 'null') {
      throw new Error(`Invalid record ID: ${id}`);
    }

    const excludedFields = EXCLUDED_FIELDS[tableName] || [];
    const readOnlyFields = [...(READ_ONLY_FIELDS['*'] || []), ...(READ_ONLY_FIELDS[tableName] || [])];

    // Get schema to check column types
    const schema = await this.getTableSchema(tableName);
    const columnTypes: Record<string, string> = {};
    schema.forEach(col => {
      columnTypes[col.column_name] = col.data_type;
    });

    // Filter out excluded, read-only fields, and invalid values
    const filteredData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (excludedFields.includes(key) || readOnlyFields.includes(key)) {
        continue;
      }
      
      // Skip undefined and "undefined" string
      if (value === undefined || value === 'undefined') {
        continue;
      }
      
      // For updates, allow null values to clear fields
      // But skip empty strings for integer columns
      const colType = columnTypes[key] || '';
      if (value === '' && (colType.includes('int') || colType.includes('numeric'))) {
        filteredData[key] = null; // Set to null instead of empty string
        continue;
      }
      
      filteredData[key] = value;
    }

    if (Object.keys(filteredData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const columns = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

    // Add updated_at if the table has it
    const hasUpdatedAt = schema.some(col => col.column_name === 'updated_at');
    const finalSetClause = hasUpdatedAt 
      ? `${setClause}, updated_at = NOW()` 
      : setClause;

    const query = `
      UPDATE ${tableName}
      SET ${finalSetClause}
      WHERE id = $${columns.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...values, numericId]);

    if (result.rows.length === 0) {
      throw new Error(`Record not found in ${tableName} with id ${id}`);
    }

    // Remove excluded fields from returned data
    const record = result.rows[0];
    for (const field of excludedFields) {
      delete record[field];
    }

    return record;
  }

  /**
   * Delete a record
   */
  async deleteRecord(tableName: string, id: string): Promise<boolean> {
    if (!MANAGEABLE_TABLES.includes(tableName)) {
      throw new Error(`Table '${tableName}' is not manageable`);
    }

    // Validate ID is a valid integer
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || id === 'undefined' || id === 'null') {
      throw new Error(`Invalid record ID: ${id}`);
    }

    // Prevent deleting the last admin user
    if (tableName === 'users') {
      const adminCountResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
      );
      const adminCount = parseInt(adminCountResult.rows[0].count, 10);
      
      const userResult = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [numericId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].role === 'admin' && adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [numericId]);

    return result.rows.length > 0;
  }

  /**
   * Get foreign key options for dropdowns
   */
  async getForeignKeyOptions(tableName: string, column: string): Promise<any[]> {
    const schema = await this.getTableSchema(tableName);
    const fkColumn = schema.find(col => col.column_name === column && col.is_foreign_key);

    if (!fkColumn || !fkColumn.foreign_table) {
      return [];
    }

    // Try to get a display label (username, email, question_text, etc.)
    const foreignSchema = await this.getTableSchema(fkColumn.foreign_table);
    const labelColumn = foreignSchema.find(col => 
      ['username', 'email', 'name', 'title', 'question_text', 'category'].includes(col.column_name)
    );

    const selectColumn = labelColumn ? labelColumn.column_name : 'id';
    const excludedFields = EXCLUDED_FIELDS[fkColumn.foreign_table] || [];

    // Filter out excluded fields from selection
    if (excludedFields.includes(selectColumn)) {
      const query = `SELECT id FROM ${fkColumn.foreign_table} ORDER BY id LIMIT 100`;
      const result = await pool.query(query);
      return result.rows.map(row => ({ id: row.id, label: row.id }));
    }

    const query = `
      SELECT id, ${selectColumn} as label 
      FROM ${fkColumn.foreign_table} 
      ORDER BY ${selectColumn}
      LIMIT 100
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get options from a table for dropdown menus
   * Returns id and a display label (name, title, username, etc.)
   */
  async getTableOptions(tableName: string): Promise<any[]> {
    if (!MANAGEABLE_TABLES.includes(tableName)) {
      throw new Error(`Table '${tableName}' is not manageable`);
    }

    const schema = await this.getTableSchema(tableName);
    
    // Find a suitable label column
    const labelColumn = schema.find(col => 
      ['name', 'username', 'email', 'title', 'question_text', 'category'].includes(col.column_name)
    );

    const selectColumn = labelColumn ? labelColumn.column_name : 'id';

    const query = `
      SELECT id, ${selectColumn} as label 
      FROM ${tableName} 
      ORDER BY ${selectColumn}
      LIMIT 100
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    // User stats
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week
      FROM users
    `);
    stats.users = userStats.rows[0];

    // Question stats
    const questionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_questions,
        COUNT(DISTINCT category_id) as categories,
        AVG(times_answered) as avg_attempts
      FROM questions
    `);
    stats.questions = questionStats.rows[0];

    // Quiz session stats
    const sessionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as sessions_this_week
      FROM quiz_sessions
    `);
    stats.sessions = sessionStats.rows[0];

    // Question attempt stats
    const attemptStats = await pool.query(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN is_correct THEN 1 END) as correct_attempts,
        ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) as accuracy_rate
      FROM question_attempts
    `);
    stats.attempts = attemptStats.rows[0];

    // Rating distribution
    const ratingStats = await pool.query(`
      SELECT 
        COUNT(*) as total_ratings,
        AVG(overall_elo) as avg_rating,
        MIN(overall_elo) as min_rating,
        MAX(overall_elo) as max_rating
      FROM player_ratings
    `);
    stats.ratings = ratingStats.rows[0];

    return stats;
  }

  /**
   * Get recent admin activity
   */
  async getRecentActivity(limit: number = 20): Promise<any[]> {
    const query = `
      SELECT 
        aal.id,
        aal.action,
        aal.table_name,
        aal.record_id,
        aal.created_at,
        u.username as admin_username,
        u.email as admin_email
      FROM admin_activity_log aal
      JOIN users u ON aal.admin_user_id = u.id
      ORDER BY aal.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get recent system activity (user signups, quiz completions, etc.)
   */
  async getSystemActivity(limit: number = 20): Promise<any[]> {
    const activities: any[] = [];

    // Recent user registrations
    const newUsers = await pool.query(`
      SELECT id, username, email, created_at, 'user_registered' as activity_type
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    activities.push(...newUsers.rows);

    // Recent completed quizzes
    const completedQuizzes = await pool.query(`
      SELECT 
        qs.id, 
        qs.status,
        qs.end_time as created_at,
        u.username,
        'quiz_completed' as activity_type
      FROM quiz_sessions qs
      JOIN users u ON qs.user_id = u.id
      WHERE qs.status = 'completed'
      ORDER BY qs.end_time DESC
      LIMIT 5
    `);
    activities.push(...completedQuizzes.rows);

    // Sort by created_at and limit
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }
}

export default new AdminService();
