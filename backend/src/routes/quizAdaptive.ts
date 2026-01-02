import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import QuizSessionModel from '../models/QuizSession';
import QuestionAttemptModel from '../models/QuestionAttempt';
import AdaptiveQuizGenerator from '../services/adaptiveQuizGenerator';
import QuizCompletionService from '../services/quizCompletionService';
import { formatErrorResponse, formatSuccessResponse } from '../utils/helpers';

const router = express.Router();

// All quiz routes require authentication
router.use(authenticateToken);

// Validation middleware
const startQuizValidation = [
  body('sessionType')
    .isIn(['practice', 'diagnostic', 'timed', 'quick-test'])
    .withMessage('Session type must be practice, diagnostic, timed, or quick-test'),
  body('totalQuestions')
    .optional()
    .isInt({ min: 5, max: 50 })
    .withMessage('Total questions must be between 5 and 50'),
  body('targetCategories')
    .optional()
    .isArray()
    .withMessage('Target categories must be an array')
];

const submitAnswerValidation = [
  param('sessionId').isInt().withMessage('Invalid session ID'),
  body('questionId').isInt().withMessage('Invalid question ID'),
  body('userAnswer').notEmpty().withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer')
];

const completeSessionValidation = [
  param('sessionId').isInt().withMessage('Invalid session ID'),
  body('attempts').isArray().withMessage('Attempts must be an array'),
  body('attempts.*.question_id').isInt().withMessage('Invalid question ID'),
  body('attempts.*.user_answer').isString().withMessage('User answer must be a string'),
  body('attempts.*.is_correct').isBoolean().withMessage('is_correct must be a boolean'),
  body('attempts.*.time_taken').isInt({ min: 0 }).withMessage('Time taken must be positive')
];

/**
 * Start a new adaptive quiz session
 * POST /api/quiz/start-adaptive
 */
router.post('/start-adaptive', startQuizValidation, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(formatErrorResponse(
        'Validation errors',
        errors.array().map(err => err.msg)
      ));
      return;
    }

    const { sessionType = 'practice', totalQuestions, targetCategories } = req.body;
    const userId = req.user?.id || ''; // userId is string from auth middleware

    if (!userId) {
      res.status(401).json(formatErrorResponse('User not authenticated'));
      return;
    }

    const userIdNum = parseInt(userId);

    // Determine question count based on session type
    let questionCount = totalQuestions;
    if (!questionCount) {
      switch (sessionType) {
        case 'diagnostic':
          questionCount = 44;
          break;
        case 'quick-test':
          questionCount = 5;
          break;
        case 'practice':
        case 'timed':
        default:
          questionCount = 20;
      }
    }

    if (process.env.DEBUG) {
      console.log(`Starting adaptive quiz for user ${userId}: ${sessionType}, ${questionCount} questions`);
    }

    // Generate adaptive quiz
    const result = await AdaptiveQuizGenerator.generateQuiz({
      userId: userIdNum,
      totalQuestions: questionCount,
      sessionType,
      targetCategories
    });

    if (process.env.DEBUG) {
      console.log(`Generated quiz session ${result.sessionId} with ${result.questions.length} questions`);
    }

    res.status(201).json(formatSuccessResponse('Adaptive quiz session started successfully', {
      sessionId: result.sessionId,
      totalQuestions: result.questions.length,
      categoryDistribution: result.categoryDistribution,
      questions: result.questions.map((q, idx) => ({
        id: q.id,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        elo_rating: q.elo_rating,
        category_id: q.category_id,
        category_name: q.category_name,
        order: idx + 1
      }))
    }));

  } catch (error) {
    console.error('Error starting adaptive quiz:', error);
    res.status(500).json(formatErrorResponse(
      'Failed to start adaptive quiz session',
      [error instanceof Error ? error.message : 'Unknown error']
    ));
  }
});

/**
 * Get quiz session questions
 * GET /api/quiz/:sessionId/questions
 */
router.get('/:sessionId/questions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || ''; // userId is string from auth middleware

    if (!userId) {
      res.status(401).json(formatErrorResponse('User not authenticated'));
      return;
    }

    if (!sessionId) {
      res.status(400).json(formatErrorResponse('Session ID is required'));
      return;
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      res.status(404).json(formatErrorResponse('Session not found'));
      return;
    }

    // Get questions for session
    const questions = await AdaptiveQuizGenerator.getSessionQuestions(parseInt(sessionId));

    res.json(formatSuccessResponse('Session questions retrieved', {
      sessionId: parseInt(sessionId),
      totalQuestions: questions.length,
      questions: questions.map((q, idx) => ({
        id: q.id,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        elo_rating: q.elo_rating,
        category_id: q.category_id,
        category_name: q.category_name,
        order: idx + 1
      }))
    }));

  } catch (error) {
    console.error('Error getting session questions:', error);
    res.status(500).json(formatErrorResponse(
      'Failed to retrieve session questions',
      [error instanceof Error ? error.message : 'Unknown error']
    ));
  }
});

