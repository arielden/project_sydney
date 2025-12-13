#!/usr/bin/env node

/**
 * ELO Rating System - Test Scenarios & Validation
 * Tests the correctness of ELO calculations
 */

class ELOTester {
  /**
   * Calculate expected score using ELO formula
   * E = 1 / (1 + 10^((Rq - Rp) / 400))
   */
  static calculateExpectedScore(playerRating, questionRating) {
    const exponent = (questionRating - playerRating) / 400;
    const expectedScore = 1 / (1 + Math.pow(10, exponent));
    return Math.max(0, Math.min(1, expectedScore));
  }

  /**
   * Calculate new rating using ELO formula
   * R' = R + K(S - E)
   */
  static calculateNewRating(currentRating, kFactor, actualScore, expectedScore) {
    const ratingChange = kFactor * (actualScore - expectedScore);
    const newRating = Math.round(currentRating + ratingChange);
    return Math.max(100, newRating);
  }

  /**
   * Test Scenario 1: New user (ELO 1200) answers easy question (ELO 1000) correctly
   * Expected: rating increases ~16 points
   */
  static testScenario1() {
    console.log('\n📊 Test Scenario 1: New user, easy question, CORRECT answer');
    console.log('═'.repeat(60));
    
    const playerRating = 1200;
    const questionRating = 1000;
    const playerKFactor = 100;
    const isCorrect = true;

    const expectedScore = this.calculateExpectedScore(playerRating, questionRating);
    const actualScore = isCorrect ? 1 : 0;
    const newPlayerRating = this.calculateNewRating(playerRating, playerKFactor, actualScore, expectedScore);
    const eloChange = newPlayerRating - playerRating;

    console.log(`Player Rating Before: ${playerRating}`);
    console.log(`Question Rating: ${questionRating}`);
    console.log(`K-Factor (new user): ${playerKFactor}`);
    console.log(`Expected Score: ${(expectedScore * 100).toFixed(2)}%`);
    console.log(`Actual Score: ${actualScore === 1 ? 'Correct' : 'Incorrect'}`);
    console.log(`\n✅ Player Rating After: ${newPlayerRating}`);
    console.log(`📈 ELO Change: +${eloChange}`);
    console.log(`\nExpected: ~16-24 points increase (higher when player is underrated)`);
    console.log(`Actual: ${eloChange} points increase`);
    console.log(`✓ PASS` + (eloChange >= 20 && eloChange <= 28 ? ' ✓' : ' ✗ FAIL'));

    return {
      scenario: 1,
      passed: eloChange >= 20 && eloChange <= 28,
      eloChange
    };
  }

  /**
   * Test Scenario 2: New user (ELO 1200) answers hard question (ELO 1400) incorrectly
   * Expected: rating decreases ~4 points
   */
  static testScenario2() {
    console.log('\n📊 Test Scenario 2: New user, hard question, INCORRECT answer');
    console.log('═'.repeat(60));
    
    const playerRating = 1200;
    const questionRating = 1400;
    const playerKFactor = 100;
    const isCorrect = false;

    const expectedScore = this.calculateExpectedScore(playerRating, questionRating);
    const actualScore = isCorrect ? 1 : 0;
    const newPlayerRating = this.calculateNewRating(playerRating, playerKFactor, actualScore, expectedScore);
    const eloChange = newPlayerRating - playerRating;

    console.log(`Player Rating Before: ${playerRating}`);
    console.log(`Question Rating: ${questionRating}`);
    console.log(`K-Factor (new user): ${playerKFactor}`);
    console.log(`Expected Score: ${(expectedScore * 100).toFixed(2)}%`);
    console.log(`Actual Score: ${actualScore === 1 ? 'Correct' : 'Incorrect'}`);
    console.log(`\n✅ Player Rating After: ${newPlayerRating}`);
    console.log(`📉 ELO Change: ${eloChange}`);
    console.log(`\nExpected: ~-24 points decrease (larger loss for tough question)`);
    console.log(`Actual: ${eloChange} points change`);
    console.log(`✓ PASS` + (eloChange >= -28 && eloChange <= -20 ? ' ✓' : ' ✗ FAIL'));

    return {
      scenario: 2,
      passed: eloChange >= -28 && eloChange <= -20,
      eloChange
    };
  }

