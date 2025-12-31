import pool from '../config/database';
import { logAdminActivity } from '../middleware/adminAuth';
import * as fs from 'fs';
import * as path from 'path';

export interface DatabaseOperationResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface ClearTablesResult extends DatabaseOperationResult {
  clearedTables: string[];
  failedTables: { table: string; error: string }[];
  warnings?: string[];
}

export interface ExecuteSchemaResult extends DatabaseOperationResult {
  executedQueries: number;
  failedQueries: { query: string; error: string }[];
}

export interface LoadSeedsResult extends DatabaseOperationResult {
  insertedRows: Record<string, number>;
  failedInserts: { table: string; error: string }[];
}

export interface SqlValidationResult {
  valid: boolean;
  errors: string[];
}

class DatabaseManagementService {
  // Tables that should NEVER be cleared (critical system tables)
  private readonly PROTECTED_TABLES = [
    'admin_activity_log', // Audit trail - never delete
  ];

  // Tables that require special caution (have complex relationships)
  private readonly CAUTION_TABLES = [
    'users', // User accounts
    'questions', // Core content
    'categories', // Taxonomy
  ];

  // Maximum tables to clear in a single operation
  private readonly MAX_BATCH_SIZE = 5;

  // Delay between table operations (ms)
  private readonly OPERATION_DELAY = 100;

  /**
   * Validate table clearing operation
   */
  private validateTableClearing(tableNames: string[]): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for protected tables
    const protectedTables = tableNames.filter(table => this.PROTECTED_TABLES.includes(table));
    if (protectedTables.length > 0) {
      errors.push(`Cannot clear protected system tables: ${protectedTables.join(', ')}`);
    }

    // Check batch size limit
    if (tableNames.length > this.MAX_BATCH_SIZE) {
      errors.push(`Cannot clear more than ${this.MAX_BATCH_SIZE} tables at once. Requested: ${tableNames.length}`);
    }

    // Check for caution tables
    const cautionTables = tableNames.filter(table => this.CAUTION_TABLES.includes(table));
    if (cautionTables.length > 0) {
      warnings.push(`Caution: Clearing tables with complex relationships: ${cautionTables.join(', ')}`);
    }

    // Check if all tables exist
    const nonExistentTables = tableNames.filter(table => !this.isValidTableName(table));
    if (nonExistentTables.length > 0) {
      errors.push(`Invalid table names: ${nonExistentTables.join(', ')}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Basic table name validation
   */
  private isValidTableName(tableName: string): boolean {
    // Basic SQL injection prevention and naming validation
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName) && tableName.length <= 63;
  }

  /**
   * Check database health before operations
   */
  private async checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      const result = await pool.query('SELECT 1 as health_check');
      return { healthy: result.rows.length > 0, message: 'Database is healthy' };
    } catch (error: any) {
      return { healthy: false, message: `Database health check failed: ${error.message}` };
    }
  }

  /**
   * Add delay between operations to prevent overwhelming the database
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get list of all tables in the database
   */
  async getTableList(): Promise<string[]> {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return result.rows.map(row => row.table_name);
  }

  /**
   * Get detailed table information with safety indicators
   */
  async getTableInfo(): Promise<Array<{
    name: string;
    rowCount: number;
    isProtected: boolean;
    isCaution: boolean;
    hasForeignKeys: boolean;
  }>> {
    const tables = await this.getTableList();
    const tableInfo: Array<{
      name: string;
      rowCount: number;
      isProtected: boolean;
      isCaution: boolean;
      hasForeignKeys: boolean;
    }> = [];

    for (const tableName of tables) {
      try {
        // Get row count
        const rowCountResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = parseInt(rowCountResult.rows[0].count);

        // Check for foreign keys
        const fkResult = await pool.query(`
          SELECT COUNT(*) as fk_count
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'
        `, [tableName]);

        const hasForeignKeys = parseInt(fkResult.rows[0].fk_count) > 0;

        tableInfo.push({
          name: tableName,
          rowCount,
          isProtected: this.PROTECTED_TABLES.includes(tableName),
          isCaution: this.CAUTION_TABLES.includes(tableName),
          hasForeignKeys
        });
      } catch (error) {
        console.error(`Error getting info for table ${tableName}:`, error);
        // Add with default values if we can't get info
        tableInfo.push({
          name: tableName,
          rowCount: 0,
          isProtected: this.PROTECTED_TABLES.includes(tableName),
          isCaution: this.CAUTION_TABLES.includes(tableName),
          hasForeignKeys: false
        });
      }
    }

    return tableInfo;
  }

  /**
   * Clear data from specified tables and reset auto-increment IDs
   */
  async clearTables(tableNames: string[], adminId: string): Promise<ClearTablesResult> {
    // Validate the operation first
    const validation = this.validateTableClearing(tableNames);
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join('; ')}`,
        clearedTables: [],
        failedTables: [],
        warnings: validation.warnings
      };
    }

