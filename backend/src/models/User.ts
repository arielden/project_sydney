import pool from '../config/database';
import { QueryResult } from 'pg';

/** User interface with all database fields */
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash?: string; // Optional for security (don't expose in responses)
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

/** Data required to create a new user */
export interface CreateUserData {
  email: string;
  username: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
}

/** User response interface (excludes sensitive fields like password_hash) */
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

/**
 * Create a new user account in the database
 * @param userData - User registration data
 * @returns Promise<UserResponse> - Created user without password hash
 * @throws Error if email/username already exists or creation fails
 */
export async function createUser(userData: CreateUserData): Promise<UserResponse> {
  try {
    const query = `
      INSERT INTO users (email, username, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, username, first_name, last_name, created_at, updated_at, last_login, is_active
    `;
    
    const values = [
      userData.email.toLowerCase().trim(),
      userData.username.trim(),
      userData.password_hash,
      userData.first_name?.trim() || null,
      userData.last_name?.trim() || null
    ];

    const result: QueryResult = await pool.query(query, values);
    const user = result.rows[0];

    // Create initial player rating
    await createInitialPlayerRating(user.id);

    return user;
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint === 'users_email_key') {
        throw new Error('Email already exists');
      }
      if (error.constraint === 'users_username_key') {
        throw new Error('Username already taken');
      }
    }
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

/**
 * Find user by email address for login authentication
 * @param email - User's email address
 * @returns Promise<User | null> - User with password hash or null if not found
 * @throws Error if database query fails
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const query = `
      SELECT id, email, username, password_hash, first_name, last_name, 
             created_at, updated_at, last_login, is_active
      FROM users 
      WHERE email = $1 AND is_active = true
    `;
    
    const result: QueryResult = await pool.query(query, [email.toLowerCase().trim()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error: any) {
    throw new Error(`Failed to find user by email: ${error.message}`);
  }
}

/**
 * Find user by ID for JWT token verification
 * @param id - User's unique identifier
 * @returns Promise<UserResponse | null> - User without password hash or null if not found
 * @throws Error if database query fails
 */
export async function findUserById(id: string): Promise<UserResponse | null> {
  try {
    const query = `
      SELECT id, email, username, first_name, last_name, 
             created_at, updated_at, last_login, is_active
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const result: QueryResult = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error: any) {
    throw new Error(`Failed to find user by ID: ${error.message}`);
  }
}

/**
 * Update user's last login timestamp to current time
 * @param userId - User's unique identifier
 * @returns Promise<void>
 * @throws Error if update fails
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    await pool.query(query, [userId]);
  } catch (error: any) {
    throw new Error(`Failed to update last login: ${error.message}`);
  }
}

/**
 * Check if an email address is already registered
 * @param email - Email address to check
 * @returns Promise<boolean> - True if email exists
 * @throws Error if database query fails
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const query = `SELECT 1 FROM users WHERE email = $1 LIMIT 1`;
    const result: QueryResult = await pool.query(query, [email.toLowerCase().trim()]);
    return result.rows.length > 0;
  } catch (error: any) {
    throw new Error(`Failed to check email existence: ${error.message}`);
  }
}

/**
 * Check if a username is already taken
 * @param username - Username to check
 * @returns Promise<boolean> - True if username exists
 * @throws Error if database query fails
 */
export async function usernameExists(username: string): Promise<boolean> {
  try {
    const query = `SELECT 1 FROM users WHERE username = $1 LIMIT 1`;
    const result: QueryResult = await pool.query(query, [username.trim()]);
    return result.rows.length > 0;
  } catch (error: any) {
    throw new Error(`Failed to check username existence: ${error.message}`);
  }
}

/**
 * Create initial player rating for a new user
 * @param userId - User's unique identifier
 * @returns Promise<void>
 * @private Internal function, doesn't throw to avoid breaking user creation
 */
async function createInitialPlayerRating(userId: string): Promise<void> {
  try {
    const query = `
      INSERT INTO player_ratings (user_id, overall_elo, k_factor, games_played)
      VALUES ($1, 1200, 100.00, 0)
    `;
    
    await pool.query(query, [userId]);
  } catch (error: any) {
    console.error('Failed to create initial player rating:', error);
    // Don't throw error here as user creation should succeed even if rating fails
  }
}