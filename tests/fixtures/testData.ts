/**
 * Test Data Fixtures
 * Provides reusable test data for unit and integration tests
 */

export const testUsers = {
  newUser: {
    id: 'test-user-new',
    email: 'new@test.com',
    username: 'newuser',
  },
  experiencedUser: {
    id: 'test-user-exp',
    email: 'experienced@test.com',
    username: 'experienced',
  },
  beginnerUser: {
    id: 'test-user-beginner',
    email: 'beginner@test.com',
    username: 'beginner',
  },
};

export const testQuestions = {
  easyQuestion: {
    id: 'q-easy-1',
    text: 'What is 2+2?',
    correct_answer: '4',
    difficulty_rating: 0.2,
    elo_rating: 400,
    times_answered: 100,
    times_correct: 85,
    category_id: 'cat-math',
  },
  mediumQuestion: {
    id: 'q-medium-1',
    text: 'Solve for x: 2x + 5 = 15',
    correct_answer: '5',
    difficulty_rating: 0.5,
    elo_rating: 500,
    times_answered: 80,
    times_correct: 50,
    category_id: 'cat-math',
  },
  hardQuestion: {
    id: 'q-hard-1',
    text: 'What is the derivative of x^3?',
    correct_answer: '3x^2',
    difficulty_rating: 0.8,
    elo_rating: 700,
    times_answered: 40,
    times_correct: 20,
    category_id: 'cat-calculus',
  },
};

export const testCategories = {
  math: {
    id: 'cat-math',
    name: 'Mathematics',
    description: 'Basic mathematics questions',
  },
  calculus: {
    id: 'cat-calculus',
    name: 'Calculus',
    description: 'Calculus and advanced math',
  },
  science: {
    id: 'cat-science',
    name: 'Science',
    description: 'General science questions',
  },
};

export const testRatings = {
  defaultPlayerRating: {
    user_id: 'test-user-1',
    overall_elo: 500,
    games_played: 0,
    k_factor: 100,
    wins: 0,
    losses: 0,
    streak: 0,
    best_rating: 500,
    confidence_level: 0.5,
  },
  defaultMicroRating: {
    user_id: 'test-user-1',
    category_id: 'cat-math',
    elo_rating: 500,
    confidence: 0.5,
    attempts: 0,
    k_factor: 32,
  },
};

export const testSessions = {
  newSession: {
    id: 'session-1',
    user_id: 'test-user-1',
    quiz_id: 'quiz-1',
    total_questions: 10,
    started_at: new Date(),
    ended_at: null,
  },
  completedSession: {
    id: 'session-2',
    user_id: 'test-user-1',
    quiz_id: 'quiz-1',
    total_questions: 10,
    started_at: new Date(Date.now() - 3600000),
    ended_at: new Date(Date.now() - 1800000),
  },
};

export const testAttempts = {
  correctAttempt: {
    session_id: 'session-1',
    question_id: 'q-easy-1',
    user_id: 'test-user-1',
    user_answer: '4',
    is_correct: true,
    time_spent: 30,
  },
  incorrectAttempt: {
    session_id: 'session-1',
    question_id: 'q-hard-1',
    user_id: 'test-user-1',
    user_answer: '2x',
    is_correct: false,
    time_spent: 120,
  },
};

/**
 * Helper function to create a test user with initial ratings
 */
export function createTestUserWithRatings(
  userId: string,
  overallElo: number = 500,
  gamesPlayed: number = 0
) {
  return {
    user: { id: userId, email: `${userId}@test.com`, username: userId },
    playerRating: {
      user_id: userId,
      overall_elo: overallElo,
      games_played: gamesPlayed,
      k_factor: gamesPlayed < 10 ? 100 : gamesPlayed < 30 ? 50 : 32,
      wins: Math.floor(gamesPlayed * 0.5),
      losses: Math.floor(gamesPlayed * 0.5),
      streak: 0,
      best_rating: overallElo,
      confidence_level: 0.5,
    },
  };
}

/**
 * Helper to create multiple test attempts for a session
 */
export function createTestAttempts(
  sessionId: string,
  userId: string,
  questionIds: string[],
  correctCount: number
) {
  return questionIds.map((qId, idx) => ({
    session_id: sessionId,
    question_id: qId,
    user_id: userId,
    user_answer: idx < correctCount ? 'correct' : 'wrong',
    is_correct: idx < correctCount,
    time_spent: Math.random() * 180 + 10,
  }));
}

/**
 * Helper to calculate expected statistics from attempts
 */
export function calculateExpectedStats(attempts: any[]) {
  const correct = attempts.filter((a) => a.is_correct).length;
  const total = attempts.length;
  return {
    correct_count: correct,
    total_attempts: total,
    success_rate: correct / total,
    average_time: attempts.reduce((sum, a) => sum + a.time_spent, 0) / total,
  };
}
