/**
 * ELO Rating Calculator
 * Implements the complete ELO rating algorithm for adaptive learning
 */

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

export interface PlayerStats {
  currentRating: number;
  kFactor: number;
  gamesPlayed: number;
}

export interface QuestionStats {
  currentRating: number;
  kFactor: number;
  timesRated: number;
}

export class ELOCalculator {
  /**
   * Calculate expected score using ELO formula
   * E = 1 / (1 + 10^((Rq - Rp) / 400))
   * @param playerRating Player's current ELO rating
   * @param questionRating Question's current ELO rating
   * @returns Expected score (0.0 to 1.0)
   */
  static calculateExpectedScore(playerRating: number, questionRating: number): number {
    const exponent = (questionRating - playerRating) / 400;
    const expectedScore = 1 / (1 + Math.pow(10, exponent));
    
    // Ensure result is between 0 and 1
    return Math.max(0, Math.min(1, expectedScore));
  }

  /**
   * Calculate new rating using ELO formula with rating change caps
   * R' = R + K(S - E)
   * @param currentRating Current ELO rating
   * @param kFactor K-factor for rating volatility
   * @param actualScore Actual score (1 for correct, 0 for incorrect)
   * @param expectedScore Expected score from calculateExpectedScore
   * @param maxChange Maximum rating change per question (default: 20 points)
   * @returns New ELO rating (clamped between 200-800)
   */
  static calculateNewRating(
    currentRating: number, 
    kFactor: number, 
    actualScore: number, 
    expectedScore: number,
    maxChange: number = 20
  ): number {
    const ratingChange = kFactor * (actualScore - expectedScore);
    let newRating = Math.round(currentRating + ratingChange);
    
    // Apply maximum change cap to prevent unrealistic jumps
    if (Math.abs(ratingChange) > maxChange) {
      const sign = ratingChange > 0 ? 1 : -1;
      newRating = Math.round(currentRating + sign * maxChange);
    }
    
    // Ensure rating stays within 200-800 range
    return Math.max(200, Math.min(800, newRating));
  }

  /**
   * Calculate dynamic K-factor for players based on experience
   * Conservative formula: K = 25 / (1 + games_played / 15)
   * @param gamesPlayed Number of games played
   * @returns K-factor (starts at ~25, decreases slowly to ~4.2 with experience)
   */
  static calculatePlayerKFactor(gamesPlayed: number): number {
    // Conservative decay formula: K = 25 / (1 + games_played / 15)
    // Examples:
    // 0 exams: K ≈ 25
    // 15 exams: K ≈ 12.5
    // 30 exams: K ≈ 8.3
    // 60 exams: K ≈ 5.6
    // 100+ exams: K ≈ 4.2
    const kFactor = 25.0 / (1.0 + gamesPlayed / 15.0);
    return Math.round(kFactor * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate K-factor for questions (more stable than player K-factors)
   * @param timesRated Number of times question has been rated
   * @returns K-factor for question stability
   */
  static calculateQuestionKFactor(timesRated: number): number {
    if (timesRated < 20) return 40;
    if (timesRated < 50) return 20;
    return 10;
  }

  /**
   * Get K-factor based on number of games/ratings (alias for compatibility)
   * @param timesPlayed Number of times played/answered
   * @param isQuestion Whether this is for a question (vs player)
   * @returns K-factor value
   */
  static getKFactor(timesPlayed: number, isQuestion: boolean = false): number {
    return isQuestion 
      ? this.calculateQuestionKFactor(timesPlayed)
      : this.calculatePlayerKFactor(timesPlayed);
  }

  /**
   * Calculate question reliability based on number of ratings
   * @param timesRated Number of times question has been rated
   * @returns Reliability score (0.0 to 0.95)
   */
  static calculateQuestionReliability(timesRated: number): number {
    // Reliability increases with more ratings, caps at 0.95
    return Math.min(0.95, timesRated / 100);
  }

  /**
   * Calculate player confidence level based on rating stability
   * @param gamesPlayed Number of games played
   * @param recentPerformance Recent performance metric (0.0 to 1.0)
   * @returns Confidence level (0.0 to 1.0)
   */
  static calculatePlayerConfidence(gamesPlayed: number, recentPerformance: number = 0.5): number {
    const experienceFactor = Math.min(1.0, gamesPlayed / 50); // Max confidence at 50 games
    const performanceFactor = recentPerformance;
    
    // Combine experience and performance for confidence
    return Math.min(0.95, (experienceFactor * 0.7) + (performanceFactor * 0.3));
  }

  /**
   * Perform complete ELO calculation for a question attempt
   * @param playerStats Current player statistics
   * @param questionStats Current question statistics
   * @param isCorrect Whether the answer was correct
   * @returns Complete ELO calculation results
   */
  static performELOCalculation(
    playerStats: PlayerStats,
    questionStats: QuestionStats,
    isCorrect: boolean
  ): ELOCalculationResult {
    // Calculate expected score
    const expectedScore = this.calculateExpectedScore(
      playerStats.currentRating, 
      questionStats.currentRating
    );

    // Actual score: 1 for correct, 0 for incorrect
    const actualScore = isCorrect ? 1 : 0;

    // Calculate new K-factors based on experience
    const playerNewKFactor = this.calculatePlayerKFactor(playerStats.gamesPlayed + 1);
    const questionNewKFactor = this.calculateQuestionKFactor(questionStats.timesRated + 1);

    // Calculate new ratings
    const playerNewRating = this.calculateNewRating(
      playerStats.currentRating,
      playerStats.kFactor,
      actualScore,
      expectedScore
    );

    // For questions, we invert the logic (question "wins" when player gets it wrong)
    const questionActualScore = isCorrect ? 0 : 1;
    const questionExpectedScore = 1 - expectedScore;
    
    const questionNewRating = this.calculateNewRating(
      questionStats.currentRating,
      questionStats.kFactor,
      questionActualScore,
      questionExpectedScore
    );

    // Calculate ELO changes
    const playerEloChange = playerNewRating - playerStats.currentRating;
    const questionEloChange = questionNewRating - questionStats.currentRating;

    return {
      playerNewRating,
      questionNewRating,
      expectedScore,
      actualScore,
      playerEloChange,
      questionEloChange,
      playerNewKFactor,
      questionNewKFactor
    };
  }

  /**
   * Determine if a question is appropriate for a player's skill level
   * @param playerRating Player's current ELO rating
   * @param questionRating Question's ELO rating
   * @param toleranceRange Acceptable rating difference (default 200)
   * @returns True if question is appropriate
   */
  static isQuestionAppropriate(
    playerRating: number, 
    questionRating: number, 
    toleranceRange: number = 200
  ): boolean {
    const ratingDifference = Math.abs(playerRating - questionRating);
    return ratingDifference <= toleranceRange;
  }

  /**
   * Calculate difficulty distribution for adaptive selection
   * @param playerRating Player's current rating
   * @returns Object with rating ranges for different difficulty levels
   */
  static getAdaptiveDifficultyRanges(playerRating: number) {
    return {
      easier: {
        min: Math.max(200, playerRating - 100),
        max: Math.max(200, playerRating - 25)
      },
      atLevel: {
        min: Math.max(200, playerRating - 25),
        max: Math.min(800, playerRating + 25)
      },
      harder: {
        min: Math.min(800, playerRating + 25),
        max: Math.min(800, playerRating + 100)
      }
    };
  }
}

export default ELOCalculator;