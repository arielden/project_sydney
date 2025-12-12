import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { quizService } from '../services/quizService';

// Types
export interface Question {
  id: string;
  question_text: string;
  options: Array<{ id: string; text: string }>;
  question_type: string;
  difficulty_rating: number;
  elo_rating?: number;
  category_id?: string;
  expected_score?: number;
  appropriateness_score?: number;
  correct_answer: string;
  explanation?: string;
  questionNumber?: number;
  totalQuestions?: number;
}

export interface QuizSession {
  id: string;
  session_type: 'practice' | 'diagnostic' | 'timed';
  status: 'active' | 'completed' | 'abandoned';
  start_time: string;
  end_time?: string;
  is_paused: boolean;
  total_pause_duration: number;
  user_id: string;
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  timeSpent: number;
  questionNumber: number;
}

export interface QuizProgress {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  elapsedTime: number;
}

export interface QuizScore {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  totalTimeSpent: number;
  averageTimePerQuestion: number;
}

interface QuizState {
  // Session data
  currentSession: QuizSession | null;
  currentQuestion: Question | null;
  questions: Question[]; // All questions for the session
  currentQuestionIndex: number; // 0-indexed
  questionNumber: number;
  totalQuestions: number;
  
  // User data
  answers: QuizAnswer[];
  timeElapsed: number;
  isPaused: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isMarkedForReview: boolean;
  
  // Results
  quizResults: any | null;
}

// Actions
type QuizAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'START_QUIZ_SUCCESS'; payload: { session: QuizSession; question: Question; totalQuestions: number } }
  | { type: 'LOAD_ALL_QUESTIONS'; payload: { questions: Question[]; totalQuestions: number } }
  | { type: 'GO_TO_QUESTION'; payload: number }
  | { type: 'LOAD_QUESTION'; payload: Question }
  | { type: 'NO_MORE_QUESTIONS' }
  | { type: 'SUBMIT_ANSWER'; payload: QuizAnswer }
  | { type: 'PAUSE_QUIZ' }
  | { type: 'RESUME_QUIZ' }
  | { type: 'COMPLETE_QUIZ'; payload: { session: QuizSession; score: QuizScore } }
  | { type: 'SET_TIME_ELAPSED'; payload: number }
  | { type: 'TOGGLE_MARK_FOR_REVIEW' }
  | { type: 'LOAD_QUIZ_RESULTS'; payload: any }
  | { type: 'RESET_QUIZ' };

// Initial state
const initialState: QuizState = {
  currentSession: null,
  currentQuestion: null,
  questions: [],
  currentQuestionIndex: 0,
  questionNumber: 0,
  totalQuestions: 0,
  answers: [],
  timeElapsed: 0,
  isPaused: false,
  isLoading: false,
  error: null,
  isMarkedForReview: false,
  quizResults: null,
};

// Reducer
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
      
    case 'START_QUIZ_SUCCESS':
      return {
        ...state,
        currentSession: action.payload.session,
        currentQuestion: action.payload.question,
        questions: [], // Will be populated by LOAD_ALL_QUESTIONS
        currentQuestionIndex: 0,
        questionNumber: action.payload.question.questionNumber || 1,
        totalQuestions: action.payload.totalQuestions,
        answers: [],
        timeElapsed: 0,
        isPaused: false,
        isLoading: false,
        error: null,
        isMarkedForReview: false,
      };
    
    case 'LOAD_ALL_QUESTIONS':
      return {
        ...state,
        questions: action.payload.questions,
        totalQuestions: action.payload.totalQuestions,
        currentQuestion: action.payload.questions[0] || null,
        currentQuestionIndex: 0,
        questionNumber: 1,
        isLoading: false,
      };
    
    case 'GO_TO_QUESTION':
      const newIndex = action.payload;
      const targetQuestion = state.questions[newIndex];
      if (!targetQuestion || newIndex < 0 || newIndex >= state.questions.length) {
        return state;
      }
      return {
        ...state,
        currentQuestion: targetQuestion,
        currentQuestionIndex: newIndex,
        questionNumber: newIndex + 1,
        isMarkedForReview: false, // Reset review state for new question
      };
      
    case 'LOAD_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
        questionNumber: action.payload?.questionNumber || state.questionNumber + 1,
        isMarkedForReview: false,
        isLoading: false,
      };
      
    case 'NO_MORE_QUESTIONS':
      return {
        ...state,
        currentQuestion: null,
        isLoading: false,
        error: null,
      };
      
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        answers: [...state.answers, action.payload],
        isLoading: false,
      };
      
    case 'PAUSE_QUIZ':
      return {
        ...state,
        isPaused: true,
        currentSession: state.currentSession ? {
          ...state.currentSession,
          is_paused: true
        } : null,
      };
      
    case 'RESUME_QUIZ':
      return {
        ...state,
        isPaused: false,
        currentSession: state.currentSession ? {
          ...state.currentSession,
          is_paused: false
        } : null,
      };
      
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        currentSession: action.payload.session,
        isPaused: false,
        isLoading: false,
      };
      
    case 'SET_TIME_ELAPSED':
      return {
        ...state,
        timeElapsed: action.payload,
      };
      
    case 'TOGGLE_MARK_FOR_REVIEW':
      return {
        ...state,
        isMarkedForReview: !state.isMarkedForReview,
      };
      
    case 'LOAD_QUIZ_RESULTS':
      return {
        ...state,
        quizResults: action.payload,
        isLoading: false,
      };
      
    case 'RESET_QUIZ':
      return initialState;
      
    default:
      return state;
  }
}

