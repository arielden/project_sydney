import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/helpers';
import { findUserById, UserResponse } from '../models/User';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: UserResponse;
  userId?: string;
}

/**
 * Middleware to authenticate JWT tokens
 * Attaches user information to request object if valid token provided
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
      return;
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error: any) {
      let message = 'Invalid token';
      let code = 'INVALID_TOKEN';

      if (error.message === 'Token has expired') {
        message = 'Token has expired';
        code = 'TOKEN_EXPIRED';
      }

      res.status(401).json({
        success: false,
        message,
        code
      });
      return;
    }

    // Find user by ID from token
    const user = await findUserById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware to authenticate optional JWT tokens
 * Attaches user information if valid token provided, but doesn't require it
 */
export async function authenticateOptionalToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    // If no token, continue without authentication
    if (!token) {
      next();
      return;
    }

    // Try to verify token
    try {
      const decoded = verifyToken(token);
      const user = await findUserById(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    } catch (error) {
      // Ignore token errors for optional authentication
      console.warn('Optional token verification failed:', error);
    }
    
    next();
  } catch (error: any) {
    console.error('Optional authentication middleware error:', error);
    // Continue without authentication for optional middleware
    next();
  }
}

/**
 * Middleware to check if user has required role/permissions
 * Note: Currently all users have same permissions, but ready for future expansion
 */
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // For now, all authenticated users have access
    // In the future, we can add role-based checks here
    next();
  };
}

/**
 * Middleware to check if user account is active
 */
export function requireActiveAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (!req.user.is_active) {
    res.status(403).json({
      success: false,
      message: 'Account is deactivated. Please contact support.',
      code: 'ACCOUNT_DEACTIVATED'
    });
    return;
  }

  next();
}