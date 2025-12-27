import express, { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import QuizSessionModel from '../models/QuizSession';
import QuestionModel from '../models/Question';
import QuestionAttemptModel from '../models/QuestionAttempt';
import AdaptiveSelectionService from '../utils/adaptiveSelection';
import { formatErrorResponse, formatSuccessResponse } from '../utils/helpers';
import pool from '../config/database';
import { DEFAULT_ELO } from '../config/eloConstants';

const router = express.Router();

// All quiz routes require authentication
router.use(authenticateToken);

// Validation middleware
const startQuizValidation = [
  body('sessionType')
    .isIn(['practice', 'diagnostic', 'timed'])
    .withMessage('Session type must be practice, diagnostic, or timed')
];

const submitAnswerValidation = [
  param('sessionId').isInt().withMessage('Invalid session ID'),
  body('questionId').isInt().withMessage('Invalid question ID'),
  body('userAnswer').notEmpty().withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer')
];

const sessionParamValidation = [
  param('sessionId').isInt().withMessage('Invalid session ID')
];

/**
 * Start a new quiz session handler
 * POST /api/quiz/start
 */
async function handleStartQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(formatErrorResponse(
        'Validation errors',
        errors.array().map(err => err.msg)
      ));
    }

    const { sessionType, forceNew } = req.body;
    const userId = req.user?.id;

    // If forceNew is true, abandon any existing sessions
    if (forceNew) {
      const activeSessions = await QuizSessionModel.getUserActiveSessions(userId!);
      for (const session of activeSessions) {
        await QuizSessionModel.abandonSession(session.id);
      }
    }

    // Create new session
    const session = await QuizSessionModel.createSession({
      userId: userId!,
      sessionType: sessionType
    });

    // Generate adaptive first question (starting around default difficulty)
    const questions = await QuestionModel.getAdaptiveQuestions(
      DEFAULT_ELO, // Starting rating (medium difficulty)
      1, // Just one question
      [] // No previous attempts for first question
    );

    let firstQuestion = questions[0];

    // Fallback to a random question if adaptive selection returns nothing
    if (!firstQuestion) {
      console.log('⚠️ Adaptive selection returned no questions; falling back to random selection');
      const questionResult = await pool.query(`
        SELECT id, question_text, options, difficulty_rating, 
               COALESCE(elo_rating, $1) as elo_rating, 
               COALESCE(qc.category_id, 0) as category_id, correct_answer, explanation
        FROM questions q
        LEFT JOIN question_categories qc ON q.id = qc.question_id AND qc.is_primary = true
        ORDER BY RANDOM() LIMIT 1
      `, [DEFAULT_ELO]);
      firstQuestion = questionResult.rows[0];

      if (!firstQuestion) {
        return res.status(500).json(formatErrorResponse('No questions available'));
      }
    }

    res.status(201).json(formatSuccessResponse(
      'Quiz session started successfully',
      {
        session: {
          id: session.id,
          session_type: session.session_type,
          status: session.status,
          start_time: session.start_time,
          is_paused: session.is_paused,
          user_id: session.user_id
        },
        question: {
          id: firstQuestion.id,
          question_text: firstQuestion.question_text,
          options: firstQuestion.options,
          difficulty_rating: firstQuestion.difficulty_rating,
          timeLimit: 120 // 2 minutes default
        },
        totalQuestions: sessionType === 'diagnostic' ? 44 : 20
      }
    ));

  } catch (error) {
    console.error('Error starting quiz:', error);
    return res.status(500).json(formatErrorResponse('Failed to start quiz session'));
  }
}

/**
 * Get next question for a session handler
 * GET /api/quiz/:sessionId/next
 */
