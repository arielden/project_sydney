import pool from '../config/database';
import { ELOCalculator } from '../utils/eloCalculator';
import MicroRatingModel from '../models/MicroRating';

export interface AdaptiveQuestionOptions {
  userId: string;
  sessionId: string;
  excludeAttempted?: boolean;
  targetDifficulty?: 'auto' | 'easy' | 'medium' | 'hard';
  categoryWeights?: { [categoryId: string]: number };
  questionCount?: number;
}

export interface QuestionWithPrediction {
  id: string;
  question_text: string;
  category_id: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty_rating: number;
  elo_rating: number;
  times_answered: number;
  times_correct: number;
  created_at: Date;
  expected_score: number;
  appropriateness_score: number;
  micro_rating_relevance: number;
}

class AdaptiveSelectionService {
  /**
   * Select questions adaptively based on user's ELO ratings
   */
  static async selectAdaptiveQuestions(
    options: AdaptiveQuestionOptions
  ): Promise<QuestionWithPrediction[]> {
    const {
      userId,
      sessionId,
      excludeAttempted = true,
      targetDifficulty = 'auto',
      categoryWeights = {},
      questionCount = 1
    } = options;

    try {
      // Get user's overall rating
      const userRatingQuery = `
        SELECT overall_elo, games_played AS times_played 
        FROM player_ratings 
        WHERE user_id = $1
      `;
      const userRatingResult = await pool.query(userRatingQuery, [userId]);
      const userRating = userRatingResult.rows[0]?.overall_elo || 1200;

      // Get user's micro ratings for all categories
      const microRatings = await MicroRatingModel.getUserAllCategoryRatings(userId);
      const microRatingMap = microRatings.reduce((acc: { [key: string]: number }, rating: any) => {
        acc[rating.category_id] = rating.elo_rating;
        return acc;
      }, {} as { [key: string]: number });

      // Get attempted question IDs if excluding them
      let excludedQuestionIds: string[] = [];
      if (excludeAttempted) {
        const attemptedQuery = `
          SELECT DISTINCT question_id 
          FROM question_attempts 
          WHERE session_id = $1
        `;
        const attemptedResult = await pool.query(attemptedQuery, [sessionId]);
        excludedQuestionIds = attemptedResult.rows.map(row => row.question_id);
      }

      // Build the main query
      let whereConditions = ['q.id IS NOT NULL'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Exclude already attempted questions
      if (excludedQuestionIds.length > 0) {
        whereConditions.push(`q.id NOT IN (${excludedQuestionIds.map(() => `$${paramIndex++}`).join(', ')})`);
        queryParams.push(...excludedQuestionIds);
      }

      // Apply target difficulty if specified
      if (targetDifficulty !== 'auto') {
        const difficultyRanges = {
          easy: [0, 1300],
          medium: [1300, 1500],
          hard: [1500, 2000]
        };
        const range = difficultyRanges[targetDifficulty];
        whereConditions.push(`q.elo_rating BETWEEN $${paramIndex++} AND $${paramIndex++}`);
        queryParams.push(range[0], range[1]);
      }

      const query = `
        SELECT 
          q.id,
          q.question_text,
          COALESCE(qc.category_id, 0) as category_id,
          q.options,
          q.correct_answer,
          q.explanation,
          q.difficulty_rating,
          q.elo_rating,
          q.times_answered,
          q.times_correct,
          q.created_at
        FROM questions q
        LEFT JOIN question_categories qc ON q.id = qc.question_id AND qc.is_primary = true
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY RANDOM()
        LIMIT 50
      `;

      const result = await pool.query(query, queryParams);
      const candidates = result.rows;

      if (candidates.length === 0) {
        throw new Error('No suitable questions found');
      }

      // Score each candidate question
      const scoredQuestions: QuestionWithPrediction[] = candidates.map(question => {
        const questionRating = question.elo_rating || 1200;
        
        // Get relevant micro rating for this category
        const microRating = microRatingMap[question.category_id] || userRating;
        
        // Calculate expected score using ELO formula
        const expectedScore = ELOCalculator.calculateExpectedScore(microRating, questionRating);
        
        // Calculate appropriateness (how well-matched the difficulty is)
        const appropriatenessScore = ELOCalculator.isQuestionAppropriate(
          microRating, 
          questionRating
        ) ? 1.0 : Math.max(0.1, 1.0 - Math.abs(microRating - questionRating) / 400);
        
        // Calculate micro rating relevance (preference for categories with weights)
        const categoryWeight = categoryWeights[question.category_id] || 1.0;
        const microRatingRelevance = categoryWeight * appropriatenessScore;

        return {
          ...question,
          expected_score: expectedScore,
          appropriateness_score: appropriatenessScore,
          micro_rating_relevance: microRatingRelevance
        };
      });

      // Sort by composite score for adaptive selection
      scoredQuestions.sort((a, b) => {
        // Adaptive scoring algorithm:
        // 1. Prioritize appropriateness (well-matched difficulty)
        // 2. Consider category weights and micro rating relevance
        // 3. Add some randomness to prevent predictability
        
        const scoreA = (a.appropriateness_score * 0.6) + 
                       (a.micro_rating_relevance * 0.3) + 
                       (Math.random() * 0.1);
        
        const scoreB = (b.appropriateness_score * 0.6) + 
                       (b.micro_rating_relevance * 0.3) + 
                       (Math.random() * 0.1);

        return scoreB - scoreA;
      });

      // Return the top questions
      return scoredQuestions.slice(0, questionCount);

    } catch (error) {
      console.error('Error in adaptive question selection:', error);
      throw new Error('Failed to select adaptive questions');
    }
  }

  /**
   * Get recommended difficulty level for a user in a specific category
   */
  static async getRecommendedDifficulty(
    userId: string, 
    categoryId: string
  ): Promise<{ level: 'easy' | 'medium' | 'hard'; rating: number }> {
    try {
      const microRating = await MicroRatingModel.getUserCategoryRating(userId, categoryId);
      
      if (microRating < 1300) {
        return { level: 'easy', rating: microRating };
      } else if (microRating < 1500) {
        return { level: 'medium', rating: microRating };
      } else {
        return { level: 'hard', rating: microRating };
      }
    } catch (error) {
      console.error('Error getting recommended difficulty:', error);
      return { level: 'medium', rating: 1200 };
    }
  }

  /**
   * Get category priorities for adaptive learning
   */
  static async getCategoryPriorities(userId: string): Promise<any[]> {
    try {
      const microRatings = await MicroRatingModel.getUserAllCategoryRatings(userId);
      
      // Calculate priority scores based on:
      // 1. Lower ratings = higher priority (need improvement)
      // 2. Recent performance (if available)
      // 3. Question availability in category
      
      const priorities = await Promise.all(
        microRatings.map(async (rating: any) => {
          // Get question count for this category
          const questionCountQuery = `
            SELECT COUNT(*) as count
            FROM questions 
            WHERE category_id = $1
          `;
          const questionCount = await pool.query(questionCountQuery, [rating.category_id]);
          const availableQuestions = parseInt(questionCount.rows[0].count) || 0;
          
          // Calculate priority score (lower rating = higher priority)
          const maxRating = 1800; // Assumed max rating
          const normalizedRating = rating.elo_rating / maxRating;
          const improvementPotential = 1.0 - normalizedRating;
          
          // Boost priority if user has few attempts in this category
          const experienceBoost = rating.attempts_count < 10 ? 1.2 : 1.0;
          
          // Reduce priority if no questions available
          const availabilityFactor = availableQuestions > 0 ? 1.0 : 0.1;
          
          const priorityScore = improvementPotential * experienceBoost * availabilityFactor;
          
          return {
            category_id: rating.category_id,
            category_name: rating.category_name,
            current_rating: rating.elo_rating,
            attempts_count: rating.attempts_count,
            success_rate: rating.success_rate,
            available_questions: availableQuestions,
            priority_score: priorityScore,
            recommended_action: this.getRecommendedAction(rating, availableQuestions)
          };
        })
      );
      
      // Sort by priority score (highest first)
      return priorities.sort((a: any, b: any) => b.priority_score - a.priority_score);
      
    } catch (error) {
      console.error('Error calculating category priorities:', error);
      throw new Error('Failed to calculate category priorities');
    }
  }

  /**
   * Get recommended action for a category
   */
  private static getRecommendedAction(
    rating: any, 
    availableQuestions: number
  ): string {
    if (availableQuestions === 0) {
      return 'No questions available';
    }
    
    if (rating.attempts_count < 5) {
      return 'Explore fundamentals';
    }
    
    if (rating.success_rate < 0.6) {
      return 'Focus on improvement';
    }
    
    if (rating.elo_rating < 1300) {
      return 'Build foundation';
    } else if (rating.elo_rating < 1500) {
      return 'Strengthen skills';
    } else {
      return 'Master advanced concepts';
    }
  }

  /**
   * Select next best question for focused practice
   */
  static async selectNextBestQuestion(
    userId: string,
    sessionId: string,
    targetCategoryId?: string
  ): Promise<QuestionWithPrediction | null> {
    try {
      // If no target category specified, find the highest priority one
      let categoryId = targetCategoryId;
      if (!categoryId) {
        const priorities = await this.getCategoryPriorities(userId);
        if (priorities.length === 0 || priorities[0].available_questions === 0) {
          return null;
        }
        categoryId = priorities[0].category_id;
      }
      
      // Ensure categoryId is not undefined
      if (!categoryId) {
        return null;
      }
      
      // Get recommended difficulty for this category
      const { level } = await this.getRecommendedDifficulty(userId, categoryId);
      
      // Set category weight to prioritize the target category
      const categoryWeights = { [categoryId]: 2.0 };
      
      const questions = await this.selectAdaptiveQuestions({
        userId,
        sessionId,
        excludeAttempted: true,
        targetDifficulty: level,
        categoryWeights,
        questionCount: 1
      });
      
      return questions.length > 0 && questions[0] ? questions[0] : null;
      
    } catch (error) {
      console.error('Error selecting next best question:', error);
      throw new Error('Failed to select next best question');
    }
  }
}

export default AdaptiveSelectionService;