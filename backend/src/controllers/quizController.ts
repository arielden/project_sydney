import { Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import QuizSessionModel from '../models/QuizSession';
import QuestionModel from '../models/Question';
import QuestionAttemptModel from '../models/QuestionAttempt';

export const quizController = {
  /**
   * Start a new quiz session
   * POST /api/quiz/start
   */
  async startQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
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

      // Generate adaptive first question (starting with medium difficulty)
      const questions = await QuestionModel.getAdaptiveQuestions(
        1500, // Starting rating
        1, // Just one question
        [] // No previous attempts for first question
      );
      const firstQuestion = questions[0];

      if (!firstQuestion) {
        return res.status(500).json({
          success: false,
          message: 'No questions available'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Quiz session started successfully',
        data: {
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
            question_type: firstQuestion.question_type,
            timeLimit: 120 // 2 minutes default
          },
          totalQuestions: sessionType === 'diagnostic' ? 44 : 20
        }
      });

    } catch (error) {
      console.error('Error starting quiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to start quiz session'
      });
    }
  },

  /**
   * Get next question for a session
   * GET /api/quiz/:sessionId/next
   */
  async getNextQuestion(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      // Verify session belongs to user
      const session = await QuizSessionModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (session.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Session is not active'
        });
      }

      // Get previous attempts
      const attempts = await QuestionAttemptModel.getSessionAttempts(sessionId);
      
      // Check if session should end (20 questions for practice/timed, 44 for diagnostic)
      const maxQuestions = session.session_type === 'diagnostic' ? 44 : 20;
      if (attempts.length >= maxQuestions) {
        // Auto-complete session
        await QuizSessionModel.completeSession(sessionId);
        return res.status(200).json({
          success: true,
          message: 'Quiz completed',
          data: { completed: true }
        });
      }

      // Get current rating (defaulting to 1500 for new players)
      const currentRating = 1500;
      
      // Get adaptive next question
      const answeredQuestionIds = attempts.map((a: any) => a.question_id);
      const questions = await QuestionModel.getAdaptiveQuestions(
        currentRating,
        1, // Just one question
        answeredQuestionIds
      );
      const nextQuestion = questions[0];

      if (!nextQuestion) {
        // No more questions available, complete session
        await QuizSessionModel.completeSession(sessionId);
        return res.status(200).json({
          success: true,
          message: 'No more questions available',
          data: { completed: true }
        });
      }

      res.json({
        success: true,
        data: {
          question: {
            id: nextQuestion.id,
            question_text: nextQuestion.question_text,
            options: nextQuestion.options,
            difficulty_rating: nextQuestion.difficulty_rating,
            question_type: nextQuestion.question_type,
            questionNumber: attempts.length + 1,
            totalQuestions: maxQuestions,
            timeLimit: 120
          },
          progress: {
            current: attempts.length + 1,
            total: maxQuestions
          }
        }
      });

    } catch (error) {
      console.error('Error getting next question:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get next question'
      });
    }
  },

  /**
   * Submit answer for a question
   * POST /api/quiz/:sessionId/answer
   */
  async submitAnswer(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { questionId, userAnswer, timeSpent } = req.body;
      const userId = req.user?.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      // Verify session belongs to user
      const session = await QuizSessionModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (session.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Session is not active'
        });
      }

      // Get question details
      const question = await QuestionModel.getQuestionById(questionId);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      // Check if already answered
      const hasAttempted = await QuestionAttemptModel.hasAttempted(sessionId, questionId);
      if (hasAttempted) {
        return res.status(400).json({
          success: false,
          message: 'Question already answered'
        });
      }

      // Evaluate answer
      const isCorrect = question.correct_answer === userAnswer;
      
      // Save attempt
      const attempt = await QuestionAttemptModel.recordAttempt({
        sessionId,
        questionId,
        userId: userId!,
        userAnswer,
        timeSpent
      });

      res.json({
        success: true,
        message: 'Answer submitted successfully',
        data: {
          attempt: {
            id: attempt.id,
            isCorrect,
            correctAnswer: question.correct_answer,
            explanation: question.explanation
          }
        }
      });

    } catch (error) {
      console.error('Error submitting answer:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit answer'
      });
    }
  },

  /**
   * Pause quiz session
   * POST /api/quiz/:sessionId/pause
   */
  async pauseQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      // Verify session belongs to user
      const session = await QuizSessionModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (session.status !== 'active' || session.is_paused) {
        return res.status(400).json({
          success: false,
          message: 'Session cannot be paused'
        });
      }

      await QuizSessionModel.pauseSession(sessionId);

      res.json({
        success: true,
        message: 'Session paused successfully'
      });

    } catch (error) {
      console.error('Error pausing quiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to pause quiz'
      });
    }
  },

  /**
   * Resume quiz session
   * POST /api/quiz/:sessionId/resume
   */
  async resumeQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      // Verify session belongs to user
      const session = await QuizSessionModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (session.status !== 'active' || !session.is_paused) {
        return res.status(400).json({
          success: false,
          message: 'Session cannot be resumed'
        });
      }

      await QuizSessionModel.resumeSession(sessionId);

      res.json({
        success: true,
        message: 'Session resumed successfully'
      });

    } catch (error) {
      console.error('Error resuming quiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to resume quiz'
      });
    }
  },

  /**
   * Complete quiz session
   * POST /api/quiz/:sessionId/complete
   */
  async completeQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      // Verify session belongs to user
      const session = await QuizSessionModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (session.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Session is not active'
        });
      }

      // Complete session
      const completedSession = await QuizSessionModel.completeSession(sessionId);

      res.json({
        success: true,
        message: 'Quiz completed successfully',
        data: {
          sessionId,
          completedAt: completedSession.end_time,
          status: 'completed'
        }
      });

    } catch (error) {
      console.error('Error completing quiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete quiz'
      });
    }
  },

  /**
   * Abandon quiz session
   * POST /api/quiz/:sessionId/abandon
   */
  async abandonQuiz(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      // Verify session belongs to user
      const session = await QuizSessionModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Abandon the session
      await QuizSessionModel.abandonSession(sessionId);

      res.json({
        success: true,
        message: 'Quiz session abandoned successfully'
      });

    } catch (error) {
      console.error('Error abandoning quiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to abandon quiz'
      });
    }
  },

  /**
   * Get quiz results
   * GET /api/quiz/:sessionId/results
   */
  async getQuizResults(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      // Verify session belongs to user
      const session = await QuizSessionModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Get detailed results
      const results = await QuestionAttemptModel.getSessionResults(sessionId);

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Error getting quiz results:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get quiz results'
      });
    }
  },

  /**
   * Get current session status
   * GET /api/quiz/:sessionId/status
   */
  async getSessionStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      const session = await QuizSessionModel.getSession(sessionId);
      if (!session || session.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Get current progress
      const attempts = await QuestionAttemptModel.getSessionAttempts(sessionId);
      const totalQuestions = session.session_type === 'diagnostic' ? 44 : 20;
      const elapsedTime = await QuizSessionModel.getSessionElapsedTime(sessionId);

      res.json({
        success: true,
        data: {
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
        }
      });

    } catch (error) {
      console.error('Error getting session status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get session status'
      });
    }
  },


};

// Validation middleware
export const startQuizValidation = [
  body('sessionType')
    .isIn(['practice', 'diagnostic', 'timed'])
    .withMessage('Session type must be practice, diagnostic, or timed')
];

export const submitAnswerValidation = [
  param('sessionId').isUUID().withMessage('Invalid session ID'),
  body('questionId').isUUID().withMessage('Invalid question ID'),
  body('userAnswer').notEmpty().withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer')
];

export const sessionParamValidation = [
  param('sessionId').isUUID().withMessage('Invalid session ID')
];