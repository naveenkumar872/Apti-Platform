const { query } = require('../config/database');

/** GET /student/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;

    // Get skill profile (weak areas)
    const skills = await query(
      `SELECT t.name as topic_name, ssp.accuracy_percent, ssp.total_attempts, ssp.is_weak
       FROM student_skill_profile ssp
       JOIN topics t ON t.topic_id = ssp.topic_id
       WHERE ssp.student_id = ?
       ORDER BY ssp.accuracy_percent ASC
       LIMIT 5`,
      [student_id]
    );

    // Get recent test attempts
    const recentAttempts = await query(
      `SELECT ta.attempt_id, t.title, ta.score, ta.total_marks, ta.accuracy_percent,
              ta.submitted_at, ta.status
       FROM test_attempts ta
       JOIN tests t ON t.test_id = ta.test_id
       WHERE ta.student_id = ? AND ta.status = 'submitted'
       ORDER BY ta.submitted_at DESC
       LIMIT 5`,
      [student_id]
    );

    // Get upcoming tests
    const upcomingTests = await query(
      `SELECT t.test_id, t.title, t.duration_minutes, t.start_time, t.end_time, t.mode
       FROM tests t
       WHERE t.status IN ('scheduled', 'live')
         AND t.end_time > NOW()
       ORDER BY t.start_time ASC
       LIMIT 3`,
      []
    );

    // Get current plan progress
    const planProgress = await query(
      `SELECT sp.plan_id, sp.duration_weeks,
              COUNT(pt.task_id) as total_tasks,
              COUNT(CASE WHEN pt.is_completed = 1 THEN 1 END) as completed_tasks
       FROM study_plans sp
       LEFT JOIN plan_tasks pt ON pt.plan_id = sp.plan_id
       WHERE sp.student_id = ? AND sp.status = 'active'
       GROUP BY sp.plan_id, sp.duration_weeks
       LIMIT 1`,
      [student_id]
    );

    // Get stats
    const statsResult = await query(
      `SELECT
         COUNT(DISTINCT ta.attempt_id) as total_tests,
         COALESCE(ROUND(AVG(ta.accuracy_percent), 1), 0) as avg_score,
         (SELECT COUNT(*) FROM practice_sessions WHERE student_id = ? AND status = 'completed') as practice_sessions
       FROM test_attempts ta
       WHERE ta.student_id = ? AND ta.status = 'submitted'`,
      [student_id, student_id]
    );

    const statsRow = statsResult.rows[0] || {};

    // Build plan_progress with percent, completed, total
    let planProgressData = null;
    if (planProgress.rows[0]) {
      const pp = planProgress.rows[0];
      const total = Number(pp.total_tasks) || 0;
      const completed = Number(pp.completed_tasks) || 0;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      planProgressData = { plan_id: pp.plan_id, duration_weeks: pp.duration_weeks, total, completed, percent };
    }

    // Streak: consecutive days (ending today) with any activity.
    const activityDays = await query(
      `SELECT DATE(submitted_at) as d FROM test_attempts WHERE student_id=? AND status='submitted' AND submitted_at IS NOT NULL
       UNION
       SELECT DATE(submitted_at) FROM practice_sessions WHERE student_id=? AND submitted_at IS NOT NULL
       UNION
       SELECT DATE(pt.completed_at) FROM plan_tasks pt
         JOIN study_plans sp ON sp.plan_id = pt.plan_id
         WHERE sp.student_id=? AND pt.is_completed=1 AND pt.completed_at IS NOT NULL`,
      [student_id, student_id, student_id]
    );
    const daySet = new Set(activityDays.rows.map(r => {
      const d = r.d instanceof Date ? r.d : new Date(r.d);
      return d.toISOString().slice(0, 10);
    }));
    let streak = 0;
    const cursor = new Date();
    // If today has no activity, start counting from yesterday (so a streak isn't broken before midnight).
    if (!daySet.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (daySet.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    res.json({
      stats: {
        total_tests: Number(statsRow.total_tests) || 0,
        avg_score: Number(statsRow.avg_score) || 0,
        practice_sessions: Number(statsRow.practice_sessions) || 0,
        streak,
      },
      weak_areas: skills.rows,
      recent_attempts: recentAttempts.rows,
      upcoming_tests: upcomingTests.rows,
      plan_progress: planProgressData,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /student/materials */
