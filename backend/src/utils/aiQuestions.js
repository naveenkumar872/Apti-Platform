/**
 * AI question generation
 * Primary:  Cerebras  (llama3.1-8b  — ~2200 tok/s, very fast)
 * Fallback: SambaNova (DeepSeek-V3.2)
 */

function buildPrompt(subject, topic, count, diffLabel) {
  return `You are an expert aptitude question generator for Indian placement exams (TCS, Infosys, Wipro, Cognizant, etc.).

Generate exactly ${count} multiple-choice questions for:
- Subject: ${subject}
- Topic: ${topic}
- Difficulty: ${diffLabel}

Requirements:
- Each question must have exactly 4 options: A, B, C, D
- Questions should be numerical/logical style relevant to placement preparation
- correct_answer must be exactly one of: "A", "B", "C", "D"
- Provide a clear step-by-step explanation
- Vary the questions — no duplicates, different scenarios
- Use only plain ASCII characters — no smart quotes, no special symbols
- Escape any double quotes inside string values with backslash

Return ONLY a valid JSON array (no markdown code blocks, no text outside the array):
[
  {
    "question_text": "...",
    "options": [
      {"id": "A", "text": "..."},
      {"id": "B", "text": "..."},
      {"id": "C", "text": "..."},
      {"id": "D", "text": "..."}
    ],
    "correct_answer": "A",
    "explanation": "Step-by-step: ..."
  }
]`;
}

function cleanJson(str) {
  return str
    // Remove markdown fences
    .replace(/```json\s*/gi, '').replace(/```\s*/g, '')
    // Fix smart/curly quotes
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    // Remove null bytes and other control chars (except \n \r \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

// Try to extract valid question objects one-by-one even from broken JSON
function extractQuestions(str) {
  const results = [];
  // Match each {...} block that looks like a question
  const objRegex = /\{[^{}]*"question_text"[\s\S]*?"correct_answer"\s*:\s*"[ABCD]"[^{}]*\}/g;
  let m;
  while ((m = objRegex.exec(str)) !== null) {
    try {
      const q = JSON.parse(m[0]);
      if (q.question_text && Array.isArray(q.options) && q.options.length === 4 &&
          ['A','B','C','D'].includes(q.correct_answer)) {
        results.push(q);
      }
    } catch { /* skip malformed */ }
  }
  return results;
}

function parseAndValidate(content) {
  const cleaned = cleanJson(content);

  // Strategy 1: standard JSON array parse
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const questions = JSON.parse(arrayMatch[0]);
      if (Array.isArray(questions) && questions.length > 0) {
        const valid = questions.filter(q =>
          q.question_text && Array.isArray(q.options) && q.options.length === 4 &&
          ['A', 'B', 'C', 'D'].includes(q.correct_answer)
        );
        if (valid.length > 0) return valid;
      }
    } catch { /* fall through */ }
  }

  // Strategy 2: truncate at last complete object and close the array
  if (arrayMatch) {
    try {
      const raw = arrayMatch[0];
      const lastBrace = raw.lastIndexOf('},');
      if (lastBrace > 0) {
        const truncated = raw.slice(0, lastBrace + 1) + ']';
        const questions = JSON.parse(truncated);
        if (Array.isArray(questions) && questions.length > 0) {
          const valid = questions.filter(q =>
            q.question_text && Array.isArray(q.options) && q.options.length === 4 &&
            ['A', 'B', 'C', 'D'].includes(q.correct_answer)
          );
          if (valid.length > 0) return valid;
        }
      }
    } catch { /* fall through */ }
  }

  // Strategy 3: extract individual objects via regex
  const extracted = extractQuestions(cleaned);
  if (extracted.length > 0) return extracted;

  throw new Error('Could not parse any valid questions from AI response');
}

