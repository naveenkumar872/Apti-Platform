/**
 * AI question generation using SambaNova DeepSeek-V3.2
 * Called as fallback when the database has no questions for the selected filters.
 */

/**
 * @param {object} opts
 * @param {string} opts.topicName     e.g. "Percentages"
 * @param {string} opts.subjectName   e.g. "Quantitative Aptitude"
 * @param {number} opts.count         number of questions to generate
 * @param {string} opts.difficulty    'easy' | 'medium' | 'hard'
 * @returns {Promise<Array>} array of { question_text, options, correct_answer, explanation }
 */
async function generateAIQuestions({ topicName, subjectName, count = 10, difficulty = 'medium' }) {
  const apiKey = (process.env.SAMBANOVA_API_KEY || '').trim();
  if (!apiKey) throw new Error('SAMBANOVA_API_KEY not configured');

  const diffLabel =
    difficulty === 'easy'  ? 'easy (basic, introductory level)' :
    difficulty === 'hard'  ? 'hard (advanced, tricky, multi-step)' :
                             'medium (moderate, standard placement level)';

  const subject = subjectName || topicName || 'Aptitude';
  const topic   = topicName   || 'General Aptitude';

  const prompt = `You are an expert aptitude question generator for Indian placement exams (TCS, Infosys, Wipro, Cognizant, etc.).

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

  const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'DeepSeek-V3.2',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`SambaNova API returned ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Extract the JSON array — handle models that wrap output in markdown fences
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not find a JSON array in the AI response');
  }

  let questions;
  try {
    questions = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse AI JSON: ${e.message}`);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('AI returned an empty questions array');
  }

  // Validate & sanitize each question
  const valid = questions.filter(q =>
    q.question_text &&
    Array.isArray(q.options) && q.options.length === 4 &&
    ['A', 'B', 'C', 'D'].includes(q.correct_answer)
  );

  if (valid.length === 0) {
    throw new Error('AI questions failed validation (bad format)');
  }

  return valid;
}

module.exports = { generateAIQuestions };