const getMaterials = async (req, res, next) => {
  try {
    const { subject_id, topic_id, concept_id, type, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE m.is_active = 1 AND (m.visibility = 'public' OR m.target_batch_id = (SELECT batch_id FROM users WHERE user_id=?))";
    const params = [req.user.user_id];

    if (subject_id) { whereClause += ' AND m.subject_id = ?'; params.push(subject_id); }
    if (topic_id) { whereClause += ' AND m.topic_id = ?'; params.push(topic_id); }
    if (concept_id) { whereClause += ' AND m.concept_id = ?'; params.push(concept_id); }
    if (type) { whereClause += ' AND m.type = ?'; params.push(type); }
    if (search) { whereClause += ' AND (m.title LIKE ? OR m.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM materials m ${whereClause}`,
      params
    );
    const total = Number(countResult.rows[0]?.total) || 0;

    const result = await query(
      `SELECT m.material_id, m.title, m.type, m.file_url, m.description, m.download_allowed,
              m.subject_id, m.topic_id, m.concept_id, m.uploaded_by,
              s.name as subject_name, t.name as topic_name, c.name as concept_name,
              m.created_at
       FROM materials m
       LEFT JOIN subjects s ON s.subject_id = m.subject_id
       LEFT JOIN topics t ON t.topic_id = m.topic_id
       LEFT JOIN concepts c ON c.concept_id = m.concept_id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ materials: result.rows, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    next(err);
  }
};

/** GET /student/materials/:id */
const getMaterialById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*, s.name as subject_name, t.name as topic_name, c.name as concept_name,
              u.name as uploaded_by_name
       FROM materials m
       LEFT JOIN subjects s ON s.subject_id = m.subject_id
       LEFT JOIN topics t ON t.topic_id = m.topic_id
       LEFT JOIN concepts c ON c.concept_id = m.concept_id
       LEFT JOIN users u ON u.user_id = m.uploaded_by
       WHERE m.material_id = ? AND m.is_active = 1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ material: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/** POST /student/materials/:id/mark-learned */
const markLearned = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student_id = req.user.user_id;

    await query(
      `INSERT INTO student_progress (student_id, material_id, marked_learned_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE marked_learned_at = NOW()`,
      [student_id, id]
    );

    res.json({ message: 'Marked as learned' });
  } catch (err) {
    next(err);
  }
};

/** POST /student/materials/:id/bookmark */
const bookmarkMaterial = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    await query(
      `INSERT IGNORE INTO bookmarks (bookmark_id, student_id, item_type, item_id)
       VALUES (?, ?, 'material', ?)`,
      [uuidv4(), req.user.user_id, req.params.id]
    );
    res.json({ message: 'Bookmarked' });
  } catch (err) {
    next(err);
  }
};

/** GET /student/notes */
const getNotes = async (req, res, next) => {
  try {
    const { subject_id, topic_id } = req.query;
    let where = "WHERE m.type = 'note' AND m.is_active = 1";
    const params = [];

    if (subject_id) { where += ' AND m.subject_id = ?'; params.push(subject_id); }
    if (topic_id) { where += ' AND m.topic_id = ?'; params.push(topic_id); }

    const result = await query(
      `SELECT m.material_id, m.title, m.file_url, m.download_allowed, m.created_at,
              u.name as teacher_name, s.name as subject_name, t.name as topic_name
       FROM materials m
       LEFT JOIN users u ON u.user_id = m.uploaded_by
       LEFT JOIN subjects s ON s.subject_id = m.subject_id
       LEFT JOIN topics t ON t.topic_id = m.topic_id
       ${where}
       ORDER BY m.created_at DESC`,
      params
    );

    res.json({ notes: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /student/practice/start */
const startPractice = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { generateAIQuestions } = require('../utils/aiQuestions');
    // Accept both frontend format (topic_id, count, difficulty as number string)
    // and direct format (topic_ids array, num_questions, difficulty as string)
    let { topic_ids, concept_ids, num_questions, difficulty, time_limit,
          topic_id, count, title, method, config, task_id } = req.body;

    // Normalize params from frontend format
    if (topic_id && !topic_ids) topic_ids = [topic_id];
    if (count && !num_questions) num_questions = count;
    num_questions = parseInt(num_questions) || 10;

    // Normalize difficulty: numeric string ('1'-'5') → 'easy'/'medium'/'hard'
    if (difficulty !== undefined && difficulty !== '' && !isNaN(Number(difficulty))) {
      const d = Number(difficulty);
      difficulty = d <= 2 ? 'easy' : d <= 3 ? 'medium' : 'hard';
    }
    if (!difficulty || difficulty === 'null') difficulty = 'mixed';

    const student_id = req.user.user_id;
    const diffLabel = (difficulty === 'mixed' || !difficulty) ? 'medium' : difficulty;

    let aiQuestions = [];
    let cachedQuestions = null;
    let topicName = null;

    // Check 6-hour cache if task_id is supplied
    if (task_id) {
      const cachePattern = `%"task_id":"${task_id}"%`;
      const cachedSessionResult = await query(
        `SELECT question_ids FROM practice_sessions
         WHERE student_id = ? AND config LIKE ? AND started_at >= DATE_SUB(NOW(), INTERVAL 6 HOUR)
         ORDER BY started_at ASC LIMIT 1`,
        [student_id, cachePattern]
      );
      if (cachedSessionResult.rows.length > 0) {
        const rawQids = cachedSessionResult.rows[0].question_ids;
        const qids = Array.isArray(rawQids) ? rawQids : JSON.parse(rawQids || '[]');
        if (qids.length > 0) {
          const placeholders = qids.map(() => '?').join(',');
          const questionsResult = await query(
            `SELECT q.question_id, q.question_text, q.question_type, q.options, q.difficulty,
                    q.estimated_time_seconds, t.name as topic_name, s.name as subject_name
             FROM questions q
             LEFT JOIN concepts c ON c.concept_id = q.concept_id
             LEFT JOIN topics t ON t.topic_id = c.topic_id
             LEFT JOIN subjects s ON s.subject_id = t.subject_id
             WHERE q.question_id IN (${placeholders})`,
            qids
          );
          
          const qMap = {};
          for (const q of questionsResult.rows) {
            let optionsObj = q.options;
            if (typeof optionsObj === 'string') {
              try { optionsObj = JSON.parse(optionsObj); } catch { optionsObj = q.options; }
            }
            qMap[q.question_id] = {
              question_id:            q.question_id,
              question_text:          q.question_text,
              question_type:          q.question_type,
              options:                optionsObj,
              difficulty:             q.difficulty,
              estimated_time_seconds: q.estimated_time_seconds || 60,
              concept_name:           q.topic_name || 'General',
              topic_name:             q.topic_name || 'General Aptitude',
            };
          }
          cachedQuestions = qids.map(qid => qMap[qid]).filter(Boolean);
        }
      }
    }

    if (cachedQuestions) {
      aiQuestions = cachedQuestions;
      if (aiQuestions.length > 0) {
        topicName = aiQuestions[0].topic_name;
      }
    } else {
      let subjectName = null, conceptId = null;

      if (topic_ids && topic_ids.length > 0) {
        const topicInfo = await query(
          `SELECT t.name as topic_name, s.name as subject_name, c.concept_id
           FROM topics t
           JOIN subjects s ON s.subject_id = t.subject_id
           LEFT JOIN concepts c ON c.topic_id = t.topic_id
           WHERE t.topic_id = ? LIMIT 1`,
          [topic_ids[0]]
        );
        if (topicInfo.rows.length > 0) {
          topicName   = topicInfo.rows[0].topic_name;
          subjectName = topicInfo.rows[0].subject_name;
          conceptId   = topicInfo.rows[0].concept_id;
        }
      }

      if (!conceptId) {
        const fallback = await query('SELECT concept_id FROM concepts ORDER BY RAND() LIMIT 1', []);
        conceptId = fallback.rows[0]?.concept_id || null;
      }

      console.log(`[AI] Generating ${num_questions} "${diffLabel}" questions for topic="${topicName || 'General Aptitude'}"`);

      const aiQs = await generateAIQuestions({
        topicName:   topicName   || 'General Aptitude',
        subjectName: subjectName || 'Aptitude',
        count:       num_questions,
        difficulty:  diffLabel,
      });

      const diffNum = diffLabel === 'easy' ? 2 : diffLabel === 'hard' ? 4 : 3;

      for (const q of aiQs.slice(0, num_questions)) {
        const qId = uuidv4();
        await query(
          `INSERT INTO questions
             (question_id, concept_id, question_text, question_type, options,
              correct_answer, explanation, difficulty, source, is_active)
           VALUES (?, ?, ?, 'mcq', ?, ?, ?, ?, 'ai_generated', 1)`,
          [qId, conceptId, q.question_text, JSON.stringify(q.options),
           q.correct_answer, q.explanation || '', diffNum]
        );
        aiQuestions.push({
          question_id:            qId,
          question_text:          q.question_text,
          question_type:          'mcq',
          options:                q.options,
          difficulty:             diffNum,
          estimated_time_seconds: 60,
          concept_name:           topicName || 'General',
          topic_name:             topicName || 'General Aptitude',
        });
      }
    }

    // Build the config object to save task_id
    let configObj = {};
    if (config) {
      try {
        configObj = typeof config === 'string' ? JSON.parse(config) : config;
      } catch (e) {
        configObj = {};
      }
    }
    if (task_id) {
      configObj.task_id = task_id;
    }
    if (!configObj.difficulty) configObj.difficulty = diffLabel;
    if (!configObj.count) configObj.count = num_questions;

    const session_id = uuidv4();
    const sessionTitle = title || (topicName ? `${topicName} Practice` : 'Practice Session');
    const sessionMethod = method || 'topic';
    const sessionConfig = JSON.stringify(configObj);
    await query(
      `INSERT INTO practice_sessions
         (session_id, student_id, question_ids, started_at, time_limit_minutes, status, title, method, config)
       VALUES (?, ?, ?, NOW(), ?, 'in_progress', ?, ?, ?)`,
      [session_id, student_id,
       JSON.stringify(aiQuestions.map(q => q.question_id)),
       time_limit || null, sessionTitle, sessionMethod, sessionConfig]
    );

    res.json({
      session_id,
      questions:    aiQuestions,
      total:        aiQuestions.length,
      ai_generated: !cachedQuestions,
    });
  } catch (err) {
    next(err);
  }
};

/** POST /student/practice/submit-answer */
const submitPracticeAnswer = async (req, res, next) => {
  try {
    const { session_id, question_id, selected_answer, time_taken_seconds } = req.body;

    const question = await query(
      'SELECT correct_answer, explanation, options FROM questions WHERE question_id = ?',
      [question_id]
    );

    if (question.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const { correct_answer, explanation } = question.rows[0];
    const is_correct = selected_answer === correct_answer;

    // Store the answer
    await query(
      `INSERT INTO practice_answers (session_id, question_id, selected_answer, is_correct, time_taken_seconds)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE selected_answer=VALUES(selected_answer), is_correct=VALUES(is_correct), time_taken_seconds=VALUES(time_taken_seconds)`,
      [session_id, question_id, selected_answer, is_correct ? 1 : 0, time_taken_seconds || 0]
    );

    // Update skill profile
    if (is_correct !== undefined) {
      const qTopicResult = await query(
        'SELECT t.topic_id FROM concepts c JOIN topics t ON t.topic_id = c.topic_id JOIN questions q ON q.concept_id = c.concept_id WHERE q.question_id = ?',
        [question_id]
      );
      if (qTopicResult.rows.length > 0) {
        const topic_id = qTopicResult.rows[0].topic_id;
        await query(
          `INSERT INTO student_skill_profile (student_id, topic_id, total_attempts, correct_count, accuracy_percent, last_attempted)
           VALUES (?, ?, 1, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             total_attempts = student_skill_profile.total_attempts + 1,
             correct_count = student_skill_profile.correct_count + VALUES(correct_count),
             accuracy_percent = ROUND(((student_skill_profile.correct_count + VALUES(correct_count)) / (student_skill_profile.total_attempts + 1)) * 100, 2),
             is_weak = ((student_skill_profile.correct_count + VALUES(correct_count)) / (student_skill_profile.total_attempts + 1)) < 0.6,
             last_attempted = NOW()`,
          [req.user.user_id, topic_id, is_correct ? 1 : 0, is_correct ? 100 : 0]
        );
      }
    }

    res.json({
      is_correct,
      correct_answer,
      explanation
    });
  } catch (err) {
    next(err);
  }
};

/** POST /student/practice/end */
const endPractice = async (req, res, next) => {
  try {
    const { session_id } = req.body;

    const answers = await query(
      `SELECT pa.question_id, pa.selected_answer, pa.is_correct, pa.time_taken_seconds,
              q.question_text, q.options, q.correct_answer, q.explanation,
              COALESCE(t.name, 'General') as topic_name
       FROM practice_answers pa
       JOIN questions q ON q.question_id = pa.question_id
       LEFT JOIN concepts c ON c.concept_id = q.concept_id
       LEFT JOIN topics t ON t.topic_id = c.topic_id
       WHERE pa.session_id = ?`,
      [session_id]
    );

    const total = answers.rows.length;
    const correct = answers.rows.filter(a => a.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const time_taken = answers.rows.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);

    await query(
      `UPDATE practice_sessions SET status='completed', submitted_at=NOW(), score=?, accuracy_percent=?
       WHERE session_id = ?`,
      [correct, accuracy, session_id]
    );

    res.json({
      session_id,
      score: correct,
      total,
      accuracy_percent: accuracy,
      time_taken_seconds: time_taken,
      answers: answers.rows
    });
  } catch (err) {
    next(err);
  }
};

/** GET /student/tests */
const getAssignedTests = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;

    const userBatch = await query('SELECT batch_id FROM users WHERE user_id = ?', [student_id]);
    const batch_id = userBatch.rows[0]?.batch_id;

    const tests = await query(
      `SELECT t.test_id, t.title, t.description, t.mode, t.duration_minutes,
              t.total_marks, t.start_time, t.end_time, t.status,
              ta.attempt_id, ta.status as attempt_status, ta.score, ta.accuracy_percent,
              (SELECT COUNT(*) FROM test_attempts ta2 WHERE ta2.test_id = t.test_id AND ta2.student_id = ?) as attempt_count
       FROM tests t
       LEFT JOIN test_attempts ta ON ta.attempt_id = (
         SELECT ta3.attempt_id FROM test_attempts ta3
         WHERE ta3.test_id = t.test_id AND ta3.student_id = ?
         ORDER BY ta3.started_at DESC LIMIT 1
       )
       WHERE t.status IN ('scheduled', 'live', 'completed')
         AND (
           (JSON_LENGTH(t.assigned_to->'$.batch_ids') = 0 AND JSON_LENGTH(t.assigned_to->'$.student_ids') = 0)
           OR (? IS NOT NULL AND JSON_CONTAINS(t.assigned_to->'$.batch_ids', JSON_QUOTE(?)))
           OR JSON_CONTAINS(t.assigned_to->'$.student_ids', JSON_QUOTE(?))
         )
       ORDER BY t.start_time DESC`,
      [student_id, student_id, batch_id, batch_id, student_id]
    );

    res.json({ tests: tests.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /student/tests/:id/start */
const startTest = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { id: test_id } = req.params;
    const student_id = req.user.user_id;

    const testResult = await query(
      `SELECT t.test_id, t.title, t.duration_minutes, t.total_marks, t.mode,
              t.shuffle_questions, t.proctoring_config, t.marking_scheme
       FROM tests t
       WHERE t.test_id = ? AND t.status IN ('live', 'scheduled') LIMIT 1`,
      [test_id]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or not available' });
    }

    const testRow = testResult.rows[0];
    const questionsResult = await query(
      `SELECT q.question_id, q.question_text, q.question_type, q.options, q.difficulty,
              q.estimated_time_seconds, tq.marks, tq.display_order
       FROM test_questions tq
       JOIN questions q ON q.question_id = tq.question_id
       WHERE tq.test_id = ?
       ORDER BY tq.display_order`,
      [test_id]
    );
    testRow.questions = questionsResult.rows;

    // Check if already attempted
    const existing = await query(
      "SELECT attempt_id FROM test_attempts WHERE test_id=? AND student_id=? AND status='in_progress'",
      [test_id, student_id]
    );

    if (existing.rows.length > 0) {
      return res.json({ attempt_id: existing.rows[0].attempt_id, test: testRow });
    }

    const attempt_id = uuidv4();
    await query(
      `INSERT INTO test_attempts (attempt_id, test_id, student_id, started_at, total_marks, status)
       VALUES (?,?,?,NOW(),?,'in_progress')`,
      [attempt_id, test_id, student_id, testRow.total_marks]
    );

    // Shuffle questions if configured
    let questions = testRow.questions;
    if (testRow.shuffle_questions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Calculate end_time from duration
    const endTime = new Date(Date.now() + testRow.duration_minutes * 60 * 1000).toISOString();

    res.json({
      attempt_id,
      end_time: endTime,
      test: { ...testRow, questions },
      questions,
      proctoring_config: testRow.proctoring_config
    });
  } catch (err) {
    next(err);
  }
};

/** POST /student/tests/attempts/:id/answer */
const saveTestAnswer = async (req, res, next) => {
  try {
    const { id: attempt_id } = req.params;
    const { question_id, selected_answer: sa, selected_option, time_taken_seconds, marked_for_review } = req.body;
    const selected_answer = sa || selected_option;

    await query(
      `INSERT INTO attempt_answers (attempt_id, question_id, selected_answer, time_taken_seconds, marked_for_review)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         selected_answer=VALUES(selected_answer), time_taken_seconds=VALUES(time_taken_seconds), marked_for_review=VALUES(marked_for_review)`,
      [attempt_id, question_id, selected_answer, time_taken_seconds || 0, marked_for_review ? 1 : 0]
    );

    res.json({ message: 'Answer saved' });
  } catch (err) {
    next(err);
  }
};

/** POST /student/tests/attempts/:id/submit */
const submitTest = async (req, res, next) => {
  try {
    const { id: attempt_id } = req.params;

    // Get attempt with test details
    const attempt = await query(
      'SELECT ta.*, t.marking_scheme FROM test_attempts ta JOIN tests t ON t.test_id = ta.test_id WHERE ta.attempt_id = ?',
      [attempt_id]
    );

    if (attempt.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.rows[0].status !== 'in_progress') {
      return res.status(400).json({ error: 'Test already submitted' });
    }

    // Calculate score
    const answers = await query(
      `SELECT aa.question_id, aa.selected_answer, q.correct_answer, tq.marks
       FROM attempt_answers aa
       JOIN questions q ON q.question_id = aa.question_id
       JOIN test_questions tq ON tq.test_id = ? AND tq.question_id = aa.question_id
       WHERE aa.attempt_id = ?`,
      [attempt.rows[0].test_id, attempt_id]
    );

    const marking = attempt.rows[0].marking_scheme || { correct: 1, wrong: 0 };
    let score = 0;
    let correct_count = 0;

    const updatedAnswers = answers.rows.map(a => {
      const is_correct = a.selected_answer === a.correct_answer;
      if (a.selected_answer) {
        score += is_correct ? (marking.correct * a.marks) : (marking.wrong * a.marks || 0);
        if (is_correct) correct_count++;
      }
      return { ...a, is_correct };
    });

    // Update answers with is_correct
    for (const ans of updatedAnswers) {
      await query(
        'UPDATE attempt_answers SET is_correct=? WHERE attempt_id=? AND question_id=?',
        [ans.is_correct ? 1 : 0, attempt_id, ans.question_id]
      );
    }

    const total_answered = answers.rows.filter(a => a.selected_answer).length;
    const accuracy = total_answered > 0 ? Math.round((correct_count / total_answered) * 100) : 0;
    const time_taken = answers.rows.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);

    await query(
      `UPDATE test_attempts SET status='submitted', submitted_at=NOW(), score=?,
       accuracy_percent=?, time_taken_seconds=? WHERE attempt_id=?`,
      [Math.max(0, score), accuracy, time_taken, attempt_id]
    );

    // Roll up per-topic accuracy into student_skill_profile so weak-area
    // analytics on the dashboard and AI-plan generator stay current.
    try {
      const topicRows = await query(
        `SELECT t.topic_id, aa.is_correct
         FROM attempt_answers aa
         JOIN questions q ON q.question_id = aa.question_id
         JOIN concepts c ON c.concept_id = q.concept_id
         JOIN topics t ON t.topic_id = c.topic_id
         WHERE aa.attempt_id = ? AND aa.selected_answer IS NOT NULL`,
        [attempt_id]
      );

      const byTopic = {};
      for (const row of topicRows.rows) {
        if (!byTopic[row.topic_id]) byTopic[row.topic_id] = { total: 0, correct: 0 };
        byTopic[row.topic_id].total += 1;
        byTopic[row.topic_id].correct += row.is_correct ? 1 : 0;
      }

      const studentId = attempt.rows[0].student_id;
      for (const [topic_id, stat] of Object.entries(byTopic)) {
        const acc = Math.round((stat.correct / stat.total) * 100);
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
          [studentId, topic_id, stat.total, stat.correct, acc]
        );
      }
    } catch (skillErr) {
      console.error('skill_profile update failed (non-fatal):', skillErr.message);
    }

    res.json({
      attempt_id,
      score: Math.max(0, score),
      total_marks: attempt.rows[0].total_marks,
      accuracy_percent: accuracy,
      correct_count,
      total_answered
    });
  } catch (err) {
    next(err);
  }
};

/** POST /student/tests/attempts/:id/violation */
const reportViolation = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { id: attempt_id } = req.params;
    const { violation_type, details } = req.body;

    await query(
      `INSERT INTO violations (violation_id, test_attempt_id, student_id, violation_type, details, occurred_at)
       VALUES (?,?,?,?,?,NOW())`,
      [uuidv4(), attempt_id, req.user.user_id, violation_type, JSON.stringify(details || {})]
    );

    await query(
      'UPDATE test_attempts SET violations_count = violations_count + 1 WHERE attempt_id = ?',
      [attempt_id]
    );

    // Check if violations exceed limit
    const attemptRow = await query(
      `SELECT ta.violations_count, t.proctoring_config
       FROM test_attempts ta JOIN tests t ON t.test_id = ta.test_id
       WHERE ta.attempt_id = ?`,
      [attempt_id]
    );

    const limit = attemptRow.rows[0]?.proctoring_config?.tab_switch_limit || 3;
    const shouldAutoSubmit = attemptRow.rows[0]?.violations_count >= limit;

    res.json({ recorded: true, auto_submit: shouldAutoSubmit });
  } catch (err) {
    next(err);
  }
};

/** GET /student/reports */
const getReports = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;

    // Formal test attempts
    const testAttempts = await query(
      `SELECT ta.attempt_id as id, t.title, 'test' as type,
              ta.score, ta.total_marks, ta.accuracy_percent,
              ta.time_taken_seconds, ta.submitted_at,
              u.name as student_name,
              t.test_id,
              NULL as method,
              NULL as config,
              creator.name as assigned_by_name,
              (
                SELECT COUNT(*)
                FROM test_attempts ta2
                WHERE ta2.student_id = ta.student_id
                  AND ta2.test_id = ta.test_id
                  AND ta2.started_at <= ta.started_at
              ) as attempt_number,
              (
                SELECT GROUP_CONCAT(DISTINCT top.name SEPARATOR ', ')
                FROM test_questions tq
                JOIN questions q ON q.question_id = tq.question_id
                JOIN concepts c ON c.concept_id = q.concept_id
                JOIN topics top ON top.topic_id = c.topic_id
                WHERE tq.test_id = t.test_id
              ) as topics
       FROM test_attempts ta
       JOIN tests t ON t.test_id = ta.test_id
       JOIN users u ON u.user_id = ta.student_id
       LEFT JOIN users creator ON creator.user_id = t.created_by
       WHERE ta.student_id = ? AND ta.status = 'submitted'`,
      [student_id]
    );

    // Practice sessions
    const practiceSessions = await query(
      `SELECT ps.session_id as id, COALESCE(ps.title, 'Practice Session') as title, 'practice' as type,
              ps.score,
              (
                SELECT COUNT(*)
                FROM practice_answers pa
                WHERE pa.session_id = ps.session_id
              ) as total_marks,
              ps.accuracy_percent,
              NULL as time_taken_seconds, ps.submitted_at,
              u.name as student_name,
              NULL as test_id,
              ps.method,
              ps.config,
              u.name as assigned_by_name,
              (
                SELECT COUNT(*)
                FROM practice_sessions ps2
                WHERE ps2.student_id = ps.student_id
                  AND (ps2.title = ps.title OR (ps2.title IS NULL AND ps.title IS NULL))
                  AND ps2.started_at <= ps.started_at
              ) as attempt_number,
              (
                SELECT GROUP_CONCAT(DISTINCT top.name SEPARATOR ', ')
                FROM practice_answers pa
                JOIN questions q ON q.question_id = pa.question_id
                JOIN concepts c ON c.concept_id = q.concept_id
                JOIN topics top ON top.topic_id = c.topic_id
                WHERE pa.session_id = ps.session_id
              ) as topics
       FROM practice_sessions ps
       JOIN users u ON u.user_id = ps.student_id
       WHERE ps.student_id = ? AND ps.status = 'completed'`,
      [student_id]
    );

    // Merge and sort by date desc
    const all = [...testAttempts.rows, ...practiceSessions.rows]
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    res.json({ attempts: all });
  } catch (err) {
    next(err);
  }
};

/** GET /student/reports/:id */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student_id = req.user.user_id;

    // ── Try as practice session first ─────────────────────────────────────
    const session = await query(
      'SELECT * FROM practice_sessions WHERE session_id = ? AND student_id = ?',
      [id, student_id]
    );

    if (session.rows.length > 0) {
      const ps = session.rows[0];
      const answers = await query(
        `SELECT pa.question_id, pa.selected_answer, pa.is_correct, pa.time_taken_seconds,
                q.question_text, q.options, q.correct_answer, q.explanation, q.difficulty,
                COALESCE(top.name, 'General') as topic_name, top.topic_id, COALESCE(c.name, 'General') as concept_name
         FROM practice_answers pa
         JOIN questions q ON q.question_id = pa.question_id
         LEFT JOIN concepts c ON c.concept_id = q.concept_id
         LEFT JOIN topics top ON top.topic_id = c.topic_id
         WHERE pa.session_id = ?`,
        [id]
      );

      const total = answers.rows.length;
      const time_taken = answers.rows.reduce((s, a) => s + (a.time_taken_seconds || 0), 0);

      let sessAttemptNum;
      if (ps.title === null) {
        sessAttemptNum = await query(
          `SELECT COUNT(*) as attempt_number FROM practice_sessions
           WHERE student_id = ? AND title IS NULL AND started_at <= ?`,
          [student_id, ps.started_at]
        );
      } else {
        sessAttemptNum = await query(
          `SELECT COUNT(*) as attempt_number FROM practice_sessions
           WHERE student_id = ? AND title = ? AND started_at <= ?`,
          [student_id, ps.title, ps.started_at]
        );
      }
      const attempt_number = sessAttemptNum.rows[0]?.attempt_number || 1;

      const topicMap = {};
      for (const a of answers.rows) {
        const name = a.topic_name || 'General';
        if (!topicMap[name]) topicMap[name] = { topic_id: a.topic_id, correct: 0, total: 0 };
        topicMap[name].total++;
        if (a.is_correct) topicMap[name].correct++;
      }
      const topic_analysis = Object.entries(topicMap).map(([topic_name, v]) => ({
        topic_name,
        topic_id: v.topic_id,
        accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
        correct: v.correct,
        total: v.total,
        is_weak: v.total > 0 && Math.round((v.correct / v.total) * 100) < 60,
      })).sort((a, b) => a.accuracy - b.accuracy);

      return res.json({
        type: 'practice',
        attempt: {
          id,
          title: ps.title || 'Practice Session',
          score: ps.score,
          total_marks: total,
          accuracy_percent: ps.accuracy_percent,
          time_taken_seconds: time_taken,
          submitted_at: ps.submitted_at,
          attempt_number,
          method: ps.method,
          config: ps.config
        },
        answers: answers.rows,
        topic_analysis,
        weak_topics: topic_analysis.filter(t => t.is_weak),
      });
    }

    // ── Fall back to test attempt ──────────────────────────────────────────
    const attempt = await query(
      `SELECT ta.*, t.title, t.marking_scheme, t.mode, t.test_id
       FROM test_attempts ta JOIN tests t ON t.test_id = ta.test_id
       WHERE ta.attempt_id = ? AND ta.student_id = ?`,
      [id, student_id]
    );

    if (attempt.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const testRow = attempt.rows[0];
    const testAttemptNum = await query(
      `SELECT COUNT(*) as attempt_number FROM test_attempts
       WHERE student_id = ? AND test_id = ? AND started_at <= ?`,
      [student_id, testRow.test_id, testRow.started_at]
    );
    const attempt_number = testAttemptNum.rows[0]?.attempt_number || 1;

    const answers = await query(
      `SELECT aa.question_id, aa.selected_answer, aa.is_correct, aa.time_taken_seconds,
              q.question_text, q.options, q.correct_answer, q.explanation, q.difficulty,
              top.name as topic_name, top.topic_id, c.name as concept_name
       FROM attempt_answers aa
       JOIN questions q ON q.question_id = aa.question_id
       JOIN concepts c ON c.concept_id = q.concept_id
       JOIN topics top ON top.topic_id = c.topic_id
       WHERE aa.attempt_id = ?`,
      [id]
    );

    const topicMap = {};
    for (const a of answers.rows) {
      const name = a.topic_name || 'General';
      if (!topicMap[name]) topicMap[name] = { topic_id: a.topic_id, correct: 0, total: 0 };
      topicMap[name].total++;
      if (a.is_correct) topicMap[name].correct++;
    }
    const topic_analysis = Object.entries(topicMap).map(([topic_name, v]) => ({
      topic_name,
      topic_id: v.topic_id,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      correct: v.correct,
      total: v.total,
      is_weak: v.total > 0 && Math.round((v.correct / v.total) * 100) < 60,
    })).sort((a, b) => a.accuracy - b.accuracy);

    res.json({
      type: 'test',
      attempt: {
        ...testRow,
        attempt_number
      },
      answers: answers.rows,
      topic_analysis,
      weak_topics: topic_analysis.filter(t => t.is_weak),
    });
  } catch (err) {
    next(err);
  }
};

/** POST /student/plan/generate */
const generatePlan = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const student_id = req.user.user_id;
    const { topic_id } = req.body;

    let targetTopics = [];
    if (topic_id) {
      const topicResult = await query(
        `SELECT topic_id, name as topic_name FROM topics WHERE topic_id = ?`,
        [topic_id]
      );
      if (topicResult.rows.length > 0) {
        targetTopics = topicResult.rows;
      }
    }

    if (targetTopics.length === 0) {
      // Get top weak areas
      const weakTopics = await query(
        `SELECT ssp.topic_id, t.name as topic_name, ssp.accuracy_percent, ssp.total_attempts
         FROM student_skill_profile ssp
         JOIN topics t ON t.topic_id = ssp.topic_id
         WHERE ssp.student_id = ? AND ssp.is_weak = 1
         ORDER BY ssp.accuracy_percent ASC
         LIMIT 5`,
        [student_id]
      );
      targetTopics = weakTopics.rows;
    }

    if (targetTopics.length === 0) {
      // Fallback: get any 3 topics so we can always generate a plan
      const fallbackTopics = await query(
        `SELECT topic_id, name as topic_name FROM topics ORDER BY RAND() LIMIT 3`,
        []
      );
      targetTopics = fallbackTopics.rows;
    }

    // Deactivate existing active plans
    await query(
      "UPDATE study_plans SET status='archived' WHERE student_id=? AND status='active'",
      [student_id]
    );

    const plan_id = uuidv4();
    const duration_weeks = Math.min(targetTopics.length * 1, 4);

    await query(
      `INSERT INTO study_plans (plan_id, student_id, generated_at, duration_weeks, status, source)
       VALUES (?,?,NOW(),?,'active','ai_generated')`,
      [plan_id, student_id, duration_weeks]
    );

    // Generate weekly tasks
    const tasks = [];
    targetTopics.forEach((topic, weekIndex) => {
      // Day 1: Study materials
      tasks.push({
        task_id: uuidv4(), plan_id, week_number: weekIndex + 1, day_number: 1,
        task_type: 'video', reference_id: null, topic_id: topic.topic_id,
        description: `Watch explanation videos for ${topic.topic_name}`, estimated_minutes: 30
      });
      // Day 2-3: Practice
      tasks.push({
        task_id: uuidv4(), plan_id, week_number: weekIndex + 1, day_number: 2,
        task_type: 'practice', reference_id: null, topic_id: topic.topic_id,
        description: `Practice 20 questions on ${topic.topic_name} (easy)`, estimated_minutes: 40
      });
      tasks.push({
        task_id: uuidv4(), plan_id, week_number: weekIndex + 1, day_number: 3,
        task_type: 'practice', reference_id: null, topic_id: topic.topic_id,
        description: `Practice 20 questions on ${topic.topic_name} (medium)`, estimated_minutes: 45
      });
      // Day 4: Re-evaluation
      tasks.push({
        task_id: uuidv4(), plan_id, week_number: weekIndex + 1, day_number: 4,
        task_type: 'test', reference_id: null, topic_id: topic.topic_id,
        description: `Re-evaluation test for ${topic.topic_name}`, estimated_minutes: 30
      });
    });

    for (const task of tasks) {
      await query(
        `INSERT INTO plan_tasks (task_id, plan_id, week_number, day_number, task_type, description, estimated_minutes, topic_id)
         VALUES (?,?,?,?,?,?,?,?)`,
        [task.task_id, task.plan_id, task.week_number, task.day_number,
         task.task_type, task.description, task.estimated_minutes, task.topic_id || null]
      );
    }

    res.json({ plan_id, duration_weeks, weak_topics: targetTopics, total_tasks: tasks.length });
  } catch (err) {
    next(err);
  }
};

/** GET /student/plan */
const getCurrentPlan = async (req, res, next) => {
  try {
    const planResult = await query(
      `SELECT * FROM study_plans WHERE student_id = ? AND status = 'active' LIMIT 1`,
      [req.user.user_id]
    );

    if (planResult.rows.length === 0) {
      return res.json({ plan: null });
    }

    const plan = planResult.rows[0];
    const tasks = await query(
      `SELECT pt.*, t.name as topic_name, t.subject_id, s.name as subject_name
       FROM plan_tasks pt
       LEFT JOIN topics t ON t.topic_id = pt.topic_id
       LEFT JOIN subjects s ON s.subject_id = t.subject_id
       WHERE pt.plan_id = ?
       ORDER BY pt.week_number, pt.day_number`,
      [plan.plan_id]
    );
    plan.tasks = tasks.rows;

    res.json({ plan });
  } catch (err) {
    next(err);
  }
};

/** POST /student/plan/tasks/:id/complete */
const completeTask = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { reference_id } = req.body;
    const task_id = req.params.id;

    // Update task
    await query(
      'UPDATE plan_tasks SET is_completed=1, completed_at=NOW(), reference_id=? WHERE task_id=?',
      [reference_id || null, task_id]
    );

    // Check if task type was a test, and check accuracy of the referenced session
    const taskResult = await query(
      `SELECT pt.*, t.name as topic_name 
       FROM plan_tasks pt
       LEFT JOIN topics t ON t.topic_id = pt.topic_id
       WHERE pt.task_id = ?`,
      [task_id]
    );

    let extended = false;
    let extensionTasks = [];

    if (taskResult.rows.length > 0) {
      const task = taskResult.rows[0];
      
      // If it is a test and we have a practice session reference
      if (task.task_type === 'test' && reference_id) {
        const sessResult = await query(
          'SELECT accuracy_percent FROM practice_sessions WHERE session_id = ?',
          [reference_id]
        );
        
        if (sessResult.rows.length > 0) {
          const accuracy = Number(sessResult.rows[0].accuracy_percent) || 0;
          
          // Fail threshold is < 50%
          if (accuracy < 50) {
            extended = true;
            
            // Generate Day 5, Day 6, Day 7 advanced items
            const newTasks = [
              {
                task_id: uuidv4(), plan_id: task.plan_id, week_number: task.week_number, day_number: 5,
                task_type: 'video', topic_id: task.topic_id,
                description: `Advanced explanation & shortcuts video for ${task.topic_name}`, estimated_minutes: 35
              },
              {
                task_id: uuidv4(), plan_id: task.plan_id, week_number: task.week_number, day_number: 6,
                task_type: 'practice', topic_id: task.topic_id,
                description: `Practice 15 Advanced-level questions on ${task.topic_name}`, estimated_minutes: 40
              },
              {
                task_id: uuidv4(), plan_id: task.plan_id, week_number: task.week_number, day_number: 7,
                task_type: 'test', topic_id: task.topic_id,
                description: `Final Mastery Test on ${task.topic_name}`, estimated_minutes: 30
              }
            ];

            for (const nt of newTasks) {
              await query(
                `INSERT INTO plan_tasks (task_id, plan_id, week_number, day_number, task_type, description, estimated_minutes, topic_id)
                 VALUES (?,?,?,?,?,?,?,?)`,
                [nt.task_id, nt.plan_id, nt.week_number, nt.day_number,
                 nt.task_type, nt.description, nt.estimated_minutes, nt.topic_id || null]
              );
            }
            extensionTasks = newTasks;
          }
        }
      }
    }

    res.json({ message: 'Task marked complete', extended, extensionTasks });
  } catch (err) {
    next(err);
  }
};

/** GET /student/companies */
const getCompanies = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT company_id, name, logo_url, important_topics, test_pattern FROM companies ORDER BY name',
      []
    );
    res.json({ companies: result.rows });
  } catch (err) {
    next(err);
  }
};

/** GET /student/companies/:id */
const getCompanyById = async (req, res, next) => {
  try {
    const company = await query(
      'SELECT * FROM companies WHERE company_id = ?',
      [req.params.id]
    );

    if (company.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const papers = await query(
      'SELECT paper_id, year, file_url, round FROM past_papers WHERE company_id = ? ORDER BY year DESC',
      [req.params.id]
    );

    res.json({ company: company.rows[0], past_papers: papers.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /student/companies/:id/generate-questions */
const generateCompanyQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year } = req.body;

    if (!year || year < 2010 || year > new Date().getFullYear()) {
      return res.status(400).json({ error: 'Invalid year. Must be between 2010 and current year.' });
    }

    const company = await query('SELECT * FROM companies WHERE company_id = ?', [id]);
    if (company.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const co = company.rows[0];
    let topics = co.important_topics;
    if (typeof topics === 'string') {
      try { topics = JSON.parse(topics); } catch { topics = []; }
    }
    if (!Array.isArray(topics)) topics = [];

    const { generateCompanyYearQuestions } = require('../utils/aiQuestions');
    const questions = await generateCompanyYearQuestions({
      companyName: co.name,
      topics,
      year: parseInt(year),
      count: 25
    });

    res.json({ company: co.name, year: parseInt(year), questions });
  } catch (err) {
    next(err);
  }
};

/** POST /student/companies/:id/topic-questions */
const generateTopicQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { topic } = req.body;

    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const company = await query('SELECT name FROM companies WHERE company_id = ?', [id]);
    if (company.rows.length === 0) return res.status(404).json({ error: 'Company not found' });

    const { generateAIQuestions } = require('../utils/aiQuestions');
    const questions = await generateAIQuestions({
      topicName: topic,
      subjectName: `${company.rows[0].name} placement aptitude`,
      count: 5,
      difficulty: 'medium'
    });

    res.json({ topic, questions });
  } catch (err) {
    next(err);
  }
};

/** GET /student/leaderboard */
const getLeaderboard = async (req, res, next) => {
  try {
    const { scope = 'batch', subject_id } = req.query;
    const student_id = req.user.user_id;

    const result = await query(
      `SELECT u.user_id, u.name, u.college, u.branch,
              AVG(ta.accuracy_percent) as avg_accuracy,
              COUNT(ta.attempt_id) as total_tests,
              SUM(ta.score) as total_score,
              RANK() OVER (ORDER BY AVG(ta.accuracy_percent) DESC) as rank
       FROM users u
       LEFT JOIN test_attempts ta ON ta.student_id = u.user_id AND ta.status = 'submitted'
       WHERE u.role = 'student' AND u.is_active = 1
       GROUP BY u.user_id, u.name, u.college, u.branch
       ORDER BY rank ASC
       LIMIT 50`,
      []
    );

    res.json({ leaderboard: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /student/bookmarks */
const addBookmark = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { item_type, item_id } = req.body;
    await query(
      `INSERT IGNORE INTO bookmarks (bookmark_id, student_id, item_type, item_id)
       VALUES (?,?,?,?)`,
      [uuidv4(), req.user.user_id, item_type, item_id]
    );
    res.json({ message: 'Bookmarked' });
  } catch (err) {
    next(err);
  }
};

/** GET /student/bookmarks */
const getBookmarks = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM bookmarks WHERE student_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    );
    res.json({ bookmarks: result.rows });
  } catch (err) {
    next(err);
  }
};

/** DELETE /student/bookmarks/:id */
const removeBookmark = async (req, res, next) => {
  try {
    await query('DELETE FROM bookmarks WHERE bookmark_id=? AND student_id=?', [req.params.id, req.user.user_id]);
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    next(err);
  }
};

/** POST /student/doubts */
const postDoubt = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { question_text, subject_id, topic_id } = req.body;
    const doubt_id = uuidv4();
    await query(
      `INSERT INTO doubts (doubt_id, student_id, question_text, subject_id, topic_id, status)
       VALUES (?,?,?,?,?,'open')`,
      [doubt_id, req.user.user_id, question_text, subject_id || null, topic_id || null]
    );
    res.status(201).json({ doubt_id, message: 'Doubt posted' });
  } catch (err) {
    next(err);
  }
};

/** GET /student/doubts */
const getDoubts = async (req, res, next) => {
  try {
    const doubtsResult = await query(
      `SELECT d.*, t.name as topic_name
       FROM doubts d
       LEFT JOIN topics t ON t.topic_id = d.topic_id
       WHERE d.student_id = ?
       ORDER BY d.created_at DESC`,
      [req.user.user_id]
    );

    // Fetch answers for each doubt
    const doubts = doubtsResult.rows;
    for (const doubt of doubts) {
      const answersResult = await query(
        `SELECT da.answer_id, da.answer_text, da.is_best_answer, u.name as answered_by_name
         FROM doubt_answers da JOIN users u ON u.user_id = da.answered_by
         WHERE da.doubt_id = ?`,
        [doubt.doubt_id]
      );
      doubt.answers = answersResult.rows;
    }

    res.json({ doubts });
  } catch (err) {
    next(err);
  }
};

/** POST /student/doubts/:id/answers */
const answerDoubt = async (req, res, next) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { answer_text } = req.body;
    await query(
      `INSERT INTO doubt_answers (answer_id, doubt_id, answered_by, answer_text)
       VALUES (?,?,?,?)`,
      [uuidv4(), req.params.id, req.user.user_id, answer_text]
    );
    res.status(201).json({ message: 'Answer posted' });
  } catch (err) {
    next(err);
  }
};

/** GET /student/skills */
const getSkillProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ssp.*, t.name as topic_name, s.name as subject_name
       FROM student_skill_profile ssp
       JOIN topics t ON t.topic_id = ssp.topic_id
       JOIN subjects s ON s.subject_id = t.subject_id
       WHERE ssp.student_id = ?
       ORDER BY ssp.accuracy_percent ASC`,
      [req.user.user_id]
    );
    res.json({ skills: result.rows });
  } catch (err) {
    next(err);
  }
};

/** GET /student/subjects — subjects with their topics (for Practice page) */
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await query(
      'SELECT subject_id, name FROM subjects ORDER BY display_order, name',
      []
    );
    for (const s of subjects.rows) {
      const topics = await query(
        'SELECT topic_id, name FROM topics WHERE subject_id = ? ORDER BY name',
        [s.subject_id]
      );
      s.topics = topics.rows;
    }
    res.json({ subjects: subjects.rows });
  } catch (err) {
    next(err);
  }
};

/** GET /student/topics/:id/concepts */
const getConceptsByTopic = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT concept_id, name, description FROM concepts WHERE topic_id = ? ORDER BY name',
      [req.params.id]
    );
    res.json({ concepts: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AI-powered smart topics/concepts/materials
// ─────────────────────────────────────────────────────────────────────────────
const { generateTopicsForSubject, generateConceptsForTopic, generateStudyContent } = require('../utils/aiQuestions');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /student/smart-topics?subject_id=X
 * Returns topics from DB. If none exist, AI generates + saves them.
 */
const getSmartTopics = async (req, res, next) => {
  try {
    const { subject_id } = req.query;
    if (!subject_id) return res.status(400).json({ error: 'subject_id required' });

    // Get subject name
    const subjectResult = await query('SELECT name FROM subjects WHERE subject_id = ?', [subject_id]);
    if (subjectResult.rows.length === 0) return res.status(404).json({ error: 'Subject not found' });
    const subjectName = subjectResult.rows[0].name;

    // Get existing DB topics
    const existing = await query('SELECT topic_id, name FROM topics WHERE subject_id = ? ORDER BY name', [subject_id]);
    const dbTopics = existing.rows;

    // If DB has a healthy set of topics, return them directly
    if (dbTopics.length >= 5) {
      return res.json({ topics: dbTopics, source: 'db' });
    }

    // DB is empty or thin — call AI to fill in / supplement
    let aiTopicNames = [];
    try {
      aiTopicNames = await generateTopicsForSubject(subjectName);
    } catch {
      // If AI fails, return whatever we have in DB
      if (dbTopics.length > 0) return res.json({ topics: dbTopics, source: 'db' });
      throw new Error('AI topic generation failed and DB is empty');
    }

    const existingNames = new Set(dbTopics.map(t => t.name.toLowerCase()));
    const saved = [...dbTopics];
    for (const name of aiTopicNames) {
      if (existingNames.has(name.toLowerCase())) continue; // skip duplicates
      const topic_id = uuidv4();
      await query('INSERT IGNORE INTO topics (topic_id, subject_id, name) VALUES (?, ?, ?)', [topic_id, subject_id, name]);
      saved.push({ topic_id, name });
      existingNames.add(name.toLowerCase());
    }
    res.json({ topics: saved.sort((a, b) => a.name.localeCompare(b.name)), source: dbTopics.length > 0 ? 'db+ai' : 'ai' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /student/smart-concepts?topic_id=X
 * Returns concepts from DB. If none exist, AI generates + saves them.
 */
const getSmartConcepts = async (req, res, next) => {
  try {
    const { topic_id } = req.query;
    if (!topic_id) return res.status(400).json({ error: 'topic_id required' });

    // Get topic + subject name
    const topicResult = await query(
      `SELECT t.name as topic_name, s.name as subject_name
       FROM topics t JOIN subjects s ON s.subject_id = t.subject_id
       WHERE t.topic_id = ?`,
      [topic_id]
    );
    if (topicResult.rows.length === 0) return res.status(404).json({ error: 'Topic not found' });
    const { topic_name, subject_name } = topicResult.rows[0];

    // Get existing DB concepts
    const existing = await query('SELECT concept_id, name, description FROM concepts WHERE topic_id = ? ORDER BY name', [topic_id]);
    const dbConcepts = existing.rows;

    // If DB already has a good set of concepts, return them
    if (dbConcepts.length >= 4) {
      return res.json({ concepts: dbConcepts, source: 'db' });
    }

    // DB is empty or thin — supplement with AI
    let aiConceptNames = [];
    try {
      aiConceptNames = await generateConceptsForTopic(subject_name, topic_name);
    } catch {
      if (dbConcepts.length > 0) return res.json({ concepts: dbConcepts, source: 'db' });
      throw new Error('AI concept generation failed and DB is empty');
    }

    const existingNames = new Set(dbConcepts.map(c => c.name.toLowerCase()));
    const saved = [...dbConcepts];
    for (const name of aiConceptNames) {
      if (existingNames.has(name.toLowerCase())) continue;
      const concept_id = uuidv4();
      await query('INSERT IGNORE INTO concepts (concept_id, topic_id, name) VALUES (?, ?, ?)', [concept_id, topic_id, name]);
      saved.push({ concept_id, name });
      existingNames.add(name.toLowerCase());
    }
    res.json({ concepts: saved.sort((a, b) => a.name.localeCompare(b.name)), source: dbConcepts.length > 0 ? 'db+ai' : 'ai' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /student/materials/ai-generate
 * Body: { subject_id, topic_id, concept_id? }
 * Checks if AI materials exist → if not, generates + saves → returns them
 */
const aiGenerateMaterials = async (req, res, next) => {
  try {
    const { subject_id, topic_id, concept_id } = req.body;
    if (!subject_id || !topic_id) return res.status(400).json({ error: 'subject_id and topic_id required' });

    // Resolve names
    const subjectResult = await query('SELECT name FROM subjects WHERE subject_id = ?', [subject_id]);
    const topicResult   = await query('SELECT name FROM topics   WHERE topic_id   = ?', [topic_id]);
    if (subjectResult.rows.length === 0 || topicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Subject or topic not found' });
    }
    const subjectName = subjectResult.rows[0].name;
    const topicName   = topicResult.rows[0].name;
    let conceptName = null;
    if (concept_id) {
      const cr = await query('SELECT name FROM concepts WHERE concept_id = ?', [concept_id]);
      if (cr.rows.length > 0) conceptName = cr.rows[0].name;
    }

    // Check existing AI materials for this exact scope.
    // We identify AI materials by: uploaded_by IS NULL AND type IN ('shortcut','formula','video').
    // A shortcut entry existing for the scope means we already generated content.
    let scopeWhere = 'uploaded_by IS NULL AND type = ? AND topic_id = ? AND is_active = 1';
    const scopeParams = ['shortcut', topic_id];
    if (concept_id) { scopeWhere += ' AND concept_id = ?'; scopeParams.push(concept_id); }
    else { scopeWhere += ' AND concept_id IS NULL'; }

    const shortcutCheck = await query(
      `SELECT material_id FROM materials WHERE ${scopeWhere} LIMIT 1`,
      scopeParams
    );

    if (shortcutCheck.rows.length > 0) {
      // Return all AI materials for this scope
      let allWhere = 'uploaded_by IS NULL AND topic_id = ? AND is_active = 1';
      const allParams = [topic_id];
      if (concept_id) { allWhere += ' AND concept_id = ?'; allParams.push(concept_id); }
      else { allWhere += ' AND concept_id IS NULL'; }
      const allExisting = await query(
        `SELECT material_id, title, type, file_url, description FROM materials WHERE ${allWhere} ORDER BY type`,
        allParams
      );
      return res.json({ materials: allExisting.rows, source: 'db' });
    }

    // AI generate
    const aiContent = await generateStudyContent(subjectName, topicName, conceptName);

    // Save videos — aiContent.videos is [{url, videoId, thumbnail, query}]
    const resolvedVideos = Array.isArray(aiContent.videos) ? aiContent.videos.slice(0, 3) : [];
    const materialRows = [];

    // Columns that always exist in the materials table (no source column needed)
    const insertMaterial = async (mid, title, type, fileUrl, description) => {
      await query(
        `INSERT INTO materials (material_id, title, type, file_url, description, subject_id, topic_id, concept_id, visibility, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'public', 1)`,
        [mid, title, type, fileUrl, description, subject_id, topic_id, concept_id || null]
      );
    };

    for (let i = 0; i < resolvedVideos.length; i++) {
      const v = resolvedVideos[i];
      const mid = uuidv4();
      const title = `${topicName} – Video ${i + 1}`;
      await insertMaterial(mid, title, 'video', v.url, v.query || '');
      materialRows.push({ material_id: mid, title, type: 'video', file_url: v.url, description: v.query || '' });
    }

    // Save shortcut sheet
    const shortcutId = uuidv4();
    const shortcutTitle = aiContent.shortcuts_title || `${topicName} – Quick Tricks`;
    await insertMaterial(shortcutId, shortcutTitle, 'shortcut', '#', aiContent.shortcuts || '');
    materialRows.push({ material_id: shortcutId, title: shortcutTitle, type: 'shortcut', file_url: '#', description: aiContent.shortcuts || '' });

    // Save formula sheet
    const formulaId = uuidv4();
    const formulaTitle = aiContent.formulas_title || `${topicName} – Formula Sheet`;
    await insertMaterial(formulaId, formulaTitle, 'formula', '#', aiContent.formulas || '');
    materialRows.push({ material_id: formulaId, title: formulaTitle, type: 'formula', file_url: '#', description: aiContent.formulas || '' });

    res.json({ materials: materialRows, source: 'ai' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /student/materials/:id
 * Only allows deleting AI-generated materials
 */
const deleteAIMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Only soft-delete materials that have no uploaded_by (i.e. AI-generated, not admin-uploaded)
    await query(
      `UPDATE materials SET is_active = 0 WHERE material_id = ? AND uploaded_by IS NULL`,
      [id]
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

/** GET /student/practice/sessions — list student's practice sessions */
const getPracticeSessions = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;
    const result = await query(
      `SELECT session_id, title, method, config, status, score, accuracy_percent,
              started_at, submitted_at,
              JSON_LENGTH(question_ids) AS total_questions
       FROM practice_sessions
       WHERE student_id = ?
       ORDER BY started_at DESC
       LIMIT 50`,
      [student_id]
    );
    res.json({ sessions: result.rows });
  } catch (err) { next(err); }
};

/** DELETE /student/practice/sessions/:id */
const deletePracticeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student_id = req.user.user_id;
    // Verify ownership
    const sess = await query(
      'SELECT question_ids FROM practice_sessions WHERE session_id = ? AND student_id = ?',
      [id, student_id]
    );
    if (sess.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    // Delete AI-generated questions that belonged only to this session
    const rawQids = sess.rows[0].question_ids;
    const qids = Array.isArray(rawQids) ? rawQids : JSON.parse(rawQids || '[]');
    if (qids.length > 0) {
      const placeholders = qids.map(() => '?').join(',');
      await query(
        `DELETE FROM questions WHERE question_id IN (${placeholders}) AND source = 'ai_generated'`,
        qids
      );
    }
    await query('DELETE FROM practice_sessions WHERE session_id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

/** DELETE /student/reports/:id */
const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student_id = req.user.user_id;

    // Check if it's a practice session first
    const sess = await query(
      'SELECT question_ids FROM practice_sessions WHERE session_id = ? AND student_id = ?',
      [id, student_id]
    );

    if (sess.rows.length > 0) {
      const rawQids = sess.rows[0].question_ids;
      const qids = Array.isArray(rawQids) ? rawQids : JSON.parse(rawQids || '[]');
      if (qids.length > 0) {
        const placeholders = qids.map(() => '?').join(',');
        await query(
          `DELETE FROM questions WHERE question_id IN (${placeholders}) AND source = 'ai_generated'`,
          qids
        );
      }
      await query('DELETE FROM practice_sessions WHERE session_id = ? AND student_id = ?', [id, student_id]);
      return res.json({ success: true, message: 'Practice session deleted successfully' });
    }

    // Otherwise, try deleting the test attempt
    await query(
      'DELETE FROM test_attempts WHERE attempt_id = ? AND student_id = ?',
      [id, student_id]
    );

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/** DELETE /student/reports */
const deleteAllReports = async (req, res, next) => {
  try {
    const student_id = req.user.user_id;

    // Get all practice sessions for the student to clean up AI questions
    const sessions = await query(
      'SELECT session_id, question_ids FROM practice_sessions WHERE student_id = ?',
      [student_id]
    );

    let allQids = [];
    for (const sess of sessions.rows) {
      const rawQids = sess.question_ids;
      const qids = Array.isArray(rawQids) ? rawQids : JSON.parse(rawQids || '[]');
      allQids.push(...qids);
    }

    if (allQids.length > 0) {
      const placeholders = allQids.map(() => '?').join(',');
      await query(
        `DELETE FROM questions WHERE question_id IN (${placeholders}) AND source = 'ai_generated'`,
        allQids
      );
    }

    // Delete all practice sessions
    await query('DELETE FROM practice_sessions WHERE student_id = ?', [student_id]);

    // Delete all test attempts
    await query('DELETE FROM test_attempts WHERE student_id = ?', [student_id]);

    res.json({ success: true, message: 'All reports deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/** POST /student/practice/syllabus-extract — upload file, AI extracts topics */
const syllabusExtractTopics = async (req, res, next) => {
  try {
    const { callAI } = require('../utils/aiQuestions');
    const fileBuffer = req.file?.buffer;
    const fileName   = req.file?.originalname || '';
    if (!fileBuffer) return res.status(400).json({ error: 'No file uploaded' });

    // Simple text extraction: works for .txt, and text-based PDFs
    let rawText = '';
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      // Extract printable ASCII text from PDF binary (works for text-based PDFs)
      rawText = fileBuffer.toString('latin1').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').slice(0, 4000);
    } else {
      rawText = fileBuffer.toString('utf8').slice(0, 4000);
    }

    const prompt = `You are an expert in Indian placement exam preparation.

Given this text from a student's syllabus or study document, extract a list of aptitude/reasoning/verbal topics that match placement exam topics (Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation).

Text: """${rawText}"""

Return ONLY a valid JSON array of topic name strings. Pick up to 15 most relevant topics:
["Topic 1", "Topic 2", ...]

Rules:
- Map to standard placement exam topic names (e.g. "Percentages", "Number System", "Blood Relations")
- If no relevant topics found, return common topics: ["Number System", "Percentages", "Logical Sequences"]
- Return ONLY the JSON array`;

    // We need the callAI function from the module
    const aiModule = require('../utils/aiQuestions');
    const content = await aiModule.generateTopicsForSubject.__proto__.constructor === Function
      ? await (async () => {
          const cerebrasKey = (process.env.CEREBRAS_API_KEY || '').trim();
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 30000);
          const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST', signal: controller.signal,
            headers: { 'Authorization': `Bearer ${cerebrasKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'llama3.1-8b', messages: [{ role: 'user', content: prompt }], temperature: 0.5, max_tokens: 1000 }),
          });
          clearTimeout(timer);
          if (!response.ok) throw new Error(`API ${response.status}`);
          const data = await response.json();
          return data.choices?.[0]?.message?.content || '';
        })()
      : '';

    // Parse JSON array from response
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const m = cleaned.match(/\[[\s\S]*\]/);
    const topics = m ? JSON.parse(m[0]) : ["Number System", "Percentages", "Logical Sequences", "Time and Work", "Blood Relations"];

    res.json({ topics: Array.isArray(topics) ? topics.filter(Boolean).slice(0, 15) : [] });
  } catch (err) { next(err); }
};

module.exports = {
  getDashboard, getMaterials, getMaterialById, markLearned, bookmarkMaterial,
  getNotes, startPractice, submitPracticeAnswer, endPractice,
  getPracticeSessions, deletePracticeSession, syllabusExtractTopics,
  getAssignedTests, startTest, saveTestAnswer, submitTest, reportViolation,
  getReports, getReportById, deleteReport, deleteAllReports, generatePlan, getCurrentPlan, completeTask,
  getCompanies, getCompanyById, generateCompanyQuestions, generateTopicQuestions, getLeaderboard,
  addBookmark, getBookmarks, removeBookmark,
  postDoubt, getDoubts, answerDoubt, getSkillProfile, getSubjects, getConceptsByTopic,
  getSmartTopics, getSmartConcepts, aiGenerateMaterials, deleteAIMaterial
};
