/**
 * ELO Calculator Unit Tests
 * Tests the core ELO rating calculation logic
 */

import { ELOCalculator } from '../../backend/src/utils/eloCalculator';

describe('ELOCalculator', () => {
  describe('calculateElo', () => {
    it('should calculate correct ELO change for a win', () => {
      const result = ELOCalculator.calculateElo({
        playerRating: 1200,
        questionRating: 1200,
        playerIsCorrect: true,
        playerKFactor: 32,
        questionKFactor: 16,
      });

      expect(result.playerNewRating).toBeGreaterThan(1200);
      expect(result.questionNewRating).toBeLessThan(1200);
      expect(result.eloChange).toBeGreaterThan(0);
    });

    it('should calculate correct ELO change for a loss', () => {
      const result = ELOCalculator.calculateElo({
        playerRating: 1200,
        questionRating: 1200,
        playerIsCorrect: false,
        playerKFactor: 32,
        questionKFactor: 16,
      });

      expect(result.playerNewRating).toBeLessThan(1200);
      expect(result.questionNewRating).toBeGreaterThan(1200);
      expect(result.eloChange).toBeLessThan(0);
    });

    it('should give higher ELO gain when beating stronger opponent', () => {
      const strongWin = ELOCalculator.calculateElo({
        playerRating: 1100,
        questionRating: 1300,
        playerIsCorrect: true,
        playerKFactor: 32,
        questionKFactor: 16,
      });

      const weakWin = ELOCalculator.calculateElo({
        playerRating: 1300,
        questionRating: 1100,
        playerIsCorrect: true,
        playerKFactor: 32,
        questionKFactor: 16,
      });

      expect(strongWin.eloChange).toBeGreaterThan(weakWin.eloChange);
    });

    it('should give lower ELO penalty when losing to stronger opponent', () => {
      const lossToStrong = ELOCalculator.calculateElo({
        playerRating: 1100,
        questionRating: 1300,
        playerIsCorrect: false,
        playerKFactor: 32,
        questionKFactor: 16,
      });

      const lossToWeak = ELOCalculator.calculateElo({
        playerRating: 1300,
        questionRating: 1100,
        playerIsCorrect: false,
        playerKFactor: 32,
        questionKFactor: 16,
      });

      expect(Math.abs(lossToStrong.eloChange)).toBeLessThan(Math.abs(lossToWeak.eloChange));
    });

    it('should respect K-factor in calculations', () => {
      const lowKFactor = ELOCalculator.calculateElo({
        playerRating: 1200,
        questionRating: 1200,
        playerIsCorrect: true,
        playerKFactor: 16,
        questionKFactor: 16,
      });

      const highKFactor = ELOCalculator.calculateElo({
        playerRating: 1200,
        questionRating: 1200,
        playerIsCorrect: true,
        playerKFactor: 64,
        questionKFactor: 16,
      });

      expect(highKFactor.eloChange).toBeGreaterThan(lowKFactor.eloChange);
    });

    it('should not produce negative ratings', () => {
      const result = ELOCalculator.calculateElo({
        playerRating: 100,
        questionRating: 3000,
        playerIsCorrect: false,
        playerKFactor: 32,
        questionKFactor: 16,
      });

      expect(result.playerNewRating).toBeGreaterThanOrEqual(0);
    });
  });

  describe('expectedScore', () => {
    it('should calculate 50% expected score for equal ratings', () => {
      const expectedScore = ELOCalculator.expectedScore(1200, 1200);
      expect(expectedScore).toBeCloseTo(0.5, 2);
    });

    it('should favor higher-rated player', () => {
      const scoreHigher = ELOCalculator.expectedScore(1300, 1100);
      const scoreLower = ELOCalculator.expectedScore(1100, 1300);

      expect(scoreHigher).toBeGreaterThan(0.5);
      expect(scoreLower).toBeLessThan(0.5);
      expect(scoreHigher + scoreLower).toBeCloseTo(1, 2);
    });

    it('should be symmetric', () => {
      const score1 = ELOCalculator.expectedScore(1200, 1300);
      const score2 = ELOCalculator.expectedScore(1300, 1200);

      expect(score1 + score2).toBeCloseTo(1, 2);
    });
  });

  describe('getKFactor', () => {
    it('should return 100 for new players with few games', () => {
      const kFactor = ELOCalculator.getKFactor(0);
      expect(kFactor).toBe(100);
    });

    it('should return 50 for intermediate players', () => {
      const kFactor = ELOCalculator.getKFactor(20);
      expect(kFactor).toBe(50);
    });

    it('should return 32 for experienced players', () => {
      const kFactor = ELOCalculator.getKFactor(50);
      expect(kFactor).toBe(32);
    });

    it('should decrease K-factor with more games', () => {
      const k0 = ELOCalculator.getKFactor(0);
      const k10 = ELOCalculator.getKFactor(10);
      const k30 = ELOCalculator.getKFactor(30);
      const k100 = ELOCalculator.getKFactor(100);

      expect(k0).toBeGreaterThan(k10);
      expect(k10).toBeGreaterThan(k30);
      expect(k30).toBeGreaterThanOrEqual(k100);
    });
  });

  describe('getConfidenceLevel', () => {
    it('should increase confidence on correct answers', () => {
      const newConfidence = ELOCalculator.getConfidenceLevel(0.5, true);
      expect(newConfidence).toBeGreaterThan(0.5);
    });

    it('should decrease confidence on incorrect answers', () => {
      const newConfidence = ELOCalculator.getConfidenceLevel(0.5, false);
      expect(newConfidence).toBeLessThan(0.5);
    });

    it('should keep confidence between 0 and 1', () => {
      let confidence = 0.9;
      for (let i = 0; i < 10; i++) {
        confidence = ELOCalculator.getConfidenceLevel(confidence, true);
      }
      expect(confidence).toBeLessThanOrEqual(1.0);

      confidence = 0.1;
      for (let i = 0; i < 10; i++) {
        confidence = ELOCalculator.getConfidenceLevel(confidence, false);
      }
      expect(confidence).toBeGreaterThanOrEqual(0.0);
    });

    it('should adjust confidence by consistent amount per answer', () => {
      const confidence1 = ELOCalculator.getConfidenceLevel(0.5, true);
      const confidence2 = ELOCalculator.getConfidenceLevel(0.6, true);

      expect(confidence1 - 0.5).toBeCloseTo(confidence2 - 0.6, 2);
    });
  });
});
