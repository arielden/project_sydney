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
   * Calculate new rating using ELO formula
   * R' = R + K(S - E)
   * @param currentRating Current ELO rating
   * @param kFactor K-factor for rating volatility
   * @param actualScore Actual score (1 for correct, 0 for incorrect)
   * @param expectedScore Expected score from calculateExpectedScore
   * @returns New ELO rating
   */
  static calculateNewRating(
    currentRating: number, 
    kFactor: number, 
    actualScore: number, 
    expectedScore: number
  ): number {
    const ratingChange = kFactor * (actualScore - expectedScore);
    const newRating = Math.round(currentRating + ratingChange);
    
    // Ensure rating doesn't go below 100
    return Math.max(100, newRating);
  }

  /**
   * Calculate dynamic K-factor for players based on experience
   * @param gamesPlayed Number of games played
   * @returns K-factor (100 for beginners, decreases with experience)
   */
  static calculatePlayerKFactor(gamesPlayed: number): number {
    if (gamesPlayed < 10) return 100;
    if (gamesPlayed < 30) return 40;
    return 10;
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
        min: Math.max(100, playerRating - 200),
        max: playerRating - 50
      },
      atLevel: {
        min: playerRating - 50,
        max: playerRating + 50
      },
      harder: {
        min: playerRating + 50,
        max: playerRating + 200
      }
    };
  }
}

export default ELOCalculator;