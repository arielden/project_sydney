/**
 * ELO Calculator Unit Tests
 * Tests the core ELO rating calculation logic
 */

import { ELOCalculator, PlayerStats, QuestionStats } from '../../backend/src/utils/eloCalculator';

describe('ELOCalculator', () => {
  describe('performELOCalculation', () => {
    it('should calculate correct ELO change for a correct answer', () => {
      const playerStats: PlayerStats = {
        currentRating: 1200,
        kFactor: 32,
        gamesPlayed: 10,
      };
      const questionStats: QuestionStats = {
        currentRating: 1200,
        kFactor: 16,
        timesRated: 5,
      };

      const result = ELOCalculator.performELOCalculation(playerStats, questionStats, true);

      expect(result.playerNewRating).toBeGreaterThan(1200);
      expect(result.questionNewRating).toBeLessThan(1200);
      expect(result.playerEloChange).toBeGreaterThan(0);
    });

    it('should calculate correct ELO change for an incorrect answer', () => {
      const playerStats: PlayerStats = {
        currentRating: 1200,
        kFactor: 32,
        gamesPlayed: 10,
      };
      const questionStats: QuestionStats = {
        currentRating: 1200,
        kFactor: 16,
        timesRated: 5,
      };

      const result = ELOCalculator.performELOCalculation(playerStats, questionStats, false);

      expect(result.playerNewRating).toBeLessThan(1200);
      expect(result.questionNewRating).toBeGreaterThan(1200);
      expect(result.playerEloChange).toBeLessThan(0);
    });

    it('should give higher ELO gain when beating stronger question', () => {
      const strongWin = ELOCalculator.performELOCalculation(
        { currentRating: 1100, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 1300, kFactor: 16, timesRated: 5 },
        true
      );

      const weakWin = ELOCalculator.performELOCalculation(
        { currentRating: 1300, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 1100, kFactor: 16, timesRated: 5 },
        true
      );

      expect(strongWin.playerEloChange).toBeGreaterThan(weakWin.playerEloChange);
    });

    it('should give smaller penalty for losing to stronger question', () => {
      const lossToStrong = ELOCalculator.performELOCalculation(
        { currentRating: 1100, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 1300, kFactor: 16, timesRated: 5 },
        false
      );

      const lossToWeak = ELOCalculator.performELOCalculation(
        { currentRating: 1300, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 1100, kFactor: 16, timesRated: 5 },
        false
      );

      expect(Math.abs(lossToStrong.playerEloChange)).toBeLessThan(Math.abs(lossToWeak.playerEloChange));
    });

    it('should respect K-factor in calculations', () => {
      const lowKResult = ELOCalculator.performELOCalculation(
        { currentRating: 1200, kFactor: 10, gamesPlayed: 50 },
        { currentRating: 1200, kFactor: 16, timesRated: 5 },
        true
      );

      const highKResult = ELOCalculator.performELOCalculation(
        { currentRating: 1200, kFactor: 100, gamesPlayed: 5 },
        { currentRating: 1200, kFactor: 16, timesRated: 5 },
        true
      );

      expect(highKResult.playerEloChange).toBeGreaterThan(lowKResult.playerEloChange);
    });

    it('should not produce negative ratings', () => {
      const result = ELOCalculator.performELOCalculation(
        { currentRating: 100, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 3000, kFactor: 16, timesRated: 5 },
        false
      );

      expect(result.playerNewRating).toBeGreaterThanOrEqual(100);
    });
  });

  describe('calculateExpectedScore', () => {
    it('should calculate 50% expected score for equal ratings', () => {
      const expectedScore = ELOCalculator.calculateExpectedScore(1200, 1200);
      expect(expectedScore).toBeCloseTo(0.5, 2);
    });

    it('should favor higher-rated question', () => {
      const scoreHigher = ELOCalculator.calculateExpectedScore(1200, 1300);
      const scoreLower = ELOCalculator.calculateExpectedScore(1200, 1100);

      expect(scoreHigher).toBeLessThan(0.5); // Harder question = lower expected score
      expect(scoreLower).toBeGreaterThan(0.5); // Easier question = higher expected score
      expect(scoreHigher + scoreLower).toBeCloseTo(1, 1);
    });

    it('should be symmetric', () => {
      const score1 = ELOCalculator.calculateExpectedScore(1200, 1300);
      const score2 = ELOCalculator.calculateExpectedScore(1300, 1200);

      expect(score1 + score2).toBeCloseTo(1, 2);
    });
  });

  describe('calculatePlayerKFactor', () => {
    it('should return 100 for new players with few games', () => {
      const kFactor = ELOCalculator.calculatePlayerKFactor(0);
      expect(kFactor).toBe(100);
    });

    it('should return 40 for intermediate players', () => {
      const kFactor = ELOCalculator.calculatePlayerKFactor(20);
      expect(kFactor).toBe(40);
    });

    it('should return 10 for experienced players', () => {
      const kFactor = ELOCalculator.calculatePlayerKFactor(50);
      expect(kFactor).toBe(10);
    });

    it('should decrease K-factor with more games', () => {
      const k0 = ELOCalculator.calculatePlayerKFactor(0);
      const k10 = ELOCalculator.calculatePlayerKFactor(10);
      const k30 = ELOCalculator.calculatePlayerKFactor(30);
      const k100 = ELOCalculator.calculatePlayerKFactor(100);

      expect(k0).toBeGreaterThan(k10);
      expect(k10).toBeGreaterThanOrEqual(k30);
      expect(k30).toBeGreaterThanOrEqual(k100);
    });
  });

  describe('calculatePlayerConfidence', () => {
    it('should increase confidence with more games', () => {
      const conf0 = ELOCalculator.calculatePlayerConfidence(0, 0.5);
      const conf50 = ELOCalculator.calculatePlayerConfidence(50, 0.5);

      expect(conf50).toBeGreaterThan(conf0);
    });

    it('should increase confidence with better performance', () => {
      const confPoor = ELOCalculator.calculatePlayerConfidence(25, 0.2);
      const confGood = ELOCalculator.calculatePlayerConfidence(25, 0.8);

      expect(confGood).toBeGreaterThan(confPoor);
    });

    it('should keep confidence between 0 and 1', () => {
      const conf = ELOCalculator.calculatePlayerConfidence(100, 1.0);
      expect(conf).toBeGreaterThanOrEqual(0);
      expect(conf).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateQuestionReliability', () => {
    it('should increase reliability with more ratings', () => {
      const rel10 = ELOCalculator.calculateQuestionReliability(10);
      const rel100 = ELOCalculator.calculateQuestionReliability(100);

      expect(rel100).toBeGreaterThan(rel10);
    });

    it('should cap reliability at 0.95', () => {
      const rel = ELOCalculator.calculateQuestionReliability(10000);
      expect(rel).toBeLessThanOrEqual(0.95);
    });
  });
});