    // Check database health
    const healthCheck = await this.checkDatabaseHealth();
    if (!healthCheck.healthy) {
      return {
        success: false,
        message: healthCheck.message,
        clearedTables: [],
        failedTables: tableNames.map(table => ({ table, error: 'Database health check failed' })),
        warnings: validation.warnings
      };
    }

    const client = await pool.connect();
    const clearedTables: string[] = [];
    const failedTables: { table: string; error: string }[] = [];

    try {
      await client.query('BEGIN');

      // Process tables one by one with delays to prevent overwhelming the database
      for (const tableName of tableNames) {
        try {
          // Verify table exists and get row count
          const tableCheck = await client.query(`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = $1
            ) as exists,
            (SELECT COUNT(*) FROM ${tableName}) as row_count
          `, [tableName]);

          if (!tableCheck.rows[0].exists) {
            failedTables.push({ table: tableName, error: 'Table does not exist' });
            continue;
          }

          const rowCount = parseInt(tableCheck.rows[0].row_count);
          if (rowCount > 10000) {
            // Large tables need special handling
            console.warn(`Clearing large table ${tableName} with ${rowCount} rows`);
          }

          // Truncate table with restart identity and cascade
          await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
          clearedTables.push(tableName);

          // Log the action
          await logAdminActivity(
            adminId,
            'update',
            tableName,
            undefined,
            { row_count: rowCount },
            { action: 'clear_table_data' },
            '127.0.0.1', // Will be overridden by actual IP
            'Database Management'
          );

          // Add delay between operations
          if (tableNames.length > 1) {
            await this.delay(this.OPERATION_DELAY);
          }

        } catch (error: any) {
          console.error(`Failed to clear table ${tableName}:`, error);
          failedTables.push({ table: tableName, error: error.message });

          // Continue with other tables but mark transaction as potentially problematic
          if (error.code === '57P01') { // Admin shutdown
            throw new Error('Database shutdown detected during operation');
          }
        }
      }

      await client.query('COMMIT');

      return {
        success: failedTables.length === 0,
        message: `Cleared ${clearedTables.length} tables${failedTables.length > 0 ? `, ${failedTables.length} failed` : ''}`,
        clearedTables,
        failedTables,
        warnings: validation.warnings
      };
    } catch (error: any) {
      console.error('Transaction failed during table clearing:', error);
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }

      return {
        success: false,
        message: `Transaction failed: ${error.message}`,
        clearedTables: [],
        failedTables: tableNames.map(table => ({ table, error: error.message })),
        warnings: validation.warnings
      };
    } finally {
      client.release();
    }
  }

  /**
   * Export current database schema as SQL
   */
  async exportCurrentSchema(): Promise<string> {
    try {
      // Get all tables with their structure
      const tablesResult = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      let schema = `-- Database Schema Export\n-- Generated on ${new Date().toISOString()}\n\n`;

      for (const row of tablesResult.rows) {
        const tableName = row.table_name;

        // Get table structure
        const structureResult = await pool.query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        schema += `-- Table: ${tableName}\n`;
        schema += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

        const columns = structureResult.rows.map(col => {
          let colDef = `  ${col.column_name} ${col.data_type}`;

          if (col.character_maximum_length) {
            colDef += `(${col.character_maximum_length})`;
          } else if (col.numeric_precision && col.data_type === 'numeric') {
            colDef += `(${col.numeric_precision}`;
            if (col.numeric_scale) {
              colDef += `,${col.numeric_scale}`;
            }
            colDef += ')';
          }

          if (col.is_nullable === 'NO') {
            colDef += ' NOT NULL';
          }

          if (col.column_default) {
            colDef += ` DEFAULT ${col.column_default}`;
          }

          return colDef;
        });

        schema += columns.join(',\n');
        schema += '\n);\n\n';

        // Get indexes
        const indexResult = await pool.query(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = $1
          AND indexname NOT LIKE '%_pkey'
        `, [tableName]);

        for (const index of indexResult.rows) {
          schema += `${index.indexdef};\n`;
        }

        // Get foreign keys
        const fkResult = await pool.query(`
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1
        `, [tableName]);

        for (const fk of fkResult.rows) {
          schema += `ALTER TABLE ${tableName} ADD CONSTRAINT ${fk.constraint_name} `;
          schema += `FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});\n`;
        }

        schema += '\n';
      }

      return schema;
    } catch (error: any) {
      console.error('Error exporting schema:', error);
      throw new Error(`Failed to export schema: ${error.message}`);
    }
  }

  /**
   * Validate SQL file content
   */
  validateSqlFile(sqlContent: string): SqlValidationResult {
    const errors: string[] = [];

    if (!sqlContent || !sqlContent.trim()) {
      errors.push('SQL file is empty');
      return { valid: false, errors };
    }

    // Basic validation - check for potentially dangerous statements
    const dangerousPatterns = [
      /\bDROP\s+DATABASE\b/i,
      /\bDROP\s+SCHEMA\b/i,
      /\bTRUNCATE\s+.*\s+CASCADE\b.*\bRESTART\s+IDENTITY\b/i,
      /\bDELETE\s+FROM\b.*\bWHERE\b.*1\s*=\s*1/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sqlContent)) {
        errors.push(`Potentially dangerous SQL pattern detected: ${pattern.source}`);
      }
    }

    // Check for basic SQL syntax (very basic check)
    const statements = this.splitSqlStatements(sqlContent);
    if (statements.length === 0) {
      errors.push('No valid SQL statements found');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute schema SQL file
   */
  async executeSchemaFile(sqlContent: string, adminId: string, dropTablesFirst: boolean = false): Promise<ExecuteSchemaResult> {
    const client = await pool.connect();
    const executedQueries: string[] = [];
    const failedQueries: { query: string; error: string }[] = [];

    try {
      await client.query('BEGIN');

      // Drop all existing tables if requested
      if (dropTablesFirst) {
        console.log('Dropping all existing tables before executing schema...');

        try {
          // First, drop all foreign key constraints to avoid dependency issues
          await client.query(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT conname, conrelid::regclass AS table_name
                         FROM pg_constraint
                         WHERE contype = 'f' AND connamespace = 'public'::regnamespace)
                LOOP
                    EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.conname || ' CASCADE';
                END LOOP;
            END $$;
          `);

          // Then drop all tables except admin_activity_log
          await client.query(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename
                         FROM pg_tables
                         WHERE schemaname = 'public'
                         AND tablename NOT IN ('admin_activity_log'))
                LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || r.tablename || ' CASCADE';
                END LOOP;
            END $$;
          `);

          executedQueries.push('DROPPED ALL TABLES (except admin_activity_log)');

          // Log the drop action
          await logAdminActivity(
            adminId,
            'delete',
            'database_schema',
            'all_tables',
            undefined,
            { action: 'drop_all_tables' },
            '127.0.0.1',
            'Schema Execution - Drop All Tables'
          );
        } catch (error: any) {
          console.error('Failed to drop tables:', error);
          failedQueries.push({
            query: 'DROP ALL TABLES',
            error: error.message
          });
          throw error; // Re-throw to fail the entire operation
        }
      }

      const statements = this.splitSqlStatements(sqlContent);

      for (const statement of statements) {
        if (!statement.trim()) continue;

        try {
          await client.query(statement);
          executedQueries.push(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));

          // Log the action
          await logAdminActivity(
            adminId,
            'create',
            'database_schema',
            undefined,
            undefined,
            { query: statement.substring(0, 200) },
            '127.0.0.1',
            'Schema Execution'
          );

        } catch (error: any) {
          console.error('Failed to execute query:', statement, error);
          failedQueries.push({
            query: statement.substring(0, 100) + (statement.length > 100 ? '...' : ''),
            error: error.message
          });

          // For schema operations, we might want to continue on some errors
          // but stop on critical ones
          if (error.code === '42P07') { // Table already exists
            console.warn('Table already exists, continuing...');
          } else if (error.code === '42701') { // Column already exists
            console.warn('Column already exists, continuing...');
          } else {
            // For other errors, we might want to rollback
            throw error;
          }
        }
      }

      await client.query('COMMIT');

      return {
        success: failedQueries.length === 0,
        message: `Executed ${executedQueries.length} queries${failedQueries.length > 0 ? `, ${failedQueries.length} failed` : ''}`,
        executedQueries: executedQueries.length,
        failedQueries
      };
    } catch (error: any) {
      console.error('Schema execution failed:', error);
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to rollback:', rollbackError);
      }

      return {
        success: false,
        message: `Schema execution failed: ${error.message}`,
        executedQueries: executedQueries.length,
        failedQueries
      };
    } finally {
      client.release();
    }
  }

  /**
   * Load seed data from SQL file
   */
  async loadSeedData(sqlContent: string, adminId: string): Promise<LoadSeedsResult> {
    const client = await pool.connect();
    const insertedRows: Record<string, number> = {};
    const failedInserts: { table: string; error: string }[] = [];

    try {
      await client.query('BEGIN');

      const statements = this.splitSqlStatements(sqlContent);

      for (const statement of statements) {
        if (!statement.trim()) continue;

        // Check if this is an INSERT statement
        if (statement.toUpperCase().trim().startsWith('INSERT INTO')) {
          try {
            const result = await client.query(statement);

            // Try to extract table name from INSERT statement
            const tableMatch = statement.match(/INSERT\s+INTO\s+["`]?(\w+)["`]?/i);
            if (tableMatch && tableMatch[1]) {
              const tableName = tableMatch[1];
              insertedRows[tableName] = (insertedRows[tableName] ?? 0) + (result.rowCount ?? 0);
            }

            // Log the action
            await logAdminActivity(
              adminId,
              'create',
              'seed_data',
              undefined,
              undefined,
              { rows_affected: result.rowCount },
              '127.0.0.1',
              'Seed Data Loading'
            );

          } catch (error: any) {
            console.error('Failed to execute seed insert:', statement, error);

            // Try to extract table name for error reporting
            const tableMatch = statement.match(/INSERT\s+INTO\s+["`]?(\w+)["`]?/i);
            const tableName = (tableMatch && tableMatch[1]) ? tableMatch[1] : 'unknown_table';

            failedInserts.push({
              table: tableName,
              error: error.message
            });
          }
        } else {
          // Execute non-INSERT statements (like SET, etc.)
          try {
            await client.query(statement);
          } catch (error: any) {
            console.error('Failed to execute seed statement:', statement, error);
            failedInserts.push({
              table: 'system',
              error: `Non-INSERT statement failed: ${error.message}`
            });
          }
        }
      }

      await client.query('COMMIT');

      const totalInserted = Object.values(insertedRows).reduce((sum, count) => sum + count, 0);

      return {
        success: failedInserts.length === 0,
        message: `Inserted ${totalInserted} rows across ${Object.keys(insertedRows).length} tables${failedInserts.length > 0 ? `, ${failedInserts.length} failed` : ''}`,
        insertedRows,
        failedInserts
      };
    } catch (error: any) {
      console.error('Seed data loading failed:', error);
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to rollback:', rollbackError);
      }

      return {
        success: false,
        message: `Seed data loading failed: ${error.message}`,
        insertedRows,
        failedInserts
      };
    } finally {
      client.release();
    }
  }

  /**
   * Load predefined seed data files
   */
  async loadPredefinedSeed(seedType: 'categories' | 'questions', adminId: string): Promise<LoadSeedsResult> {
    try {
      // Determine the seed file path based on type
      const seedFileName = seedType === 'categories' ? 'seed_categories.sql' : 'seed_development_m2m.sql';
      const seedFilePath = path.join(process.cwd(), 'database', 'seeds', seedFileName);

      // Check if the seed file exists
      if (!fs.existsSync(seedFilePath)) {
        return {
          success: false,
          message: `Seed file not found: ${seedFileName}`,
          insertedRows: {},
          failedInserts: [{ table: seedType, error: `File not found: ${seedFilePath}` }]
        };
      }

      // Read the seed file content
      const sqlContent = fs.readFileSync(seedFilePath, 'utf-8');

      // Use the existing loadSeedData method
      return await this.loadSeedData(sqlContent, adminId);

    } catch (error: any) {
      console.error(`Failed to load ${seedType} seed:`, error);
      return {
        success: false,
        message: `Failed to load ${seedType} seed: ${error.message}`,
        insertedRows: {},
        failedInserts: [{ table: seedType, error: error.message }]
      };
    }
  }

  /**
   * Split SQL content into individual statements
   */
  private splitSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    let inString = false;
    let inComment = false;
    let stringChar = '';
    let inBlockComment = false;
    let inDollarQuote = false;
    let dollarQuoteTag = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1] || '';
      const prevChar = sql[i - 1] || '';

      // Handle block comments
      if (!inString && !inComment && !inDollarQuote && char === '/' && nextChar === '*') {
        inBlockComment = true;
        currentStatement += char;
        continue;
      }

      if (inBlockComment && char === '*' && nextChar === '/') {
        inBlockComment = false;
        currentStatement += char + nextChar;
        i++; // Skip next char
        continue;
      }

      if (inBlockComment) {
        currentStatement += char;
        continue;
      }

      // Handle line comments
      if (!inString && !inDollarQuote && char === '-' && nextChar === '-') {
        inComment = true;
        currentStatement += char;
        continue;
      }

      if (inComment && char === '\n') {
        inComment = false;
        currentStatement += char;
        continue;
      }

      if (inComment) {
        currentStatement += char;
        continue;
      }

      // Handle dollar quoting
      if (!inString && !inComment && char === '$' && nextChar === '$') {
        if (!inDollarQuote) {
          // Starting dollar quote
          inDollarQuote = true;
          dollarQuoteTag = '$$';
          currentStatement += char + nextChar;
          i++; // Skip next char
          continue;
        } else if (dollarQuoteTag === '$$') {
          // Ending dollar quote
          inDollarQuote = false;
          dollarQuoteTag = '';
          currentStatement += char + nextChar;
          i++; // Skip next char
          continue;
        }
      }

      if (inDollarQuote) {
        currentStatement += char;
        continue;
      }

      // Handle strings
      if (!inString && (char === '\'' || char === '"')) {
        inString = true;
        stringChar = char;
        currentStatement += char;
        continue;
      }

      if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        currentStatement += char;
        continue;
      }

      if (inString) {
        currentStatement += char;
        continue;
      }

      // Handle statement termination (only when not in dollar quotes)
      if (!inDollarQuote && char === ';') {
        currentStatement += char;
        statements.push(currentStatement.trim());
        currentStatement = '';
        continue;
      }

      currentStatement += char;
    }

    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    return statements;
  }
}

export default new DatabaseManagementService();