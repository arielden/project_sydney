import api, { apiHelpers } from './api';

/**
 * User ELO rating interface
 */
export interface UserELORating {
  overall_elo: number;
  times_played: number;
  created_at: string;
  updated_at: string;
}

/**
 * Micro rating interface
 */
export interface MicroRating {
  category_id: string;
  category_name: string;
  elo_rating: number;
  attempts_count: number;
  correct_count: number;
  success_rate: number;
  last_attempt_date: string | null;
  updated_at: string;
}

/**
 * Performance analytics interface
 */
export interface PerformanceAnalytics {
  overall_stats: {
    total_questions_answered: number;
    total_correct: number;
    overall_accuracy: number;
    avg_time_per_question: number;
    first_attempt: string | null;
    last_attempt: string | null;
  };
  performance_by_category: Array<{
    question_type: string;
    category_id: string;
    total_attempts: number;
    correct_attempts: number;
    accuracy_percentage: number;
    avg_time_spent: number;
    avg_player_rating: number;
    avg_question_difficulty: number;
    avg_rating_change: number;
    current_micro_rating: number;
  }>;
  elo_progression: Array<{
    answered_at: string;
    is_correct: boolean;
    player_rating_before: number;
    player_rating_after: number;
    rating_change: number;
    question_type: string;
    category_id: string;
  }>;
}

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
  rank: number;
  overall_elo?: number;
  elo_rating?: number;
  times_played?: number;
  attempts_count?: number;
  correct_count?: number;
  success_rate?: number;
  username: string;
  user_id: string;
  updated_at: string;
}

/**
 * User rank interface
 */
export interface UserRank {
  rank: number;
  user_rating: number;
  total_players: number;
  percentile: number;
  category_id?: string;
}

/**
 * ELO rating service - handles all ELO-related API calls
 */
export const eloRatingService = {
  /**
   * Get user's overall ELO rating
   */
  async getOverallRating(): Promise<UserELORating> {
    try {
      const response = await api.get('/ratings/overall');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get overall rating');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get user's micro ratings for all categories
   */
  async getMicroRatings(): Promise<MicroRating[]> {
    try {
      const response = await api.get('/ratings/micro');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get micro ratings');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get user's micro rating for a specific category
   */
  async getCategoryRating(categoryId: string): Promise<MicroRating & { rating: number }> {
    try {
      const response = await api.get(`/ratings/micro/${categoryId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get category rating');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get user's performance analytics with ELO insights
   */
  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    try {
      const response = await api.get('/ratings/performance');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get performance analytics');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get overall ELO leaderboard
   */
  async getOverallLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await api.get(`/ratings/leaderboard/overall?limit=${limit}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get overall leaderboard');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get category-specific leaderboard
   */
  async getCategoryLeaderboard(categoryId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await api.get(`/ratings/leaderboard/category/${categoryId}?limit=${limit}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get category leaderboard');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get user's overall rank
   */
  async getOverallRank(): Promise<UserRank> {
    try {
      const response = await api.get('/ratings/rank/overall');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get overall rank');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get user's rank in a specific category
   */
  async getCategoryRank(categoryId: string): Promise<UserRank> {
    try {
      const response = await api.get(`/ratings/rank/category/${categoryId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get category rank');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },
};