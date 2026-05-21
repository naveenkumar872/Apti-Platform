const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateAIQuestions } = require('../utils/aiQuestions');

/* ────────────────────────────────────────────────
   Company Exam Simulator
   ─────────────────────────────────────────────────
   Multi-section proctored mock exams that mimic real placement test patterns
   (TCS NQT, Infosys SP, Wipro Elite NTH, Cognizant GenC, Capgemini).

   Pattern lives in companies.test_pattern as JSON:
     {
       duration_minutes,
       navigation: "section_locked" | "free",
       overall_cutoff_percent,
       sections: [
         { name, subject_id, question_count, duration_minutes, cutoff_percent },
         ...
       ]
     }
   ───────────────────────────────────────────────── */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normaliseJSON(value) {
  if (value == null) return null;
  if (Buffer.isBuffer(value)) value = value.toString('utf8');
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
}

function normaliseOptions(options) {
  const parsed = normaliseJSON(options);
  return parsed || options;
}

/* Pull `count` questions for a subject. Tries the bank first; AI-fills shortfall. */
async function questionsForSection(section) {
  const target = Math.max(1, parseInt(section.question_count, 10) || 10);

  const bank = await query(
    `SELECT q.question_id, q.question_text, q.options, q.difficulty, q.concept_id,
            c.topic_id, t.subject_id, t.name as topic_name, sb.name as subject_name
     FROM questions q
     JOIN concepts c  ON c.concept_id = q.concept_id
     JOIN topics t    ON t.topic_id   = c.topic_id
     JOIN subjects sb ON sb.subject_id = t.subject_id
     WHERE t.subject_id = ? AND q.question_type = 'mcq' AND q.is_active = 1
     ORDER BY RAND()
     LIMIT ?`,
    [section.subject_id, target * 2]
  );
  const fromBank = shuffle(bank.rows).slice(0, target).map(q => ({
    question_id:   q.question_id,
    question_text: q.question_text,
    options:       normaliseOptions(q.options),
    difficulty:    q.difficulty,
    topic_id:      q.topic_id,
    subject_id:    q.subject_id,
    subject_name:  q.subject_name,
    topic_name:    q.topic_name,
  }));

  const shortfall = target - fromBank.length;
  if (shortfall <= 0) return fromBank;

  // AI fallback — resolve a topic to focus AI generation on.
  const topicRow = await query(
    `SELECT t.topic_id, t.name as topic_name, c.concept_id
     FROM topics t LEFT JOIN concepts c ON c.topic_id = t.topic_id
     WHERE t.subject_id = ?
     ORDER BY RAND() LIMIT 1`,
    [section.subject_id]
  );
  const fallbackTopic = topicRow.rows[0] || {};

  try {
    const aiQs = await generateAIQuestions({
      topicName:   fallbackTopic.topic_name || section.name,
      subjectName: section.name,
      count:       shortfall,
      difficulty:  'medium',
    });
    const inserted = [];
    for (const q of aiQs.slice(0, shortfall)) {
      if (!q?.question_text || !Array.isArray(q.options) || !q.correct_answer) continue;
      const qId = uuidv4();
      await query(
        `INSERT INTO questions
           (question_id, concept_id, question_text, question_type, options,
            correct_answer, explanation, difficulty, source, is_active)
         VALUES (?, ?, ?, 'mcq', ?, ?, ?, 3, 'ai_generated', 1)`,
        [qId, fallbackTopic.concept_id || null, q.question_text,
         JSON.stringify(q.options), q.correct_answer, q.explanation || '']
      );
      inserted.push({
        question_id:   qId,
        question_text: q.question_text,
        options:       q.options,
        difficulty:    3,
        topic_id:      fallbackTopic.topic_id || null,
        subject_id:    section.subject_id,
        subject_name:  section.name,
        topic_name:    fallbackTopic.topic_name || section.name,
      });
    }
    return [...fromBank, ...inserted];
  } catch (err) {
    console.error(`[Simulator AI] ${section.name} fallback failed:`, err.message);
    return fromBank;
  }
}