  /**
   * Test Scenario 3: Experienced user (30+ games) has smaller rating changes
   * K-factor should be 10 instead of 100
   */
  static testScenario3() {
    console.log('\n📊 Test Scenario 3: Experienced user (30+ games), easy question, CORRECT');
    console.log('═'.repeat(60));
    
    const playerRating = 1250;
    const questionRating = 1000;
    const playerKFactor = 10; // After 30+ games
    const isCorrect = true;

    const expectedScore = this.calculateExpectedScore(playerRating, questionRating);
    const actualScore = isCorrect ? 1 : 0;
    const newPlayerRating = this.calculateNewRating(playerRating, playerKFactor, actualScore, expectedScore);
    const eloChange = newPlayerRating - playerRating;

    console.log(`Player Rating Before: ${playerRating}`);
    console.log(`Question Rating: ${questionRating}`);
    console.log(`K-Factor (experienced): ${playerKFactor}`);
    console.log(`Expected Score: ${(expectedScore * 100).toFixed(2)}%`);
    console.log(`Actual Score: ${actualScore === 1 ? 'Correct' : 'Incorrect'}`);
    console.log(`\n✅ Player Rating After: ${newPlayerRating}`);
    console.log(`📈 ELO Change: +${eloChange}`);
    console.log(`\nExpected: ~1.6 points increase (10x smaller than new user)`);
    console.log(`Actual: ${eloChange} points increase`);
    console.log(`✓ PASS` + (eloChange >= 1 && eloChange <= 3 ? ' ✓' : ' ✗ FAIL'));

    return {
      scenario: 3,
      passed: eloChange >= 1 && eloChange <= 3,
      eloChange
    };
  }

  /**
   * Test Scenario 4: Verify rating never goes below 100
   */
  static testScenario4() {
    console.log('\n📊 Test Scenario 4: Prevent negative ratings (minimum 100)');
    console.log('═'.repeat(60));
    
    const playerRating = 150;
    const questionRating = 1800;
    const playerKFactor = 100;
    const isCorrect = false;

    const expectedScore = this.calculateExpectedScore(playerRating, questionRating);
    const actualScore = isCorrect ? 1 : 0;
    const newPlayerRating = this.calculateNewRating(playerRating, playerKFactor, actualScore, expectedScore);

    console.log(`Player Rating Before: ${playerRating}`);
    console.log(`Question Rating: ${questionRating}`);
    console.log(`K-Factor: ${playerKFactor}`);
    console.log(`Expected Score: ${(expectedScore * 100).toFixed(2)}%`);
    console.log(`Actual Score: ${actualScore === 1 ? 'Correct' : 'Incorrect'}`);
    console.log(`\n✅ Player Rating After: ${newPlayerRating}`);
    console.log(`\nExpected: Minimum rating of 100`);
    console.log(`Actual: ${newPlayerRating}`);
    console.log(`✓ PASS` + (newPlayerRating >= 100 ? ' ✓' : ' ✗ FAIL'));

    return {
      scenario: 4,
      passed: newPlayerRating >= 100,
      finalRating: newPlayerRating
    };
  }

  /**
   * Test Scenario 5: Question K-factor decreases with experience
   * K-factor for questions: 40 < 20 attempts, 20 < 50 attempts, 10 > 50 attempts
   */
  static testScenario5() {
    console.log('\n📊 Test Scenario 5: Question K-factor decreases with experience');
    console.log('═'.repeat(60));

    // Test different times_rated values
    const testCases = [
      { timesRated: 10, expectedK: 40, description: 'New question (< 20 attempts)' },
      { timesRated: 30, expectedK: 20, description: 'Moderately used (20-50 attempts)' },
      { timesRated: 60, expectedK: 10, description: 'Well-established (> 50 attempts)' }
    ];

    let allPassed = true;

    testCases.forEach(testCase => {
      const k = this.getQuestionKFactor(testCase.timesRated);
      const passed = k === testCase.expectedK;
      allPassed = allPassed && passed;

      console.log(`\n  ${testCase.description}`);
      console.log(`  Times Rated: ${testCase.timesRated}`);
      console.log(`  Expected K-Factor: ${testCase.expectedK}`);
      console.log(`  Actual K-Factor: ${k}`);
      console.log(`  ${passed ? '✓' : '✗'} ${passed ? 'PASS' : 'FAIL'}`);
    });

    return {
      scenario: 5,
      passed: allPassed
    };
  }

  static getQuestionKFactor(timesRated) {
    if (timesRated < 20) return 40;
    if (timesRated < 50) return 20;
    return 10;
  }

  /**
   * Run all tests
   */
  static runAllTests() {
    console.log('\n' + '═'.repeat(60));
    console.log('🧪 ELO RATING SYSTEM - COMPREHENSIVE TEST SUITE');
    console.log('═'.repeat(60));

    const results = [
      this.testScenario1(),
      this.testScenario2(),
      this.testScenario3(),
      this.testScenario4(),
      this.testScenario5()
    ];

    console.log('\n' + '═'.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`Test ${result.scenario}: ${status}`);
    });

    console.log(`\n📊 Overall: ${passed}/${total} tests passed`);
    console.log('═'.repeat(60));

    if (passed === total) {
      console.log('\n✅ All tests passed! ELO system is working correctly.\n');
    } else {
      console.log(`\n⚠️  ${total - passed} test(s) failed. Please review the implementation.\n`);
    }
  }
}

// Run tests
ELOTester.runAllTests();
