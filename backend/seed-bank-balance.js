/**
 * seed-bank-balance.js — balanced question bank seeder
 *
 * Adds 42 hand-crafted MCQs (no AI, no duplicates) to fill the empty buckets:
 *   • Quantitative Aptitude / Hard      (6)
 *   • Verbal Ability / Easy / Medium / Hard (6 each = 18)
 *   • Logical Reasoning / Easy / Medium / Hard (6 each = 18)
 *
 * Idempotent — re-running this skips any question whose text already exists.
 * Run with:  npm run seed:bank
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query } = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

// ── Topic IDs (already in DB) ────────────────────────────────────────────
const T = {
  // Quantitative
  averages:           '10000000-0000-0000-0000-000000000012', // has concepts
  numberSystem:       '10000000-0000-0000-0000-000000000002',
  algebra:            '10000000-0000-0000-0000-000000000007',
  geometry:           '10000000-0000-0000-0000-000000000008',
  // Logical
  series:             '20000000-0000-0000-0000-000000000006', // Series Completion
  coding:             '20000000-0000-0000-0000-000000000004', // Coding Decoding
  blood:              '20000000-0000-0000-0000-000000000001', // Blood Relations
  directions:         '20000000-0000-0000-0000-000000000005',
  syllogism:          '20000000-0000-0000-0000-000000000003',
  seating:            '20000000-0000-0000-0000-000000000002',
  inequalities:       '20000000-0000-0000-0000-000000000008',
  puzzles:            '20000000-0000-0000-0000-000000000007',
  // Verbal
  synonyms:           '30000000-0000-0000-0000-000000000005', // Synonyms and Antonyms
  vocabulary:         '30000000-0000-0000-0000-000000000003',
  sentenceComp:       '30000000-0000-0000-0000-000000000004', // Sentence Completion
  errorSpotting:      '30000000-0000-0000-0000-000000000007',
  grammar:            '30000000-0000-0000-0000-000000000002', // Grammar and Usage
  readingComp:        '30000000-0000-0000-0000-000000000001',
  paraJumbles:        '30000000-0000-0000-0000-000000000006',
};

/* ──────────────────────────────────────────────────────────
   QUESTIONS — written by hand, all unique, balanced bucket
   ────────────────────────────────────────────────────────── */
