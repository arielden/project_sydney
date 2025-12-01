import express from 'express';
import { 
  quizController,
  startQuizValidation,
  submitAnswerValidation,
  sessionParamValidation
} from '../controllers/quizController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All quiz routes require authentication
router.use(authenticateToken);

/**
 * POST /api/quiz/start
 * Start a new quiz session
 */
router.post('/start', startQuizValidation, quizController.startQuiz);

/**
 * GET /api/quiz/:sessionId/next
 * Get next question for a session
 */
router.get('/:sessionId/next', sessionParamValidation, quizController.getNextQuestion);

/**
 * POST /api/quiz/:sessionId/answer
 * Submit answer for a question
 */
router.post('/:sessionId/answer', submitAnswerValidation, quizController.submitAnswer);

/**
 * POST /api/quiz/:sessionId/pause
 * Pause quiz session
 */
router.post('/:sessionId/pause', sessionParamValidation, quizController.pauseQuiz);

/**
 * POST /api/quiz/:sessionId/resume
 * Resume quiz session
 */
router.post('/:sessionId/resume', sessionParamValidation, quizController.resumeQuiz);

/**
 * POST /api/quiz/:sessionId/complete
 * Complete quiz session
 */
router.post('/:sessionId/complete', sessionParamValidation, quizController.completeQuiz);

/**
 * POST /api/quiz/:sessionId/abandon
 * Abandon quiz session
 */
router.post('/:sessionId/abandon', sessionParamValidation, quizController.abandonQuiz);

/**
 * GET /api/quiz/:sessionId/results
 * Get quiz results
 */
router.get('/:sessionId/results', sessionParamValidation, quizController.getQuizResults);

/**
 * GET /api/quiz/:sessionId/status
 * Get current session status and progress
 */
router.get('/:sessionId/status', sessionParamValidation, quizController.getSessionStatus);

export default router;