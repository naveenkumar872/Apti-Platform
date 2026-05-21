const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');

/* ────────────────────────────────────────────────
   Bulk Question Import
   ─────────────────────────────────────────────────
   Two-step admin flow:
     1) POST /admin/questions/import/parse  — upload CSV/XLSX → preview rows + per-row validation errors
     2) POST /admin/questions/import/commit — commit the parsed rows (admin can drop bad ones first)

   Plus a template download:
       GET /admin/questions/import/template
   ───────────────────────────────────────────────── */

const TEMPLATE_HEADERS = [
  'question_text',
  'option_a', 'option_b', 'option_c', 'option_d',
  'correct_answer',
  'difficulty',
  'subject_name',
  'topic_name',
  'concept_name',
  'explanation',
];

const TEMPLATE_ROWS = [
  {
    question_text:    'If 8 men can complete a task in 12 days, how many days will 6 men take?',
    option_a:         '14 days',
    option_b:         '16 days',
    option_c:         '18 days',
    option_d:         '20 days',
    correct_answer:   'B',
    difficulty:       3,
    subject_name:     'Quantitative Aptitude',
    topic_name:       'Time and Work',
    concept_name:     'Inverse proportion',
    explanation:      'Work is constant. (8 × 12) / 6 = 16 days.',
  },
  {
    question_text:    'Choose the synonym of "alleviate".',
    option_a:         'Worsen',
    option_b:         'Cure',
    option_c:         'Reduce',
    option_d:         'Provoke',
    correct_answer:   'C',
    difficulty:       2,
    subject_name:     'Verbal Ability',
    topic_name:       'Synonyms',
    concept_name:     '',
    explanation:      'Alleviate = lessen / reduce the severity of.',
  },
];

const NORMALISE = (s) => String(s ?? '').trim();
const NORMALISE_LOWER = (s) => NORMALISE(s).toLowerCase();
const VALID_ANSWERS = new Set(['A', 'B', 'C', 'D']);

/* ──────────────────────────
   GET /admin/questions/import/template
   Returns a CSV file with header row + 2 sample rows so the admin can edit-in-place.
   ────────────────────────── */
const downloadTemplate = (req, res) => {
  const csvLines = [TEMPLATE_HEADERS.join(',')];
  for (const row of TEMPLATE_ROWS) {
    csvLines.push(TEMPLATE_HEADERS.map(h => {
      const v = row[h] ?? '';
      const s = String(v);
      // Quote if contains comma, quote, or newline.
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="question-import-template.csv"');
  res.send(csvLines.join('\n'));
};

/* ──────────────────────────
   Helper: parse a file buffer (CSV or XLSX) into row objects keyed by header.
   ────────────────────────── */
function parseFile(buffer, originalName) {
  const isXlsx = /\.xlsx?$/i.test(originalName || '');
  const workbook = isXlsx
    ? XLSX.read(buffer, { type: 'buffer' })
    : XLSX.read(buffer.toString('utf8'), { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheet/tab found in file');
  const sheet = workbook.Sheets[sheetName];
  // header: 1 gives arrays-of-arrays; we'll convert to objects ourselves so we
  // can normalise header casing.
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, blankrows: false, defval: '' });
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => NORMALISE_LOWER(h).replace(/\s+/g, '_'));
  return rows.slice(1).map((arr) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = arr[i]; });
    return obj;
  }).filter(row => Object.values(row).some(v => NORMALISE(v).length > 0));
}

/* ──────────────────────────
   Helper: lookup subject + topic + concept by name. Resolves to ids without creating
   anything yet — the commit step is responsible for inserts.
   ────────────────────────── */
async function buildTaxonomyIndex() {
  const [subjects, topics, concepts] = await Promise.all([
    query('SELECT subject_id, name FROM subjects'),
    query('SELECT topic_id, subject_id, name FROM topics'),
    query('SELECT concept_id, topic_id, name FROM concepts'),
  ]);
  const subjectsByName = new Map();
  for (const s of subjects.rows) subjectsByName.set(s.name.toLowerCase(), s);
  const topicsBySubjectName = new Map(); // `${subject_id}::${topic_name}` → row
  for (const t of topics.rows) topicsBySubjectName.set(`${t.subject_id}::${t.name.toLowerCase()}`, t);
  const conceptsByTopicName = new Map(); // `${topic_id}::${concept_name}` → row
  for (const c of concepts.rows) conceptsByTopicName.set(`${c.topic_id}::${c.name.toLowerCase()}`, c);
  return { subjectsByName, topicsBySubjectName, conceptsByTopicName };
}