const QUESTIONS = [
  // ════ QUANT · HARD (6) ════
  {
    topic_id: T.algebra, concept_name: 'Equations', difficulty: 5,
    question_text: "If x + 1/x = 3, what is x³ + 1/x³?",
    options: [{id:'A',text:'18'},{id:'B',text:'27'},{id:'C',text:'21'},{id:'D',text:'24'}],
    correct_answer: 'A',
    explanation: 'x³ + 1/x³ = (x + 1/x)³ − 3(x + 1/x) = 27 − 9 = 18.',
  },
  {
    topic_id: T.numberSystem, concept_name: 'Remainder Theorem', difficulty: 4,
    question_text: "Find the remainder when 7^100 is divided by 25.",
    options: [{id:'A',text:'0'},{id:'B',text:'1'},{id:'C',text:'7'},{id:'D',text:'24'}],
    correct_answer: 'B',
    explanation: '7² = 49 ≡ −1 (mod 25), so 7^100 = (7²)^50 ≡ (−1)^50 = 1 (mod 25).',
  },
  {
    topic_id: T.averages, concept_id: '6839574c-715e-4176-99e7-33bd0b9fbe0e', difficulty: 4,
    question_text: "A man's present age is 2/5 of his mother's age. After 8 years, he will be half her age. What is his mother's current age?",
    options: [{id:'A',text:'40 years'},{id:'B',text:'42 years'},{id:'C',text:'48 years'},{id:'D',text:'50 years'}],
    correct_answer: 'A',
    explanation: 'Let mother = M. Son = 2M/5. After 8 yrs: 2M/5 + 8 = (M+8)/2. Solve: 4M/5 + 16 = M + 8 → M/5 = 8 → M = 40.',
  },
  {
    topic_id: T.geometry, concept_name: 'Mensuration', difficulty: 5,
    question_text: "The diagonal of a rectangle is 13 cm and its perimeter is 34 cm. What is its area?",
    options: [{id:'A',text:'40 cm²'},{id:'B',text:'60 cm²'},{id:'C',text:'70 cm²'},{id:'D',text:'80 cm²'}],
    correct_answer: 'B',
    explanation: 'l + b = 17, l² + b² = 169. (l+b)² = 289, so 2lb = 289 − 169 = 120 → lb = 60.',
  },
  {
    topic_id: T.numberSystem, concept_name: 'LCM and HCF', difficulty: 4,
    question_text: "Find the largest 4-digit number divisible by 12, 15, and 18.",
    options: [{id:'A',text:'9900'},{id:'B',text:'9720'},{id:'C',text:'9990'},{id:'D',text:'9960'}],
    correct_answer: 'B',
    explanation: 'LCM(12,15,18) = 180. Largest 4-digit multiple of 180 is 9720 (180 × 54).',
  },
  {
    topic_id: T.averages, concept_id: 'fe4a0185-03ac-4957-b7f3-18c8fdbd02ce', difficulty: 5,
    question_text: "A car covers half a journey at 60 km/h and the remaining half at 40 km/h. What is its average speed?",
    options: [{id:'A',text:'50 km/h'},{id:'B',text:'48 km/h'},{id:'C',text:'45 km/h'},{id:'D',text:'52 km/h'}],
    correct_answer: 'B',
    explanation: 'Average speed for equal distances = 2ab/(a+b) = 2×60×40/100 = 48 km/h.',
  },

  // ════ LOGICAL · EASY (6) ════
  {
    topic_id: T.series, concept_name: 'Number Series', difficulty: 1,
    question_text: "Find the next term: 2, 4, 8, 16, ?",
    options: [{id:'A',text:'24'},{id:'B',text:'32'},{id:'C',text:'30'},{id:'D',text:'28'}],
    correct_answer: 'B',
    explanation: 'Each term doubles. 16 × 2 = 32.',
  },
  {
    topic_id: T.coding, concept_name: 'Letter Coding', difficulty: 2,
    question_text: "If 'CAT' is coded as 'DBU', how is 'DOG' coded?",
    options: [{id:'A',text:'EPH'},{id:'B',text:'CNF'},{id:'C',text:'FQI'},{id:'D',text:'EQH'}],
    correct_answer: 'A',
    explanation: 'Each letter shifts +1. D→E, O→P, G→H.',
  },
  {
    topic_id: T.blood, concept_name: 'Family Relationships', difficulty: 1,
    question_text: "Pointing to a photo, Asha said, \"He is the son of my father.\" How is the man in the photo related to Asha?",
    options: [{id:'A',text:'Cousin'},{id:'B',text:'Brother'},{id:'C',text:'Uncle'},{id:'D',text:'Father'}],
    correct_answer: 'B',
    explanation: "Father's son = Asha's brother.",
  },
  {
    topic_id: T.series, concept_name: 'Letter Series', difficulty: 2,
    question_text: "Find the next term: A, C, E, G, ?",
    options: [{id:'A',text:'H'},{id:'B',text:'I'},{id:'C',text:'J'},{id:'D',text:'K'}],
    correct_answer: 'B',
    explanation: 'Skip one letter each time: A, C, E, G, I.',
  },
  {
    topic_id: T.directions, concept_name: 'Cardinal Directions', difficulty: 2,
    question_text: "A man walks 5 km North, then turns right and walks 3 km. In which direction is he facing now?",
    options: [{id:'A',text:'North'},{id:'B',text:'South'},{id:'C',text:'East'},{id:'D',text:'West'}],
    correct_answer: 'C',
    explanation: 'Facing North, turning right means facing East.',
  },
  {
    topic_id: T.coding, concept_name: 'Number Coding', difficulty: 2,
    question_text: "If RED = 27, what is BLUE?",
    options: [{id:'A',text:'40'},{id:'B',text:'42'},{id:'C',text:'45'},{id:'D',text:'47'}],
    correct_answer: 'A',
    explanation: 'Use alphabet positions and sum: R(18)+E(5)+D(4) = 27. Similarly B(2)+L(12)+U(21)+E(5) = 40.',
  },

  // ════ LOGICAL · MEDIUM (6) ════
  {
    topic_id: T.series, concept_name: 'Number Series', difficulty: 3,
    question_text: "Find the next term: 3, 9, 27, 81, ?",
    options: [{id:'A',text:'162'},{id:'B',text:'243'},{id:'C',text:'324'},{id:'D',text:'405'}],
    correct_answer: 'B',
    explanation: 'Each term is multiplied by 3. 81 × 3 = 243.',
  },
  {
    topic_id: T.syllogism, concept_name: 'Deductive Logic', difficulty: 3,
    question_text: "Statements: All birds are animals. All animals breathe. Conclusion: All birds breathe. Is the conclusion valid?",
    options: [{id:'A',text:'Valid'},{id:'B',text:'Invalid'},{id:'C',text:'Cannot determine'},{id:'D',text:'Partially valid'}],
    correct_answer: 'A',
    explanation: "Transitive deduction: birds → animals → breathe. So all birds breathe.",
  },
  {
    topic_id: T.coding, concept_name: 'Substitution Coding', difficulty: 3,
    question_text: "If 'POND' is coded as 'QPOE', how is 'WALK' coded?",
    options: [{id:'A',text:'XBNL'},{id:'B',text:'XBML'},{id:'C',text:'XBNM'},{id:'D',text:'YBML'}],
    correct_answer: 'B',
    explanation: 'Each letter shifts +1, +1, +1, +1. W→X, A→B, L→M, K→L.',
  },
  {
    topic_id: T.directions, concept_name: 'Distance Calculation', difficulty: 3,
    question_text: "A man walks 6 km East, then 8 km North. How far is he from the starting point?",
    options: [{id:'A',text:'10 km'},{id:'B',text:'12 km'},{id:'C',text:'14 km'},{id:'D',text:'8 km'}],
    correct_answer: 'A',
    explanation: 'Pythagoras: √(6² + 8²) = √100 = 10 km.',
  },
  {
    topic_id: T.blood, concept_name: 'Family Relationships', difficulty: 3,
    question_text: "A's father is B's son. C is A's paternal uncle. How is C related to B?",
    options: [{id:'A',text:'Son'},{id:'B',text:'Brother'},{id:'C',text:'Grandson'},{id:'D',text:'Father'}],
    correct_answer: 'A',
    explanation: "B is grandfather of A. C is brother of A's father → C is also B's son.",
  },
  {
    topic_id: T.series, concept_name: 'Mixed Series', difficulty: 3,
    question_text: "Find the next term: 5, 11, 23, 47, ?",
    options: [{id:'A',text:'95'},{id:'B',text:'94'},{id:'C',text:'92'},{id:'D',text:'96'}],
    correct_answer: 'A',
    explanation: 'Pattern: each term × 2 + 1. 47 × 2 + 1 = 95.',
  },

  // ════ LOGICAL · HARD (6) ════
  {
    topic_id: T.series, concept_name: 'Cubic Series', difficulty: 5,
    question_text: "Find the next term: 1, 8, 27, 64, 125, ?",
    options: [{id:'A',text:'180'},{id:'B',text:'196'},{id:'C',text:'216'},{id:'D',text:'225'}],
    correct_answer: 'C',
    explanation: 'Cubes of consecutive integers: 1³, 2³, 3³, 4³, 5³, 6³ = 216.',
  },
  {
    topic_id: T.inequalities, concept_name: 'Inequality Chains', difficulty: 4,
    question_text: "If A ≥ B > C = D, and E ≥ A, which is necessarily true?",
    options: [{id:'A',text:'E > D'},{id:'B',text:'E = D'},{id:'C',text:'E < D'},{id:'D',text:'Cannot determine'}],
    correct_answer: 'A',
    explanation: 'E ≥ A ≥ B > C = D, so E > D.',
  },
  {
    topic_id: T.puzzles, concept_name: 'Height Ordering', difficulty: 4,
    question_text: "A is taller than B but shorter than C. D is shorter than B. E is taller than C. Who is the tallest?",
    options: [{id:'A',text:'A'},{id:'B',text:'C'},{id:'C',text:'D'},{id:'D',text:'E'}],
    correct_answer: 'D',
    explanation: 'E > C > A > B > D. So E is tallest.',
  },
  {
    topic_id: T.syllogism, concept_name: 'Multi-step Syllogism', difficulty: 5,
    question_text: "Statements: All managers are workers. No worker is a director. Conclusion: No manager is a director. Valid?",
    options: [{id:'A',text:'Valid'},{id:'B',text:'Invalid'},{id:'C',text:'Cannot determine'},{id:'D',text:'Partially valid'}],
    correct_answer: 'A',
    explanation: 'managers ⊂ workers, and workers ∩ directors = ∅, so managers ∩ directors = ∅.',
  },
  {
    topic_id: T.coding, concept_name: 'Complex Coding', difficulty: 4,
    question_text: "If 'MANGO' = 'OCPIQ', how is 'APPLE' coded? (Each letter shifts +2)",
    options: [{id:'A',text:'CRRNG'},{id:'B',text:'BQQMF'},{id:'C',text:'CRRMG'},{id:'D',text:'CSSNG'}],
    correct_answer: 'A',
    explanation: 'A+2=C, P+2=R, P+2=R, L+2=N, E+2=G → CRRNG.',
  },
  {
    topic_id: T.series, concept_name: 'Self-Power Series', difficulty: 5,
    question_text: "Find the next term: 1, 4, 27, 256, ?",
    options: [{id:'A',text:'625'},{id:'B',text:'1024'},{id:'C',text:'3125'},{id:'D',text:'2500'}],
    correct_answer: 'C',
    explanation: 'Pattern is n^n: 1¹, 2², 3³, 4⁴, 5⁵ = 3125.',
  },

  // ════ VERBAL · EASY (6) ════
  {
    topic_id: T.synonyms, concept_name: 'Synonyms', difficulty: 1,
    question_text: "Choose the synonym of \"Begin\":",
    options: [{id:'A',text:'End'},{id:'B',text:'Start'},{id:'C',text:'Stop'},{id:'D',text:'Pause'}],
    correct_answer: 'B',
    explanation: "Begin and Start both mean to commence.",
  },
  {
    topic_id: T.synonyms, concept_name: 'Antonyms', difficulty: 1,
    question_text: "Choose the antonym of \"Brave\":",
    options: [{id:'A',text:'Bold'},{id:'B',text:'Cowardly'},{id:'C',text:'Strong'},{id:'D',text:'Fearless'}],
    correct_answer: 'B',
    explanation: 'Cowardly is the opposite of brave.',
  },
  {
    topic_id: T.sentenceComp, concept_name: 'Fill in the Blank', difficulty: 1,
    question_text: "Choose the correct word: She _____ her homework before dinner.",
    options: [{id:'A',text:'finish'},{id:'B',text:'finishes'},{id:'C',text:'finished'},{id:'D',text:'finishing'}],
    correct_answer: 'C',
    explanation: 'Past tense action: "finished" fits before "dinner."',
  },
  {
    topic_id: T.synonyms, concept_name: 'Synonyms', difficulty: 2,
    question_text: "Choose the synonym of \"Quick\":",
    options: [{id:'A',text:'Slow'},{id:'B',text:'Lazy'},{id:'C',text:'Fast'},{id:'D',text:'Calm'}],
    correct_answer: 'C',
    explanation: 'Quick = Fast.',
  },
  {
    topic_id: T.synonyms, concept_name: 'Antonyms', difficulty: 2,
    question_text: "Choose the antonym of \"Ancient\":",
    options: [{id:'A',text:'Old'},{id:'B',text:'Modern'},{id:'C',text:'Aged'},{id:'D',text:'Historic'}],
    correct_answer: 'B',
    explanation: 'Modern is the opposite of ancient.',
  },
  {
    topic_id: T.vocabulary, concept_name: 'Word Meanings', difficulty: 2,
    question_text: "What is the meaning of \"Hostile\"?",
    options: [{id:'A',text:'Friendly'},{id:'B',text:'Unfriendly'},{id:'C',text:'Helpful'},{id:'D',text:'Generous'}],
    correct_answer: 'B',
    explanation: 'Hostile means unfriendly or opposed.',
  },

  // ════ VERBAL · MEDIUM (6) ════
  {
    topic_id: T.errorSpotting, concept_name: 'Subject-Verb Agreement', difficulty: 3,
    question_text: "Identify the error: \"The team are playing well in the tournament.\"",
    options: [{id:'A',text:'No error'},{id:'B',text:'\"are\" should be \"is\"'},{id:'C',text:'\"playing\" should be \"play\"'},{id:'D',text:'\"in\" should be \"on\"'}],
    correct_answer: 'B',
    explanation: 'Collective noun "team" takes a singular verb in standard English.',
  },
  {
    topic_id: T.sentenceComp, concept_name: 'Contextual Fill', difficulty: 3,
    question_text: "Despite being tired, she _____ the marathon successfully.",
    options: [{id:'A',text:'started'},{id:'B',text:'avoided'},{id:'C',text:'completed'},{id:'D',text:'lost'}],
    correct_answer: 'C',
    explanation: '"Despite" indicates contrast — being tired but still finishing the marathon.',
  },
  {
    topic_id: T.vocabulary, concept_name: 'Advanced Vocabulary', difficulty: 3,
    question_text: "Choose the synonym of \"Ephemeral\":",
    options: [{id:'A',text:'Permanent'},{id:'B',text:'Short-lived'},{id:'C',text:'Eternal'},{id:'D',text:'Stable'}],
    correct_answer: 'B',
    explanation: 'Ephemeral means lasting a very short time.',
  },
  {
    topic_id: T.synonyms, concept_name: 'Advanced Antonyms', difficulty: 3,
    question_text: "Choose the antonym of \"Verbose\":",
    options: [{id:'A',text:'Talkative'},{id:'B',text:'Wordy'},{id:'C',text:'Concise'},{id:'D',text:'Eloquent'}],
    correct_answer: 'C',
    explanation: 'Verbose = wordy. Opposite = Concise (brief, to the point).',
  },
  {
    topic_id: T.grammar, concept_name: 'Articles', difficulty: 3,
    question_text: "Choose the correct article: \"He is _____ honest man.\"",
    options: [{id:'A',text:'a'},{id:'B',text:'an'},{id:'C',text:'the'},{id:'D',text:'no article'}],
    correct_answer: 'B',
    explanation: '"Honest" begins with a silent H — pronunciation starts with a vowel sound, so "an".',
  },
  {
    topic_id: T.sentenceComp, concept_name: 'Vocabulary in Context', difficulty: 3,
    question_text: "The scientist's _____ approach helped uncover the truth behind the mystery.",
    options: [{id:'A',text:'careless'},{id:'B',text:'meticulous'},{id:'C',text:'lazy'},{id:'D',text:'random'}],
    correct_answer: 'B',
    explanation: 'Meticulous = paying careful attention to detail. Fits the context of "uncovering truth".',
  },

  // ════ VERBAL · HARD (6) ════
  {
    topic_id: T.vocabulary, concept_name: 'Advanced Vocabulary', difficulty: 5,
    question_text: "Choose the synonym of \"Ubiquitous\":",
    options: [{id:'A',text:'Rare'},{id:'B',text:'Omnipresent'},{id:'C',text:'Hidden'},{id:'D',text:'Limited'}],
    correct_answer: 'B',
    explanation: 'Ubiquitous = present everywhere = Omnipresent.',
  },
  {
    topic_id: T.synonyms, concept_name: 'Advanced Antonyms', difficulty: 4,
    question_text: "Choose the antonym of \"Pristine\":",
    options: [{id:'A',text:'Pure'},{id:'B',text:'Polluted'},{id:'C',text:'New'},{id:'D',text:'Spotless'}],
    correct_answer: 'B',
    explanation: 'Pristine = pure / unspoiled. Opposite = Polluted.',
  },
  {
    topic_id: T.vocabulary, concept_name: 'Verbs of Concealment', difficulty: 5,
    question_text: "Choose the synonym of \"Obfuscate\":",
    options: [{id:'A',text:'Clarify'},{id:'B',text:'Confuse'},{id:'C',text:'Reveal'},{id:'D',text:'Explain'}],
    correct_answer: 'B',
    explanation: 'To obfuscate is to deliberately make something unclear or confusing.',
  },
  {
    topic_id: T.errorSpotting, concept_name: 'Pronoun Reference', difficulty: 4,
    question_text: "Identify the error: \"Neither of the students have submitted their assignment.\"",
    options: [{id:'A',text:'No error'},{id:'B',text:'\"have\" should be \"has\"'},{id:'C',text:'\"their\" should be \"his or her\"'},{id:'D',text:'Both B and C'}],
    correct_answer: 'D',
    explanation: '"Neither" is singular — verb should be "has" and pronoun should be singular ("his or her").',
  },
  {
    topic_id: T.vocabulary, concept_name: 'Idioms and Phrases', difficulty: 5,
    question_text: "What does the idiom \"Bite the bullet\" mean?",
    options: [{id:'A',text:'To run away'},{id:'B',text:'To endure a painful situation bravely'},{id:'C',text:'To attack someone'},{id:'D',text:'To remain silent'}],
    correct_answer: 'B',
    explanation: 'Bite the bullet = face a difficult/unpleasant situation with courage.',
  },
  {
    topic_id: T.paraJumbles, concept_name: 'Sentence Ordering', difficulty: 4,
    question_text: "Arrange in correct order: (1) The fire spread quickly. (2) Within minutes the building was engulfed. (3) A small spark ignited the curtains. (4) Firefighters arrived 20 minutes later.",
    options: [{id:'A',text:'3, 1, 2, 4'},{id:'B',text:'1, 3, 2, 4'},{id:'C',text:'3, 2, 1, 4'},{id:'D',text:'4, 3, 1, 2'}],
    correct_answer: 'A',
    explanation: 'Chronological cause→effect: spark (3) → fire spread (1) → engulfed (2) → firefighters arrived (4).',
  },
];

