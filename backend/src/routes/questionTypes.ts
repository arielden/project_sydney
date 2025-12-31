import express, { Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import QuestionTypeModel from '../models/QuestionType';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/question-types
 * Get all question types
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const withStats = req.query.withStats === 'true';
    
    let questionTypes;
    if (withStats) {
      questionTypes = await QuestionTypeModel.getWithStats(activeOnly);
    } else {
      questionTypes = await QuestionTypeModel.getAll(activeOnly);
    }
    
    res.json({
      success: true,
      data: questionTypes
    });
  } catch (error) {
    console.error('Error getting question types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get question types'
    });
  }
});

/**
 * GET /api/question-types/categories
 * Get distinct categories
 */
router.get('/categories', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categories = await QuestionTypeModel.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

/**
 * GET /api/question-types/grouped
 * Get question types grouped by category
 */
router.get('/grouped', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const grouped = await QuestionTypeModel.getGroupedByCategory(activeOnly);
    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error getting grouped question types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get grouped question types'
    });
  }
});

/**
 * GET /api/question-types/by-difficulty/:level
 * Get question types by difficulty level
 */
router.get('/by-difficulty/:level', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const level = req.params.level as 'easy' | 'medium' | 'hard' | 'mixed';
    
    if (!['easy', 'medium', 'hard', 'mixed'].includes(level)) {
      res.status(400).json({
        success: false,
        message: 'Invalid difficulty level. Must be easy, medium, hard, or mixed'
      });
      return;
    }
    
    const questionTypes = await QuestionTypeModel.getByDifficultyLevel(level);
    res.json({
      success: true,
      data: questionTypes
    });
  } catch (error) {
    console.error('Error getting question types by difficulty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get question types by difficulty'
    });
  }
});

/**
 * GET /api/question-types/by-category/:categoryId
 * Get question types by category
 */
router.get('/by-category/:categoryId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categoryId = req.params.categoryId as string;
    const activeOnly = req.query.activeOnly !== 'false';
    const questionTypes = await QuestionTypeModel.getByCategory(categoryId, activeOnly);
    res.json({
      success: true,
      data: questionTypes
    });
  } catch (error) {
    console.error('Error getting question types by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get question types by category'
    });
  }
});

/**
 * GET /api/question-types/:id
 * Get a single question type by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const questionType = await QuestionTypeModel.getById(id);
    
    if (!questionType) {
      res.status(404).json({
        success: false,
        message: 'Question type not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: questionType
    });
  } catch (error) {
    console.error('Error getting question type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get question type'
    });
  }
});

export default router;