/* ────────────────────────────────────────────────
   GET /student/simulator/companies
   ──────────────────────────────────────────────── */
const listCompanies = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;
    const r = await query(
      `SELECT c.company_id, c.name, c.important_topics, c.test_pattern, c.cutoff_info, c.interview_tips,
              (SELECT COUNT(*) FROM simulated_attempts sa WHERE sa.company_id = c.company_id AND sa.student_id = ? AND sa.status='submitted') as my_attempts,
              (SELECT MAX(sa.accuracy_percent) FROM simulated_attempts sa WHERE sa.company_id = c.company_id AND sa.student_id = ? AND sa.status='submitted') as my_best
       FROM companies c
       ORDER BY c.name ASC`,
      [student_id, student_id]
    );
    const companies = r.rows.map(row => {
      const pattern = normaliseJSON(row.test_pattern) || {};
      const topics  = normaliseJSON(row.important_topics) || [];
      const sectionCount = (pattern.sections || []).length;
      const totalQuestions = (pattern.sections || []).reduce((s, sec) => s + (parseInt(sec.question_count, 10) || 0), 0);
      return {
        company_id:        row.company_id,
        name:              row.name,
        important_topics:  topics,
        sections:          (pattern.sections || []).map(s => ({
          name:             s.name,
          question_count:   parseInt(s.question_count, 10) || 0,
          duration_minutes: parseInt(s.duration_minutes, 10) || 0,
          cutoff_percent:   parseInt(s.cutoff_percent, 10) || 0,
        })),
        section_count:        sectionCount,
        total_questions:      totalQuestions,
        duration_minutes:     parseInt(pattern.duration_minutes, 10) || 0,
        overall_cutoff_percent: parseInt(pattern.overall_cutoff_percent, 10) || 0,
        cutoff_info:          row.cutoff_info || '',
        interview_tips:       row.interview_tips || '',
        my_attempts:          parseInt(row.my_attempts) || 0,
        my_best:              row.my_best != null ? Math.round(Number(row.my_best)) : null,
      };
    }).filter(c => c.sections.length > 0); // hide companies that don't have a simulator pattern yet
    res.json({ companies });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   POST /student/simulator/start
   Body: { company_id }
   ──────────────────────────────────────────────── */
const start = async (req, res, next) => {
  try {
    const { company_id } = req.body;
    const student_id = req.user.user_id;
    if (!company_id) return res.status(400).json({ error: 'company_id is required' });

    // Resume in-progress attempt for this company if any.
    const ip = await query(
      "SELECT attempt_id FROM simulated_attempts WHERE student_id=? AND company_id=? AND status='in_progress' ORDER BY started_at DESC LIMIT 1",
      [student_id, company_id]
    );
    if (ip.rows.length > 0) {
      const data = await loadAttempt(ip.rows[0].attempt_id, student_id);
      return res.json({ ...data, resumed: true });
    }

    // Load the company + pattern.
    const c = await query('SELECT company_id, name, test_pattern FROM companies WHERE company_id=?', [company_id]);
    if (c.rows.length === 0) return res.status(404).json({ error: 'Company not found' });
    const pattern = normaliseJSON(c.rows[0].test_pattern);
    if (!pattern || !Array.isArray(pattern.sections) || pattern.sections.length === 0) {
      return res.status(400).json({ error: 'This company does not have a simulator pattern yet.' });
    }

    // Pick questions for each section in parallel.
    const sectionResults = await Promise.all(pattern.sections.map(s => questionsForSection(s)));

    // Persist attempt + answer slots.
    const attempt_id = uuidv4();
    const totalQuestions = sectionResults.reduce((s, qs) => s + qs.length, 0);

    await query(
      `INSERT INTO simulated_attempts (attempt_id, student_id, company_id, pattern_snapshot, total_questions, current_section, status)
       VALUES (?, ?, ?, ?, ?, 0, 'in_progress')`,
      [attempt_id, student_id, company_id, JSON.stringify(pattern), totalQuestions]
    );

    let order = 1;
    for (let sIdx = 0; sIdx < sectionResults.length; sIdx++) {
      for (const q of sectionResults[sIdx]) {
        await query(
          `INSERT INTO simulated_answers (attempt_id, question_id, question_order, section_index)
           VALUES (?, ?, ?, ?)`,
          [attempt_id, q.question_id, order++, sIdx]
        );
      }
    }

    const data = await loadAttempt(attempt_id, student_id);
    res.json({ ...data, resumed: false });
  } catch (err) { next(err); }
};

