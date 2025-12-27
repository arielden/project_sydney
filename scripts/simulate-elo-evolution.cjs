#!/usr/bin/env node
/**
 * Simulation script to demonstrate K-factor evolution over 1000 questions
 * using the updated ELO calculator with staged K-factor reduction.
 */

const path = require('path');
const fs = require('fs');

// Import the ELOCalculator from the compiled backend
const ELOCalculator = require(path.join(__dirname, '..', 'backend', 'dist', 'utils', 'eloCalculator')).ELOCalculator;

function simulateELOEvolution(totalQuestions = 1000, initialRating = 500, useSmoothing = true, maxChange) {
  console.log(`Simulating ELO evolution for ${totalQuestions} questions...`);
  console.log(`Initial rating: ${initialRating}`);
  console.log(`K-factor smoothing: ${useSmoothing ? 'enabled' : 'disabled'}`);
  console.log(`Max rating change per question: ${maxChange || 'unlimited'}\n`);

  let currentRating = initialRating;
  let gamesPlayed = 0; // Start from 0, will increment before calculation

  const results = [];
  results.push(['Question', 'GamesPlayed', 'KFactor', 'RatingBefore', 'OppRating', 'ExpectedScore', 'ActualScore', 'RatingAfter', 'Change'].join(','));

  for (let q = 1; q <= totalQuestions; q++) {
    gamesPlayed = q - 1; // gamesPlayed before this question

    // Calculate K-factor for this question (based on gamesPlayed so far)
    const kFactor = ELOCalculator.calculatePlayerKFactor(gamesPlayed, useSmoothing);

    // Simulate opponent rating (question rating) - distributed around player rating but within 200-800
    const baseRating = Math.max(200, Math.min(800, currentRating));
    const oppRating = Math.round(baseRating + (Math.random() - 0.5) * 200); // ±100 range
    const clampedOppRating = Math.max(200, Math.min(800, oppRating));

    // Calculate expected score
    const expectedScore = ELOCalculator.calculateExpectedScore(currentRating, clampedOppRating);

    // Simulate actual score (random based on expected probability)
    const actualScore = Math.random() < expectedScore ? 1 : 0;

    // Calculate new rating with optional max change smoothing
    const newRating = ELOCalculator.calculateNewRating(currentRating, kFactor, actualScore, expectedScore, maxChange);

    const change = newRating - currentRating;

    results.push([q, gamesPlayed, kFactor, currentRating, clampedOppRating, expectedScore.toFixed(4), actualScore, newRating, change].join(','));

    currentRating = newRating;
  }

  // Write to CSV
  const csvContent = results.join('\n');
  const suffix = useSmoothing ? '_smoothed' : '_staged';
  const changeSuffix = maxChange ? `_max${maxChange}` : '';
  const outputPath = path.join(__dirname, '..', `elo_simulation_results${suffix}${changeSuffix}.csv`);
  fs.writeFileSync(outputPath, csvContent);

  console.log(`Simulation complete! Results saved to: ${outputPath}`);
  console.log(`Final rating after ${totalQuestions} questions: ${currentRating}`);

  if (useSmoothing) {
    console.log('\nSmoothed K-factor transitions:');
    console.log('Questions 1-44: K=100');
    console.log('Questions 45-200: K=100→60 (linear interpolation)');
    console.log('Questions 201-400: K=60→40 (linear interpolation)');
    console.log('Questions 401-600: K=40→24 (linear interpolation)');
    console.log('Questions 601-800: K=24→16 (linear interpolation)');
    console.log('Questions 801-1000: K=16→10 (linear interpolation)');
    console.log('Questions 1000+: K=10');
  } else {
    console.log('\nStaged K-factor (original):');
    console.log('Questions 1-44: K=100');
    console.log('Questions 45-200: K=60');
    console.log('Questions 201-400: K=40');
    console.log('Questions 401-600: K=24');
    console.log('Questions 601-800: K=16');
    console.log('Questions 801+: K=10');
  }
}

function main() {
  const args = process.argv.slice(2);
  const totalQuestions = args[0] ? parseInt(args[0], 10) : 1000;
  const initialRating = args[1] ? parseInt(args[1], 10) : 500; // Default to 500 for new users
  const useSmoothing = args[2] !== 'false'; // Default true, set to 'false' to disable
  const maxChange = args[3] ? parseInt(args[3], 10) : undefined; // Optional max change

  simulateELOEvolution(totalQuestions, initialRating, useSmoothing, maxChange);
}

if (require.main === module) {
  main();
}

module.exports = { simulateELOEvolution };