async function handleGetNextQuestion(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    if (session.status !== 'active') {
      return res.status(400).json(formatErrorResponse('Session is not active'));
    }

    // Get previous attempts
    const attempts = await QuestionAttemptModel.getSessionAttempts(sessionId);
    
    // Check if session should end (20 questions for practice/timed, 44 for diagnostic)
    const maxQuestions = session.session_type === 'diagnostic' ? 44 : 20;
    if (attempts.length >= maxQuestions) {
      // Auto-complete session
      await QuizSessionModel.completeSession(sessionId);
      return res.status(200).json(formatSuccessResponse(
        'Quiz completed',
        { completed: true }
      ));
    }

    // Use adaptive question selection based on user performance
    let question;
    try {
      const adaptiveQuestion = await AdaptiveSelectionService.selectNextBestQuestion(
        userId,
        sessionId
      );
      question = adaptiveQuestion;
    } catch (adaptiveError) {
      console.log('⚠️ Adaptive selection failed, falling back to random:', adaptiveError instanceof Error ? adaptiveError.message : 'Unknown error');
      
      // Fallback to random selection if adaptive fails
      const attemptedQuestionIds = attempts.map(attempt => attempt.question_id);
      const questionQuery = `
        SELECT id, question_text, options, difficulty_rating, 
               COALESCE(elo_rating, $1) as elo_rating, 
               COALESCE(qc.category_id, 0) as category_id, correct_answer, explanation
        FROM questions q
        LEFT JOIN question_categories qc ON q.id = qc.question_id AND qc.is_primary = true
        WHERE q.id NOT IN (${attemptedQuestionIds.map((_, i) => `$${i + 1}`).join(', ') || 'NULL'})
        ORDER BY RANDOM() 
        LIMIT 1
      `;
      
      const params = attemptedQuestionIds.length > 0 ? [...attemptedQuestionIds, DEFAULT_ELO] : [DEFAULT_ELO];
      const questionResult = await pool.query(questionQuery, params);
      question = questionResult.rows[0];
    }

    if (!question) {
      // No more suitable questions available, complete session
      await QuizSessionModel.completeSession(sessionId);
      return res.status(200).json(formatSuccessResponse(
        'No more questions available',
        { completed: true }
      ));
    }

    // Ensure question has required properties for response
    const nextQuestion = {
      ...question,
      expected_score: question.expected_score || 0.5, // Default 50% expected score
      appropriateness_score: question.appropriateness_score || 0.8 // Default appropriateness
    };

    res.json(formatSuccessResponse('Next question retrieved', {
      question: {
        id: nextQuestion.id,
        question_text: nextQuestion.question_text,
        options: nextQuestion.options,
        difficulty_rating: nextQuestion.difficulty_rating,
        elo_rating: nextQuestion.elo_rating,
        category_id: nextQuestion.category_id,
        expected_score: nextQuestion.expected_score,
        appropriateness_score: nextQuestion.appropriateness_score,
        questionNumber: attempts.length + 1,
        totalQuestions: maxQuestions,
        timeLimit: 120
      },
      progress: {
        current: attempts.length + 1,
        total: maxQuestions
      },
      adaptive_info: {
        expected_score: Math.round(nextQuestion.expected_score * 100) / 100,
        appropriateness: Math.round(nextQuestion.appropriateness_score * 100) / 100,
        difficulty_level: nextQuestion.elo_rating < 600 ? 'Easy' : 
                         nextQuestion.elo_rating < 700 ? 'Medium' : 'Hard'
      }
    }));

  } catch (error) {
    console.error('Error getting next question:', error);
    return res.status(500).json(formatErrorResponse('Failed to get next question'));
  }
}

/**
 * Submit answer for a question handler
 * POST /api/quiz/:sessionId/answer
 */
