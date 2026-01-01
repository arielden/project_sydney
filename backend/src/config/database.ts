import { Pool, PoolConfig } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration - supports both TCP and Unix socket connections
let dbConfig: PoolConfig;

// Determine connection method based on environment
const dbHost = process.env.DB_HOST;
const useUnixSocket = dbHost?.startsWith('/cloudsql/') || dbHost?.startsWith('/');
const isCloudRun = !!process.env.K_SERVICE; // Cloud Run sets K_SERVICE

console.log('🔧 Database Config Debug:');
console.log(`  DB_HOST: ${dbHost}`);
console.log(`  Available env vars: ${Object.keys(process.env).filter(k => k.includes('DB') || k.includes('CLOUD')).join(', ')}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  useUnixSocket: ${useUnixSocket}`);
console.log(`  isCloudRun: ${isCloudRun}`);

if (useUnixSocket) {
  // Cloud SQL connection via Unix socket
  const socketPath = dbHost || '/cloudsql/project-sidney-prod:us-central1:sydney-postgres';
  console.log(`  ✓ Using Unix socket: ${socketPath}`);
  
  dbConfig = {
    host: socketPath,
    database: process.env.DB_NAME || 'sydney_db',
    user: process.env.DB_USER || 'sydney_user',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else if (process.env.DATABASE_URL) {
  // Connection string format
  console.log(`  ✓ Using DATABASE_URL connection string`);
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else {
  // TCP connection (local development)
  console.log(`  ✓ Using TCP connection`);
  dbConfig = {
    host: dbHost || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sydney_db',
    user: process.env.DB_USER || 'sydney_user',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
    console.log(`📊 Database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Run SQL migration files
export async function runMigration(migrationFile: string): Promise<boolean> {
  try {
    const migrationPath = path.join(process.cwd(), '..', 'database', 'migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    const client = await pool.connect();
    
    console.log(`🔄 Running migration: ${migrationFile}`);
    await client.query(sql);
    client.release();
    
    console.log(`✅ Migration completed: ${migrationFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed for ${migrationFile}:`, error);
    return false;
  }
}

// Run seed files
export async function runSeed(seedFile: string): Promise<boolean> {
  try {
    const seedPath = path.join(process.cwd(), '..', 'database', 'seeds', seedFile);
    
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found: ${seedPath}`);
    }

    const sql = fs.readFileSync(seedPath, 'utf8');
    const client = await pool.connect();
    
    console.log(`🌱 Running seed: ${seedFile}`);
    await client.query(sql);
    client.release();
    
    console.log(`✅ Seed completed: ${seedFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Seed failed for ${seedFile}:`, error);
    return false;
  }
}

// Check if database is initialized (has tables)
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'questions', 'player_ratings', 'quiz_sessions', 'question_attempts')
    `);
    client.release();
    
    const tableCount = parseInt(result.rows[0].table_count);
    return tableCount === 5;
  } catch (error) {
    console.error('❌ Error checking database initialization:', error);
    return false;
  }
}

// Initialize database with schema if empty
export async function initializeDatabase(): Promise<boolean> {
  try {
    const isInitialized = await isDatabaseInitialized();
    
    if (isInitialized) {
      console.log('✅ Database already initialized');
      return true;
    }

    console.log('🔄 Initializing database schema...');
    
    // Run schema.sql directly
    const schemaPath = path.join(process.cwd(), '..', 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    const client = await pool.connect();
    
    console.log(`🔄 Running schema initialization`);
    await client.query(sql);
    client.release();
    
    console.log(`✅ Schema initialization completed`);
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Run all pending migrations
export async function runAllMigrations(): Promise<boolean> {
  try {
    const migrationsDir = path.join(process.cwd(), '..', 'database', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found');
      return true;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('📁 No migration files found');
      return true;
    }

    console.log(`🔄 Found ${migrationFiles.length} migration(s)`);

    for (const file of migrationFiles) {
      const success = await runMigration(file);
      if (!success) {
        throw new Error(`Migration failed: ${file}`);
      }
    }

    console.log('✅ All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    return false;
  }
}

// Drop and recreate database
export async function dropDatabase(): Promise<boolean> {
  try {
    console.log('🗑️  Dropping database...');
    
    // Create admin connection config pointing to postgres database
    let adminConfig: PoolConfig;
    
    if (process.env.DATABASE_URL) {
      // Parse DATABASE_URL and replace database name with 'postgres'
      const url = new URL(process.env.DATABASE_URL);
      url.pathname = '/postgres'; // Change database to postgres
      adminConfig = {
        connectionString: url.toString(),
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };
    } else {
      // Use individual DB_* variables but connect to postgres
      adminConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres', // Connect to postgres for admin operations
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'admin123',
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };
    }
    
    const adminPool = new Pool(adminConfig);
    const dbName = process.env.DB_NAME || 'sydney_db';
    
    // Terminate active connections (ignore errors if database doesn't exist)
    try {
      await adminPool.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity 
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `, [dbName]);
    } catch {
      console.log('⚠️  Could not terminate connections (database may not exist)');
    }
    
    // Drop the database (ignore errors if it doesn't exist)
    try {
      await adminPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      console.log('✅ Database dropped');
    } catch (error) {
      console.log('⚠️  Database drop failed (may not exist):', (error as Error).message);
    }
    
    // Recreate the database
    try {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log('✅ Database created');
    } catch (error) {
      console.log('⚠️  Database create failed:', (error as Error).message);
      // If create fails, try without quotes
      try {
        await adminPool.query(`CREATE DATABASE ${dbName}`);
        console.log('✅ Database created (without quotes)');
      } catch (error2) {
        console.log('❌ Database create failed completely:', (error2 as Error).message);
        await adminPool.end();
        return false;
      }
    }
    
    await adminPool.end();
    
    console.log('✅ Database recreated successfully');
    return true;
  } catch (error) {
    console.error('❌ Database recreate failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
}

// Export the pool for use in other modules
export default pool;