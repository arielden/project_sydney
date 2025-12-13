import express from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import MicroRatingModel from '../models/MicroRating';
import QuestionAttemptModel from '../models/QuestionAttempt';
import pool from '../config/database';
import { formatErrorResponse, formatSuccessResponse } from '../utils/helpers';

const router = express.Router();

/**
 * Get user's overall ELO rating and statistics
 */
router.get('/overall', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const query = `
      SELECT 
        overall_elo,
        games_played,
        k_factor,
        confidence_level,
        created_at,
        updated_at
      FROM player_ratings 
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO player_ratings (user_id, overall_elo, games_played)
         VALUES ($1, $2, $3)
         RETURNING overall_elo, games_played, k_factor, confidence_level, created_at, updated_at`,
        [userId, 1200, 0]
      );

      const rating = insertResult.rows[0];

      return res.json(formatSuccessResponse('Overall rating retrieved', {
        overall_elo: rating.overall_elo,
        times_played: rating.games_played,
        k_factor: rating.k_factor,
        confidence_level: rating.confidence_level ?? 0,
        created_at: rating.created_at,
        updated_at: rating.updated_at
      }));
    }

    const rating = result.rows[0];

    return res.json(formatSuccessResponse('Overall rating retrieved', {
      overall_elo: rating.overall_elo,
      times_played: rating.games_played,
      k_factor: rating.k_factor,
      confidence_level: rating.confidence_level ?? 0,
      created_at: rating.created_at,
      updated_at: rating.updated_at
    }));
  } catch (error) {
    console.error('Error fetching overall rating:', error);
    return res.status(500).json(formatErrorResponse('Failed to fetch overall rating'));
  }
});

/**
 * Get user's micro ratings for all SAT categories
 */
router.get('/micro', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const microRatings = await MicroRatingModel.getUserAllCategoryRatings(userId);

    res.json(formatSuccessResponse('Micro ratings retrieved', microRatings));
  } catch (error) {
    console.error('Error fetching micro ratings:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch micro ratings'));
  }
});

/**
 * Get user's micro rating for a specific category
 */
router.get('/micro/:categoryId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { categoryId } = req.params;
    
    if (!categoryId) {
      return res.status(400).json(formatErrorResponse('Category ID is required'));
    }
    
    const rating = await MicroRatingModel.getUserCategoryRating(userId, categoryId);
    const stats = await MicroRatingModel.getUserCategoryStats(userId, categoryId);
    
    return res.json(formatSuccessResponse('Category rating retrieved', {
      category_id: categoryId,
      rating,
      ...stats
    }));
  } catch (error) {
    console.error('Error fetching category micro rating:', error);
    return res.status(500).json(formatErrorResponse('Failed to fetch category micro rating'));
  }
});

/**
 * Get user's performance analytics with ELO insights
 */
router.get('/performance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get performance by category
    const performanceByType = await QuestionAttemptModel.getUserPerformanceByType(userId);
    
    // Get ELO progression
    const eloProgression = await QuestionAttemptModel.getUserELOProgression(userId, 20);
    
    // Get overall statistics
    const overallQuery = `
      SELECT 
        COUNT(*) as total_questions_answered,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as total_correct,
        ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) as overall_accuracy,
        ROUND(AVG(time_spent), 2) as avg_time_per_question,
        MIN(answered_at) as first_attempt,
        MAX(answered_at) as last_attempt
      FROM question_attempts 
      WHERE user_id = $1
    `;
    
    const overallResult = await pool.query(overallQuery, [userId]);
    const overallStats = overallResult.rows[0];

    res.json(formatSuccessResponse('Performance analytics retrieved', {
      overall_stats: {
        total_questions_answered: parseInt(overallStats.total_questions_answered) || 0,
        total_correct: parseInt(overallStats.total_correct) || 0,
        overall_accuracy: parseFloat(overallStats.overall_accuracy) || 0,
        avg_time_per_question: parseFloat(overallStats.avg_time_per_question) || 0,
        first_attempt: overallStats.first_attempt,
        last_attempt: overallStats.last_attempt
      },
      performance_by_category: performanceByType,
      elo_progression: eloProgression
    }));
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch performance analytics'));
  }
});