async function handleSubmitAnswer(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    console.log('🎯 Answer submission started:', { 
      sessionId: req.params.sessionId, 
      body: req.body, 
      userId: req.user?.id 
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json(formatErrorResponse(
        'Validation errors',
        errors.array().map(err => err.msg)
      ));
    }

    const { sessionId } = req.params;
    const { questionId, userAnswer, timeSpent } = req.body;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    if (session.status !== 'active') {
      return res.status(400).json(formatErrorResponse('Session is not active'));
    }

    // Get question details
    const question = await QuestionModel.getQuestionById(questionId);
    
    if (!question) {
      return res.status(404).json(formatErrorResponse('Question not found'));
    }

    // Check if already answered
    const hasAttempted = await QuestionAttemptModel.hasAttempted(sessionId, questionId);
    
    if (hasAttempted) {
      return res.status(400).json(formatErrorResponse('Question already answered'));
    }

    // Evaluate answer
    const isCorrect = question.correct_answer === userAnswer;
    
    // Save attempt
    console.log('💾 Recording attempt...');
    try {
      const attempt = await QuestionAttemptModel.recordAttempt({
        sessionId,
        questionId,
        userId: userId!,
        userAnswer,
        timeSpent
      });

      const responseData = {
        attempt: {
          id: attempt.id,
          isCorrect,
          correctAnswer: question.correct_answer,
          explanation: question.explanation
        }
      };

      res.json(formatSuccessResponse('Answer submitted successfully', responseData));
    } catch (err: any) {
      // Handle duplicate submissions gracefully
      if (err.message && err.message.includes('already answered')) {
        return res.status(400).json(formatErrorResponse('Question already answered', ['This question has already been answered in this session']));
      }

      throw err;
    }

  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json(formatErrorResponse('Failed to submit answer'));
  }
}

/**
 * Pause quiz session handler
 * POST /api/quiz/:sessionId/pause
 */
async function handlePauseQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    if (session.status !== 'active' || session.is_paused) {
      return res.status(400).json(formatErrorResponse('Session cannot be paused'));
    }

    await QuizSessionModel.pauseSession(sessionId);

    res.json(formatSuccessResponse('Session paused successfully'));

  } catch (error) {
    console.error('Error pausing quiz:', error);
    return res.status(500).json(formatErrorResponse('Failed to pause quiz'));
  }
}

/**
 * Resume quiz session handler
 * POST /api/quiz/:sessionId/resume
 */
async function handleResumeQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    if (session.status !== 'active' || !session.is_paused) {
      return res.status(400).json(formatErrorResponse('Session cannot be resumed'));
    }

    await QuizSessionModel.resumeSession(sessionId);

    res.json(formatSuccessResponse('Session resumed successfully'));

  } catch (error) {
    console.error('Error resuming quiz:', error);
    return res.status(500).json(formatErrorResponse('Failed to resume quiz'));
  }
}

/**
 * Complete quiz session handler
 * POST /api/quiz/:sessionId/complete
 */
async function handleCompleteQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    if (session.status !== 'active') {
      return res.status(400).json(formatErrorResponse('Session is not active'));
    }

    // Complete session
    const completedSession = await QuizSessionModel.completeSession(sessionId);

    res.json(formatSuccessResponse('Quiz completed successfully', {
      sessionId,
      completedAt: completedSession.end_time,
      status: 'completed'
    }));

  } catch (error) {
    console.error('Error completing quiz:', error);
    return res.status(500).json(formatErrorResponse('Failed to complete quiz'));
  }
}

/**
 * Abandon quiz session handler
 * POST /api/quiz/:sessionId/abandon
 */
async function handleAbandonQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    // Abandon the session
    await QuizSessionModel.abandonSession(sessionId);

    res.json(formatSuccessResponse('Quiz session abandoned successfully'));

  } catch (error) {
    console.error('Error abandoning quiz:', error);
    return res.status(500).json(formatErrorResponse('Failed to abandon quiz'));
  }
}

/**
 * Get quiz results handler
 * GET /api/quiz/:sessionId/results
 */
async function handleGetQuizResults(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    // Get detailed results
    const results = await QuestionAttemptModel.getSessionResults(sessionId);

    res.json(formatSuccessResponse('Quiz results retrieved successfully', results));

  } catch (error) {
    console.error('Error getting quiz results:', error);
    return res.status(500).json(formatErrorResponse('Failed to get quiz results'));
  }
}

/**
 * Get current session status handler
 * GET /api/quiz/:sessionId/status
 */
