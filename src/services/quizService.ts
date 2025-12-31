import api, { apiHelpers } from './api';

/**
 * Quiz session interface
 */
export interface QuizSession {
  id: string;
  session_type: 'practice' | 'diagnostic' | 'timed';
  status: 'active' | 'completed' | 'abandoned';
  start_time: string;
  end_time?: string;
  is_paused: boolean;
  user_id: string;
}

/**
 * Quiz question interface
 */
export interface QuizQuestion {
  id: string;
  question_text: string;
  options: Array<{ id: string; text: string }>;
  difficulty_rating: number;
  elo_rating?: number;
  question_type: string;
  category_id?: string;
  expected_score?: number;
  appropriateness_score?: number;
  questionNumber: number;
  totalQuestions: number;
  timeLimit: number;
}

/**
 * Quiz answer submission interface
 */
export interface QuizAnswerSubmission {
  sessionId: string;
  questionId: string;
  userAnswer: string;
  timeSpent: number;
}

/**
 * Quiz attempt result interface
 */
export interface QuizAttemptResult {
  id: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

/**
 * Quiz results interface
 */
export interface QuizResults {
  session: QuizSession;
  attempts: Array<{
    question: QuizQuestion;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalTime: number;
    averageTime: number;
  };
}

/**
 * Quiz service - handles all quiz-related API calls
 */
export const quizService = {
  /**
   * Start a new quiz session
   * @param sessionType - Type of quiz session to start
   * @param forceNew - Whether to abandon existing sessions
   * @returns Promise<{session: QuizSession, question: QuizQuestion, totalQuestions: number}>
   */
  async startQuizSession(sessionType: 'practice' | 'diagnostic' | 'timed', forceNew: boolean = true) {
    try {
      const response = await api.post('/quiz/start', { sessionType, forceNew });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to start quiz session');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get next question for a quiz session
   * @param sessionId - Quiz session identifier
   * @returns Promise<{question: QuizQuestion, progress: object} | {completed: boolean}>
   */
  async getNextQuestion(sessionId: string) {
    try {
      const response = await api.get(`/quiz/${sessionId}/next`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get next question');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get all questions for a quiz session (for local navigation)
   * @param sessionId - Quiz session identifier
   * @returns Promise<{questions: QuizQuestion[], totalQuestions: number}>
   */
  async getAllQuestions(sessionId: string) {
    try {
      const response = await api.get(`/quiz/${sessionId}/questions`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get questions');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Submit answer for a quiz question
   * @param sessionId - Quiz session identifier
   * @param questionId - Question identifier
   * @param userAnswer - User's selected answer
   * @param timeSpent - Time spent on question in seconds
   * @returns Promise<QuizAttemptResult>
   */
  async submitAnswer(sessionId: string, questionId: string, userAnswer: string, timeSpent: number): Promise<QuizAttemptResult> {
    try {
      const response = await api.post(`/quiz/${sessionId}/answer`, {
        questionId,
        userAnswer,
        timeSpent
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to submit answer');
      }
      
      return response.data.data.attempt;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Submit all answers for a quiz session at once
   * @param sessionId - Quiz session identifier
   * @param answers - Array of answer objects with questionId, userAnswer, timeSpent
   * @returns Promise<{sessionId: string, completedAt: string, status: string, results: any[]}>
   */
  async submitBatchAnswers(sessionId: string, answers: Array<{questionId: number, userAnswer: string, timeSpent: number}>) {
    try {
      const response = await api.post(`/quiz/${sessionId}/batch-submit`, {
        answers
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to submit quiz answers');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Pause a quiz session
   * @param sessionId - Quiz session identifier
   * @returns Promise<void>
   */
  async pauseQuizSession(sessionId: string): Promise<void> {
    try {
      const response = await api.post(`/quiz/${sessionId}/pause`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to pause quiz session');
      }
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Resume a paused quiz session
   * @param sessionId - Quiz session identifier
   * @returns Promise<void>
   */
  async resumeQuizSession(sessionId: string): Promise<void> {
    try {
      const response = await api.post(`/quiz/${sessionId}/resume`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to resume quiz session');
      }
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Complete a quiz session
   * @param sessionId - Quiz session identifier
   * @returns Promise<{sessionId: string, completedAt: string, status: string}>
   */
  async completeQuizSession(sessionId: string) {
    try {
      const response = await api.post(`/quiz/${sessionId}/complete`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to complete quiz session');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Abandon a quiz session
   * @param sessionId - Quiz session identifier
   * @returns Promise<void>
   */
  async abandonQuizSession(sessionId: string): Promise<void> {
    try {
      const response = await api.post(`/quiz/${sessionId}/abandon`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to abandon quiz session');
      }
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get quiz session results
   * @param sessionId - Quiz session identifier
   * @returns Promise<QuizResults>
   */
  async getQuizResults(sessionId: string): Promise<QuizResults> {
    try {
      const response = await api.get(`/quiz/${sessionId}/results`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get quiz results');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get quiz session status and progress
   * @param sessionId - Quiz session identifier
   * @returns Promise<{session: object, progress: object}>
   */
  async getQuizSessionStatus(sessionId: string) {
    try {
      const response = await api.get(`/quiz/${sessionId}/status`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get session status');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },
};

export default quizService;