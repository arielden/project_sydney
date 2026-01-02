import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import pool from '../../backend/src/config/database';
import AdaptiveQuizGenerator from '../../backend/src/services/adaptiveQuizGenerator';
import QuizCompletionService from '../../backend/src/services/quizCompletionService';
import UserQuestionHistoryModel from '../../backend/src/models/UserQuestionHistory';
import CategoryPracticePriorityModel from '../../backend/src/models/CategoryPracticePriority';

describe('Adaptive Quiz Generation', () => {
  let testUserId: number;
  let testCategoryIds: number[];

  beforeAll(async () => {
    // Create test user
    const userResult = await pool.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES ('quiz-test-user', 'quiztest@example.com', 'hash')
      RETURNING id
    `);
    testUserId = userResult.rows[0].id;

    // Initialize player_ratings
    await pool.query(`
      INSERT INTO player_ratings (user_id, overall_elo)
      VALUES ($1, 1500)
    `, [testUserId]);

    // Get test categories
    const categoryResult = await pool.query(`
      SELECT id FROM categories LIMIT 3
    `);
    testCategoryIds = categoryResult.rows.map(row => row.id);

    // Initialize micro_ratings for test categories
    for (const categoryId of testCategoryIds) {
      await pool.query(`
        INSERT INTO micro_ratings (user_id, category_id, elo_rating, attempts, correct_attempts, success_rate)
        VALUES ($1, $2, 1400, 10, 5, 0.50)
        ON CONFLICT (user_id, category_id) DO UPDATE SET 
          elo_rating = 1400, attempts = 10, correct_attempts = 5, success_rate = 0.50
      `, [testUserId, categoryId]);
    }
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.end();
  });

  beforeEach(async () => {
    // Clear quiz sessions and related data
    await pool.query('DELETE FROM quiz_sessions WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM user_question_history WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM category_practice_priority WHERE user_id = $1', [testUserId]);
  });

  describe('Quiz Generation', () => {
    it('should generate a 20-question adaptive quiz', async () => {
      const result = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 20,
        sessionType: 'practice'
      });

      expect(result.sessionId).toBeGreaterThan(0);
      expect(result.questions).toHaveLength(20);
      expect(Object.keys(result.categoryDistribution).length).toBeGreaterThan(0);
    });

    it('should focus on weak categories', async () => {
      // Set one category to be very weak
      await pool.query(`
        UPDATE micro_ratings
        SET elo_rating = 1200, success_rate = 0.40
        WHERE user_id = $1 AND category_id = $2
      `, [testUserId, testCategoryIds[0]]);

      const result = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 20,
        sessionType: 'practice'
      });

      expect(result.questions).toHaveLength(20);
      
      // Count questions from weak category
      const weakCategoryQuestions = result.questions.filter(
        q => q.category_id === testCategoryIds[0]
      );
      
      // Should have more questions from weak category
      expect(weakCategoryQuestions.length).toBeGreaterThan(5);
    });

    it('should respect target categories', async () => {
      const targetCategory = testCategoryIds[0];
      
      const result = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice',
        targetCategories: [targetCategory]
      });

      expect(result.questions).toHaveLength(10);
      
      // All questions should be from target category
      const targetCategoryQuestions = result.questions.filter(
        q => q.category_id === targetCategory
      );
      expect(targetCategoryQuestions.length).toBe(10);
    });

    it('should select questions close to user ELO', async () => {
      const result = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice'
      });

      // Check that questions are within reasonable ELO range
      const userElo = 1500;
      const eloRange = 200;
      
      result.questions.forEach(q => {
        expect(q.elo_rating).toBeGreaterThanOrEqual(userElo - eloRange);
        expect(q.elo_rating).toBeLessThanOrEqual(userElo + eloRange);
      });
    });

    it('should not include duplicate questions', async () => {
      const result = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 20,
        sessionType: 'practice'
      });

      const questionIds = result.questions.map(q => q.id);
      const uniqueIds = new Set(questionIds);
      
      expect(uniqueIds.size).toBe(questionIds.length);
    });

    it('should create quiz_questions records', async () => {
      const result = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice'
      });

      const quizQuestionsResult = await pool.query(`
        SELECT * FROM quiz_questions WHERE session_id = $1
      `, [result.sessionId]);

      expect(quizQuestionsResult.rows).toHaveLength(10);
    });

    it('should record questions as seen', async () => {
      const result = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice'
      });

      const historyResult = await pool.query(`
        SELECT * FROM user_question_history 
        WHERE user_id = $1 AND last_session_id = $2
      `, [testUserId, result.sessionId]);

      expect(historyResult.rows).toHaveLength(10);
      historyResult.rows.forEach(row => {
        expect(row.times_seen).toBe(1);
      });
    });
  });

  describe('Question Exclusion', () => {
    it('should avoid recently seen questions', async () => {
      // First quiz
      const firstQuiz = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice'
      });

      // Second quiz
      const secondQuiz = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice'
      });

      const firstQuestionIds = new Set(firstQuiz.questions.map(q => q.id));
      const secondQuestionIds = new Set(secondQuiz.questions.map(q => q.id));

      // Should have minimal overlap
      const overlap = [...firstQuestionIds].filter(id => secondQuestionIds.has(id));
      expect(overlap.length).toBeLessThan(5);
    });

    it('should prioritize queued questions (incorrect answers)', async () => {
      // Mark some questions as incorrect (queue priority > 0)
      const question1 = await pool.query(`
        SELECT id FROM questions WHERE is_active = true LIMIT 1
      `);
      const questionId = question1.rows[0].id;

      await pool.query(`
        INSERT INTO user_question_history (user_id, question_id, category_id, times_seen, queue_priority)
        VALUES ($1, $2, $3, 1, 2)
      `, [testUserId, questionId, testCategoryIds[0]]);

      const result = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice'
      });

      // Queued question should appear early in the list
      const queuedQuestionIndex = result.questions.findIndex(q => q.id === questionId);
      expect(queuedQuestionIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quiz Completion', () => {
    it('should update session statistics', async () => {
      const quizResult = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice'
      });

      const attempts = quizResult.questions.map((q, idx) => ({
        question_id: q.id,
        user_answer: idx < 7 ? q.correct_answer : 'wrong',
        is_correct: idx < 7,
        time_taken: 30,
        category_id: q.category_id,
        question_elo: q.elo_rating
      }));

      const completionResult = await QuizCompletionService.completeSession(
        quizResult.sessionId,
        testUserId,
        attempts
      );

      expect(completionResult.totalQuestions).toBe(10);
      expect(completionResult.correctAnswers).toBe(7);
      expect(completionResult.incorrectAnswers).toBe(3);
      expect(completionResult.accuracyPercentage).toBe(70);
    });

    it('should update user_question_history after completion', async () => {
      const quizResult = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 5,
        sessionType: 'practice'
      });

      const attempts = quizResult.questions.map((q, idx) => ({
        question_id: q.id,
        user_answer: idx < 3 ? q.correct_answer : 'wrong',
        is_correct: idx < 3,
        time_taken: 30,
        category_id: q.category_id,
        question_elo: q.elo_rating
      }));

      await QuizCompletionService.completeSession(
        quizResult.sessionId,
        testUserId,
        attempts
      );

      // Check retired questions (correct answers)
      const retiredResult = await pool.query(`
        SELECT COUNT(*) as count FROM user_question_history
        WHERE user_id = $1 AND is_retired = true
      `, [testUserId]);
      expect(parseInt(retiredResult.rows[0].count)).toBe(3);

      // Check queued questions (incorrect answers)
      const queuedResult = await pool.query(`
        SELECT COUNT(*) as count FROM user_question_history
        WHERE user_id = $1 AND queue_priority > 0
      `, [testUserId]);
      expect(parseInt(queuedResult.rows[0].count)).toBe(2);
    });
    it('should update ELO ratings', async () => {
      const initialElo = await pool.query(`
        SELECT overall_elo FROM player_ratings WHERE user_id = $1
      `, [testUserId]);
      const startElo = initialElo.rows[0].overall_elo;

      const quizResult = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 5,
        sessionType: 'practice'
      });

      const attempts = quizResult.questions.map(q => ({
        question_id: q.id,
        user_answer: q.correct_answer,
        is_correct: true,
        time_taken: 30,
        category_id: q.category_id,
        question_elo: q.elo_rating
      }));

      const completionResult = await QuizCompletionService.completeSession(
        quizResult.sessionId,
        testUserId,
        attempts
      );

      expect(completionResult.newEloRating).toBeGreaterThan(startElo);
      expect(completionResult.eloChange).toBeGreaterThan(0);
    });

    it('should update micro_ratings for categories', async () => {
      const categoryId = testCategoryIds[0];

      const quizResult = await AdaptiveQuizGenerator.generateQuiz({
        userId: testUserId,
        totalQuestions: 10,
        sessionType: 'practice',
        targetCategories: [categoryId]
      });

      const attempts = quizResult.questions.map(q => ({
        question_id: q.id,
        user_answer: q.correct_answer,
        is_correct: true,
        time_taken: 30,
        category_id: q.category_id,
        question_elo: q.elo_rating
      }));

      await QuizCompletionService.completeSession(
        quizResult.sessionId,
        testUserId,
        attempts
      );

      const microRatingResult = await pool.query(`
        SELECT * FROM micro_ratings
        WHERE user_id = $1 AND category_id = $2
      `, [testUserId, categoryId]);

      const microRating = microRatingResult.rows[0];
      expect(microRating.attempts).toBeGreaterThan(10);
      expect(parseFloat(microRating.success_rate)).toBeGreaterThan(50);
    });
  });

  describe('Category Priority Calculation', () => {
    it('should calculate priority scores', async () => {
      await CategoryPracticePriorityModel.recalculateAllPriorities(testUserId);

      const priorities = await CategoryPracticePriorityModel.getAllForUser(testUserId);
      
      expect(priorities.length).toBeGreaterThan(0);
      priorities.forEach(priority => {
        expect(parseFloat(priority.selection_weight)).toBeGreaterThan(0);
        expect(priority.elo_deficit).toBeDefined();
        expect(priority.accuracy_deficit).toBeDefined();
      });
    });

    it('should rank weak categories higher', async () => {
      // Create one very weak category
      await pool.query(`
        UPDATE micro_ratings
        SET elo_rating = 1100, success_rate = 0.30
        WHERE user_id = $1 AND category_id = $2
      `, [testUserId, testCategoryIds[0]]);

      await CategoryPracticePriorityModel.recalculateAllPriorities(testUserId);
      const priorities = await CategoryPracticePriorityModel.getTopPriorities(testUserId, 3);

      // Weakest category should be first
      expect(priorities[0].category_id).toBe(testCategoryIds[0]);
      expect(parseFloat(priorities[0].selection_weight)).toBeGreaterThan(2.0);
    });
  });
});
