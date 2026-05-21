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

// ─────────────────────────────────────────────────────────────────────────────
// Study content generation
// ─────────────────────────────────────────────────────────────────────────────

function buildStudyContentPrompt(subject, topic, concept) {
  const scope = concept ? `the concept "${concept}" within topic "${topic}" of "${subject}"` : `the topic "${topic}" in "${subject}"`;
  return `You are an expert educator for Indian placement exam preparation (TCS, Infosys, Wipro, Cognizant, etc.).

Generate comprehensive study content for ${scope} covering basic to advanced level.

Return ONLY a valid JSON object. No markdown fences, no text outside the JSON:
{"youtube_searches":["search query 1","search query 2","search query 3"],"shortcuts_title":"Quick Tricks and Shortcuts","shortcuts":["Basic: trick 1","Basic: trick 2","Intermediate: trick 3","Intermediate: trick 4","Advanced: trick 5","Advanced: trick 6"],"formulas_title":"Key Formulas and Concepts","formulas":["Basic: formula 1","Basic: formula 2","Intermediate: formula 3","Intermediate: formula 4","Advanced: formula 5","Advanced: formula 6"]}

Rules:
- youtube_searches: exactly 3 search terms — one for basics, one for tricks, one for advanced/practice
- shortcuts: array of 8-12 single-line tricks ordered from basic to advanced, label each with Basic/Intermediate/Advanced prefix
- formulas: array of 8-12 single-line formulas/rules ordered from basic to advanced, include actual equations (e.g. SI = P*R*T/100), label with Basic/Intermediate/Advanced
- NO newlines inside any string value, ASCII only
- Return ONLY the JSON object`;
}

/**
 * Search YouTube for a real video link using the YouTube Data API v3.
 * Falls back to a YouTube search URL if no API key is configured.
 */
async function searchYouTubeVideo(query) {
  const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();
  const fallback = {
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    videoId: null,
    thumbnail: null,
    channelTitle: null,
  };
  if (!apiKey) return { ...fallback, query };
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&relevanceLanguage=en&key=${apiKey}`;
    const resp = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { console.warn(`[YouTube] API returned ${resp.status}`); return { ...fallback, query }; }
    const data = await resp.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const videoId = item.id.videoId;
      return {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        thumbnail: item.snippet.thumbnails?.high?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        channelTitle: item.snippet.channelTitle || '',
        query,
      };
    }
  } catch (e) {
    console.warn('[YouTube] search failed:', e.message);
  }
  return { ...fallback, query };
}

function buildTopicsPrompt(subject) {
  return `You are an expert in Indian placement exam preparation.

List all important topics for the subject "${subject}" commonly tested in TCS, Infosys, Wipro, Cognizant placement aptitude exams.

Return ONLY a valid JSON array of topic name strings (no markdown, no text outside):
["Topic 1", "Topic 2", "Topic 3", ...]

Rules:
- Include 8-15 most important topics
- Use standard academic names
- Return ONLY the JSON array`;
}

function buildConceptsPrompt(subject, topic) {
  return `You are an expert in Indian placement exam preparation.

List all key concepts and subtopics for "${topic}" in "${subject}" commonly tested in placement exams.

Return ONLY a valid JSON array of concept name strings (no markdown, no text outside):
["Concept 1", "Concept 2", "Concept 3", ...]

Rules:
- Include 4-10 specific concepts/subtopics
- Each concept should be a distinct learnable unit
- Return ONLY the JSON array`;
}

async function callAI(prompt) {
  try {
    const content = await callCerebras(prompt);
    // Fall back if Cerebras returned empty or clearly non-JSON content
    if (content && content.includes('{')) {
      return content;
    }
    console.warn('[AI] Cerebras returned unusable content, falling back to SambaNova. Preview:', (content || '').slice(0, 120));
  } catch (e) {
    console.warn('[AI] Cerebras threw, falling back to SambaNova:', e.message);
  }
  return await callSambaNova(prompt);
}

function parseJsonArray(raw) {
  const cleaned = cleanJson(raw);
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('No JSON array found');
  return JSON.parse(m[0]);
}

// Escape literal control chars inside JSON string values without touching whitespace outside strings
function sanitizeControlCharsInStrings(jsonStr) {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\' && inString) { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString) {
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
    }
    result += ch;
  }
  return result;
}

function parseJsonObject(raw) {
  const cleaned = cleanJson(raw);
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) {
    console.error('[AI] parseJsonObject FAIL. cleaned.length:', cleaned.length,
      '| starts:', JSON.stringify(cleaned.slice(0, 80)),
      '| ends:', JSON.stringify(cleaned.slice(-80)));
    throw new Error('No JSON object found');
  }
  return JSON.parse(sanitizeControlCharsInStrings(m[0]));
}

/**
 * Generate AI topics for a subject
 * @param {string} subjectName
 * @returns {Promise<string[]>}
 */
async function generateTopicsForSubject(subjectName) {
  console.log(`[AI] Generating topics for subject: "${subjectName}"`);
  const content = await callAI(buildTopicsPrompt(subjectName));
  const topics = parseJsonArray(content);
  if (!Array.isArray(topics) || topics.length === 0) throw new Error('No topics generated');
  return topics.filter(t => typeof t === 'string' && t.trim());
}

/**
 * Generate AI concepts for a topic
 * @param {string} subjectName
 * @param {string} topicName
 * @returns {Promise<string[]>}
 */
async function generateConceptsForTopic(subjectName, topicName) {
  console.log(`[AI] Generating concepts for topic: "${topicName}" in "${subjectName}"`);
  const content = await callAI(buildConceptsPrompt(subjectName, topicName));
  const concepts = parseJsonArray(content);
  if (!Array.isArray(concepts) || concepts.length === 0) throw new Error('No concepts generated');
  return concepts.filter(c => typeof c === 'string' && c.trim());
}

/**
 * Generate full study content (YouTube searches + shortcuts + formulas)
 * @param {string} subjectName
 * @param {string} topicName
 * @param {string|null} conceptName
 * @returns {Promise<{youtube_searches, shortcuts_title, shortcuts, formulas_title, formulas}>}
 */
async function generateStudyContent(subjectName, topicName, conceptName) {
  const label = conceptName ? `${subjectName} > ${topicName} > ${conceptName}` : `${subjectName} > ${topicName}`;
  console.log(`[AI] Generating study content for: "${label}"`);
  const content = await callAI(buildStudyContentPrompt(subjectName, topicName, conceptName));
  const raw = parseJsonObject(content);
  if (!raw.shortcuts || !raw.formulas) throw new Error('Incomplete study content from AI');

  // Normalize: AI may return arrays or strings — always produce bullet-text strings for DB storage
  const toText = (v) => Array.isArray(v)
    ? v.filter(Boolean).map(s => `• ${String(s).trim()}`).join('\n')
    : String(v || '').trim();

  // Resolve each youtube search query into an actual video URL (or search URL fallback)
  const searches = Array.isArray(raw.youtube_searches) ? raw.youtube_searches.filter(Boolean).slice(0, 3) : [];
  const videos = await Promise.all(searches.map(q => searchYouTubeVideo(q)));

  return {
    videos,
    shortcuts_title: raw.shortcuts_title || 'Quick Tricks & Shortcuts',
    shortcuts: toText(raw.shortcuts),
    formulas_title: raw.formulas_title || 'Key Formulas & Concepts',
    formulas: toText(raw.formulas),
  };
}

module.exports = { generateAIQuestions, generateCompanyYearQuestions, generateTopicsForSubject, generateConceptsForTopic, generateStudyContent, searchYouTubeVideo };
