// User interface
export interface User {
  id: string;
  email: string;
  username: string;
}

// Question interface
export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended';
  difficulty: 'easy' | 'medium' | 'hard';
}

// Quiz Session interface
export interface QuizSession {
  id: string;
  userId: string;
  startTime: Date;
}