async function handleGetSessionStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    // Get current progress
    const attempts = await QuestionAttemptModel.getSessionAttempts(sessionId);
    const totalQuestions = session.session_type === 'diagnostic' ? 44 : 20;
    const elapsedTime = await QuizSessionModel.getSessionElapsedTime(sessionId);

    res.json(formatSuccessResponse('Session status retrieved successfully', {
      session: {
        id: session.id,
        type: session.session_type,
        status: session.status,
        isPaused: session.is_paused,
        startTime: session.start_time,
        endTime: session.end_time
      },
      progress: {
        totalQuestions,
        answeredQuestions: attempts.length,
        elapsedTime
      }
    }));

  } catch (error) {
    console.error('Error getting session status:', error);
    return res.status(500).json(formatErrorResponse('Failed to get session status'));
  }
}

// Routes

/**
 * POST /api/quiz/start
 * Start a new quiz session
 */
router.post('/start', startQuizValidation, handleStartQuiz);

/**
 * GET /api/quiz/:sessionId/next
 * Get next question for a session
 */
router.get('/:sessionId/next', sessionParamValidation, handleGetNextQuestion);

/**
 * POST /api/quiz/:sessionId/answer
 * Submit answer for a question
 */
router.post('/:sessionId/answer', submitAnswerValidation, handleSubmitAnswer);

/**
 * POST /api/quiz/:sessionId/pause
 * Pause quiz session
 */
router.post('/:sessionId/pause', sessionParamValidation, handlePauseQuiz);

/**
 * POST /api/quiz/:sessionId/resume
 * Resume quiz session
 */
router.post('/:sessionId/resume', sessionParamValidation, handleResumeQuiz);

/**
 * POST /api/quiz/:sessionId/complete
 * Complete quiz session
 */
router.post('/:sessionId/complete', sessionParamValidation, handleCompleteQuiz);

/**
 * POST /api/quiz/:sessionId/abandon
 * Abandon quiz session
 */
router.post('/:sessionId/abandon', sessionParamValidation, handleAbandonQuiz);

/**
 * GET /api/quiz/:sessionId/results
 * Get quiz results
 */
router.get('/:sessionId/results', sessionParamValidation, handleGetQuizResults);

/**
 * GET /api/quiz/:sessionId/status
 * Get current session status and progress
 */
router.get('/:sessionId/status', sessionParamValidation, handleGetSessionStatus);

/**
 * GET /api/quiz/adaptive/priorities
 * Get category priorities for adaptive learning (temporarily disabled)
 */
async function handleGetAdaptivePriorities(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const userId = req.user!.id;
    
    // Get user's category priorities using AdaptiveSelectionService
    const priorities = await AdaptiveSelectionService.getCategoryPriorities(userId);
    
    res.json(formatSuccessResponse('Category priorities retrieved', {
      priorities
    }));
  } catch (error) {
    console.error('Error getting adaptive priorities:', error);
    return res.status(500).json(formatErrorResponse('Failed to get adaptive priorities'));
  }
}

/**
 * POST /api/quiz/adaptive/question
 * Get adaptive question for specific category (temporarily disabled)
 */
async function handleGetAdaptiveQuestion(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    // Use adaptive selection to get best question for category
    const categoryId = req.body.categoryId; // Get categoryId from request body
    const question = await AdaptiveSelectionService.selectNextBestQuestion(
      userId!,
      sessionId,
      categoryId
    );

    if (!question) {
      return res.status(404).json(formatErrorResponse('No suitable questions found'));
    }

    // Add default values
    question.expected_score = 0.5;
    question.appropriateness_score = 0.8;
    
    res.json(formatSuccessResponse('Adaptive question retrieved', {
      question: {
        id: question.id,
        question_text: question.question_text,
        options: question.options,
        difficulty_rating: question.difficulty_rating,
        elo_rating: question.elo_rating,
        category_id: question.category_id,
        expected_score: question.expected_score,
        appropriateness_score: question.appropriateness_score,
        timeLimit: 120
      },
      adaptive_info: {
        expected_score: Math.round(question.expected_score * 100) / 100,
        appropriateness: Math.round(question.appropriateness_score * 100) / 100,
        difficulty_level: question.elo_rating < 1300 ? 'Easy' : 
                         question.elo_rating < 1500 ? 'Medium' : 'Hard'
      }
    }));

  } catch (error) {
    console.error('Error getting adaptive question:', error);
    return res.status(500).json(formatErrorResponse('Failed to get adaptive question'));
  }
}