/* Internal helper: full attempt payload (pattern + questions + saved answers) */
async function loadAttempt(attempt_id, student_id) {
  const a = await query(
    `SELECT attempt_id, student_id, company_id, pattern_snapshot, current_section,
            started_at, status, total_questions
     FROM simulated_attempts WHERE attempt_id = ?`,
    [attempt_id]
  );
  if (a.rows.length === 0) throw Object.assign(new Error('Attempt not found'), { statusCode: 404 });
  const row = a.rows[0];
  if (student_id && row.student_id !== student_id) {
    throw Object.assign(new Error('Not your attempt'), { statusCode: 403 });
  }
  const pattern = normaliseJSON(row.pattern_snapshot) || {};
  const cmp = await query('SELECT name FROM companies WHERE company_id=?', [row.company_id]);

  const ans = await query(
    `SELECT sa.question_order, sa.section_index, sa.selected_answer, sa.flagged, sa.time_taken_seconds,
            q.question_id, q.question_text, q.options, q.difficulty,
            t.name AS topic_name, s.name AS subject_name
     FROM simulated_answers sa
     JOIN questions q ON q.question_id = sa.question_id
     LEFT JOIN concepts c ON c.concept_id = q.concept_id
     LEFT JOIN topics   t ON t.topic_id   = c.topic_id
     LEFT JOIN subjects s ON s.subject_id = t.subject_id
     WHERE sa.attempt_id = ?
     ORDER BY sa.question_order ASC`,
    [attempt_id]
  );

  const questionsBySection = {};
  for (const r of ans.rows) {
    if (!questionsBySection[r.section_index]) questionsBySection[r.section_index] = [];
    questionsBySection[r.section_index].push({
      question_order:  r.question_order,
      section_index:   r.section_index,
      question_id:     r.question_id,
      question_text:   r.question_text,
      options:         normaliseOptions(r.options),
      difficulty:      r.difficulty,
      topic_name:      r.topic_name,
      subject_name:    r.subject_name,
      selected_answer: r.selected_answer,
      flagged:         !!r.flagged,
    });
  }

  return {
    attempt_id:      row.attempt_id,
    company_id:      row.company_id,
    company_name:    cmp.rows[0]?.name || 'Company',
    pattern,
    current_section: parseInt(row.current_section) || 0,
    started_at:      row.started_at,
    status:          row.status,
    total_questions: parseInt(row.total_questions) || 0,
    sections: (pattern.sections || []).map((s, i) => ({
      ...s,
      questions: questionsBySection[i] || [],
    })),
  };
}

/* ────────────────────────────────────────────────
   GET /student/simulator/attempt/:id
   ──────────────────────────────────────────────── */
