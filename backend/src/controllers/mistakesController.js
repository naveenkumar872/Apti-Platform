const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/* ────────────────────────────────────────────────
   Mistake Replay Queue
   ─────────────────────────────────────────────────
   Auto-collects every wrong answer from practice / tests / diagnostic.
   Student replays them until they get each one right; the entry is then
   marked `mastered_at` and stops appearing in the active queue.
   ───────────────────────────────────────────────── */

const REPLAY_BATCH = 10;

function normaliseOptions(options) {
  if (Buffer.isBuffer(options)) options = options.toString('utf8');
  if (typeof options === 'string') {
    try { return JSON.parse(options); } catch { /* ignore */ }
  }
  return options;
}

/**
 * Add a wrong answer to the queue (or bump replay_attempts if it's already there).
 * Exported and called from the practice / test / diagnostic submit handlers.
 *
 * Safe to call with partial info; resolves topic/subject by question_id.
 */
async function enqueueWrongAnswer({ student_id, question_id, selected_answer, source, source_id }) {
  if (!student_id || !question_id) return;
  try {
    // Resolve question metadata (topic + subject + correct answer) once.
    const meta = await query(
      `SELECT q.correct_answer, c.topic_id, t.subject_id
       FROM questions q
       LEFT JOIN concepts c ON c.concept_id = q.concept_id
       LEFT JOIN topics t   ON t.topic_id   = c.topic_id
       WHERE q.question_id = ? LIMIT 1`,
      [question_id]
    );
    if (meta.rows.length === 0) return;
    const { correct_answer, topic_id, subject_id } = meta.rows[0];

    await query(
      `INSERT INTO wrong_answer_queue
         (entry_id, student_id, question_id, source, source_id, topic_id, subject_id,
          original_selected, correct_answer, replay_attempts, mastered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
       ON DUPLICATE KEY UPDATE
         replay_attempts  = wrong_answer_queue.replay_attempts + 1,
         last_replayed_at = NOW(),
         mastered_at      = NULL,
         source           = VALUES(source),
         source_id        = VALUES(source_id)`,
      [
        uuidv4(), student_id, question_id,
        source || null, source_id || null,
        topic_id || null, subject_id || null,
        selected_answer || null, correct_answer || null,
      ]
    );
  } catch (err) {
    console.error('[mistakes] enqueue failed (non-fatal):', err.message);
  }
}

/* ────────────────────────────────────────────────
   GET /student/mistakes
   List pending + summary stats + breakdown by topic.
   ──────────────────────────────────────────────── */
const getMistakes = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;

    const [pendingRows, stats, byTopic] = await Promise.all([
      query(
        `SELECT w.entry_id, w.question_id, w.source, w.replay_attempts,
                w.last_replayed_at, w.created_at, w.original_selected,
                q.question_text, q.options, q.difficulty,
                t.name as topic_name, s.name as subject_name,
                w.topic_id, w.subject_id
         FROM wrong_answer_queue w
         JOIN questions q ON q.question_id = w.question_id
         LEFT JOIN topics t   ON t.topic_id   = w.topic_id
         LEFT JOIN subjects s ON s.subject_id = w.subject_id
         WHERE w.student_id = ? AND w.mastered_at IS NULL
         ORDER BY w.last_replayed_at ASC, w.created_at ASC`,
        [student_id]
      ),
      query(
        `SELECT
            COUNT(*)                                                 AS total,
            SUM(CASE WHEN mastered_at IS NULL THEN 1 ELSE 0 END)     AS pending_count,
            SUM(CASE WHEN mastered_at IS NOT NULL THEN 1 ELSE 0 END) AS mastered_count
         FROM wrong_answer_queue WHERE student_id = ?`,
        [student_id]
      ),
      query(
        `SELECT w.topic_id, t.name AS topic_name, s.name AS subject_name,
                COUNT(*) AS pending
         FROM wrong_answer_queue w
         LEFT JOIN topics t   ON t.topic_id   = w.topic_id
         LEFT JOIN subjects s ON s.subject_id = w.subject_id
         WHERE w.student_id = ? AND w.mastered_at IS NULL
         GROUP BY w.topic_id, t.name, s.name
         ORDER BY pending DESC`,
        [student_id]
      ),
    ]);

    const pending = pendingRows.rows.map(r => ({
      entry_id:      r.entry_id,
      question_id:   r.question_id,
      question_text: r.question_text,
      options:       normaliseOptions(r.options),
      difficulty:    r.difficulty,
      topic_name:    r.topic_name,
      subject_name:  r.subject_name,
      topic_id:      r.topic_id,
      subject_id:    r.subject_id,
      source:        r.source,
      replay_attempts: Number(r.replay_attempts) || 0,
      original_selected: r.original_selected,
      added_at:      r.created_at,
      last_replayed_at: r.last_replayed_at,
    }));

    const s = stats.rows[0] || {};
    res.json({
      pending,
      summary: {
        total:          Number(s.total)          || 0,
        pending_count:  Number(s.pending_count)  || 0,
        mastered_count: Number(s.mastered_count) || 0,
      },
      by_topic: byTopic.rows.map(b => ({
        topic_id:     b.topic_id,
        topic_name:   b.topic_name || 'Uncategorised',
        subject_name: b.subject_name || '',
        pending:      Number(b.pending) || 0,
      })),
    });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   GET /student/mistakes/replay?topic_id=&limit=
   Returns up to N pending mistakes ready to re-attempt (no answer key).
   ──────────────────────────────────────────────── */
