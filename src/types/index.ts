// ==============================================================================
// Core Domain Types - Sydney Learning Platform
// ==============================================================================

// -----------------------------------------------------------------------------
// User Management Types
// -----------------------------------------------------------------------------

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile extends User {
  profile_picture_url?: string;
  timezone?: string;
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark';
    difficulty_preference: 'easy' | 'medium' | 'hard';
  };
}

// -----------------------------------------------------------------------------
// Authentication Types  
// -----------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role?: UserRole;
  isAuthenticated: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

// -----------------------------------------------------------------------------
// Quiz Engine Types
// -----------------------------------------------------------------------------

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

export interface QuizAttemptResult {
  id: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export interface QuizResults {
  session: QuizSession;
  attempts: Array<{
    question: Question;
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

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
}

// -----------------------------------------------------------------------------
// Component Props Types
// -----------------------------------------------------------------------------

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export type LoadingState = boolean;
export type ErrorState = string | null;

export interface ComponentState {
  isLoading: LoadingState;
  error: ErrorState;
}

// -----------------------------------------------------------------------------
// Quiz Configuration Types
// -----------------------------------------------------------------------------

export interface QuizConfig {
  sessionType: 'practice' | 'diagnostic' | 'timed';
  forceNew?: boolean;
  timeLimit?: number;
  questionCount?: number;
}

export interface QuizTimer {
  timeElapsed: number;
  timeLimit?: number;
  isPaused: boolean;
}

// -----------------------------------------------------------------------------
// Navigation Types
// -----------------------------------------------------------------------------

export interface NavigationState {
  from?: {
    pathname: string;
  };
}