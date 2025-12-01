import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { authAPI } from '../utils/api';

// Types
export interface Question {
  id: string;
  question_text: string;
  options: Array<{ id: string; text: string }>;
  question_type: string;
  difficulty_rating: number;
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
        questionNumber: action.payload.question.questionNumber || 1,
        totalQuestions: action.payload.totalQuestions,
        answers: [],
        timeElapsed: 0,
        isPaused: false,
        isLoading: false,
        error: null,
        isMarkedForReview: false,
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
  submitAnswer: (userAnswer: string, markedForReview?: boolean) => Promise<void>;
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
      
      const response = await authAPI.post('/quiz/start', {
        sessionType: config.sessionType || 'practice',
        forceNew: config.forceNew || false
      });
      
      if (response.success) {
        dispatch({
          type: 'START_QUIZ_SUCCESS',
          payload: {
            session: response.data.session,
            question: response.data.question,
            totalQuestions: response.data.totalQuestions
          }
        });
        return response.data.session.id; // Return session ID
      } else {
        throw new Error(response.message || 'Failed to start quiz');
      }
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to start quiz' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Exit quiz and abandon session
  const exitQuiz = useCallback(async (): Promise<void> => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Abandon the session
      await authAPI.post(`/quiz/${state.currentSession.id}/abandon`);
      
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
  const submitAnswer = useCallback(async (userAnswer: string, markedForReview: boolean = false) => {
    try {
      if (!state.currentSession || !state.currentQuestion) {
        throw new Error('No active quiz session or question');
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authAPI.post(`/quiz/${state.currentSession.id}/answer`, {
        questionId: state.currentQuestion.id,
        userAnswer,
        timeSpent: state.timeElapsed,
        markedForReview
      });
      
      if (response.success) {
        const answer: QuizAnswer = {
          questionId: state.currentQuestion.id,
          userAnswer,
          isCorrect: response.data.isCorrect,
          timeSpent: state.timeElapsed,
          questionNumber: state.questionNumber
        };
        
        dispatch({ type: 'SUBMIT_ANSWER', payload: answer });
      } else {
        throw new Error(response.message || 'Failed to submit answer');
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to submit answer' });
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
      
      const response = await authAPI.get(`/quiz/${state.currentSession.id}/next`);
      
      if (response.success) {
        if (response.data.completed) {
          // No more questions, quiz is completed
          dispatch({ type: 'NO_MORE_QUESTIONS' });
        } else if (response.data.question) {
          dispatch({ type: 'LOAD_QUESTION', payload: response.data.question });
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error(response.message || 'Failed to get next question');
      }
    } catch (error: any) {
      console.error('Error getting next question:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to get next question' });
    }
  }, [state.currentSession]);

  // Pause quiz
  const pauseQuiz = useCallback(async () => {
    try {
      if (!state.currentSession) {
        throw new Error('No active quiz session');
      }
      
      const response = await authAPI.post(`/quiz/${state.currentSession.id}/pause`);
      
      if (response.success) {
        dispatch({ type: 'PAUSE_QUIZ' });
      } else {
        throw new Error(response.message || 'Failed to pause quiz');
      }
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
      
      const response = await authAPI.post(`/quiz/${state.currentSession.id}/resume`);
      
      if (response.success) {
        dispatch({ type: 'RESUME_QUIZ' });
      } else {
        throw new Error(response.message || 'Failed to resume quiz');
      }
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
      
      const response = await authAPI.post(`/quiz/${state.currentSession.id}/complete`);
      
      if (response.success) {
        dispatch({
          type: 'COMPLETE_QUIZ',
          payload: {
            session: response.data.session,
            score: response.data.score
          }
        });
      } else {
        throw new Error(response.message || 'Failed to complete quiz');
      }
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
      
      const response = await authAPI.get(`/quiz/${state.currentSession.id}/next`);
      
      if (response.success) {
        if (response.data.completed) {
          // No more questions, quiz is completed
          dispatch({ type: 'NO_MORE_QUESTIONS' });
          return false;
        } else if (response.data.question) {
          dispatch({ type: 'LOAD_QUESTION', payload: response.data.question });
          return true;
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error(response.message || 'Failed to get next question');
      }
    } catch (error: any) {
      console.error('Error getting next question:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to get next question' });
      return false;
    }
  }, [state.currentSession]);

  // Get quiz results
  const getQuizResults = useCallback(async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authAPI.get(`/quiz/${sessionId}/results`);
      
      if (response.success) {
        dispatch({ type: 'LOAD_QUIZ_RESULTS', payload: response.data });
        return response.data; // Return the results data
      } else {
        throw new Error(response.message || 'Failed to get quiz results');
      }
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