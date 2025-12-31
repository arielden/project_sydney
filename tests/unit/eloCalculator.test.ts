/**
 * ELO Calculator Unit Tests
 * Tests the core ELO rating calculation logic
 */

import { ELOCalculator, PlayerStats, QuestionStats } from '../../backend/src/utils/eloCalculator';

describe('ELOCalculator', () => {
  describe('performELOCalculation', () => {
    it('should calculate correct ELO change for a correct answer', () => {
      const playerStats: PlayerStats = {
        currentRating: 500,
        kFactor: 32,
        gamesPlayed: 10,
      };
      const questionStats: QuestionStats = {
        currentRating: 500,
        kFactor: 16,
        timesRated: 5,
      };

      const result = ELOCalculator.performELOCalculation(playerStats, questionStats, true);

      expect(result.playerNewRating).toBeGreaterThan(500);
      expect(result.questionNewRating).toBeLessThan(500);
      expect(result.playerEloChange).toBeGreaterThan(0);
    });

    it('should calculate correct ELO change for an incorrect answer', () => {
      const playerStats: PlayerStats = {
        currentRating: 500,
        kFactor: 32,
        gamesPlayed: 10,
      };
      const questionStats: QuestionStats = {
        currentRating: 500,
        kFactor: 16,
        timesRated: 5,
      };

      const result = ELOCalculator.performELOCalculation(playerStats, questionStats, false);

      expect(result.playerNewRating).toBeLessThan(500);
      expect(result.questionNewRating).toBeGreaterThan(500);
      expect(result.playerEloChange).toBeLessThan(0);
    });

    it('should give higher ELO gain when beating stronger question', () => {
      const strongWin = ELOCalculator.performELOCalculation(
        { currentRating: 400, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 600, kFactor: 16, timesRated: 5 },
        true
      );

      const weakWin = ELOCalculator.performELOCalculation(
        { currentRating: 600, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 400, kFactor: 16, timesRated: 5 },
        true
      );

      expect(strongWin.playerEloChange).toBeGreaterThan(weakWin.playerEloChange);
    });

    it('should give smaller penalty for losing to stronger question', () => {
      const lossToStrong = ELOCalculator.performELOCalculation(
        { currentRating: 400, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 600, kFactor: 16, timesRated: 5 },
        false
      );

      const lossToWeak = ELOCalculator.performELOCalculation(
        { currentRating: 600, kFactor: 32, gamesPlayed: 10 },
        { currentRating: 400, kFactor: 16, timesRated: 5 },
        false
      );

      expect(Math.abs(lossToStrong.playerEloChange)).toBeLessThan(Math.abs(lossToWeak.playerEloChange));
    });

    it('should respect K-factor in calculations', () => {
      const lowKResult = ELOCalculator.performELOCalculation(
        { currentRating: 500, kFactor: 10, gamesPlayed: 50 },
        { currentRating: 500, kFactor: 16, timesRated: 5 },
        true
      );

      const highKResult = ELOCalculator.performELOCalculation(
        { currentRating: 500, kFactor: 100, gamesPlayed: 5 },
        { currentRating: 500, kFactor: 16, timesRated: 5 },
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
      const expectedScore = ELOCalculator.calculateExpectedScore(500, 500);
      expect(expectedScore).toBeCloseTo(0.5, 2);
    });

    it('should favor higher-rated question', () => {
      const scoreHigher = ELOCalculator.calculateExpectedScore(500, 600);
      const scoreLower = ELOCalculator.calculateExpectedScore(500, 400);

      expect(scoreHigher).toBeLessThan(0.5); // Harder question = lower expected score
      expect(scoreLower).toBeGreaterThan(0.5); // Easier question = higher expected score
      expect(scoreHigher + scoreLower).toBeCloseTo(1, 1);
    });

    it('should be symmetric', () => {
      const score1 = ELOCalculator.calculateExpectedScore(500, 600);
      const score2 = ELOCalculator.calculateExpectedScore(600, 500);

      expect(score1 + score2).toBeCloseTo(1, 2);
    });
  });

  describe('calculatePlayerKFactor', () => {
    it('should return 25 for new players with few games', () => {
      const kFactor = ELOCalculator.calculatePlayerKFactor(0);
      expect(kFactor).toBe(25);
    });

    it('should return interpolated K for intermediate players', () => {
      const kFactor = ELOCalculator.calculatePlayerKFactor(300);
      expect(kFactor).toBe(1.19);
    });

    it('should return 0.37 for experienced players', () => {
      const kFactor = ELOCalculator.calculatePlayerKFactor(1000);
      expect(kFactor).toBe(0.37);
    });

    it('should decrease K-factor with more games', () => {
      const k0 = ELOCalculator.calculatePlayerKFactor(0);
      const k50 = ELOCalculator.calculatePlayerKFactor(50);
      const k250 = ELOCalculator.calculatePlayerKFactor(250);
      const k900 = ELOCalculator.calculatePlayerKFactor(900);

      expect(k0).toBeGreaterThan(k50);
      expect(k50).toBeGreaterThanOrEqual(k250);
      expect(k250).toBeGreaterThanOrEqual(k900);
    });
  });

  describe('rating progression and caps', () => {
    it('should cap rating changes at ±20 points per question', () => {
      // Very strong player vs very easy question
      const strongPlayerVsEasyQuestion = ELOCalculator.performELOCalculation(
        { currentRating: 800, kFactor: 25, gamesPlayed: 0 },
        { currentRating: 200, kFactor: 40, timesRated: 5 },
        true // correct answer
      );

      // Very weak player vs very hard question
      const weakPlayerVsHardQuestion = ELOCalculator.performELOCalculation(
        { currentRating: 200, kFactor: 25, gamesPlayed: 0 },
        { currentRating: 800, kFactor: 40, timesRated: 5 },
        false // incorrect answer
      );

      expect(strongPlayerVsEasyQuestion.playerEloChange).toBeLessThanOrEqual(20);
      expect(weakPlayerVsHardQuestion.playerEloChange).toBeGreaterThanOrEqual(-20);
    });

    it('should allow ratings to reach around 800 for advanced players', () => {
      let rating = 500;
      let gamesPlayed = 50; // Moderately experienced player

      // Simulate many correct answers against slightly easier questions
      for (let i = 0; i < 300; i++) {
        const kFactor = ELOCalculator.calculatePlayerKFactor(gamesPlayed);
        const questionRating = Math.max(300, rating - 50); // Questions slightly below player rating
        const result = ELOCalculator.performELOCalculation(
          { currentRating: rating, kFactor, gamesPlayed },
          { currentRating: questionRating, kFactor: 20, timesRated: 100 },
          true
        );
        rating = result.playerNewRating;
        gamesPlayed++;
      }

      // Should be able to reach high ratings but not exceed 800 significantly
      expect(rating).toBeGreaterThan(700);
      expect(rating).toBeLessThan(850);
    });

    it('should prevent extreme rating inflation with conservative K-factor', () => {
      let rating = 500;
      const gamesPlayed = 2000; // Very experienced player
      const kFactor = ELOCalculator.calculatePlayerKFactor(gamesPlayed);

      // Even with perfect performance, rating changes should be minimal
      const result = ELOCalculator.performELOCalculation(
        { currentRating: rating, kFactor, gamesPlayed },
        { currentRating: 300, kFactor: 20, timesRated: 100 },
        true
      );

      expect(result.playerEloChange).toBeLessThan(1); // Very small change due to low K-factor
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