// Context
interface QuizContextType {
  // State
  currentSession: QuizSession | null;
  currentQuestion: Question | null;
  questions: Question[];
  currentQuestionIndex: number;
  questionNumber: number;
  totalQuestions: number;
  answers: QuizAnswer[];
  timeElapsed: number;
  isPaused: boolean;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  isMarkedForReview: boolean;
  quizResults: any | null;
  
  // Functions
  startQuiz: (config: any) => Promise<string>;
  loadAllQuestions: (sessionId: string) => Promise<void>;
  goToQuestion: (index: number) => void;
  submitAnswer: (userAnswer: string, markedForReview?: boolean) => Promise<any>;
  nextQuestion: () => Promise<boolean>;
  getNextQuestion: () => Promise<void>;
  pauseQuiz: () => Promise<void>;
  resumeQuiz: () => Promise<void>;
  completeQuiz: () => Promise<void>;
  exitQuiz: () => Promise<void>;
  getQuizResults: (sessionId: string) => Promise<any>;
  toggleMarkForReview: () => void;
  resetQuiz: () => void;
  setTimeElapsed: (time: number) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Provider
export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Start a new quiz session
  const startQuiz = useCallback(async (config: any): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await quizService.startQuizSession(
        config.sessionType || 'practice',
        config.forceNew || false
      );
      
      dispatch({
        type: 'START_QUIZ_SUCCESS',
        payload: {
          session: result.session,
          question: result.question,
          totalQuestions: result.totalQuestions
        }
      });
      return result.session.id; // Return session ID
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to start quiz' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load all questions for the session (for local navigation)
  const loadAllQuestions = useCallback(async (sessionId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await quizService.getAllQuestions(sessionId);
      
      dispatch({
        type: 'LOAD_ALL_QUESTIONS',
        payload: {
          questions: result.questions,
          totalQuestions: result.totalQuestions
        }
      });
    } catch (error: any) {
      console.error('Error loading all questions:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load questions' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Navigate to a specific question by index (0-indexed)
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < state.questions.length) {
      dispatch({ type: 'GO_TO_QUESTION', payload: index });
    }
  }, [state.questions.length]);

  // Exit quiz and abandon session
  const exitQuiz = useCallback(async (): Promise<void> => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Abandon the session
      await quizService.abandonQuizSession(state.currentSession.id);
      
      // Reset the quiz state
      dispatch({ type: 'RESET_QUIZ' });
    } catch (error: any) {
      console.error('Error exiting quiz:', error);
      // Reset anyway since user wants to exit
      dispatch({ type: 'RESET_QUIZ' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentSession]);

  // Submit an answer
  const submitAnswer = useCallback(async (userAnswer: string, _markedForReview: boolean = false) => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      if (!state.currentQuestion) {
        throw new Error('No current question');
      }
      
      if (!userAnswer || userAnswer.trim() === '') {
        throw new Error('Answer is required');
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Ensure timeSpent is a positive integer
      const timeSpent = Math.max(1, Math.floor(state.timeElapsed || 30));
      
      const result = await quizService.submitAnswer(
        state.currentSession.id,
        state.currentQuestion.id,
        userAnswer,
        timeSpent
      );
      
      const answer: QuizAnswer = {
        questionId: state.currentQuestion.id,
        userAnswer,
        isCorrect: result.isCorrect,
        timeSpent: timeSpent,
        questionNumber: state.questionNumber
      };
      
      dispatch({ type: 'SUBMIT_ANSWER', payload: answer });
      return result;
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit answer';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentSession, state.currentQuestion, state.timeElapsed, state.questionNumber]);

  // Get next question
  const getNextQuestion = useCallback(async () => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const result = await quizService.getNextQuestion(state.currentSession.id);
      
      if (result.completed) {
        // No more questions, quiz is completed
        dispatch({ type: 'NO_MORE_QUESTIONS' });
      } else if (result.question) {
        dispatch({ type: 'LOAD_QUESTION', payload: result.question });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error getting next question:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get next question';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentSession]);

  // Pause quiz
  const pauseQuiz = useCallback(async () => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      await quizService.pauseQuizSession(state.currentSession.id);
      dispatch({ type: 'PAUSE_QUIZ' });
    } catch (error: any) {
      console.error('Error pausing quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to pause quiz' });
    }
  }, [state.currentSession]);

  // Resume quiz
  const resumeQuiz = useCallback(async () => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      await quizService.resumeQuizSession(state.currentSession.id);
      dispatch({ type: 'RESUME_QUIZ' });
    } catch (error: any) {
      console.error('Error resuming quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to resume quiz' });
    }
  }, [state.currentSession]);

