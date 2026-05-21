const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/** GET /admin/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const [students, activeToday, testsThisWeek, avgScore] = await Promise.all([
      query("SELECT COUNT(*) as count FROM users WHERE role='student' AND is_active=1"),
      // Active today = any student who: logged in OR took a test OR ran a practice session in the last 24h.
      query(`
        SELECT COUNT(*) as count FROM users u
        WHERE u.role='student' AND u.is_active=1
          AND (
            u.last_login > NOW() - INTERVAL 24 HOUR
            OR EXISTS (SELECT 1 FROM test_attempts ta WHERE ta.student_id=u.user_id AND ta.started_at > NOW() - INTERVAL 24 HOUR)
            OR EXISTS (SELECT 1 FROM practice_sessions ps WHERE ps.student_id=u.user_id AND ps.started_at > NOW() - INTERVAL 24 HOUR)
          )
      `),
      // Tests this week = test attempts submitted in the last 7 days.
      query(`
        SELECT COUNT(*) as count FROM test_attempts
        WHERE status='submitted' AND submitted_at > NOW() - INTERVAL 7 DAY
      `),
      query("SELECT ROUND(AVG(accuracy_percent),2) as avg_score FROM test_attempts WHERE submitted_at > NOW() - INTERVAL 30 DAY AND status='submitted'"),
    ]);

    const topPerformers = await query(
      `SELECT u.user_id, u.name, ROUND(AVG(ta.accuracy_percent),1) as avg_score,
              ROUND(AVG(ta.accuracy_percent),1) as avg_accuracy,
              COUNT(ta.attempt_id) as test_count
       FROM users u JOIN test_attempts ta ON ta.student_id = u.user_id
       WHERE ta.submitted_at > NOW() - INTERVAL 30 DAY AND ta.status='submitted'
       GROUP BY u.user_id, u.name
       ORDER BY avg_accuracy DESC LIMIT 5`
    );

    const recentViolations = await query(
      `SELECT v.violation_id, v.violation_type, v.occurred_at, u.name as student_name
       FROM violations v
       JOIN users u ON u.user_id = v.student_id
       ORDER BY v.occurred_at DESC LIMIT 5`
    );

    // 7-day activity trend: tests submitted + practice sessions completed per day.
    const activityTrend = await query(`
      SELECT
        DATE(d.day) as day,
        COALESCE(SUM(CASE WHEN ta.attempt_id IS NOT NULL THEN 1 ELSE 0 END), 0) as tests,
        COALESCE(SUM(CASE WHEN ps.session_id IS NOT NULL THEN 1 ELSE 0 END), 0) as practices
      FROM (
        SELECT CURDATE() - INTERVAL 6 DAY as day UNION ALL
        SELECT CURDATE() - INTERVAL 5 DAY UNION ALL
        SELECT CURDATE() - INTERVAL 4 DAY UNION ALL
        SELECT CURDATE() - INTERVAL 3 DAY UNION ALL
        SELECT CURDATE() - INTERVAL 2 DAY UNION ALL
        SELECT CURDATE() - INTERVAL 1 DAY UNION ALL
        SELECT CURDATE()
      ) d
      LEFT JOIN test_attempts ta
        ON DATE(ta.submitted_at) = DATE(d.day) AND ta.status='submitted'
      LEFT JOIN practice_sessions ps
        ON DATE(ps.submitted_at) = DATE(d.day)
      GROUP BY DATE(d.day)
      ORDER BY day
    `);

    // At-risk students: low accuracy OR no recent activity (no login in 7 days).
    const atRiskStudents = await query(`
      SELECT u.user_id, u.name, u.email, u.last_login, u.created_at,
             COALESCE((SELECT ROUND(AVG(ta.accuracy_percent),1) FROM test_attempts ta
                        WHERE ta.student_id=u.user_id AND ta.status='submitted'), 0) as avg_score,
             COALESCE((SELECT COUNT(*) FROM test_attempts ta
                        WHERE ta.student_id=u.user_id AND ta.status='submitted'), 0) as tests_taken,
             CASE
               WHEN u.last_login IS NULL THEN 'never_logged_in'
               WHEN u.last_login < NOW() - INTERVAL 7 DAY THEN 'inactive_7d'
               ELSE 'low_score'
             END as risk_reason
      FROM users u
      WHERE u.role='student' AND u.is_active=1
        AND (
          u.last_login IS NULL
          OR u.last_login < NOW() - INTERVAL 7 DAY
          OR EXISTS (
            SELECT 1 FROM test_attempts ta
            WHERE ta.student_id=u.user_id AND ta.status='submitted'
            GROUP BY ta.student_id
            HAVING AVG(ta.accuracy_percent) < 50
          )
        )
      ORDER BY (u.last_login IS NULL) DESC, u.last_login ASC
      LIMIT 5
    `);

    // Weak topics across the platform — lowest average accuracy.
    const weakTopics = await query(`
      SELECT t.topic_id, t.name as topic_name, s.name as subject_name,
             ROUND(AVG(ssp.accuracy_percent),1) as avg_accuracy,
             COUNT(DISTINCT ssp.student_id) as student_count
      FROM student_skill_profile ssp
      JOIN topics t ON t.topic_id = ssp.topic_id
      JOIN subjects s ON s.subject_id = t.subject_id
      GROUP BY t.topic_id, t.name, s.name
      HAVING student_count >= 1
      ORDER BY avg_accuracy ASC
      LIMIT 5
    `);

    // Recent activity feed — newest test submissions & practice sessions.
    const [recentTests, recentPractice] = await Promise.all([
      query(`
        SELECT 'test' as kind, u.name as student_name, t.title as detail,
               ta.accuracy_percent as score, ta.submitted_at as at
        FROM test_attempts ta
        JOIN users u ON u.user_id = ta.student_id
        JOIN tests t ON t.test_id = ta.test_id
        WHERE ta.status='submitted'
        ORDER BY ta.submitted_at DESC LIMIT 10
      `),
      query(`
        SELECT 'practice' as kind, u.name as student_name,
               COALESCE(ps.config_json->>'$.title', 'Practice session') as detail,
               ps.accuracy_percent as score, ps.submitted_at as at
        FROM practice_sessions ps
        JOIN users u ON u.user_id = ps.student_id
        WHERE ps.submitted_at IS NOT NULL
        ORDER BY ps.submitted_at DESC LIMIT 10
      `).catch(() => ({ rows: [] })), // config_json may not exist on older schemas
    ]);
    const recentActivity = [...recentTests.rows, ...recentPractice.rows]
      .filter(r => r.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 8);

    res.json({
      stats: {
        total_students: parseInt(students.rows[0].count),
        active_today: parseInt(activeToday.rows[0].count),
        tests_this_week: parseInt(testsThisWeek.rows[0].count),
        avg_score_30d: parseFloat(avgScore.rows[0].avg_score) || 0,
      },
      total_students: parseInt(students.rows[0].count),
      active_today: parseInt(activeToday.rows[0].count),
      tests_this_week: parseInt(testsThisWeek.rows[0].count),
      avg_score: parseFloat(avgScore.rows[0].avg_score) || 0,
      top_performers: topPerformers.rows,
      recent_violations: recentViolations.rows,
      activity_trend: activityTrend.rows,
      at_risk_students: atRiskStudents.rows,
      weak_topics: weakTopics.rows,
      recent_activity: recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/users */