/**
 * GET /api/quiz/adaptive/recommendation/:categoryId
 * Get difficulty recommendation for a category (temporarily disabled)
 */
async function handleGetDifficultyRecommendation(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { categoryId } = req.params;
    const userId = req.user!.id;
    
    if (!categoryId) {
      return res.status(400).json(formatErrorResponse('Category ID is required'));
    }
    
    // Get difficulty recommendation using AdaptiveSelectionService
    const recommendation = await AdaptiveSelectionService.getRecommendedDifficulty(
      userId,
      categoryId
    );
    
    res.json(formatSuccessResponse('Difficulty recommendation retrieved', {
      category_id: categoryId,
      recommended_level: recommendation.level,
      user_rating: recommendation.rating
    }));
    
  } catch (error) {
    console.error('Error getting difficulty recommendation:', error);
    return res.status(500).json(formatErrorResponse('Failed to get difficulty recommendation'));
  }
}

router.get('/adaptive/priorities', handleGetAdaptivePriorities);
router.post('/adaptive/question', [
  body('sessionId').isInt().withMessage('Invalid session ID'),
  body('categoryId').optional().isString(),
  body('targetDifficulty').optional().isIn(['auto', 'easy', 'medium', 'hard'])
], handleGetAdaptiveQuestion);
router.get('/adaptive/recommendation/:categoryId', [
  param('categoryId').isString().withMessage('Invalid category ID')
], handleGetDifficultyRecommendation);

/**
 * Get all questions for a quiz session
 * GET /api/quiz/:sessionId/questions
 * Returns all questions for the session at once for local navigation
 */
async function handleGetAllQuestions(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      return res.status(400).json(formatErrorResponse('Session ID is required'));
    }

    // Verify session belongs to user
    const session = await QuizSessionModel.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      return res.status(404).json(formatErrorResponse('Session not found'));
    }

    if (session.status !== 'active') {
      return res.status(400).json(formatErrorResponse('Session is not active'));
    }

    // Determine total questions based on session type
    const maxQuestions = session.session_type === 'diagnostic' ? 44 : 20;

    // Get all questions for this session (randomly selected, not based on adaptive algorithm)
    // This allows for free navigation forward and backward
    // Use DISTINCT ON to ensure no duplicate questions
    const questionsQuery = `
      SELECT DISTINCT ON(q.id)
        q.id, q.question_text, q.options, q.difficulty_rating, 
        COALESCE(q.elo_rating, $2) as elo_rating, 
        COALESCE(qc.category_id, 0) as category_id, q.correct_answer, q.explanation
      FROM questions q
      LEFT JOIN question_categories qc ON q.id = qc.question_id AND qc.is_primary = true
      ORDER BY q.id, RANDOM() 
      LIMIT $1
    `;
    
    const questionsResult = await pool.query(questionsQuery, [maxQuestions, DEFAULT_ELO]);
    const questions = questionsResult.rows;

    if (questions.length === 0) {
      return res.status(500).json(formatErrorResponse('No questions available'));
    }

    // Format questions with indices
    const formattedQuestions = questions.map((q, index) => ({
      id: q.id,
      question_text: q.question_text,
      options: q.options,
      difficulty_rating: q.difficulty_rating,
      elo_rating: q.elo_rating,
      category_id: q.category_id,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      questionNumber: index + 1,
      totalQuestions: questions.length,
      timeLimit: 120
    }));

    res.json(formatSuccessResponse('All questions retrieved', {
      questions: formattedQuestions,
      totalQuestions: formattedQuestions.length
    }));

  } catch (error) {
    console.error('Error getting all questions:', error);
    return res.status(500).json(formatErrorResponse('Failed to get questions'));
  }
}

router.get('/:sessionId/questions', sessionParamValidation, handleGetAllQuestions);

export default router;