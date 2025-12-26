#!/usr/bin/env node
/**
 * Batch simulation runner — executes multiple attempt scenarios and writes CSV rows.
 * Usage: node scripts/simulate-batch.cjs [output.csv]
 */

const fs = require('fs');
const path = require('path');

const QuestionAttemptModel = require(path.join(__dirname, '..', 'backend', 'dist', 'models', 'QuestionAttempt')).default;
const QuizSessionModel = require(path.join(__dirname, '..', 'backend', 'dist', 'models', 'QuizSession')).default;
const db = require(path.join(__dirname, '..', 'backend', 'dist', 'config', 'database')).default;

const outFile = process.argv[2] || path.join(__dirname, '..', 'simulation-results.csv');

const scenarios = [
  { name: '5_correct', user: '1', questionId: 1, answers: Array(5).fill('B'), category: 18 },
  { name: '5_incorrect', user: '1', questionId: 1, answers: Array(5).fill('A'), category: 18 },
  { name: 'mixed_4', user: '1', questionId: 1, answers: ['B', 'A', 'B', 'A'], category: 18 }
];

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

async function ensureSession(userId) {
  try {
    const created = await QuizSessionModel.createSession({ userId: String(userId), sessionType: 'practice' });
    return created.id;
  } catch (e) {
    // fallback: try to create again
    const created = await QuizSessionModel.createSession({ userId: String(userId), sessionType: 'practice' });
    return created.id;
  }
}

async function getMicro(userId, categoryId) {
  try {
    const res = await db.query('SELECT elo_rating, confidence FROM micro_ratings WHERE user_id = $1 AND category_id = $2', [String(userId), Number(categoryId)]);
    return res.rows[0] || { elo_rating: null, confidence: null };
  } catch (e) {
    return { elo_rating: null, confidence: null };
  }
}

async function getLastAttempt(sessionId, questionId, userId) {
  try {
    const res = await db.query(`SELECT * FROM question_attempts WHERE session_id = $1 AND question_id = $2 AND user_id = $3 ORDER BY id DESC LIMIT 1`, [sessionId, questionId, userId]);
    return res.rows[0] || null;
  } catch (e) {
    return null;
  }
}

async function run() {
  // Write header
  const header = [
    'scenario','attempt_index','timestamp','user_id','category_id','question_id','answer',
    'is_correct','player_rating_before','player_rating_after','player_elo_change',
    'question_rating_before','question_rating_after','question_elo_change','expected_score',
    'micro_before_elo','micro_after_elo','micro_elo_delta','micro_conf_before','micro_conf_after'
  ].join(',') + '\n';

  fs.writeFileSync(outFile, header, 'utf8');

  for (const scen of scenarios) {
    const sessionId = await ensureSession(scen.user);
    console.log('Running scenario', scen.name, 'session', sessionId);

    for (let i = 0; i < scen.answers.length; i++) {
      const answer = scen.answers[i];
      const microBefore = await getMicro(scen.user, scen.category);

      try {
        await QuestionAttemptModel.recordAttempt({
          sessionId: sessionId,
          questionId: scen.questionId,
          userId: String(scen.user),
          userAnswer: String(answer),
          timeSpent: 10
        });
      } catch (err) {
        console.error('Attempt record failed', err && err.message ? err.message : err);
      }

      const attemptRow = await getLastAttempt(sessionId, scen.questionId, String(scen.user));
      const microAfter = await getMicro(scen.user, scen.category);

      const row = [
        scen.name,
        i + 1,
        new Date().toISOString(),
        scen.user,
        scen.category,
        scen.questionId,
        answer,
        attemptRow ? (attemptRow.is_correct ? 1 : 0) : '',
        attemptRow ? (attemptRow.player_rating_before ?? '') : '',
        attemptRow ? (attemptRow.player_rating_after ?? '') : '',
        attemptRow ? (attemptRow.elo_change ?? '') : '',
        attemptRow ? (attemptRow.question_rating_before ?? '') : '',
        attemptRow ? (attemptRow.question_rating_after ?? '') : '',
        attemptRow ? (attemptRow.question_rating_after - attemptRow.question_rating_before ?? '') : '',
        attemptRow ? (attemptRow.expected_score ?? '') : '',
        microBefore.elo_rating ?? '',
        microAfter.elo_rating ?? '',
        (microAfter.elo_rating !== null && microBefore.elo_rating !== null) ? (microAfter.elo_rating - microBefore.elo_rating) : '',
        microBefore.confidence ?? '',
        microAfter.confidence ?? ''
      ].map(csvEscape).join(',') + '\n';

      fs.appendFileSync(outFile, row, 'utf8');
    }
  }

  console.log('CSV written to', outFile);
  try { await db.end(); } catch (e) { /* ignore */ }
}

run().catch(err => { console.error('Batch failed:', err); process.exit(1); });