  // Complete quiz
  const completeQuiz = useCallback(async () => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await quizService.completeQuizSession(state.currentSession.id);
      
      dispatch({
        type: 'COMPLETE_QUIZ',
        payload: {
          session: { ...state.currentSession, status: 'completed' },
          score: result.score || {}
        }
      });
    } catch (error: any) {
      console.error('Error completing quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to complete quiz' });
    }
  }, [state.currentSession]);

  // Get next question with return value indicating if there are more questions
  const nextQuestion = useCallback(async (): Promise<boolean> => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const result = await quizService.getNextQuestion(state.currentSession.id);
      
      if (result.completed) {
        // No more questions, quiz is completed
        dispatch({ type: 'NO_MORE_QUESTIONS' });
        return false;
      } else if (result.question) {
        dispatch({ type: 'LOAD_QUESTION', payload: result.question });
        return true;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error getting next question:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get next question';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentSession]);

  // Get quiz results
  const getQuizResults = useCallback(async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const results = await quizService.getQuizResults(sessionId);
      
      dispatch({ type: 'LOAD_QUIZ_RESULTS', payload: results });
      return results; // Return the results data
    } catch (error: any) {
      console.error('Error getting quiz results:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to get quiz results' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Toggle mark for review
  const toggleMarkForReview = useCallback(() => {
    dispatch({ type: 'TOGGLE_MARK_FOR_REVIEW' });
  }, []);

  // Reset quiz
  const resetQuiz = useCallback(() => {
    dispatch({ type: 'RESET_QUIZ' });
  }, []);

  // Set time elapsed
  const setTimeElapsed = useCallback((time: number) => {
    dispatch({ type: 'SET_TIME_ELAPSED', payload: time });
  }, []);

  const value: QuizContextType = {
    // State
    currentSession: state.currentSession,
    currentQuestion: state.currentQuestion,
    questions: state.questions,
    currentQuestionIndex: state.currentQuestionIndex,
    questionNumber: state.questionNumber,
    totalQuestions: state.totalQuestions,
    answers: state.answers,
    timeElapsed: state.timeElapsed,
    isPaused: state.isPaused,
    loading: state.isLoading,
    isLoading: state.isLoading,
    error: state.error,
    isMarkedForReview: state.isMarkedForReview,
    quizResults: state.quizResults,
    
    // Functions
    startQuiz,
    loadAllQuestions,
    goToQuestion,
    submitAnswer,
    nextQuestion,
    getNextQuestion,
    pauseQuiz,
    resumeQuiz,
    completeQuiz,
    exitQuiz,
    getQuizResults,
    toggleMarkForReview,
    resetQuiz,
    setTimeElapsed,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

// Hook to use quiz context
export function useQuiz(): QuizContextType {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}

export default QuizContext;