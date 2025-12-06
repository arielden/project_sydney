import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import pool from '../config/database';

/**
 * Middleware to require admin role for protected routes
 * Must be used AFTER authenticateToken middleware
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User should already be authenticated via authenticateToken
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has admin role
    const query = 'SELECT role FROM users WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const userRole = result.rows[0].role;

    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required. You do not have permission to access this resource.'
      });
      return;
    }

    // User is admin, proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authorization check'
    });
  }
};

/**
 * Helper function to log admin activity
 */
export const logAdminActivity = async (
  adminUserId: number | string,
  action: 'create' | 'update' | 'delete' | 'view',
  tableName: string,
  recordId?: number | string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  try {
    // Build details object for JSONB column
    const details: Record<string, any> = {};
    if (oldValues) details.old_values = oldValues;
    if (newValues) details.new_values = newValues;
    if (userAgent) details.user_agent = userAgent;

    const query = `
      INSERT INTO admin_activity_log 
      (admin_user_id, action, table_name, record_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await pool.query(query, [
      adminUserId,
      action,
      tableName,
      recordId?.toString() || null,
      Object.keys(details).length > 0 ? JSON.stringify(details) : null,
      ipAddress || null
    ]);
  } catch (error) {
    // Log error but don't fail the request - activity logging is not critical
    console.error('Failed to log admin activity:', error);
  }
};

export default requireAdmin;
