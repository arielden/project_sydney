import express, { Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { requireAdmin, logAdminActivity } from '../middleware/adminAuth';
import adminService from '../services/adminService';
import databaseManagementService from '../services/databaseManagementService';
import { uploadSqlFile, handleUploadError } from '../middleware/fileUpload';

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

/**
 * GET /api/admin/activity
 * Get recent admin activity log
 */
router.get('/activity', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await adminService.getRecentActivity(limit);
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error getting admin activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity log'
    });
  }
});

/**
 * GET /api/admin/system-activity
 * Get recent system activity (signups, quiz completions)
 */
router.get('/system-activity', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await adminService.getSystemActivity(limit);
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error getting system activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system activity'
    });
  }
});

/**
 * GET /api/admin/tables
 * List all available tables
 */
router.get('/tables', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tables = await adminService.getTableList();
    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Error getting table list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table list'
    });
  }
});

/**
 * GET /api/admin/tables/:tableName/schema
 * Get table schema/structure
 */
router.get('/tables/:tableName/schema', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableName = req.params.tableName as string;
    const schema = await adminService.getTableSchema(tableName);
    res.json({
      success: true,
      data: schema
    });
  } catch (error: any) {
    console.error('Error getting table schema:', error);
    res.status(error.message?.includes('not manageable') ? 400 : 500).json({
      success: false,
      message: error.message || 'Failed to get table schema'
    });
  }
});

/**
 * GET /api/admin/tables/:tableName
 * Get table data (paginated)
 */
router.get('/tables/:tableName', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableName = req.params.tableName as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const search = req.query.search as string;
    const sortColumn = req.query.sortColumn as string;
    const sortDirection = (req.query.sortDirection as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Parse filters from query
    const filters: Record<string, any> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (!['page', 'limit', 'search', 'sortColumn', 'sortDirection'].includes(key)) {
        filters[key] = value;
      }
    }

    const result = await adminService.getTableData(
      tableName,
      page,
      limit,
      search,
      sortColumn,
      sortDirection,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    // Log view activity
    await logAdminActivity(
      req.user!.id,
      'view',
      tableName,
      undefined,
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error getting table data:', error);
    res.status(error.message?.includes('not manageable') ? 400 : 500).json({
      success: false,
      message: error.message || 'Failed to get table data'
    });
  }
});

/**
 * GET /api/admin/tables/:tableName/fk/:column
 * Get foreign key options for a column
 */
router.get('/tables/:tableName/fk/:column', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableName = req.params.tableName as string;
    const column = req.params.column as string;
    const options = await adminService.getForeignKeyOptions(tableName, column);
    res.json({
      success: true,
      data: options
    });
  } catch (error: any) {
    console.error('Error getting FK options:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get foreign key options'
    });
  }
});

/**
 * GET /api/admin/tables/:tableName/options
 * Get dropdown options from a table (id and display label)
 */
router.get('/tables/:tableName/options', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableName = req.params.tableName as string;
    const options = await adminService.getTableOptions(tableName);
    res.json({
      success: true,
      data: options
    });
  } catch (error: any) {
    console.error('Error getting table options:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get table options'
    });
  }
});

/**
 * GET /api/admin/tables/:tableName/:id
 * Get single record by ID
 */
router.get('/tables/:tableName/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableName = req.params.tableName as string;
    const id = req.params.id as string;
    const record = await adminService.getRecord(tableName, id);
    
    res.json({
      success: true,
      data: record
    });
  } catch (error: any) {
    console.error('Error getting record:', error);
    const status = error.message?.includes('not found') ? 404 : 
                   error.message?.includes('not manageable') ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to get record'
    });
  }
});

/**
 * POST /api/admin/tables/:tableName
 * Create new record
 */
router.post('/tables/:tableName', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableName = req.params.tableName as string;
    const data = req.body;

    const record = await adminService.createRecord(tableName, data);

    // Log create activity
    await logAdminActivity(
      req.user!.id,
      'create',
      tableName,
      record.id,
      undefined,
      data,
      req.ip,
      req.get('User-Agent')
    );

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: record
    });
  } catch (error: any) {
    console.error('Error creating record:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create record'
    });
  }
});

/**
 * PUT /api/admin/tables/:tableName/:id
 * Update existing record
 */