async function callCerebras(prompt) {
  const apiKey = (process.env.CEREBRAS_API_KEY || '').trim();
  if (!apiKey) throw new Error('CEREBRAS_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    signal: controller.signal,
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 16000,
    }),
  });
  clearTimeout(timer);

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Cerebras API returned ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callSambaNova(prompt) {
  const apiKey = (process.env.SAMBANOVA_API_KEY || '').trim();
  if (!apiKey) throw new Error('SAMBANOVA_API_KEY not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);

  const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
    method: 'POST',
    signal: controller.signal,
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'DeepSeek-V3.2',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });
  clearTimeout(timer);

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`SambaNova API returned ${response.status}: ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * @param {object} opts
 * @param {string} opts.topicName
 * @param {string} opts.subjectName
 * @param {number} opts.count
 * @param {string} opts.difficulty  'easy' | 'medium' | 'hard'
 */
async function generateAIQuestions({ topicName, subjectName, count = 10, difficulty = 'medium' }) {
  const diffLabel =
    difficulty === 'easy' ? 'easy (basic, introductory level)' :
    difficulty === 'hard' ? 'hard (advanced, tricky, multi-step)' :
                            'medium (moderate, standard placement level)';

  const subject = subjectName || topicName || 'Aptitude';
  const topic   = topicName   || 'General Aptitude';
  const prompt  = buildPrompt(subject, topic, count, diffLabel);

  // ── 1. Try Cerebras (primary — very fast) ──────────────────────────────────
  try {
    console.log(`[AI] Cerebras → generating ${count} "${difficulty}" questions for "${topic}"`);
    const content = await callCerebras(prompt);
    const result  = parseAndValidate(content);
    console.log(`[AI] Cerebras ✓ returned ${result.length} questions`);
    return result;
  } catch (cerebrasErr) {
    console.warn(`[AI] Cerebras failed (${cerebrasErr.message}), falling back to SambaNova...`);
  }

  // ── 2. Fallback: SambaNova ─────────────────────────────────────────────────
  console.log(`[AI] SambaNova → generating ${count} "${difficulty}" questions for "${topic}"`);
  const content = await callSambaNova(prompt);
  const result  = parseAndValidate(content);
  console.log(`[AI] SambaNova ✓ returned ${result.length} questions`);
  return result;
}

function buildCompanyPrompt(companyName, topics, year, count) {
  return `You are an expert aptitude question generator for Indian campus placement exams.

Generate exactly ${count} multiple-choice questions simulating the ${year} ${companyName} placement aptitude test.

Topics to cover (mix proportionally): ${topics}

Requirements:
- Each question must have exactly 4 options: A, B, C, D
- Match ${companyName}'s typical placement test style and difficulty
- correct_answer must be exactly one of: "A", "B", "C", "D"
- Include a "topic_name" field indicating which topic this question belongs to
- Provide a clear step-by-step explanation
- Use only plain ASCII characters -- no smart quotes, no special symbols
- Escape any double quotes inside string values with backslash

Return ONLY a valid JSON array (no markdown, no text outside the array):
[
  {
    "question_text": "...",
    "options": [
      {"id": "A", "text": "..."},
      {"id": "B", "text": "..."},
      {"id": "C", "text": "..."},
      {"id": "D", "text": "..."}
    ],
    "correct_answer": "A",
    "topic_name": "Percentages",
    "explanation": "Step-by-step: ..."
  }
]`;
}

/**
 * Generate company-specific placement questions for a given year
 */
async function generateCompanyYearQuestions({ companyName, topics, year, count = 25 }) {
  const topicsStr = topics.length > 0 ? topics.join(', ') : 'Arithmetic, Logical Reasoning, Verbal Ability, Data Interpretation';
  const prompt = buildCompanyPrompt(companyName, topicsStr, year, count);

  try {
    console.log(`[AI] Cerebras → generating ${count} questions for ${companyName} ${year}`);
    const content = await callCerebras(prompt);
    const result = parseAndValidate(content);
    console.log(`[AI] Cerebras ✓ returned ${result.length} questions for ${year}`);
    return result;
  } catch (cerebrasErr) {
    console.warn(`[AI] Cerebras failed for ${year} (${cerebrasErr.message}), falling back to SambaNova...`);
  }

  console.log(`[AI] SambaNova → generating ${count} questions for ${companyName} ${year}`);
  const content = await callSambaNova(prompt);
  const result = parseAndValidate(content);
  console.log(`[AI] SambaNova ✓ returned ${result.length} questions for ${year}`);
  return result;
}

module.exports = { generateAIQuestions, generateCompanyYearQuestions };
