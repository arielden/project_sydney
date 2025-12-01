import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'sydney-learning-platform-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Ensure JWT_SECRET is not null or undefined
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash password using bcrypt with high security salt rounds
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12; // High security for production
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error: any) {
    throw new Error(`Failed to hash password: ${error.message}`);
  }
}

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored hashed password to compare against
 * @returns Promise<boolean> - True if passwords match
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error: any) {
    throw new Error(`Failed to compare passwords: ${error.message}`);
  }
}

/**
 * Generate JWT token for authenticated user
 * @param userId - User's unique identifier
 * @param email - User's email address
 * @returns string - JWT token string
 */
export function generateToken(userId: string, email: string): string {
  try {
    const payload: TokenPayload = {
      userId,
      email
    };

    return (jwt as any).sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (error: any) {
    throw new Error(`Failed to generate token: ${error.message}`);
  }
}

/**
 * Verify and decode JWT token
 * @param token - JWT token string to verify
 * @returns TokenPayload - Decoded token payload
 * @throws Error - If token is invalid, expired, or malformed
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = (jwt as any).verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    if (error.name === 'NotBeforeError') {
      throw new Error('Token not active');
    }
    throw new Error(`Failed to verify token: ${error.message}`);
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value (Bearer <token>)
 * @returns string | null - Token string or null if invalid format
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * Validate password strength with comprehensive checks
 * @param password - Plain text password to validate
 * @returns Object with validation result and error messages
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common password check
  const commonPasswords = ['password', '12345678', 'qwerty123', 'abc123456'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format using regex pattern
 * @param email - Email address to validate
 * @returns boolean - True if valid email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate username format and constraints
 * @param username - Username to validate
 * @returns Object with validation result and error messages
 */
export function validateUsername(username: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!username) {
    errors.push('Username is required');
    return { isValid: false, errors };
  }

  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (username.length > 30) {
    errors.push('Username must be less than 30 characters long');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  if (/^[0-9]/.test(username)) {
    errors.push('Username cannot start with a number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format error response for API endpoints
 * @param message - Main error message
 * @param errors - Array of specific error messages
 * @returns Formatted error response object
 */
export function formatErrorResponse(message: string, errors?: string[]) {
  return {
    success: false,
    message,
    errors: errors || []
  };
}

/**
 * Format success response for API endpoints
 * @param message - Success message
 * @param data - Response data
 * @returns Formatted success response object
 */
export function formatSuccessResponse(message: string, data?: any) {
  const response: any = {
    success: true,
    message
  };
  
  if (data !== undefined) {
    response.data = data;
  }
  
  return response;
}