const getUsers = async (req, res, next) => {
  try {
    const { role, batch_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE u.is_active = 1';
    const params = [];

    if (role) { where += ' AND u.role = ?'; params.push(role); }
    if (batch_id) { where += ' AND u.batch_id = ?'; params.push(batch_id); }
    if (search) { where += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const users = await query(
      `SELECT u.user_id, u.name, u.email, u.role, u.college, u.branch, u.year,
              u.is_verified, u.created_at, u.last_login, b.name as batch_name
       FROM users u LEFT JOIN batches b ON b.batch_id = u.batch_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ users: users.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/users */
const createUser = async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, email, password, role, college, branch, year, batch_id } = req.body;
    const existing = await query('SELECT user_id FROM users WHERE email=?', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already exists' });

    const password_hash = await bcrypt.hash(password || 'Welcome@123', 12);
    const user_id = uuidv4();
    await query(
      `INSERT INTO users (user_id,name,email,password_hash,role,college,branch,year,batch_id,is_verified)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [user_id, name, email, password_hash, role || 'student', college, branch, year, batch_id]
    );
    // Audit log
    await logAudit(req.user.user_id, 'CREATE', 'user', user_id);
    res.status(201).json({ user_id, message: 'User created' });
  } catch (err) {
    next(err);
  }
};

/** PUT /admin/users/:id */
const updateUser = async (req, res, next) => {
  try {
    const { name, college, branch, year, batch_id, is_active, role } = req.body;
    await query(
      `UPDATE users SET name=COALESCE(?,name), college=COALESCE(?,college),
       branch=COALESCE(?,branch), year=COALESCE(?,year), batch_id=COALESCE(?,batch_id),
       is_active=COALESCE(?,is_active), role=COALESCE(?,role)
       WHERE user_id=?`,
      [name, college, branch, year, batch_id, is_active, role, req.params.id]
    );
    await logAudit(req.user.user_id, 'UPDATE', 'user', req.params.id);
    res.json({ message: 'User updated' });
  } catch (err) {
    next(err);
  }
};

/** DELETE /admin/users/:id (soft delete) */
const deleteUser = async (req, res, next) => {
  try {
    await query('UPDATE users SET is_active=0 WHERE user_id=?', [req.params.id]);
    await logAudit(req.user.user_id, 'DELETE', 'user', req.params.id);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/batches */
const getBatches = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM users u WHERE u.batch_id = b.batch_id AND u.role='student') as student_count
       FROM batches b ORDER BY b.created_at DESC`
    );
    res.json({ batches: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/batches */
const createBatch = async (req, res, next) => {
  try {
    const { name, college, year } = req.body;
    const batch_id = uuidv4();
    await query(
      'INSERT INTO batches (batch_id,name,college,year,created_by) VALUES (?,?,?,?,?)',
      [batch_id, name, college, year, req.user.user_id]
    );
    res.status(201).json({ batch_id, message: 'Batch created' });
  } catch (err) {
    next(err);
  }
};

/** PUT /admin/batches/:id */
const updateBatch = async (req, res, next) => {
  try {
    const { name, college, year } = req.body;
    await query('UPDATE batches SET name=COALESCE(?,name),college=COALESCE(?,college),year=COALESCE(?,year) WHERE batch_id=?',
      [name, college, year, req.params.id]);
    res.json({ message: 'Batch updated' });
  } catch (err) {
    next(err);
  }
};

/** DELETE /admin/batches/:id */
const deleteBatch = async (req, res, next) => {
  try {
    await query('DELETE FROM batches WHERE batch_id=?', [req.params.id]);
    res.json({ message: 'Batch deleted' });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/tests */
const getTests = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT t.*, u.name as created_by_name,
              (SELECT COUNT(*) FROM test_questions tq WHERE tq.test_id = t.test_id) as question_count
       FROM tests t LEFT JOIN users u ON u.user_id = t.created_by
       ORDER BY t.created_at DESC`
    );
    res.json({ tests: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/tests */
const createTest = async (req, res, next) => {
  try {
    const {
      title, description, mode, duration_minutes, total_marks, marking_scheme,
      shuffle_questions, shuffle_options, proctoring_config, start_time, end_time,
      assigned_to, questions
    } = req.body;

    const test_id = uuidv4();
    await query(
      `INSERT INTO tests (test_id,title,description,mode,duration_minutes,total_marks,
       marking_scheme,shuffle_questions,shuffle_options,proctoring_config,
       start_time,end_time,assigned_to,created_by,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft')`,
      [test_id, title, description, mode || 'practice', duration_minutes, total_marks,
       JSON.stringify(marking_scheme || { correct: 1, wrong: -0.25 }),
       shuffle_questions ? 1 : 0, shuffle_options ? 1 : 0,
       JSON.stringify(proctoring_config || { fullscreen: true, tab_switch_limit: 3, webcam: false }),
       start_time || null, end_time || null, JSON.stringify(assigned_to || { batch_ids: [], student_ids: [] }),
       req.user.user_id]
    );

    // Add questions — always insert as new (frontend IDs like ai_xxx / manual_xxx are not DB IDs)
    const questionCount = questions && questions.length > 0 ? questions.length : 0;
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const question_id = uuidv4();
        const source = (q.question_id && String(q.question_id).startsWith('ai_')) ? 'ai_generated' : 'manual';
        await query(
          `INSERT INTO questions (question_id,question_text,question_type,options,correct_answer,
           explanation,difficulty,concept_id,source,created_by)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [question_id, q.question_text, q.question_type || 'mcq',
           JSON.stringify(q.options), q.correct_answer, q.explanation || null,
           q.difficulty || 3, q.concept_id || null, source, req.user.user_id]
        );
        await query(
          'INSERT INTO test_questions (test_id,question_id,display_order,marks) VALUES (?,?,?,?)',
          [test_id, question_id, i + 1, q.marks || marking_scheme?.correct || 1]
        );
      }
    }

    // Calculate total_marks from questions
    const computedTotalMarks = questionCount * (marking_scheme?.correct || 1);

    // Update total_marks now that we know question count
    await query('UPDATE tests SET total_marks=? WHERE test_id=?', [computedTotalMarks, test_id]);

    await logAudit(req.user.user_id, 'CREATE', 'test', test_id);

    const created = await query(
      `SELECT t.*, u.name as created_by_name,
              (SELECT COUNT(*) FROM test_questions tq WHERE tq.test_id = t.test_id) as question_count
       FROM tests t LEFT JOIN users u ON u.user_id = t.created_by WHERE t.test_id = ?`,
      [test_id]
    );
    res.status(201).json({ test: created.rows[0], test_id, message: 'Test created' });
  } catch (err) {
    next(err);
  }
};

/** PUT /admin/tests/:id */
const updateTest = async (req, res, next) => {
  try {
    const { title, description, mode, duration_minutes, start_time, end_time, assigned_to } = req.body;
    await query(
      `UPDATE tests SET title=COALESCE(?,title),description=COALESCE(?,description),
       mode=COALESCE(?,mode),duration_minutes=COALESCE(?,duration_minutes),
       start_time=COALESCE(?,start_time),end_time=COALESCE(?,end_time),
       assigned_to=COALESCE(?,assigned_to)
       WHERE test_id=?`,
      [title, description, mode, duration_minutes, start_time, end_time,
       assigned_to ? JSON.stringify(assigned_to) : null, req.params.id]
    );
    await logAudit(req.user.user_id, 'UPDATE', 'test', req.params.id);
    res.json({ message: 'Test updated' });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/tests/:id/publish */
const publishTest = async (req, res, next) => {
  try {
    const status = req.body.schedule_for ? 'scheduled' : 'live';
    await query("UPDATE tests SET status=? WHERE test_id=?", [status, req.params.id]);
    await logAudit(req.user.user_id, 'PUBLISH', 'test', req.params.id);
    res.json({ message: `Test ${status}` });
  } catch (err) {
    next(err);
  }
};

/** DELETE /admin/tests/:id */
const deleteTest = async (req, res, next) => {
  try {
    await query('UPDATE tests SET status=? WHERE test_id=?', ['archived', req.params.id]);
    res.json({ message: 'Test archived' });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/tests/ai-generate */
const aiGenerateQuestions = async (req, res, next) => {
  try {
    const { topic, subject, concept, num_questions = 5, difficulty = 'medium' } = req.body;
    const apiKey = process.env.SAMBANOVA_API_KEY;

    if (apiKey) {
      let prompt = `Generate ${num_questions} multiple choice questions on the topic '${topic}' under '${subject}'.`;
      if (concept) {
        prompt = `Generate ${num_questions} multiple choice questions on the concept '${concept}' under the topic '${topic}' of subject '${subject}'.`;
      }
      prompt += ` Difficulty: ${difficulty}. Return only a JSON array, no markdown. Each element: {"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct_index":0,"explanation":"...","difficulty":"${difficulty}","estimated_time_seconds":60}`;

      const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'DeepSeek-V3-0324',
          stream: false,
          messages: [
            { role: 'system', content: 'You are an aptitude question generator. Return only valid JSON arrays.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`SambaNova API error: ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices[0].message.content.trim();
      // Strip markdown code fences if present
      content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

      let questions;
      try {
        questions = JSON.parse(content);
      } catch {
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }

      return res.json({ questions });
    }

    // Demo response when no API key
    const demoQuestions = Array.from({ length: num_questions }, (_, i) => ({
      question: `Sample question ${i + 1} on ${concept ? `${concept} (${topic})` : topic}: What is the correct answer?`,
      options: ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
      correct_index: 0,
      correct_answer: 'A',
      explanation: `This is the explanation for question ${i + 1}.`,
      difficulty,
      estimated_time_seconds: 60,
    }));

    res.json({ questions: demoQuestions, note: 'Demo questions — add SAMBANOVA_API_KEY for AI generation' });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/questions */
const getQuestions = async (req, res, next) => {
  try {
    const { subject_id, topic_id, concept_id, difficulty, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE q.is_active = 1';
    const params = [];

    if (topic_id) { where += ' AND c.topic_id = ?'; params.push(topic_id); }
    if (concept_id) { where += ' AND q.concept_id = ?'; params.push(concept_id); }
    if (difficulty) { where += ' AND q.difficulty = ?'; params.push(parseInt(difficulty)); }
    if (search) { where += ' AND q.question_text LIKE ?'; params.push(`%${search}%`); }

    const result = await query(
      `SELECT q.question_id, q.question_text, q.question_type, q.difficulty, q.source,
              q.created_at, c.name as concept_name, t.name as topic_name, s.name as subject_name
       FROM questions q
       JOIN concepts c ON c.concept_id = q.concept_id
       JOIN topics t ON t.topic_id = c.topic_id
       JOIN subjects s ON s.subject_id = t.subject_id
       ${where}
       ORDER BY q.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ questions: result.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/questions */
const createQuestion = async (req, res, next) => {
  try {
    const { question_text, question_type, options, correct_answer, explanation, difficulty, concept_id, company_tags } = req.body;
    const question_id = uuidv4();
    await query(
      `INSERT INTO questions (question_id,question_text,question_type,options,correct_answer,
       explanation,difficulty,concept_id,company_tags,source,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,'manual',?)`,
      [question_id, question_text, question_type || 'mcq', JSON.stringify(options),
       correct_answer, explanation, difficulty || 3, concept_id,
       JSON.stringify(company_tags || []), req.user.user_id]
    );
    res.status(201).json({ question_id, message: 'Question created' });
  } catch (err) {
    next(err);
  }
};

/** PUT /admin/questions/:id */
const updateQuestion = async (req, res, next) => {
  try {
    const { question_text, options, correct_answer, explanation, difficulty } = req.body;
    await query(
      `UPDATE questions SET question_text=COALESCE(?,question_text),
       options=COALESCE(?,options),correct_answer=COALESCE(?,correct_answer),
       explanation=COALESCE(?,explanation),difficulty=COALESCE(?,difficulty)
       WHERE question_id=?`,
      [question_text, options ? JSON.stringify(options) : null, correct_answer, explanation, difficulty, req.params.id]
    );
    res.json({ message: 'Question updated' });
  } catch (err) {
    next(err);
  }
};

/** DELETE /admin/questions/:id */
const deleteQuestion = async (req, res, next) => {
  try {
    await query('UPDATE questions SET is_active=0 WHERE question_id=?', [req.params.id]);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/materials */
const getMaterials = async (req, res, next) => {
  try {
    const { topic_id, type } = req.query;
    const conditions = ['m.is_active = 1'];
    const params = [];
    if (topic_id) { conditions.push('m.topic_id = ?'); params.push(topic_id); }
    if (type)     { conditions.push('m.type = ?');     params.push(type); }
    const where = conditions.join(' AND ');
    const result = await query(
      `SELECT m.*, u.name as uploaded_by_name, s.name as subject_name, t.name as topic_name
       FROM materials m LEFT JOIN users u ON u.user_id = m.uploaded_by
       LEFT JOIN subjects s ON s.subject_id = m.subject_id
       LEFT JOIN topics t ON t.topic_id = m.topic_id
       WHERE ${where}
       ORDER BY m.created_at DESC`,
      params
    );
    res.json({ materials: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/materials */
const uploadMaterial = async (req, res, next) => {
  try {
    const { title, type, file_url, description, subject_id, topic_id, concept_id, visibility, download_allowed, target_batch_id } = req.body;
    const material_id = uuidv4();
    await query(
      `INSERT INTO materials (material_id,title,type,file_url,description,subject_id,topic_id,
       concept_id,uploaded_by,visibility,download_allowed,target_batch_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [material_id, title, type, file_url, description, subject_id, topic_id, concept_id,
       req.user.user_id, visibility || 'public', download_allowed !== false ? 1 : 0, target_batch_id]
    );
    res.status(201).json({ material_id, message: 'Material uploaded' });
  } catch (err) {
    next(err);
  }
};

/** PUT /admin/materials/:id */
const updateMaterial = async (req, res, next) => {
  try {
    const { title, description, visibility, download_allowed } = req.body;
    await query(
      `UPDATE materials SET title=COALESCE(?,title),description=COALESCE(?,description),
       visibility=COALESCE(?,visibility),download_allowed=COALESCE(?,download_allowed)
       WHERE material_id=?`,
      [title, description, visibility, download_allowed, req.params.id]
    );
    res.json({ message: 'Material updated' });
  } catch (err) {
    next(err);
  }
};

/** DELETE /admin/materials/:id */
const deleteMaterial = async (req, res, next) => {
  try {
    await query('UPDATE materials SET is_active=0 WHERE material_id=?', [req.params.id]);
    res.json({ message: 'Material deleted' });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/reports/tests/:id */
const getTestReport = async (req, res, next) => {
  try {
    const attempts = await query(
      `SELECT ta.attempt_id, u.name as student_name, u.email, ta.score, ta.total_marks,
              ta.accuracy_percent, ta.time_taken_seconds, ta.submitted_at, ta.violations_count,
              RANK() OVER (ORDER BY ta.score DESC) as rank
       FROM test_attempts ta JOIN users u ON u.user_id = ta.student_id
       WHERE ta.test_id = ? AND ta.status = 'submitted'
       ORDER BY ta.score DESC`,
      [req.params.id]
    );

    const rows = attempts.rows.map(a => ({
      ...a,
      percentage: a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : Math.round(a.accuracy_percent || 0)
    }));

    const total_attempts = rows.length;
    const avg_score = total_attempts > 0 ? rows.reduce((s, a) => s + a.percentage, 0) / total_attempts : 0;
    const max_score = total_attempts > 0 ? Math.max(...rows.map(a => a.percentage)) : 0;

    res.json({ students: rows, attempts: rows, total_attempts, avg_score, max_score });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/reports/students/:id */
const getStudentReport = async (req, res, next) => {
  try {
    const sid = req.params.id;
    const [testAttempts, practiceSessions, skills] = await Promise.all([
      query(
        `SELECT ta.attempt_id as id, t.title, 'test' as type, t.mode, t.test_id,
                ta.score, ta.total_marks, ta.accuracy_percent,
                ta.time_taken_seconds, ta.submitted_at, ta.violations_count,
                creator.name as assigned_by_name,
                (
                  SELECT COUNT(*) FROM test_attempts ta2
                  WHERE ta2.student_id = ta.student_id AND ta2.test_id = ta.test_id
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
         LEFT JOIN users creator ON creator.user_id = t.created_by
         WHERE ta.student_id = ? AND ta.status = 'submitted'
         ORDER BY ta.submitted_at DESC`,
        [sid]
      ),
      query(
        `SELECT ps.session_id as id, COALESCE(ps.title, 'Practice Session') as title,
                'practice' as type, 'practice' as mode, NULL as test_id,
                ps.score,
                (SELECT COUNT(*) FROM practice_answers pa WHERE pa.session_id = ps.session_id) as total_marks,
                ps.accuracy_percent,
                NULL as time_taken_seconds, ps.submitted_at, 0 as violations_count,
                u.name as assigned_by_name,
                (
                  SELECT COUNT(*) FROM practice_sessions ps2
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
         WHERE ps.student_id = ? AND ps.status = 'completed'
         ORDER BY ps.submitted_at DESC`,
        [sid]
      ),
      query(
        `SELECT ssp.accuracy_percent as avg_score, ssp.total_attempts, ssp.correct_count,
                ssp.is_weak, t.name as topic_name, s.name as subject_name
         FROM student_skill_profile ssp
         JOIN topics t ON t.topic_id = ssp.topic_id
         JOIN subjects s ON s.subject_id = t.subject_id
         WHERE ssp.student_id = ?
         ORDER BY ssp.accuracy_percent ASC`,
        [sid]
      )
    ]);

    const all = [...testAttempts.rows, ...practiceSessions.rows]
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
      .map(a => ({
        ...a,
        percentage: a.total_marks > 0
          ? Math.round((a.score / a.total_marks) * 100)
          : Math.round(a.accuracy_percent || 0)
      }));

    res.json({ attempts: all, skills: skills.rows });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/plans/:student_id */
const getStudentPlan = async (req, res, next) => {
  try {
    const planResult = await query(
      `SELECT * FROM study_plans WHERE student_id = ? AND status = 'active' LIMIT 1`,
      [req.params.student_id]
    );
    const plan = planResult.rows[0] || null;
    if (plan) {
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
    }
    res.json({ plan });
  } catch (err) {
    next(err);
  }
};

/** PUT /admin/plans/:plan_id */
const updatePlan = async (req, res, next) => {
  try {
    const { status, tasks_to_add, tasks_to_remove } = req.body;
    if (status) await query('UPDATE study_plans SET status=? WHERE plan_id=?', [status, req.params.plan_id]);
    if (tasks_to_remove && tasks_to_remove.length > 0) {
      await query('DELETE FROM plan_tasks WHERE task_id IN (?)', [tasks_to_remove]);
    }
    if (tasks_to_add && tasks_to_add.length > 0) {
      for (const t of tasks_to_add) {
        await query(
          'INSERT INTO plan_tasks (task_id,plan_id,week_number,day_number,task_type,description,estimated_minutes,content,url) VALUES (?,?,?,?,?,?,?,?,?)',
          [uuidv4(), req.params.plan_id, t.week_number, t.day_number, t.task_type, t.description, t.estimated_minutes, t.content || null, t.url || null]
        );
      }
    }
    res.json({ message: 'Plan updated' });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/plans/:student_id/generate */
const adminGeneratePlan = async (req, res, next) => {  try {
    const { student_id } = req.params;

    // Verify student exists
    const studentCheck = await query('SELECT user_id, name FROM users WHERE user_id=? AND role="student"', [student_id]);
    if (!studentCheck.rows.length) return res.status(404).json({ message: 'Student not found' });

    let targetTopics = [];
    const weakTopics = await query(
      `SELECT ssp.topic_id, t.name as topic_name, ssp.accuracy_percent
       FROM student_skill_profile ssp
       JOIN topics t ON t.topic_id = ssp.topic_id
       WHERE ssp.student_id = ? AND ssp.is_weak = 1
       ORDER BY ssp.accuracy_percent ASC LIMIT 5`,
      [student_id]
    );
    targetTopics = weakTopics.rows;

    if (targetTopics.length === 0) {
      const fallbackTopics = await query(
        `SELECT topic_id, name as topic_name FROM topics ORDER BY RAND() LIMIT 3`, []
      );
      targetTopics = fallbackTopics.rows;
    }

    // Archive existing active plans
    await query("UPDATE study_plans SET status='archived' WHERE student_id=? AND status='active'", [student_id]);

    const plan_id = uuidv4();
    const duration_weeks = Math.min(targetTopics.length, 4);
    await query(
      `INSERT INTO study_plans (plan_id, student_id, generated_at, duration_weeks, status, source)
       VALUES (?,?,NOW(),?,'active','admin_custom')`,
      [plan_id, student_id, duration_weeks]
    );

    const tasks = [];
    targetTopics.forEach((topic, weekIndex) => {
      const week = weekIndex + 1;
      tasks.push(
        [uuidv4(), plan_id, week, 1, 'video', `Watch concept videos for ${topic.topic_name}`, 30],
        [uuidv4(), plan_id, week, 2, 'pdf', `Read formulas & shortcuts for ${topic.topic_name}`, 20],
        [uuidv4(), plan_id, week, 3, 'practice', `Practice 20 questions on ${topic.topic_name}`, 40],
        [uuidv4(), plan_id, week, 4, 'practice', `Practice 20 more questions on ${topic.topic_name}`, 40],
        [uuidv4(), plan_id, week, 5, 'test', `Re-evaluation test for ${topic.topic_name}`, 25]
      );
    });
    for (const t of tasks) {
      await query(
        'INSERT INTO plan_tasks (task_id,plan_id,week_number,day_number,task_type,description,estimated_minutes) VALUES (?,?,?,?,?,?,?)',
        t
      );
    }

    const createdPlan = await query('SELECT * FROM study_plans WHERE plan_id=?', [plan_id]);
    const createdTasks = await query('SELECT * FROM plan_tasks WHERE plan_id=? ORDER BY week_number, day_number', [plan_id]);
    const planData = createdPlan.rows[0];
    planData.tasks = createdTasks.rows;

    res.json({ plan: planData });
  } catch (err) {
    next(err);
  }
};

/** DELETE /admin/plans/:plan_id/tasks/:task_id */
const deletePlanTask = async (req, res, next) => {
  try {
    await query('DELETE FROM plan_tasks WHERE task_id=?', [req.params.task_id]);
    res.json({ message: 'Task removed' });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/violations */
const getViolations = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT v.*, u.name as student_name, t.title as test_title
       FROM violations v JOIN users u ON u.user_id = v.student_id
       JOIN test_attempts ta ON ta.attempt_id = v.test_attempt_id
       JOIN tests t ON t.test_id = ta.test_id
       ORDER BY v.occurred_at DESC LIMIT 100`
    );
    res.json({ violations: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/announcements */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, target_batches } = req.body;
    const ann_id = uuidv4();
    await query(
      'INSERT INTO announcements (announcement_id,title,content,target_batches,created_by) VALUES (?,?,?,?,?)',
      [ann_id, title, content, JSON.stringify(target_batches || []), req.user.user_id]
    );
    res.status(201).json({ announcement_id: ann_id, message: 'Announcement created' });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/announcements */
const getAnnouncements = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, u.name as created_by_name FROM announcements a
       LEFT JOIN users u ON u.user_id = a.created_by ORDER BY a.created_at DESC`
    );
    res.json({ announcements: result.rows });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/doubts */
const getAllDoubts = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND d.status=?'; params.push(status); }

    const result = await query(
      `SELECT d.*, u.name as student_name, t.name as topic_name
       FROM doubts d JOIN users u ON u.user_id = d.student_id
       LEFT JOIN topics t ON t.topic_id = d.topic_id
       ${where} ORDER BY d.created_at DESC`,
      params
    );
    res.json({ doubts: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/doubts/:id/answer */
const answerDoubt = async (req, res, next) => {
  try {
    const { answer_text, is_best_answer } = req.body;
    const answer_id = uuidv4();
    await query(
      'INSERT INTO doubt_answers (answer_id,doubt_id,answered_by,answer_text,is_best_answer) VALUES (?,?,?,?,?)',
      [answer_id, req.params.id, req.user.user_id, answer_text, is_best_answer ? 1 : 0]
    );
    await query("UPDATE doubts SET status='answered' WHERE doubt_id=?", [req.params.id]);
    res.status(201).json({ answer_id, message: 'Answered' });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/subjects */
const getSubjects = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM subjects ORDER BY display_order');
    res.json({ subjects: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/subjects */
const createSubject = async (req, res, next) => {
  try {
    const { name, display_order } = req.body;
    const subject_id = uuidv4();
    await query('INSERT INTO subjects (subject_id,name,display_order) VALUES (?,?,?)', [subject_id, name, display_order]);
    res.status(201).json({ subject_id });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/topics */
const getTopics = async (req, res, next) => {
  try {
    const { subject_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (subject_id) { where += ' AND t.subject_id=?'; params.push(subject_id); }
    const result = await query(`SELECT t.*, s.name as subject_name FROM topics t JOIN subjects s ON s.subject_id=t.subject_id ${where} ORDER BY t.name`, params);
    res.json({ topics: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/topics */
const createTopic = async (req, res, next) => {
  try {
    const { name, subject_id, description } = req.body;
    const topic_id = uuidv4();
    await query('INSERT INTO topics (topic_id,name,subject_id,description) VALUES (?,?,?,?)', [topic_id, name, subject_id, description]);
    res.status(201).json({ topic_id });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/concepts */
const getConcepts = async (req, res, next) => {
  try {
    const { topic_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (topic_id) { where += ' AND topic_id=?'; params.push(topic_id); }
    const result = await query(`SELECT c.*, t.name as topic_name FROM concepts c JOIN topics t ON t.topic_id=c.topic_id ${where} ORDER BY c.name`, params);
    res.json({ concepts: result.rows });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/concepts */
const createConcept = async (req, res, next) => {
  try {
    const { name, topic_id, description } = req.body;
    const concept_id = uuidv4();
    await query('INSERT INTO concepts (concept_id,name,topic_id,description) VALUES (?,?,?,?)', [concept_id, name, topic_id, description]);
    res.status(201).json({ concept_id });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/audit-log */
const getAuditLog = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT al.*, u.name as user_name FROM audit_log al
       LEFT JOIN users u ON u.user_id = al.user_id
       ORDER BY al.occurred_at DESC LIMIT 200`
    );
    res.json({ logs: result.rows });
  } catch (err) {
    next(err);
  }
};

// Helper: log audit action
const logAudit = async (user_id, action, entity_type, entity_id) => {
  try {
    await query(
      'INSERT INTO audit_log (log_id,user_id,action,entity_type,entity_id) VALUES (?,?,?,?,?)',
      [uuidv4(), user_id, action, entity_type, entity_id]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const [st, te, ad, ba] = await Promise.all([
      query("SELECT COUNT(*) as count FROM users WHERE role='student' AND is_active=1"),
      query("SELECT COUNT(*) as count FROM users WHERE role='teacher' AND is_active=1"),
      query("SELECT COUNT(*) as count FROM users WHERE role='admin' AND is_active=1"),
      query("SELECT COUNT(*) as count FROM batches"),
    ]);
    res.json({
      total_students: parseInt(st.rows[0].count) || 0,
      total_teachers: parseInt(te.rows[0].count) || 0,
      total_admins: parseInt(ad.rows[0].count) || 0,
      total_batches: parseInt(ba.rows[0].count) || 0
    });
  } catch (err) {
    next(err);
  }
};

const getQuestionBankStats = async (req, res, next) => {
  try {
    const [qCount, sCount, tCount, cCount] = await Promise.all([
      query("SELECT COUNT(*) as count FROM questions WHERE is_active=1"),
      query("SELECT COUNT(*) as count FROM subjects"),
      query("SELECT COUNT(*) as count FROM topics"),
      query("SELECT COUNT(*) as count FROM concepts"),
    ]);
    res.json({
      total_questions: parseInt(qCount.rows[0].count) || 0,
      total_subjects: parseInt(sCount.rows[0].count) || 0,
      total_topics: parseInt(tCount.rows[0].count) || 0,
      total_concepts: parseInt(cCount.rows[0].count) || 0
    });
  } catch (err) {
    next(err);
  }
};

const getReportStats = async (req, res, next) => {
  try {
    const [co, ta, av, ma] = await Promise.all([
      query("SELECT COUNT(*) as count FROM tests WHERE status='completed'"),
      query("SELECT COUNT(*) as count FROM test_attempts WHERE status='submitted'"),
      query("SELECT ROUND(AVG(accuracy_percent),2) as avg FROM test_attempts WHERE status='submitted'"),
      query("SELECT ROUND(MAX(accuracy_percent),2) as max FROM test_attempts WHERE status='submitted'"),
    ]);
    res.json({
      completed_tests: parseInt(co.rows[0].count) || 0,
      total_attempts: parseInt(ta.rows[0].count) || 0,
      avg_score: parseFloat(av.rows[0].avg) || 0,
      max_score: parseFloat(ma.rows[0].max) || 0
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard, getUsers, createUser, updateUser, deleteUser,
  getBatches, createBatch, updateBatch, deleteBatch,
  getTests, createTest, updateTest, publishTest, deleteTest, aiGenerateQuestions,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
  getMaterials, uploadMaterial, updateMaterial, deleteMaterial,
  getTestReport, getStudentReport,
  getStudentPlan, updatePlan, adminGeneratePlan, deletePlanTask,
  getViolations, createAnnouncement, getAnnouncements,
  getAllDoubts, answerDoubt,
  getSubjects, createSubject, getTopics, createTopic, getConcepts, createConcept,
  getAuditLog, getUserStats, getQuestionBankStats, getReportStats
};