/**
 * Get leaderboard for overall ELO ratings
 */
router.get('/leaderboard/overall', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const query = `
      SELECT 
        pr.overall_elo,
        pr.games_played,
        pr.k_factor,
        pr.confidence_level,
        u.username,
        u.id as user_id,
        pr.updated_at
      FROM player_ratings pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.games_played > 0
      ORDER BY pr.overall_elo DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      ...row,
      times_played: row.games_played
    }));

    res.json(formatSuccessResponse('Overall leaderboard retrieved', leaderboard));
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch overall leaderboard'));
  }
});

/**
 * Get leaderboard for a specific category
 */
router.get('/leaderboard/category/:categoryId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!categoryId) {
      return res.status(400).json(formatErrorResponse('Category ID is required'));
    }

    const topPerformers = await MicroRatingModel.getTopPerformersInCategory(categoryId, limit);

    const leaderboard = topPerformers.map((row: any, index: number) => ({
      rank: index + 1,
      ...row
    }));

    return res.json(formatSuccessResponse('Category leaderboard retrieved', leaderboard));
  } catch (error) {
    console.error('Error fetching category leaderboard:', error);
    return res.status(500).json(formatErrorResponse('Failed to fetch category leaderboard'));
  }
});

/**
 * Get user's rank in overall leaderboard
 */
router.get('/rank/overall', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const query = `
      SELECT 
        COUNT(*) + 1 as rank,
        (SELECT overall_elo FROM player_ratings WHERE user_id = $1) as user_rating,
        (SELECT COUNT(*) FROM player_ratings WHERE games_played > 0) as total_players
      FROM player_ratings pr
      WHERE pr.overall_elo > (SELECT overall_elo FROM player_ratings WHERE user_id = $1)
      AND pr.games_played > 0
    `;

    const result = await pool.query(query, [userId]);
    const rankInfo = result.rows[0];

    res.json(formatSuccessResponse('Overall rank retrieved', {
      rank: parseInt(rankInfo.rank) || 1,
      user_rating: parseFloat(rankInfo.user_rating) || 1200,
      total_players: parseInt(rankInfo.total_players) || 1,
      percentile: rankInfo.total_players > 0 
        ? Math.round((1 - (rankInfo.rank - 1) / rankInfo.total_players) * 100)
        : 100
    }));
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json(formatErrorResponse('Failed to fetch user rank'));
  }
});

/**
 * Get user's rank in a specific category
 */
router.get('/rank/category/:categoryId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { categoryId } = req.params;
    
    if (!categoryId) {
      return res.status(400).json(formatErrorResponse('Category ID is required'));
    }

    const userRating = await MicroRatingModel.getUserCategoryRating(userId, categoryId);

    const query = `
      SELECT 
        COUNT(*) + 1 as rank,
        (SELECT COUNT(*) FROM micro_ratings WHERE category_id = $2 AND attempts > 0) as total_players
      FROM micro_ratings mr
      WHERE mr.elo_rating > $1
      AND mr.category_id = $2
      AND mr.attempts > 0
    `;

    const result = await pool.query(query, [userRating, categoryId]);
    const rankInfo = result.rows[0];

    return res.json(formatSuccessResponse('Category rank retrieved', {
      category_id: categoryId,
      rank: parseInt(rankInfo.rank) || 1,
      user_rating: userRating,
      total_players: parseInt(rankInfo.total_players) || 1,
      percentile: rankInfo.total_players > 0 
        ? Math.round((1 - (rankInfo.rank - 1) / rankInfo.total_players) * 100)
        : 100
    }));
  } catch (error) {
    console.error('Error fetching category rank:', error);
    return res.status(500).json(formatErrorResponse('Failed to fetch category rank'));
  }
});

export default router;