const getAttempt = async (req, res, next) => {
  try {
    const data = await loadAttempt(req.params.id, req.user.user_id);
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

/* ────────────────────────────────────────────────
   POST /student/simulator/answer
   Body: { attempt_id, question_id, selected_answer, time_taken_seconds, flagged }
   ──────────────────────────────────────────────── */
const answer = async (req, res, next) => {
  try {
    const { attempt_id, question_id, selected_answer, time_taken_seconds, flagged } = req.body;
    const student_id = req.user.user_id;

    const a = await query('SELECT student_id, status FROM simulated_attempts WHERE attempt_id=?', [attempt_id]);
    if (a.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    if (a.rows[0].student_id !== student_id) return res.status(403).json({ error: 'Not yours' });
    if (a.rows[0].status !== 'in_progress')   return res.status(400).json({ error: 'Already submitted' });

    const q = await query('SELECT correct_answer FROM questions WHERE question_id=?', [question_id]);
    if (q.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    const is_correct = selected_answer && selected_answer === q.rows[0].correct_answer ? 1 : 0;

    await query(
      `UPDATE simulated_answers
         SET selected_answer = ?, is_correct = ?, time_taken_seconds = ?, flagged = ?
       WHERE attempt_id = ? AND question_id = ?`,
      [
        selected_answer === undefined ? null : selected_answer,
        is_correct,
        time_taken_seconds || 0,
        flagged ? 1 : 0,
        attempt_id, question_id,
      ]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   POST /student/simulator/submit-section
   Body: { attempt_id, section_index }
   Just advances current_section so the next section unlocks.
   ──────────────────────────────────────────────── */
const submitSection = async (req, res, next) => {
  try {
    const { attempt_id, section_index } = req.body;
    const student_id = req.user.user_id;
    const a = await query('SELECT student_id, current_section, pattern_snapshot, status FROM simulated_attempts WHERE attempt_id=?', [attempt_id]);
    if (a.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    if (a.rows[0].student_id !== student_id) return res.status(403).json({ error: 'Not yours' });
    if (a.rows[0].status !== 'in_progress')   return res.status(400).json({ error: 'Already submitted' });
    const pattern = normaliseJSON(a.rows[0].pattern_snapshot) || {};
    const total   = (pattern.sections || []).length;
    const next    = Math.min(total, (parseInt(section_index, 10) || 0) + 1);
    await query('UPDATE simulated_attempts SET current_section=? WHERE attempt_id=?', [next, attempt_id]);
    res.json({ ok: true, current_section: next, finished: next >= total });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   POST /student/simulator/submit
   Body: { attempt_id, violations }
   Scores everything, persists section results + cutoff verdicts.
   ──────────────────────────────────────────────── */
const submit = async (req, res, next) => {
  try {
    const { attempt_id, violations } = req.body;
    const violationsCount = Math.max(0, Math.min(99, Number(violations) || 0));
    const student_id = req.user.user_id;

    const a = await query('SELECT student_id, status, pattern_snapshot, started_at FROM simulated_attempts WHERE attempt_id=?', [attempt_id]);
    if (a.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
    if (a.rows[0].student_id !== student_id) return res.status(403).json({ error: 'Not yours' });
    if (a.rows[0].status !== 'in_progress')   return res.status(400).json({ error: 'Already submitted' });

    const pattern = normaliseJSON(a.rows[0].pattern_snapshot) || {};

    const ans = await query(
      `SELECT sa.section_index, sa.selected_answer, sa.time_taken_seconds, q.correct_answer
       FROM simulated_answers sa
       JOIN questions q ON q.question_id = sa.question_id
       WHERE sa.attempt_id = ?`,
      [attempt_id]
    );

    // Mark is_correct correctly (in case the answer endpoint missed any), and
    // compute totals per section.
    let totalCorrect = 0;
    let totalAnswered = 0;
    let totalTime = 0;
    const bySection = {};
    for (const r of ans.rows) {
      totalTime += Number(r.time_taken_seconds) || 0;
      const sIdx = r.section_index;
      bySection[sIdx] = bySection[sIdx] || { total: 0, correct: 0, answered: 0 };
      bySection[sIdx].total += 1;
      if (r.selected_answer) {
        bySection[sIdx].answered += 1;
        totalAnswered += 1;
        if (String(r.selected_answer).toUpperCase() === String(r.correct_answer).toUpperCase()) {
          bySection[sIdx].correct += 1;
          totalCorrect += 1;
        }
      }
    }

    // Persist updated is_correct using a single batched UPDATE per attempt (safe and simple).
    // (Skipped — we already wrote per-answer in /answer handler. Keep simple.)

    const overallCutoff = parseInt(pattern.overall_cutoff_percent, 10) || 60;
    const sectionResults = (pattern.sections || []).map((s, i) => {
      const stat = bySection[i] || { total: 0, correct: 0, answered: 0 };
      const accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      const cutoff   = parseInt(s.cutoff_percent, 10) || overallCutoff;
      return {
        name:             s.name,
        total:            stat.total,
        correct:          stat.correct,
        answered:         stat.answered,
        accuracy_percent: accuracy,
        cutoff_percent:   cutoff,
        passed:           accuracy >= cutoff,
      };
    });

    const totalQs    = ans.rows.length;
    const accuracy   = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
    const allSectionsPassed = sectionResults.every(s => s.passed);
    const overallPassed     = allSectionsPassed && accuracy >= overallCutoff;

    await query(
      `UPDATE simulated_attempts
         SET status='submitted', submitted_at=NOW(),
             total_questions=?, correct_count=?, accuracy_percent=?, time_taken_seconds=?,
             section_results=?, overall_passed=?, violations_count=?
       WHERE attempt_id=?`,
      [
        totalQs, totalCorrect, accuracy, totalTime,
        JSON.stringify(sectionResults),
        overallPassed ? 1 : 0,
        violationsCount,
        attempt_id,
      ]
    );

    res.json({
      attempt_id,
      total_questions:  totalQs,
      correct_count:    totalCorrect,
      accuracy_percent: accuracy,
      overall_passed:   overallPassed,
      section_results:  sectionResults,
      overall_cutoff_percent: overallCutoff,
      time_taken_seconds: totalTime,
    });
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   GET /student/simulator/result/:id
   ──────────────────────────────────────────────── */
const result = async (req, res, next) => {
  try {
    const data = await buildResult(req.params.id, req.user.user_id);
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

async function buildResult(attempt_id, student_id) {
  const a = await query(
    `SELECT sa.attempt_id, sa.student_id, sa.company_id, sa.pattern_snapshot,
            sa.submitted_at, sa.started_at,
            sa.total_questions, sa.correct_count, sa.accuracy_percent,
            sa.time_taken_seconds, sa.section_results, sa.overall_passed,
            sa.violations_count, sa.status,
            c.name as company_name
     FROM simulated_attempts sa
     JOIN companies c ON c.company_id = sa.company_id
     WHERE sa.attempt_id = ?`,
    [attempt_id]
  );
  if (a.rows.length === 0) throw Object.assign(new Error('Attempt not found'), { statusCode: 404 });
  const row = a.rows[0];
  if (student_id && row.student_id !== student_id) {
    throw Object.assign(new Error('Not your attempt'), { statusCode: 403 });
  }
  if (row.status !== 'submitted') throw Object.assign(new Error('Not yet submitted'), { statusCode: 400 });

  const pattern = normaliseJSON(row.pattern_snapshot) || {};
  const sectionResults = normaliseJSON(row.section_results) || [];

  return {
    attempt_id:        row.attempt_id,
    company_id:        row.company_id,
    company_name:      row.company_name,
    submitted_at:      row.submitted_at,
    started_at:        row.started_at,
    total_questions:   Number(row.total_questions) || 0,
    correct_count:     Number(row.correct_count)   || 0,
    accuracy_percent:  Math.round(Number(row.accuracy_percent) || 0),
    time_taken_seconds: Number(row.time_taken_seconds) || 0,
    section_results:   sectionResults,
    overall_passed:    !!row.overall_passed,
    overall_cutoff_percent: parseInt(pattern.overall_cutoff_percent, 10) || 60,
    violations_count:  Number(row.violations_count) || 0,
  };
}

/* ────────────────────────────────────────────────
   ADMIN endpoints
   ──────────────────────────────────────────────── */
const adminList = async (req, res, next) => {
  try {
    const r = await query(
      `SELECT sa.attempt_id, sa.submitted_at, sa.accuracy_percent, sa.overall_passed,
              sa.total_questions, sa.correct_count, sa.violations_count,
              u.user_id, u.name, u.email, c.company_id, c.name as company_name
       FROM simulated_attempts sa
       JOIN users u     ON u.user_id     = sa.student_id
       JOIN companies c ON c.company_id  = sa.company_id
       WHERE sa.status='submitted'
       ORDER BY sa.submitted_at DESC
       LIMIT 200`
    );
    res.json({
      attempts: r.rows.map(row => ({
        attempt_id:       row.attempt_id,
        student_id:       row.user_id,
        student_name:     row.name,
        student_email:    row.email,
        company_id:       row.company_id,
        company_name:     row.company_name,
        submitted_at:     row.submitted_at,
        accuracy_percent: Math.round(Number(row.accuracy_percent) || 0),
        total_questions:  Number(row.total_questions)  || 0,
        correct_count:    Number(row.correct_count)    || 0,
        overall_passed:   !!row.overall_passed,
        violations_count: Number(row.violations_count) || 0,
      })),
    });
  } catch (err) { next(err); }
};

const adminDetail = async (req, res, next) => {
  try {
    const data = await buildResult(req.params.id, null);
    res.json(data);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

/* ────────────────────────────────────────────────
   ADMIN — Company Pattern CRUD
   ──────────────────────────────────────────────── */

// Validate + normalise a pattern payload from the admin form.
function validatePattern(patternRaw) {
  const errors = [];
  if (!patternRaw || typeof patternRaw !== 'object') {
    return { errors: ['Pattern is required'], normalised: null };
  }
  const overallCutoff = parseInt(patternRaw.overall_cutoff_percent, 10);
  if (!Number.isFinite(overallCutoff) || overallCutoff < 0 || overallCutoff > 100) {
    errors.push('overall_cutoff_percent must be 0-100');
  }
  const sectionsRaw = Array.isArray(patternRaw.sections) ? patternRaw.sections : [];
  if (sectionsRaw.length === 0) errors.push('At least one section is required');

  const sections = sectionsRaw.map((s, i) => {
    const qc = parseInt(s.question_count, 10);
    const dm = parseInt(s.duration_minutes, 10);
    const cp = parseInt(s.cutoff_percent, 10);
    if (!s.name) errors.push(`Section ${i + 1}: name required`);
    if (!s.subject_id) errors.push(`Section ${i + 1}: subject_id required`);
    if (!Number.isFinite(qc) || qc < 1) errors.push(`Section ${i + 1}: question_count must be ≥ 1`);
    if (!Number.isFinite(dm) || dm < 1) errors.push(`Section ${i + 1}: duration_minutes must be ≥ 1`);
    if (!Number.isFinite(cp) || cp < 0 || cp > 100) errors.push(`Section ${i + 1}: cutoff_percent must be 0-100`);
    return {
      name:             String(s.name || '').trim(),
      subject_id:       String(s.subject_id || '').trim(),
      question_count:   qc || 0,
      duration_minutes: dm || 0,
      cutoff_percent:   cp || 0,
    };
  });
  const totalDuration = sections.reduce((sum, s) => sum + s.duration_minutes, 0);
  return {
    errors,
    normalised: {
      duration_minutes: totalDuration,
      navigation: patternRaw.navigation === 'free' ? 'free' : 'section_locked',
      negative_marking: Math.max(0, parseFloat(patternRaw.negative_marking) || 0),
      overall_cutoff_percent: overallCutoff || 60,
      sections,
    },
  };
}

/** GET /admin/simulator/patterns — every company with its current pattern */
const adminListPatterns = async (req, res, next) => {
  try {
    const r = await query(
      `SELECT c.company_id, c.name, c.test_pattern, c.cutoff_info, c.interview_tips,
              c.important_topics,
              (SELECT COUNT(*) FROM simulated_attempts sa WHERE sa.company_id = c.company_id) AS attempt_count
       FROM companies c
       ORDER BY c.name ASC`
    );
    res.json({
      companies: r.rows.map(row => {
        const pattern = normaliseJSON(row.test_pattern);
        return {
          company_id:       row.company_id,
          name:             row.name,
          cutoff_info:      row.cutoff_info || '',
          interview_tips:   row.interview_tips || '',
          important_topics: normaliseJSON(row.important_topics) || [],
          pattern,
          has_simulator:    !!(pattern && Array.isArray(pattern.sections) && pattern.sections.length > 0),
          attempt_count:    Number(row.attempt_count) || 0,
        };
      }),
    });
  } catch (err) { next(err); }
};

/** POST /admin/simulator/patterns — create a new company */
const adminCreatePattern = async (req, res, next) => {
  try {
    const { name, cutoff_info, interview_tips, important_topics, pattern } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Company name is required' });
    const { errors, normalised } = validatePattern(pattern);
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });

    // Reject duplicate name (uq_companies_name).
    const exists = await query('SELECT company_id FROM companies WHERE name = ?', [String(name).trim()]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'A company with that name already exists' });

    const company_id = uuidv4();
    await query(
      `INSERT INTO companies (company_id, name, important_topics, test_pattern, cutoff_info, interview_tips)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        company_id, String(name).trim(),
        JSON.stringify(Array.isArray(important_topics) ? important_topics : []),
        JSON.stringify(normalised),
        cutoff_info || '',
        interview_tips || '',
      ]
    );
    res.status(201).json({ company_id, message: 'Company created' });
  } catch (err) { next(err); }
};

/** PUT /admin/simulator/patterns/:id — update name + pattern + metadata */
const adminUpdatePattern = async (req, res, next) => {
  try {
    const { name, cutoff_info, interview_tips, important_topics, pattern } = req.body || {};
    const id = req.params.id;
    const exists = await query('SELECT company_id FROM companies WHERE company_id = ?', [id]);
    if (exists.rows.length === 0) return res.status(404).json({ error: 'Company not found' });

    const { errors, normalised } = validatePattern(pattern);
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });

    await query(
      `UPDATE companies
         SET name = COALESCE(?, name),
             important_topics = ?,
             test_pattern = ?,
             cutoff_info = ?,
             interview_tips = ?
       WHERE company_id = ?`,
      [
        name ? String(name).trim() : null,
        JSON.stringify(Array.isArray(important_topics) ? important_topics : []),
        JSON.stringify(normalised),
        cutoff_info || '',
        interview_tips || '',
        id,
      ]
    );
    res.json({ message: 'Updated' });
  } catch (err) { next(err); }
};

/** DELETE /admin/simulator/patterns/:id */
const adminDeletePattern = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Soft-clear instead of hard delete if any attempts exist — preserves student history.
    const attempts = await query('SELECT COUNT(*) AS cnt FROM simulated_attempts WHERE company_id = ?', [id]);
    if (parseInt(attempts.rows[0]?.cnt) > 0) {
      await query('UPDATE companies SET test_pattern = NULL WHERE company_id = ?', [id]);
      return res.json({ message: 'Pattern cleared (student attempts preserved). Company can be re-enabled later.' });
    }
    await query('DELETE FROM companies WHERE company_id = ?', [id]);
    res.json({ message: 'Company deleted' });
  } catch (err) { next(err); }
};

module.exports = {
  listCompanies, start, getAttempt, answer, submitSection, submit, result,
  adminList, adminDetail,
  adminListPatterns, adminCreatePattern, adminUpdatePattern, adminDeletePattern,
};