/* ──────────────────────────────────────────────────────────
   Main
   ────────────────────────────────────────────────────────── */
async function ensureConcept(topic_id, name) {
  // Reuse an existing concept with this name under the topic if present.
  const existing = await query(
    'SELECT concept_id FROM concepts WHERE topic_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
    [topic_id, name]
  );
  if (existing.rows.length > 0) return existing.rows[0].concept_id;
  // Otherwise create it.
  const cid = uuidv4();
  await query('INSERT INTO concepts (concept_id, topic_id, name) VALUES (?, ?, ?)', [cid, topic_id, name]);
  return cid;
}

async function questionExists(text) {
  const r = await query('SELECT question_id FROM questions WHERE question_text = ? LIMIT 1', [text]);
  return r.rows.length > 0;
}

async function run() {
  console.log(`Seeding ${QUESTIONS.length} balanced questions…`);
  let added = 0, skipped = 0;

  for (const q of QUESTIONS) {
    if (await questionExists(q.question_text)) {
      skipped++;
      continue;
    }
    // Resolve concept_id: either passed directly or look up / create by name under the topic.
    let concept_id = q.concept_id;
    if (!concept_id) {
      concept_id = await ensureConcept(q.topic_id, q.concept_name || 'General');
    }

    const qid = uuidv4();
    await query(
      `INSERT INTO questions
         (question_id, concept_id, question_text, question_type, options,
          correct_answer, explanation, difficulty, source, is_active)
       VALUES (?, ?, ?, 'mcq', ?, ?, ?, ?, 'seed_balanced', 1)`,
      [qid, concept_id, q.question_text, JSON.stringify(q.options),
       q.correct_answer, q.explanation || '', q.difficulty]
    );
    added++;
  }

  console.log(`\n✓ Added ${added} questions, skipped ${skipped} duplicates.`);

  // Print the new distribution.
  const dist = await query(`
    SELECT
      COALESCE(s.name, 'Unknown') AS subject,
      CASE WHEN q.difficulty <= 2 THEN 'Easy'
           WHEN q.difficulty = 3 THEN 'Medium'
           ELSE 'Hard' END AS tier,
      COUNT(*) AS cnt
    FROM questions q
    LEFT JOIN concepts c ON c.concept_id = q.concept_id
    LEFT JOIN topics t   ON t.topic_id   = c.topic_id
    LEFT JOIN subjects s ON s.subject_id = t.subject_id
    WHERE q.is_active = 1 AND q.question_type = 'mcq'
    GROUP BY s.name, tier
    ORDER BY s.name, tier
  `);
  console.log('\nNew distribution:');
  console.table(dist.rows);
  const total = dist.rows.reduce((s, r) => s + Number(r.cnt), 0);
  console.log('Total active questions:', total);

  process.exit(0);
}

run().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
