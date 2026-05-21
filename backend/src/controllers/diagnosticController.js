const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateAIQuestions } = require('../utils/aiQuestions');
const { enqueueWrongAnswer } = require('./mistakesController');

/* ────────────────────────────────────────────────
   Diagnostic test feature
   ──────────────────────────────────────────────── */

// 4 subjects × ~7-8 questions each = 30 total
const SUBJECTS = [
  { subject_id: '00000000-0000-0000-0000-000000000001', name: 'Quantitative Aptitude', target: 8 },
  { subject_id: '00000000-0000-0000-0000-000000000002', name: 'Logical Reasoning',     target: 8 },
  { subject_id: '00000000-0000-0000-0000-000000000003', name: 'Verbal Ability',        target: 7 },
  { subject_id: '00000000-0000-0000-0000-000000000004', name: 'Data Interpretation',   target: 7 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Normalise the options JSON the DB returns into a plain array/object. */
function normaliseOptions(options) {
  if (Buffer.isBuffer(options)) options = options.toString('utf8');
  if (typeof options === 'string') {
    try { return JSON.parse(options); } catch { /* fall through */ }
  }
  return options;
}

/* Insert one AI-generated question into the `questions` table and return the
   payload to surface to the student. */
async function insertAIQuestion(q, { subject, topic_id, topic_name, concept_id }) {
  const qId = uuidv4();
  await query(
    `INSERT INTO questions
       (question_id, concept_id, question_text, question_type, options,
        correct_answer, explanation, difficulty, source, is_active)
     VALUES (?, ?, ?, 'mcq', ?, ?, ?, 3, 'ai_generated', 1)`,
    [qId, concept_id || null, q.question_text, JSON.stringify(q.options),
     q.correct_answer, q.explanation || '']
  );
  return {
    question_id:  qId,
    question_text: q.question_text,
    options:      q.options,
    difficulty:   3,
    concept_id:   concept_id || null,
    topic_id:     topic_id || null,
    subject_id:   subject.subject_id,
    subject_name: subject.name,
    topic_name:   topic_name || subject.name,
  };
}

/* Resolve a subject → one topic → one concept for AI generation context.
   Falls back gracefully when topics/concepts aren't seeded yet. */
async function resolveTopicForSubject(subjectId, subjectName) {
  const r = await query(
    `SELECT t.topic_id, t.name as topic_name, c.concept_id, c.name as concept_name
     FROM topics t
     LEFT JOIN concepts c ON c.topic_id = t.topic_id
     WHERE t.subject_id = ?
     ORDER BY RAND()
     LIMIT 1`,
    [subjectId]
  );
  if (r.rows.length > 0) {
    return {
      topic_id:   r.rows[0].topic_id,
      topic_name: r.rows[0].topic_name,
      concept_id: r.rows[0].concept_id || null,
    };
  }
  // No topics seeded for this subject — AI-generate against the subject name itself.
  return { topic_id: null, topic_name: subjectName, concept_id: null };
}

/* For one subject, return up to `target` questions: prefer the existing bank,
   AI-generate the shortfall on demand. */
async function questionsForSubject(s) {
  const r = await query(
    `SELECT q.question_id, q.question_text, q.options, q.difficulty, q.concept_id,
            c.topic_id, t.subject_id, t.name as topic_name, sb.name as subject_name
     FROM questions q
     JOIN concepts c  ON c.concept_id = q.concept_id
     JOIN topics t    ON t.topic_id   = c.topic_id
     JOIN subjects sb ON sb.subject_id = t.subject_id
     WHERE t.subject_id = ? AND q.question_type = 'mcq' AND q.is_active = 1
     ORDER BY RAND()
     LIMIT ?`,
    [s.subject_id, s.target * 2]
  );

  const fromBank = shuffle(r.rows).slice(0, s.target).map(q => ({
    question_id:  q.question_id,
    question_text: q.question_text,
    options:      normaliseOptions(q.options),
    difficulty:   q.difficulty,
    concept_id:   q.concept_id,
    topic_id:     q.topic_id,
    subject_id:   q.subject_id,
    subject_name: q.subject_name,
    topic_name:   q.topic_name,
  }));

  const shortfall = s.target - fromBank.length;
  if (shortfall <= 0) return fromBank;

  // AI fallback — generate the missing questions for this subject.
  const topic = await resolveTopicForSubject(s.subject_id, s.name);
  try {
    const aiQs = await generateAIQuestions({
      topicName:   topic.topic_name,
      subjectName: s.name,
      count:       shortfall,
      difficulty:  'medium',
    });
    const inserted = [];
    for (const q of aiQs.slice(0, shortfall)) {
      // Defensive: skip malformed AI output
      if (!q?.question_text || !Array.isArray(q.options) || !q.correct_answer) continue;
      const row = await insertAIQuestion(q, {
        subject:    s,
        topic_id:   topic.topic_id,
        topic_name: topic.topic_name,
        concept_id: topic.concept_id,
      });
      inserted.push(row);
    }
    return [...fromBank, ...inserted];
  } catch (err) {
    console.error(`[Diagnostic AI] ${s.name} fallback failed:`, err.message);
    return fromBank;
  }
}

/* Build the full diagnostic. AI calls per subject run in parallel — Cerebras
   is fast enough that the whole thing usually finishes in <15s even cold. */
async function pickQuestionsForDiagnostic() {
  const perSubject = await Promise.all(SUBJECTS.map(s => questionsForSubject(s)));
  // Section-major order (Quant first, then Logical, …) — feels more natural in the UI.
  return perSubject.flat();
}

/* ────────────────────────────────────────────────
   GET /student/diagnostic/status
   ──────────────────────────────────────────────── */
const status = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;
    const u = await query(
      'SELECT diagnostic_completed_at FROM users WHERE user_id = ?',
      [student_id]
    );
    const completed_at = u.rows[0]?.diagnostic_completed_at || null;

    // Is there an in-progress attempt?
    const ip = await query(
      "SELECT attempt_id FROM diagnostic_attempts WHERE student_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
      [student_id]
    );

    res.json({
      completed: !!completed_at,
      completed_at,
      in_progress_attempt_id: ip.rows[0]?.attempt_id || null,
    });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   POST /student/diagnostic/start
   Returns an existing in-progress attempt if any, otherwise creates a new one.
   ──────────────────────────────────────────────── */
const start = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;

    // If already submitted — refuse.
    const u = await query(
      'SELECT diagnostic_completed_at FROM users WHERE user_id = ?',
      [student_id]
    );
    if (u.rows[0]?.diagnostic_completed_at) {
      return res.status(400).json({ error: 'Diagnostic already completed', completed: true });
    }

    // Resume in-progress attempt if any.
    const ip = await query(
      "SELECT attempt_id FROM diagnostic_attempts WHERE student_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
      [student_id]
    );
    if (ip.rows.length > 0) {
      const attempt_id = ip.rows[0].attempt_id;
      const qs = await loadAttemptQuestions(attempt_id);
      return res.json({ attempt_id, questions: qs, resumed: true });
    }

    // Pick the questions — AI fills any shortfall in the bank.
    const picked = await pickQuestionsForDiagnostic();
    if (picked.length < 8) {
      // Both bank AND AI generation failed (network / API outage).
      return res.status(503).json({
        error: 'We couldn\'t build your diagnostic right now. Please try again in a minute.',
      });
    }

    // Create the attempt.
    const attempt_id = uuidv4();
    await query(
      `INSERT INTO diagnostic_attempts (attempt_id, student_id, total_questions, status)
       VALUES (?, ?, ?, 'in_progress')`,
      [attempt_id, student_id, picked.length]
    );

    // Persist answer slots (one per question, with order).
    for (let i = 0; i < picked.length; i++) {
      const q = picked[i];
      await query(
        `INSERT INTO diagnostic_answers (attempt_id, question_id, question_order, subject_id, topic_id)
         VALUES (?, ?, ?, ?, ?)`,
        [attempt_id, q.question_id, i + 1, q.subject_id, q.topic_id]
      );
    }

    res.json({
      attempt_id,
      questions: picked.map((q, i) => ({ ...q, question_order: i + 1 })),
      resumed: false,
    });
  } catch (err) { next(err); }
};