/* ──────────────────────────
   Validate one parsed row + resolve taxonomy. Returns { valid, errors, normalised }.
   `normalised` carries the ids needed to insert (when valid).
   ────────────────────────── */
function validateRow(raw, taxonomy) {
  const errors = [];
  const question_text  = NORMALISE(raw.question_text);
  const option_a       = NORMALISE(raw.option_a);
  const option_b       = NORMALISE(raw.option_b);
  const option_c       = NORMALISE(raw.option_c);
  const option_d       = NORMALISE(raw.option_d);
  const correct_answer = NORMALISE(raw.correct_answer).toUpperCase();
  const difficulty_raw = NORMALISE(raw.difficulty);
  const subject_name   = NORMALISE(raw.subject_name);
  const topic_name     = NORMALISE(raw.topic_name);
  const concept_name   = NORMALISE(raw.concept_name);
  const explanation    = NORMALISE(raw.explanation);

  if (!question_text) errors.push('Missing question_text');
  if (!option_a) errors.push('Missing option_a');
  if (!option_b) errors.push('Missing option_b');
  if (!option_c) errors.push('Missing option_c');
  if (!option_d) errors.push('Missing option_d');
  if (!VALID_ANSWERS.has(correct_answer)) errors.push(`correct_answer must be A/B/C/D (got "${raw.correct_answer}")`);

  const difficulty = parseInt(difficulty_raw, 10);
  if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
    errors.push(`difficulty must be 1-5 (got "${raw.difficulty}")`);
  }

  if (!subject_name) errors.push('Missing subject_name');
  if (!topic_name)   errors.push('Missing topic_name');

  let subject = null, topic = null, concept = null;
  if (subject_name) {
    subject = taxonomy.subjectsByName.get(subject_name.toLowerCase()) || null;
    if (!subject) errors.push(`Subject "${subject_name}" not found. Create it under Admin → Subjects first.`);
  }
  if (subject && topic_name) {
    topic = taxonomy.topicsBySubjectName.get(`${subject.subject_id}::${topic_name.toLowerCase()}`) || null;
    if (!topic) errors.push(`Topic "${topic_name}" not found under "${subject.name}". Create it first or check spelling.`);
  }
  if (topic && concept_name) {
    concept = taxonomy.conceptsByTopicName.get(`${topic.topic_id}::${concept_name.toLowerCase()}`) || null;
    // Concept missing is fine — we'll auto-create under the topic on commit.
  }

  return {
    valid: errors.length === 0,
    errors,
    normalised: {
      question_text,
      option_a, option_b, option_c, option_d,
      correct_answer,
      difficulty,
      subject_name, topic_name, concept_name, explanation,
      subject_id: subject?.subject_id || null,
      topic_id:   topic?.topic_id   || null,
      concept_id: concept?.concept_id || null,
    },
  };
}

/* ──────────────────────────
   POST /admin/questions/import/parse
   Multipart upload (field name: file). Returns a preview.
   ────────────────────────── */
