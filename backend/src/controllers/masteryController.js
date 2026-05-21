const { query } = require('../config/database');

/* ────────────────────────────────────────────────
   Mastery & Daily Focus
   ─────────────────────────────────────────────────
   Both endpoints read from student_skill_profile, which is populated from:
     - the first-time diagnostic test (diagnosticController.submit)
     - every practice answer  (studentController.submitPracticeAnswer)
     - every test submission   (studentController.submitTest)
   ─────────────────────────────────────────────────  */

const TARGET_MASTERY = 85;        // "strong in every topic" target
const STALE_THRESHOLD_DAYS = 5;   // a topic untouched this long counts as stale

function tierForAccuracy(acc) {
  if (acc >= 70) return 'mastered';
  if (acc >= 40) return 'building';
  return 'weak';
}

function daysSince(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

/* ────────────────────────────────────────────────
   Internal helper: load the full mastery payload for one student.
   Shared by /student/mastery and /admin/students/:id/mastery.
   ──────────────────────────────────────────────── */
async function loadMastery(studentId) {
  const r = await query(
    `SELECT ssp.topic_id, ssp.accuracy_percent, ssp.total_attempts, ssp.correct_count,
            ssp.last_attempted, ssp.is_weak,
            t.name as topic_name, s.subject_id, s.name as subject_name
     FROM student_skill_profile ssp
     JOIN topics t   ON t.topic_id = ssp.topic_id
     JOIN subjects s ON s.subject_id = t.subject_id
     WHERE ssp.student_id = ?
     ORDER BY ssp.accuracy_percent ASC, ssp.last_attempted ASC`,
    [studentId]
  );

  const topics = r.rows.map(row => {
    const acc = Number(row.accuracy_percent) || 0;
    return {
      topic_id:        row.topic_id,
      topic_name:      row.topic_name,
      subject_id:      row.subject_id,
      subject_name:    row.subject_name,
      accuracy_percent: Math.round(acc),
      total_attempts:  Number(row.total_attempts) || 0,
      correct_count:   Number(row.correct_count) || 0,
      last_attempted:  row.last_attempted,
      days_since:      daysSince(row.last_attempted),
      tier:            tierForAccuracy(acc),
    };
  });

  // Overall mastery — weighted by attempts so a topic with 1 attempt doesn't
  // count as much as one with 30. Falls back to plain avg if no attempts yet.
  const totalAttempts = topics.reduce((s, t) => s + t.total_attempts, 0);
  const overall = totalAttempts > 0
    ? Math.round(
        topics.reduce((s, t) => s + t.accuracy_percent * t.total_attempts, 0) / totalAttempts
      )
    : (topics.length > 0
        ? Math.round(topics.reduce((s, t) => s + t.accuracy_percent, 0) / topics.length)
        : 0);

  // Bucket subject summary so the UI can render a per-section roll-up too.
  const bySubject = {};
  for (const t of topics) {
    const key = t.subject_id || 'unknown';
    bySubject[key] = bySubject[key] || {
      subject_id: t.subject_id, subject_name: t.subject_name,
      sum_acc: 0, count: 0, mastered: 0, weak: 0,
    };
    bySubject[key].sum_acc += t.accuracy_percent;
    bySubject[key].count   += 1;
    if (t.tier === 'mastered') bySubject[key].mastered += 1;
    if (t.tier === 'weak')     bySubject[key].weak     += 1;
  }
  const subjects = Object.values(bySubject).map(b => ({
    subject_id:   b.subject_id,
    subject_name: b.subject_name,
    avg_accuracy: b.count ? Math.round(b.sum_acc / b.count) : 0,
    topic_count:  b.count,
    mastered:     b.mastered,
    weak:         b.weak,
  })).sort((a, b) => a.avg_accuracy - b.avg_accuracy);

  // Pick the next two topics to nudge towards mastery (closest to threshold).
  const nextWins = [...topics]
    .filter(t => t.tier !== 'mastered' && t.total_attempts > 0)
    .sort((a, b) => b.accuracy_percent - a.accuracy_percent)
    .slice(0, 2);

  return {
    overall_mastery: overall,
    target_mastery:  TARGET_MASTERY,
    summary: {
      total_topics:    topics.length,
      mastered_count:  topics.filter(t => t.tier === 'mastered').length,
      building_count:  topics.filter(t => t.tier === 'building').length,
      weak_count:      topics.filter(t => t.tier === 'weak').length,
    },
    topics,
    subjects,
    next_wins: nextWins,
  };
}

/* ────────────────────────────────────────────────
   GET /student/mastery
   ──────────────────────────────────────────────── */
const getMastery = async (req, res, next) => {
  try {
    const data = await loadMastery(req.user.user_id);
    res.json(data);
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   GET /admin/students/:student_id/mastery
   ──────────────────────────────────────────────── */
const getMasteryForStudent = async (req, res, next) => {
  try {
    const data = await loadMastery(req.params.student_id);
    res.json(data);
  } catch (err) { next(err); }
};

/* ────────────────────────────────────────────────
   GET /student/focus-today
   Picks the single most-impactful topic to practice right now.
   Ranking:
     1) Topic on the student's active plan whose plan_task is incomplete and topic accuracy is weakest
     2) Topic in skill profile that's stale (untouched ≥ 5 days) AND not yet mastered
     3) Topic with lowest accuracy that isn't mastered
   Returns a recommendation sentence + a CTA URL.
   ──────────────────────────────────────────────── */
const getFocusToday = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;

    // 1) Plan-driven candidate
    const planRow = await query(
      `SELECT pt.task_id, pt.task_type, pt.description, pt.estimated_minutes, pt.topic_id,
              t.name as topic_name, s.subject_id, s.name as subject_name,
              COALESCE(ssp.accuracy_percent, 0) as accuracy_percent,
              ssp.last_attempted
       FROM plan_tasks pt
       JOIN study_plans sp ON sp.plan_id = pt.plan_id
       LEFT JOIN topics t   ON t.topic_id   = pt.topic_id
       LEFT JOIN subjects s ON s.subject_id = t.subject_id
       LEFT JOIN student_skill_profile ssp
         ON ssp.student_id = sp.student_id AND ssp.topic_id = pt.topic_id
       WHERE sp.student_id = ? AND sp.status = 'active' AND pt.is_completed = 0
         AND pt.topic_id IS NOT NULL
       ORDER BY ssp.accuracy_percent ASC, pt.week_number ASC, pt.day_number ASC
       LIMIT 1`,
      [student_id]
    );

    let focus = null;
    if (planRow.rows.length > 0) {
      const p = planRow.rows[0];
      const acc = Math.round(Number(p.accuracy_percent) || 0);
      focus = {
        source: 'plan_task',
        topic_id:        p.topic_id,
        topic_name:      p.topic_name,
        subject_name:    p.subject_name,
        accuracy_percent: acc,
        last_attempted:  p.last_attempted,
        estimated_minutes: Number(p.estimated_minutes) || 25,
        reason: acc === 0
          ? 'fresh_plan_topic'
          : (acc < 50 ? 'weak_plan_topic' : 'plan_continuation'),
        explanation: acc === 0
          ? `It's the next topic in your study plan — let's set a baseline.`
          : (acc < 50
              ? `You're at ${acc}% on this — your plan flags it as a priority.`
              : `Continue your plan to push this from ${acc}% towards mastery.`),
      };
    }

    // 2) Stale topic — untouched ≥ N days, not yet mastered
    if (!focus) {
      const staleRow = await query(
        `SELECT ssp.topic_id, ssp.accuracy_percent, ssp.last_attempted,
                t.name as topic_name, s.name as subject_name
         FROM student_skill_profile ssp
         JOIN topics t   ON t.topic_id   = ssp.topic_id
         JOIN subjects s ON s.subject_id = t.subject_id
         WHERE ssp.student_id = ?
           AND ssp.accuracy_percent < 70
           AND (ssp.last_attempted IS NULL OR ssp.last_attempted < NOW() - INTERVAL ? DAY)
         ORDER BY ssp.accuracy_percent ASC, ssp.last_attempted ASC
         LIMIT 1`,
        [student_id, STALE_THRESHOLD_DAYS]
      );
      if (staleRow.rows.length > 0) {
        const t = staleRow.rows[0];
        const acc = Math.round(Number(t.accuracy_percent) || 0);
        const days = daysSince(t.last_attempted);
        focus = {
          source: 'stale_topic',
          topic_id:        t.topic_id,
          topic_name:      t.topic_name,
          subject_name:    t.subject_name,
          accuracy_percent: acc,
          last_attempted:  t.last_attempted,
          estimated_minutes: 25,
          reason: 'stale',
          explanation: `Haven't touched this in ${days || STALE_THRESHOLD_DAYS}+ days — accuracy is ${acc}%.`,
        };
      }
    }

    // 3) Weakest non-mastered topic
    if (!focus) {
      const weakRow = await query(
        `SELECT ssp.topic_id, ssp.accuracy_percent, ssp.last_attempted,
                t.name as topic_name, s.name as subject_name
         FROM student_skill_profile ssp
         JOIN topics t   ON t.topic_id   = ssp.topic_id
         JOIN subjects s ON s.subject_id = t.subject_id
         WHERE ssp.student_id = ? AND ssp.accuracy_percent < 70
         ORDER BY ssp.accuracy_percent ASC
         LIMIT 1`,
        [student_id]
      );
      if (weakRow.rows.length > 0) {
        const t = weakRow.rows[0];
        const acc = Math.round(Number(t.accuracy_percent) || 0);
        focus = {
          source: 'weakest_topic',
          topic_id:        t.topic_id,
          topic_name:      t.topic_name,
          subject_name:    t.subject_name,
          accuracy_percent: acc,
          last_attempted:  t.last_attempted,
          estimated_minutes: 25,
          reason: 'low_accuracy',
          explanation: `${acc}% accuracy — pushing this up is the biggest win available right now.`,
        };
      }
    }

    if (!focus) {
      return res.json({
        focus: null,
        message: 'Every topic you have attempted is at or above mastery threshold — great job. Browse Practice to take on something new.',
      });
    }

    // CTA URL — deep link into Practice with the topic preselected.
    focus.cta = {
      label: 'Practice this topic now',
      url:   `/student/practice?topic_id=${encodeURIComponent(focus.topic_id)}`,
    };

    res.json({ focus });
  } catch (err) { next(err); }
};

module.exports = { getMastery, getMasteryForStudent, getFocusToday };
