#!/usr/bin/env node
/**
 * CommonJS simulation script to record question attempts via the compiled backend model.
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

const QuestionAttemptModel = require(path.join(__dirname, '..', 'backend', 'dist', 'models', 'QuestionAttempt')).default;
const QuizSessionModel = require(path.join(__dirname, '..', 'backend', 'dist', 'models', 'QuizSession')).default;
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

  // Ensure quiz session exists; create if missing
  let effectiveSessionId = sessionId;
  try {
    const existing = await QuizSessionModel.getSession(effectiveSessionId);
    if (!existing) {
      const created = await QuizSessionModel.createSession({ userId: String(userId), sessionType: 'practice' });
      effectiveSessionId = created.id;
      console.log('Created new quiz session:', effectiveSessionId);
    } else {
      console.log('Using existing session:', effectiveSessionId);
    }
  } catch (err) {
    // If getSession by arbitrary string id fails (e.g., numeric vs uuid), create a session
    try {
      const created = await QuizSessionModel.createSession({ userId: String(userId), sessionType: 'practice' });
      effectiveSessionId = created.id;
      console.log('Created fallback quiz session:', effectiveSessionId);
    } catch (cErr) {
      console.error('Failed to ensure session exists:', cErr && cErr.message ? cErr.message : cErr);
      throw cErr;
    }
  }

  for (let i = 0; i < iterations; i++) {
    try {
      console.log(`-> Recording attempt ${i + 1}/${iterations}`);
      await QuestionAttemptModel.recordAttempt({
        sessionId: effectiveSessionId,
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

  try { await db.end(); } catch (e) { /* ignore */ }
}

run().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