router.put('/tables/:tableName/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableName = req.params.tableName as string;
    const id = req.params.id as string;
    const data = req.body;

    // Get old values for audit log
    let oldValues;
    try {
      oldValues = await adminService.getRecord(tableName, id);
    } catch {
      // Record might not exist
    }

    const record = await adminService.updateRecord(tableName, id, data);

    // Log update activity
    await logAdminActivity(
      req.user!.id,
      'update',
      tableName,
      id,
      oldValues,
      data,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Record updated successfully',
      data: record
    });
  } catch (error: any) {
    console.error('Error updating record:', error);
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to update record'
    });
  }
});

/**
 * DELETE /api/admin/tables/:tableName/:id
 * Delete record
 */
router.delete('/tables/:tableName/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableName = req.params.tableName as string;
    const id = req.params.id as string;

    // Get old values for audit log
    let oldValues;
    try {
      oldValues = await adminService.getRecord(tableName, id);
    } catch {
      // Record might not exist
    }

    const deleted = await adminService.deleteRecord(tableName, id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Record not found'
      });
      return;
    }

    // Log delete activity
    await logAdminActivity(
      req.user!.id,
      'delete',
      tableName,
      id,
      oldValues,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting record:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete record'
    });
  }
});

/**
 * GET /api/admin/database/tables
 * Get list of all database tables
 */
router.get('/database/tables', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tables = await databaseManagementService.getTableList();
    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Error getting database table list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database table list'
    });
  }
});

/**
 * GET /api/admin/database/export-schema
 * Export current database schema
 */
router.get('/database/export-schema', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const schema = await databaseManagementService.exportCurrentSchema();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="schema.sql"');
    res.send(schema);
  } catch (error) {
    console.error('Error exporting schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export schema'
    });
  }
});

/**
 * GET /api/admin/database/tables-info
 * Get detailed table information with safety indicators
 */
router.get('/database/tables-info', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tableInfo = await databaseManagementService.getTableInfo();
    res.json({
      success: true,
      data: tableInfo
    });
  } catch (error) {
    console.error('Error getting table info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table information'
    });
  }
});

/**
 * POST /api/admin/database/clear-tables
 * Clear data from specified tables
 */
router.post('/database/clear-tables', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { tableNames, confirmation } = req.body;

    if (!Array.isArray(tableNames) || tableNames.length === 0) {
      res.status(400).json({
        success: false,
        message: 'tableNames must be a non-empty array'
      });
      return;
    }

    if (confirmation !== 'DELETE') {
      res.status(400).json({
        success: false,
        message: 'Confirmation required: type "DELETE" to proceed'
      });
      return;
    }

    const result = await databaseManagementService.clearTables(tableNames, req.user!.id);

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error clearing tables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear tables'
    });
  }
});

/**
 * POST /api/admin/database/execute-schema
 * Execute schema SQL file
 */
router.post('/database/execute-schema', uploadSqlFile.single('schemaFile'), handleUploadError, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    const sqlContent = req.file.buffer.toString('utf-8');

    // Validate the file
    const validation = databaseManagementService.validateSqlFile(sqlContent);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: validation.errors
      });
      return;
    }

    // Check if we should drop tables first
    const dropTablesFirst = req.body.dropTablesFirst === 'true';

    const result = await databaseManagementService.executeSchemaFile(sqlContent, req.user!.id, dropTablesFirst);

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error executing schema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute schema'
    });
  }
});

/**
 * POST /api/admin/database/load-seeds
 * Load seed data from SQL file
 */
router.post('/database/load-seeds', uploadSqlFile.single('seedFile'), handleUploadError, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    const sqlContent = req.file.buffer.toString('utf-8');

    // Basic validation
    if (!sqlContent.trim()) {
      res.status(400).json({
        success: false,
        message: 'File is empty'
      });
      return;
    }

    const result = await databaseManagementService.loadSeedData(sqlContent, req.user!.id);

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error loading seeds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load seed data'
    });
  }
});

/**
 * POST /api/admin/database/load-predefined-seed
 * Load predefined seed data files
 */
router.post('/database/load-predefined-seed', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { seedType } = req.body;

    if (!seedType || !['categories', 'questions'].includes(seedType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid seedType. Must be "categories" or "questions"'
      });
      return;
    }

    const result = await databaseManagementService.loadPredefinedSeed(seedType, req.user!.id);

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error loading predefined seed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load predefined seed data'
    });
  }
});

export default router;