const getReplay = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;
    const topic_id   = req.query.topic_id || null;
    const limit      = Math.max(1, Math.min(20, Number(req.query.limit) || REPLAY_BATCH));

    const params = [student_id];
    let where = 'WHERE w.student_id = ? AND w.mastered_at IS NULL';
    if (topic_id) { where += ' AND w.topic_id = ?'; params.push(topic_id); }
    params.push(limit);

    const r = await query(
      `SELECT w.entry_id, w.question_id, w.replay_attempts,
              q.question_text, q.options, q.difficulty,
              t.name AS topic_name, s.name AS subject_name
       FROM wrong_answer_queue w
       JOIN questions q ON q.question_id = w.question_id
       LEFT JOIN topics t   ON t.topic_id   = w.topic_id
       LEFT JOIN subjects s ON s.subject_id = w.subject_id
       ${where}
       ORDER BY w.last_replayed_at ASC, w.created_at ASC
       LIMIT ?`,
      params
    );

    res.json({
      questions: r.rows.map(row => ({
        entry_id:      row.entry_id,
        question_id:   row.question_id,
        question_text: row.question_text,
        options:       normaliseOptions(row.options),
        difficulty:    row.difficulty,
        topic_name:    row.topic_name,
        subject_name:  row.subject_name,
        replay_attempts: Number(row.replay_attempts) || 0,
      })),
      total: r.rows.length,
    });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   POST /student/mistakes/answer
   Body: { entry_id, selected_answer, time_taken_seconds }
   Marks the entry mastered when correct, bumps replay_attempts in both cases.
   Always returns the correct_answer + explanation so the student sees the why.
   ──────────────────────────────────────────────── */
const submitAnswer = async (req, res, next) => {
  try {
    const { entry_id, selected_answer, time_taken_seconds } = req.body;
    const student_id = req.user.user_id;
    if (!entry_id || !selected_answer) {
      return res.status(400).json({ error: 'entry_id and selected_answer are required' });
    }

    // Verify ownership + load question
    const r = await query(
      `SELECT w.entry_id, w.student_id, w.question_id, w.topic_id, w.mastered_at,
              q.correct_answer, q.explanation
       FROM wrong_answer_queue w
       JOIN questions q ON q.question_id = w.question_id
       WHERE w.entry_id = ?`,
      [entry_id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });
    const row = r.rows[0];
    if (row.student_id !== student_id) return res.status(403).json({ error: 'Not yours' });

    const is_correct = String(selected_answer).toUpperCase() === String(row.correct_answer || '').toUpperCase();

    if (is_correct) {
      await query(
        `UPDATE wrong_answer_queue
           SET mastered_at = NOW(),
               replay_attempts = replay_attempts + 1,
               last_replayed_at = NOW()
         WHERE entry_id = ?`,
        [entry_id]
      );
    } else {
      await query(
        `UPDATE wrong_answer_queue
           SET replay_attempts = replay_attempts + 1,
               last_replayed_at = NOW()
         WHERE entry_id = ?`,
        [entry_id]
      );
    }

    // Roll the result into student_skill_profile so mastery % reflects this.
    if (row.topic_id) {
      await query(
        `INSERT INTO student_skill_profile (student_id, topic_id, total_attempts, correct_count, accuracy_percent, last_attempted)
         VALUES (?, ?, 1, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           total_attempts = student_skill_profile.total_attempts + 1,
           correct_count  = student_skill_profile.correct_count  + VALUES(correct_count),
           accuracy_percent = ROUND(((student_skill_profile.correct_count + VALUES(correct_count)) /
                                     (student_skill_profile.total_attempts + 1)) * 100, 2),
           is_weak = ((student_skill_profile.correct_count + VALUES(correct_count)) /
                      (student_skill_profile.total_attempts + 1)) < 0.6,
           last_attempted = NOW()`,
        [student_id, row.topic_id, is_correct ? 1 : 0, is_correct ? 100 : 0]
      );
    }

    res.json({
      is_correct,
      correct_answer: row.correct_answer,
      explanation:    row.explanation || '',
      mastered:       is_correct,
    });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   DELETE /student/mistakes/:entry_id
   Manually drop an entry from the queue (e.g. flagged as a bad question).
   ──────────────────────────────────────────────── */
const dismissMistake = async (req, res, next) => {
  try {
    const r = await query(
      'DELETE FROM wrong_answer_queue WHERE entry_id = ? AND student_id = ?',
      [req.params.entry_id, req.user.user_id]
    );
    res.json({ ok: true, removed: r.rows?.affectedRows || 0 });
  } catch (err) { next(err); }
};

module.exports = {
  enqueueWrongAnswer,
  getMistakes,
  getReplay,
  submitAnswer,
  dismissMistake,
};