const parseImport = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const rows = parseFile(req.file.buffer, req.file.originalname);
    if (rows.length === 0) return res.status(400).json({ error: 'No data rows found in file' });
    if (rows.length > 1000) return res.status(413).json({ error: 'Max 1000 rows per import. Split into batches.' });

    const taxonomy = await buildTaxonomyIndex();
    const preview = rows.map((r, i) => ({
      row_number: i + 2,                          // header is row 1
      raw: r,
      ...validateRow(r, taxonomy),
    }));
    const validCount   = preview.filter(p => p.valid).length;
    const invalidCount = preview.length - validCount;

    res.json({
      preview,
      summary: {
        total: preview.length,
        valid: validCount,
        invalid: invalidCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ──────────────────────────
   POST /admin/questions/import/commit
   Body: { rows: [normalised...] }
   Inserts each row; auto-creates the concept if `concept_name` is set but
   `concept_id` is null. Skips rows that don't validate at commit time.
   ────────────────────────── */
const commitImport = async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) return res.status(400).json({ error: 'No rows to import' });

    // Re-validate against the latest taxonomy (taxonomy may have changed between parse + commit).
    const taxonomy = await buildTaxonomyIndex();
    const created_by = req.user?.user_id || null;

    let inserted = 0;
    const failed = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        // Lookups are already done client-side, but if the admin altered the
        // preview before committing we re-resolve here.
        const subject = r.subject_id
          ? { subject_id: r.subject_id }
          : (r.subject_name ? taxonomy.subjectsByName.get(NORMALISE_LOWER(r.subject_name)) : null);
        if (!subject) { failed.push({ row_number: r.row_number || (i + 2), error: 'Subject not found' }); continue; }

        const topicKey = `${subject.subject_id}::${NORMALISE_LOWER(r.topic_name)}`;
        const topic = r.topic_id
          ? { topic_id: r.topic_id }
          : taxonomy.topicsBySubjectName.get(topicKey);
        if (!topic) { failed.push({ row_number: r.row_number || (i + 2), error: 'Topic not found' }); continue; }

        // Resolve or auto-create concept (concept is optional).
        let concept_id = r.concept_id || null;
        const conceptName = NORMALISE(r.concept_name);
        if (!concept_id && conceptName) {
          const existing = taxonomy.conceptsByTopicName.get(`${topic.topic_id}::${conceptName.toLowerCase()}`);
          if (existing) {
            concept_id = existing.concept_id;
          } else {
            // Auto-create concept under the topic.
            concept_id = uuidv4();
            await query(
              'INSERT INTO concepts (concept_id, topic_id, name) VALUES (?, ?, ?)',
              [concept_id, topic.topic_id, conceptName]
            );
            taxonomy.conceptsByTopicName.set(`${topic.topic_id}::${conceptName.toLowerCase()}`, { concept_id, topic_id: topic.topic_id, name: conceptName });
          }
        }
        // If still no concept_id and there's at least one concept for the topic, fall back to any.
        // (questions.concept_id has a FK so cannot be NULL in this schema — fall back to first.)
        if (!concept_id) {
          const anyConcept = await query(
            'SELECT concept_id FROM concepts WHERE topic_id = ? LIMIT 1',
            [topic.topic_id]
          );
          if (anyConcept.rows.length > 0) concept_id = anyConcept.rows[0].concept_id;
          else {
            // Create a generic "General" concept under this topic.
            concept_id = uuidv4();
            await query(
              'INSERT INTO concepts (concept_id, topic_id, name) VALUES (?, ?, ?)',
              [concept_id, topic.topic_id, 'General']
            );
            taxonomy.conceptsByTopicName.set(`${topic.topic_id}::general`, { concept_id, topic_id: topic.topic_id, name: 'General' });
          }
        }

        // Validate the question shape one more time
        const correct = String(r.correct_answer || '').toUpperCase();
        if (!VALID_ANSWERS.has(correct)) {
          failed.push({ row_number: r.row_number || (i + 2), error: `correct_answer must be A/B/C/D` });
          continue;
        }
        const difficulty = parseInt(r.difficulty, 10);
        if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
          failed.push({ row_number: r.row_number || (i + 2), error: `difficulty must be 1-5` });
          continue;
        }

        const options = [
          { id: 'A', text: NORMALISE(r.option_a) },
          { id: 'B', text: NORMALISE(r.option_b) },
          { id: 'C', text: NORMALISE(r.option_c) },
          { id: 'D', text: NORMALISE(r.option_d) },
        ];
        if (options.some(o => !o.text)) {
          failed.push({ row_number: r.row_number || (i + 2), error: 'Missing one or more options' });
          continue;
        }
        if (!NORMALISE(r.question_text)) {
          failed.push({ row_number: r.row_number || (i + 2), error: 'Missing question_text' });
          continue;
        }

        const question_id = uuidv4();
        await query(
          `INSERT INTO questions
             (question_id, concept_id, question_text, question_type, options,
              correct_answer, explanation, difficulty, source, created_by, is_active)
           VALUES (?, ?, ?, 'mcq', ?, ?, ?, ?, 'bulk_import', ?, 1)`,
          [
            question_id,
            concept_id,
            NORMALISE(r.question_text),
            JSON.stringify(options),
            correct,
            NORMALISE(r.explanation) || '',
            difficulty,
            created_by,
          ]
        );
        inserted++;
      } catch (rowErr) {
        failed.push({ row_number: r.row_number || (i + 2), error: rowErr.message || 'Insert failed' });
      }
    }

    res.json({
      inserted,
      failed_count: failed.length,
      failed,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { downloadTemplate, parseImport, commitImport };
