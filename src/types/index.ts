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
  session_type: 'practice' | 'diagnostic' | 'timed' | 'quick-test';
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

export interface QuizScore {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  totalTimeSpent: number;
  averageTimePerQuestion: number;
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

// ============================================================================
// ELO Rating System Types (Phase 3)
// ============================================================================

export interface PlayerRating {
  userId: string;
  overallElo: number;
  kFactor: number;
  gamesPlayed: number;
  confidenceLevel: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MicroRatingCategory {
  categoryId: string;
  categoryName: string;
  eloRating: number;
  attempts: number;
  correctCount?: number;
  successRate?: number;
  lastUpdated?: string;
}

export interface MicroRating {
  category: string;
  eloRating: number;
  attempts: number;
  successRate?: number;
  correctCount?: number;
  categoryName?: string;
}

export interface QuestionWithELO extends Question {
  eloRating: number;
  reliability: number;
  timesRated: number;
  expectedScore?: number;
  appropriatenessScore?: number;
}

export interface ELOCalculationResult {
  playerNewRating: number;
  questionNewRating: number;
  expectedScore: number;
  actualScore: number;
  playerEloChange: number;
  questionEloChange: number;
  playerNewKFactor: number;
  questionNewKFactor: number;
}

export interface PerformanceAnalytics {
  overallStats: {
    totalQuestionsAnswered: number;
    totalCorrect: number;
    overallAccuracy: number;
    avgTimePerQuestion: number;
    firstAttempt?: string;
    lastAttempt?: string;
  };
  performanceByCategory: Array<{
    questionType: string;
    categoryId: string;
    totalAttempts: number;
    correctAttempts: number;
    accuracyPercentage: number;
    avgTimeSpent: number;
    avgPlayerRating: number;
    avgQuestionDifficulty: number;
    avgRatingChange: number;
    currentMicroRating: number;
  }>;
  eloProgression: Array<{
    answeredAt: string;
    isCorrect: boolean;
    playerRatingBefore: number;
    playerRatingAfter: number;
    ratingChange: number;
    questionType: string;
    categoryId: string;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  overallElo?: number;
  eloRating?: number;
  timesPlayed?: number;
  attemptsCount?: number;
  correctCount?: number;
  successRate?: number;
  username: string;
  userId: string;
  updatedAt: string;
}

export interface UserRank {
  rank: number;
  userRating: number;
  totalPlayers: number;
  percentile: number;
  categoryId?: string;
}

export interface RatingLevel {
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}

// Constants for ELO rating levels
export const ELO_RATING_LEVELS: Record<string, RatingLevel> = {
  beginner: {
    min: 0,
    max: 400,
    label: 'Beginner',
    color: '#ef4444', // red
    description: 'Starting your learning journey'
  },
  intermediate: {
    min: 400,
    max: 600,
    label: 'Intermediate',
    color: '#f59e0b', // amber
    description: 'Building your skills'
  },
  advanced: {
    min: 600,
    max: 700,
    label: 'Advanced',
    color: '#3b82f6', // blue
    description: 'Mastering the concepts'
  },
  expert: {
    min: 700,
    max: 1000,
    label: 'Expert',
    color: '#10b981', // emerald
    description: 'Excellence achieved'
  }
};

// --------------------------------------------------------------------------
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