/**
 * Submit answer for a question
 * POST /api/quiz/:sessionId/answer
 */
router.post('/:sessionId/answer', submitAnswerValidation, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(formatErrorResponse(
        'Validation errors',
        errors.array().map(err => err.msg)
      ));
      return;
    }

    const { sessionId } = req.params;
    const { questionId, userAnswer, timeSpent } = req.body;
    const userId = req.user?.id || ''; // userId is string from auth middleware

    if (!userId) {
      res.status(401).json(formatErrorResponse('User not authenticated'));
      return;
    }

    if (!sessionId) {
      res.status(400).json(formatErrorResponse('Session ID is required'));
      return;
    }

    // Verify session belongs to user and is active
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      res.status(404).json(formatErrorResponse('Session not found'));
      return;
    }

    if (session.status !== 'active') {
      res.status(400).json(formatErrorResponse('Session is not active'));
      return;
    }

    // Record the attempt
    const attempt = await QuestionAttemptModel.recordAttempt({
      sessionId,
      userId,
      questionId: questionId.toString(),
      userAnswer,
      timeSpent
    });

    res.json(formatSuccessResponse('Answer submitted successfully', {
      attemptId: attempt.id,
      isCorrect: attempt.is_correct,
      timeSpent: attempt.time_spent
    }));

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json(formatErrorResponse(
      'Failed to submit answer',
      [error instanceof Error ? error.message : 'Unknown error']
    ));
  }
});

/**
 * Complete quiz session with all attempts
 * POST /api/quiz/:sessionId/complete
 */
router.post('/:sessionId/complete', completeSessionValidation, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(formatErrorResponse(
        'Validation errors',
        errors.array().map(err => err.msg)
      ));
      return;
    }

    const { sessionId } = req.params;
    const { attempts } = req.body;
    const userId = req.user?.id || ''; // userId is string from auth middleware

    if (!userId) {
      res.status(401).json(formatErrorResponse('User not authenticated'));
      return;
    }

    if (!sessionId) {
      res.status(400).json(formatErrorResponse('Session ID is required'));
      return;
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      res.status(404).json(formatErrorResponse('Session not found'));
      return;
    }

    if (process.env.DEBUG) {
      console.log(`Completing quiz session ${sessionId} with ${attempts.length} attempts`);
    }

    // Complete session and update all statistics
    const result = await QuizCompletionService.completeSession(
      parseInt(sessionId),
      parseInt(userId),
      attempts
    );

    res.json(formatSuccessResponse('Quiz session completed successfully', {
      sessionId: result.sessionId,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      incorrectAnswers: result.incorrectAnswers,
      skippedAnswers: result.skippedAnswers,
      accuracyPercentage: result.accuracyPercentage,
      avgTimePerQuestion: result.avgTimePerQuestion,
      eloChange: result.eloChange,
      newEloRating: result.newEloRating,
      categoryBreakdown: result.categoryBreakdown
    }));
  } catch (error) {
    console.error('Error completing quiz session:', error);
    res.status(500).json(formatErrorResponse(
      'Failed to complete quiz session',
      [error instanceof Error ? error.message : 'Unknown error']
    ));
  }
});

/**
 * Get session summary
 * GET /api/quiz/:sessionId/summary
 */
router.get('/:sessionId/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || ''; // userId is string from auth middleware

    if (!userId) {
      res.status(401).json(formatErrorResponse('User not authenticated'));
      return;
    }

    if (!sessionId) {
      res.status(400).json(formatErrorResponse('Session ID is required'));
      return;
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      res.status(404).json(formatErrorResponse('Session not found'));
      return;
    }

    // Get session summary
    const summary = await QuizCompletionService.getSessionSummary(parseInt(sessionId));

    if (!summary) {
      res.status(404).json(formatErrorResponse('Session summary not found'));
      return;
    }

    res.json(formatSuccessResponse('Session summary retrieved', summary));

  } catch (error) {
    console.error('Error getting session summary:', error);
    res.status(500).json(formatErrorResponse(
      'Failed to retrieve session summary',
      [error instanceof Error ? error.message : 'Unknown error']
    ));
  }
});

export default router;