async function loadAttemptQuestions(attempt_id) {
  const r = await query(
    `SELECT da.question_order, q.question_id, q.question_text, q.options, q.difficulty,
            da.subject_id, da.topic_id, s.name as subject_name, t.name as topic_name,
            da.selected_answer
     FROM diagnostic_answers da
     JOIN questions q ON q.question_id = da.question_id
     LEFT JOIN topics t   ON t.topic_id   = da.topic_id
     LEFT JOIN subjects s ON s.subject_id = da.subject_id
     WHERE da.attempt_id = ?
     ORDER BY da.question_order ASC`,
    [attempt_id]
  );
  return r.rows.map(row => {
    let options = row.options;
    if (Buffer.isBuffer(options)) options = options.toString('utf8');
    if (typeof options === 'string') {
      try { options = JSON.parse(options); } catch { /* ignore */ }
    }
    return { ...row, options };
  });
}

/* ────────────────────────────────────────────────
   POST /student/diagnostic/answer
   Body: { attempt_id, question_id, selected_answer, time_taken_seconds }
   ──────────────────────────────────────────────── */
const answer = async (req, res, next) => {
  try {
    const { attempt_id, question_id, selected_answer, time_taken_seconds } = req.body;
    const student_id = req.user.user_id;

    // Verify ownership + status.
    const a = await query(
      'SELECT student_id, status FROM diagnostic_attempts WHERE attempt_id = ?',
      [attempt_id]
    );
    if (a.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    if (a.rows[0].student_id !== student_id) return res.status(403).json({ error: 'Not your attempt' });
    if (a.rows[0].status !== 'in_progress') return res.status(400).json({ error: 'Already submitted' });

    const q = await query('SELECT correct_answer FROM questions WHERE question_id = ?', [question_id]);
    if (q.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    const is_correct = selected_answer && selected_answer === q.rows[0].correct_answer ? 1 : 0;

    await query(
      `UPDATE diagnostic_answers
         SET selected_answer = ?, is_correct = ?, time_taken_seconds = ?
       WHERE attempt_id = ? AND question_id = ?`,
      [selected_answer, is_correct, time_taken_seconds || 0, attempt_id, question_id]
    );

    res.json({ ok: true });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   POST /student/diagnostic/submit
   Body: { attempt_id }
   Calculates score + section breakdown, marks user.diagnostic_completed_at,
   and rolls up per-topic accuracy into student_skill_profile.
   ──────────────────────────────────────────────── */
const submit = async (req, res, next) => {
  try {
    const { attempt_id, violations } = req.body;
    const violationsCount = Math.max(0, Math.min(99, Number(violations) || 0));
    const student_id = req.user.user_id;

    const a = await query(
      'SELECT student_id, status, started_at FROM diagnostic_attempts WHERE attempt_id = ?',
      [attempt_id]
    );
    if (a.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    if (a.rows[0].student_id !== student_id) return res.status(403).json({ error: 'Not your attempt' });
    if (a.rows[0].status !== 'in_progress') return res.status(400).json({ error: 'Already submitted' });

    // Pull all answers with topic/subject + question_id (needed to queue mistakes).
    const ans = await query(
      `SELECT da.question_id, da.is_correct, da.selected_answer, da.subject_id, da.topic_id, da.time_taken_seconds,
              s.name as subject_name
       FROM diagnostic_answers da
       LEFT JOIN subjects s ON s.subject_id = da.subject_id
       WHERE da.attempt_id = ?`,
      [attempt_id]
    );

    // Queue each wrong answer (that was actually answered) for replay.
    for (const r of ans.rows) {
      if (r.selected_answer && !r.is_correct) {
        enqueueWrongAnswer({
          student_id,
          question_id:     r.question_id,
          selected_answer: r.selected_answer,
          source:          'diagnostic',
          source_id:       attempt_id,
        });
      }
    }

    const total = ans.rows.length;
    let correct = 0;
    let time = 0;
    const bySubject = {};
    const byTopic = {};
    for (const r of ans.rows) {
      time += Number(r.time_taken_seconds) || 0;
      const answered = !!r.selected_answer;
      const ok = !!r.is_correct;
      if (ok) correct += 1;

      const sub = r.subject_id || 'unknown';
      bySubject[sub] = bySubject[sub] || { subject_id: sub, subject_name: r.subject_name || 'Unknown', total: 0, correct: 0, answered: 0 };
      bySubject[sub].total   += 1;
      bySubject[sub].correct += ok ? 1 : 0;
      bySubject[sub].answered += answered ? 1 : 0;

      if (r.topic_id) {
        byTopic[r.topic_id] = byTopic[r.topic_id] || { total: 0, correct: 0 };
        byTopic[r.topic_id].total   += 1;
        byTopic[r.topic_id].correct += ok ? 1 : 0;
      }
    }
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Build section breakdown with accuracy %.
    const sectionBreakdown = Object.values(bySubject).map(b => ({
      ...b,
      accuracy_percent: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
    }));

    // Persist on the attempt.
    await query(
      `UPDATE diagnostic_attempts
         SET status = 'submitted',
             submitted_at = NOW(),
             total_questions = ?,
             correct_count = ?,
             accuracy_percent = ?,
             time_taken_seconds = ?,
             section_breakdown = ?,
             violations_count = ?
       WHERE attempt_id = ?`,
      [total, correct, accuracy, time, JSON.stringify(sectionBreakdown), violationsCount, attempt_id]
    );

    // Mark on user — this is what gates the rest of the app.
    await query(
      'UPDATE users SET diagnostic_completed_at = NOW() WHERE user_id = ?',
      [student_id]
    );

    // Seed student_skill_profile so the rest of the platform learns from this attempt.
    for (const [topic_id, stat] of Object.entries(byTopic)) {
      const acc = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      await query(
        `INSERT INTO student_skill_profile (student_id, topic_id, total_attempts, correct_count, accuracy_percent, last_attempted)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           total_attempts = student_skill_profile.total_attempts + VALUES(total_attempts),
           correct_count  = student_skill_profile.correct_count  + VALUES(correct_count),
           accuracy_percent = ROUND(((student_skill_profile.correct_count + VALUES(correct_count)) /
                                     (student_skill_profile.total_attempts + VALUES(total_attempts))) * 100, 2),
           is_weak = ((student_skill_profile.correct_count + VALUES(correct_count)) /
                      (student_skill_profile.total_attempts + VALUES(total_attempts))) < 0.6,
           last_attempted = NOW()`,
        [student_id, topic_id, stat.total, stat.correct, acc]
      );
    }

    res.json({
      attempt_id,
      total_questions: total,
      correct_count: correct,
      accuracy_percent: accuracy,
      time_taken_seconds: time,
      section_breakdown: sectionBreakdown,
    });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   GET /student/diagnostic/report
   The detailed analysis page after the student submits.
   ──────────────────────────────────────────────── */
const report = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;
    const data = await buildReport(student_id);
    if (!data) return res.status(404).json({ error: 'No diagnostic attempt found' });
    res.json(data);
  } catch (err) { next(err); }
};

async function buildReport(student_id) {
  const a = await query(
    `SELECT attempt_id, started_at, submitted_at, total_questions, correct_count,
            accuracy_percent, time_taken_seconds, section_breakdown, status,
            COALESCE(violations_count, 0) AS violations_count
     FROM diagnostic_attempts
     WHERE student_id = ? AND status = 'submitted'
     ORDER BY submitted_at DESC LIMIT 1`,
    [student_id]
  );
  if (a.rows.length === 0) return null;
  const attempt = a.rows[0];

  // section_breakdown may already be parsed by the JSON typecast in database.js
  let breakdown = attempt.section_breakdown;
  if (typeof breakdown === 'string') {
    try { breakdown = JSON.parse(breakdown); } catch { breakdown = []; }
  }
  breakdown = Array.isArray(breakdown) ? breakdown : [];

  // Topic-level breakdown — for the "focus on these" list.
  const topicRows = await query(
    `SELECT t.topic_id, t.name as topic_name, s.name as subject_name,
            COUNT(*) as total,
            SUM(da.is_correct) as correct,
            ROUND(AVG(da.time_taken_seconds), 1) as avg_time_seconds
     FROM diagnostic_answers da
     JOIN topics   t ON t.topic_id   = da.topic_id
     JOIN subjects s ON s.subject_id = da.subject_id
     WHERE da.attempt_id = ?
     GROUP BY t.topic_id, t.name, s.name
     ORDER BY (SUM(da.is_correct) / COUNT(*)) ASC`,
    [attempt.attempt_id]
  );
  const topics = topicRows.rows.map(t => ({
    topic_id: t.topic_id,
    topic_name: t.topic_name,
    subject_name: t.subject_name,
    total: Number(t.total),
    correct: Number(t.correct),
    accuracy_percent: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
    avg_time_seconds: Number(t.avg_time_seconds) || 0,
  }));

  // The 4-5 topics where the student was weakest.
  const focus = topics
    .filter(t => t.accuracy_percent < 70)
    .slice(0, 5);

  // Strongest topics — for confidence framing.
  const strong = [...topics]
    .filter(t => t.accuracy_percent >= 70)
    .sort((a, b) => b.accuracy_percent - a.accuracy_percent)
    .slice(0, 5);

  // Recommendation tier (overall).
  const acc = Number(attempt.accuracy_percent) || 0;
  const recommendation =
    acc >= 80 ? { tier: 'strong',     headline: 'Excellent baseline — focus on advanced patterns and speed.' } :
    acc >= 60 ? { tier: 'on_track',   headline: 'On track — sharpen the few weak areas below.' } :
    acc >= 40 ? { tier: 'building',   headline: 'Solid start — work through your plan day by day.' } :
                { tier: 'foundation', headline: 'We\'ll start from the basics — your plan covers fundamentals first.' };

  return {
    attempt_id: attempt.attempt_id,
    submitted_at: attempt.submitted_at,
    total_questions: Number(attempt.total_questions),
    correct_count: Number(attempt.correct_count),
    accuracy_percent: acc,
    time_taken_seconds: Number(attempt.time_taken_seconds) || 0,
    violations_count: Number(attempt.violations_count) || 0,
    sections: breakdown,
    topics,
    focus_topics: focus,
    strong_topics: strong,
    recommendation,
  };
}

/* ────────────────────────────────────────────────
   ADMIN ENDPOINTS
   ──────────────────────────────────────────────── */

/** GET /admin/diagnostics — list every student + their diagnostic summary */
const adminList = async (req, res, next) => {
  try {
    const r = await query(
      `SELECT u.user_id, u.name, u.email, u.branch, u.year,
              u.diagnostic_completed_at,
              da.attempt_id, da.accuracy_percent, da.total_questions, da.correct_count,
              da.section_breakdown,
              COALESCE(da.violations_count, 0) AS violations_count
       FROM users u
       LEFT JOIN diagnostic_attempts da
         ON da.student_id = u.user_id AND da.status = 'submitted'
       WHERE u.role = 'student' AND u.is_active = 1
       ORDER BY u.diagnostic_completed_at DESC, u.name ASC`
    );
    const rows = r.rows.map(row => {
      let breakdown = row.section_breakdown;
      if (typeof breakdown === 'string') {
        try { breakdown = JSON.parse(breakdown); } catch { breakdown = []; }
      }
      return {
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        branch: row.branch,
        year: row.year,
        completed: !!row.diagnostic_completed_at,
        completed_at: row.diagnostic_completed_at,
        accuracy_percent: row.accuracy_percent != null ? Number(row.accuracy_percent) : null,
        total_questions: row.total_questions != null ? Number(row.total_questions) : null,
        correct_count: row.correct_count != null ? Number(row.correct_count) : null,
        violations_count: Number(row.violations_count) || 0,
        sections: Array.isArray(breakdown) ? breakdown : [],
      };
    });

    // Aggregate stats across the cohort.
    const completed   = rows.filter(r => r.completed);
    const summary = {
      total_students:   rows.length,
      completed_count:  completed.length,
      pending_count:    rows.length - completed.length,
      avg_accuracy:     completed.length
        ? Math.round(completed.reduce((s, r) => s + (r.accuracy_percent || 0), 0) / completed.length)
        : 0,
    };

    res.json({ students: rows, summary });
  } catch (err) { next(err); }
};

/** GET /admin/diagnostics/:student_id — full report */
const adminDetail = async (req, res, next) => {
  try {
    const data = await buildReport(req.params.student_id);
    if (!data) return res.status(404).json({ error: 'Student has not completed the diagnostic yet' });

    const u = await query(
      'SELECT user_id, name, email, branch, year FROM users WHERE user_id = ?',
      [req.params.student_id]
    );
    res.json({ ...data, student: u.rows[0] || null });
  } catch (err) { next(err); }
};

module.exports = {
  status, start, answer, submit, report,
  adminList, adminDetail,
};
