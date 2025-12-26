#!/usr/bin/env node
/**
 * Simple simulation script to record question attempts via the compiled backend model.
 * Usage:
 *   node scripts/simulate-attempts.js --user 1 --question 10 --session 999 --answer A --count 3 --delay 500 --category 2
 *
 * It will call backend/dist/models/QuestionAttempt.recordAttempt and show micro rating before/after.
 */

const path = require('path');

function parseArg(name, fallback) {
  const argv = process.argv.slice(2);
  const idx = argv.findIndex(a => a === name || a.startsWith(`${name}=`));
  if (idx === -1) return fallback;
  const token = argv[idx];
  if (token.includes('=')) return token.split('=')[1];
  return argv[idx + 1] || fallback;
}

const userId = parseArg('--user', process.env.SIM_USER || '1');
const questionId = parseArg('--question', process.env.SIM_QUESTION || '1');
const sessionId = parseArg('--session', process.env.SIM_SESSION || `sim-${Date.now()}`);
const userAnswer = parseArg('--answer', process.env.SIM_ANSWER || 'A');
const iterations = parseInt(parseArg('--count', '1'), 10) || 1;
const delayMs = parseInt(parseArg('--delay', '250'), 10) || 250;
const categoryId = parseArg('--category', null);

// Load compiled backend models (uses same DB config)
const QuestionAttemptModel = require(path.join(__dirname, '..', 'backend', 'dist', 'models', 'QuestionAttempt')).default;
const db = require(path.join(__dirname, '..', 'backend', 'dist', 'config', 'database')).default;

async function getMicroRating(uid, cid) {
  if (!cid) return null;
  try {
    const res = await db.query('SELECT elo_rating, confidence, updated_at FROM micro_ratings WHERE user_id = $1 AND category_id = $2', [String(uid), Number(cid)]);
    return res.rows[0] || null;
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log('Simulate Attempts — config:', { userId, questionId, sessionId, userAnswer, iterations, delayMs, categoryId });

  const before = await getMicroRating(userId, categoryId);
  console.log('Micro rating before:', before);

  for (let i = 0; i < iterations; i++) {
    try {
      console.log(`-> Recording attempt ${i + 1}/${iterations}`);
      await QuestionAttemptModel.recordAttempt({
        sessionId: sessionId,
        questionId: Number(questionId),
        userId: String(userId),
        userAnswer: String(userAnswer),
        timeSpent: 10
      });
    } catch (err) {
      console.error('Error recording attempt:', err && err.message ? err.message : err);
      process.exitCode = 2;
      break;
    }

    if (i < iterations - 1) await new Promise(r => setTimeout(r, delayMs));
  }

  const after = await getMicroRating(userId, categoryId);
  console.log('Micro rating after:', after);

  // Close DB pool
  try { await db.end(); } catch (e) { /* ignore */ }
}

run().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
