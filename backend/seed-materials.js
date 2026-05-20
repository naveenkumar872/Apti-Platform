/**
 * Seed dummy study materials into TiDB.
 * Run: node seed-materials.js
 */
require('dotenv').config();
const { query } = require('./src/config/database');
const { v4: uuidv4 } = require('uuid');

// Admin user ID to use as uploaded_by
const ADMIN_ID = '00000000-0000-0000-0000-000000000099';

const materials = [
  // ─── Quantitative Aptitude ────────────────────────────────────────────────
  { title: 'Number System – Complete Notes', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000001', file_url: 'https://www.examveda.com/mcq-question-on-number-system-practice-pdf', description: 'Comprehensive notes covering LCM, HCF, divisibility rules, and number types.' },
  { title: 'Number System – Video Lecture (Full)', type: 'video', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000001', file_url: 'https://www.youtube.com/watch?v=T1OmYWBLZKI', description: 'Detailed video lecture on number system concepts for placement exams.' },
  { title: 'Percentages – Tricks and Shortcuts', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000002', file_url: 'https://www.examveda.com/percentage-mcq-aptitude', description: 'Quick tricks and shortcut formulas for solving percentage problems in under 30 seconds.' },
  { title: 'Percentages – Video with Practice', type: 'video', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000002', file_url: 'https://www.youtube.com/watch?v=rR95Cbcjzus', description: 'End-to-end percentage problems with worked examples and practice.' },
  { title: 'Profit and Loss – Concept Sheet', type: 'note', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000003', file_url: 'https://www.bankersadda.com/profit-and-loss-pdf/', description: 'One-page concept sheet on profit & loss formulas with examples.' },
  { title: 'Profit and Loss – Solved Examples', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000003', file_url: 'https://www.indiabix.com/aptitude/profit-and-loss/', description: '50 solved problems on profit and loss with detailed explanations.' },
  { title: 'Time and Work – Master Class', type: 'video', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000004', file_url: 'https://www.youtube.com/watch?v=IuJpbq1kD60', description: 'Master time and work problems including pipes & cisterns.' },
  { title: 'Time and Work – Formula Sheet', type: 'note', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000004', file_url: 'https://www.bankersadda.com/time-and-work-pdf/', description: 'Quick-reference formula sheet for time and work problems.' },
  { title: 'Time Speed Distance – Complete Guide', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000005', file_url: 'https://www.indiabix.com/aptitude/time-and-distance/', description: 'Complete guide covering boats, trains, and relative speed problems.' },
  { title: 'Speed Distance Time – Video', type: 'video', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000005', file_url: 'https://www.youtube.com/watch?v=CX9F7oEDZC8', description: 'Visual explanation of speed, distance, and time with tricky problems.' },
  { title: 'Simple & Compound Interest – Notes', type: 'note', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000006', file_url: 'https://www.bankersadda.com/simple-and-compound-interest-pdf/', description: 'All formulas for SI and CI with practice sets.' },
  { title: 'Algebra for Placement Exams', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000007', file_url: 'https://www.indiabix.com/aptitude/problems-on-algebra/', description: 'Algebraic expressions, equations, and simplification techniques.' },
  { title: 'Probability – Explained Simply', type: 'video', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000009', file_url: 'https://www.youtube.com/watch?v=KzfWUEJjG18', description: 'Probability from basics to advanced placement problems.' },
  { title: 'Permutation & Combination – Practice PDF', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000010', file_url: 'https://www.indiabix.com/aptitude/permutation-and-combination/', description: '100 practice problems with complete solutions.' },
  { title: 'Ratio & Proportion – Quick Notes', type: 'note', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: '10000000-0000-0000-0000-000000000011', file_url: 'https://www.bankersadda.com/ratio-and-proportion-pdf/', description: 'Key formulas and solved examples for ratio and proportion.' },

  // ─── Logical Reasoning ────────────────────────────────────────────────────
  { title: 'Blood Relations – Concept + Practice', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000002', topic_id: '20000000-0000-0000-0000-000000000001', file_url: 'https://www.indiabix.com/logical-reasoning/blood-relations/', description: 'Solve blood relation puzzles using chart and tree methods.' },
  { title: 'Seating Arrangement – Strategy Video', type: 'video', subject_id: '00000000-0000-0000-0000-000000000002', topic_id: '20000000-0000-0000-0000-000000000002', file_url: 'https://www.youtube.com/watch?v=4pqLnCHEEHY', description: 'Step-by-step approach to linear and circular seating arrangements.' },
  { title: 'Syllogism – Complete Notes', type: 'note', subject_id: '00000000-0000-0000-0000-000000000002', topic_id: '20000000-0000-0000-0000-000000000003', file_url: 'https://www.bankersadda.com/syllogism-pdf/', description: 'Venn diagram and possibility-based approach to syllogism problems.' },
  { title: 'Coding Decoding – Pattern Guide', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000002', topic_id: '20000000-0000-0000-0000-000000000004', file_url: 'https://www.indiabix.com/logical-reasoning/coding-decoding/', description: 'All coding patterns: letter shift, number, symbol, and mixed coding.' },
  { title: 'Directions & Distance – Video', type: 'video', subject_id: '00000000-0000-0000-0000-000000000002', topic_id: '20000000-0000-0000-0000-000000000005', file_url: 'https://www.youtube.com/watch?v=B7m8oVcpXbQ', description: 'Compass-based direction problems solved visually with diagrams.' },
  { title: 'Series Completion – Types & Tricks', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000002', topic_id: '20000000-0000-0000-0000-000000000006', file_url: 'https://www.indiabix.com/logical-reasoning/number-series/', description: 'All series types: arithmetic, geometric, Fibonacci, and mixed patterns.' },
  { title: 'Puzzles – 50 Solved Examples', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000002', topic_id: '20000000-0000-0000-0000-000000000007', file_url: 'https://www.bankersadda.com/puzzle-pdf/', description: 'Curated 50 placement-level puzzles with detailed solutions.' },
  { title: 'Clocks and Calendars – Shortcut Notes', type: 'note', subject_id: '00000000-0000-0000-0000-000000000002', topic_id: '20000000-0000-0000-0000-000000000009', file_url: 'https://www.bankersadda.com/clock-calendar-pdf/', description: 'Formula-based approach to clock angles and calendar day-of-week problems.' },

  // ─── Verbal Ability ───────────────────────────────────────────────────────
  { title: 'Reading Comprehension – Strategy Guide', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000003', topic_id: '30000000-0000-0000-0000-000000000001', file_url: 'https://www.indiabix.com/verbal-ability/reading-comprehension/', description: 'Effective strategies for scanning, skimming, and answering RC passages.' },
  { title: 'Grammar – Common Errors PDF', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000003', topic_id: '30000000-0000-0000-0000-000000000002', file_url: 'https://www.bankersadda.com/english-grammar-pdf/', description: '200 common grammar mistakes with corrections and rules.' },
  { title: 'Vocabulary Building – 1000 Words', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000003', topic_id: '30000000-0000-0000-0000-000000000003', file_url: 'https://www.bankersadda.com/vocabulary-pdf/', description: 'Top 1000 words asked in placement exams with meanings and usage.' },
  { title: 'Synonyms & Antonyms – High Frequency', type: 'note', subject_id: '00000000-0000-0000-0000-000000000003', topic_id: '30000000-0000-0000-0000-000000000005', file_url: 'https://www.indiabix.com/verbal-ability/synonyms/', description: 'High-frequency synonym/antonym pairs from actual placement papers.' },
  { title: 'Para Jumbles – Approach Video', type: 'video', subject_id: '00000000-0000-0000-0000-000000000003', topic_id: '30000000-0000-0000-0000-000000000006', file_url: 'https://www.youtube.com/watch?v=xIB0oxdqcng', description: 'Systematic approach to solving para jumble questions.' },
  { title: 'Error Spotting – 100 Sentences', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000003', topic_id: '30000000-0000-0000-0000-000000000007', file_url: 'https://www.bankersadda.com/error-spotting-pdf/', description: '100 error spotting sentences with grammatical explanations.' },

  // ─── Data Interpretation ─────────────────────────────────────────────────
  { title: 'Bar Charts – Solved Practice Set', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000004', topic_id: '40000000-0000-0000-0000-000000000001', file_url: 'https://www.indiabix.com/data-interpretation/bar-charts/', description: '30 bar chart sets with detailed solutions for placement preparation.' },
  { title: 'Line Graphs – Complete Guide', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000004', topic_id: '40000000-0000-0000-0000-000000000002', file_url: 'https://www.indiabix.com/data-interpretation/line-charts/', description: 'How to read and interpret line graphs quickly and accurately.' },
  { title: 'Pie Charts – Video Explanation', type: 'video', subject_id: '00000000-0000-0000-0000-000000000004', topic_id: '40000000-0000-0000-0000-000000000003', file_url: 'https://www.youtube.com/watch?v=U1o2kxBXrH8', description: 'Visual guide to pie chart problems with percentage calculations.' },
  { title: 'Table DI – Practice Workbook', type: 'pdf', subject_id: '00000000-0000-0000-0000-000000000004', topic_id: '40000000-0000-0000-0000-000000000004', file_url: 'https://www.indiabix.com/data-interpretation/table-charts/', description: '25 tabular DI sets from actual placement papers with step-by-step solutions.' },

  // ─── Past Papers ─────────────────────────────────────────────────────────
  { title: 'TCS NQT 2023 – Full Paper with Solutions', type: 'past_paper', subject_id: null, topic_id: null, file_url: 'https://www.tcsionhub.in/ievolve/prep/', description: 'Full TCS National Qualifier Test 2023 paper with detailed solutions.' },
  { title: 'Infosys Placement Paper 2023 – Quantitative', type: 'past_paper', subject_id: '00000000-0000-0000-0000-000000000001', topic_id: null, file_url: 'https://www.indiabix.com/placement-papers/infosys/', description: 'Infosys 2023 quantitative section with 30 questions and solutions.' },
  { title: 'Wipro NLTH 2023 – Previous Paper', type: 'past_paper', subject_id: null, topic_id: null, file_url: 'https://www.indiabix.com/placement-papers/wipro/', description: 'Wipro National Level Talent Hunt 2023 complete paper.' },
  { title: 'Accenture Aptitude Paper 2023', type: 'past_paper', subject_id: null, topic_id: null, file_url: 'https://www.indiabix.com/placement-papers/accenture/', description: 'Accenture 2023 aptitude section with all 3 modules.' },
  { title: 'Cognizant GenC 2023 – Full Paper', type: 'past_paper', subject_id: null, topic_id: null, file_url: 'https://www.indiabix.com/placement-papers/cognizant/', description: 'Cognizant GenC 2023 aptitude + reasoning + verbal paper.' },
];

async function seed() {
  console.log('Seeding dummy study materials...');

  // Get admin user id (if exists)
  const adminResult = await query("SELECT user_id FROM users WHERE role='admin' LIMIT 1", []);
  const uploaded_by = adminResult.rows[0]?.user_id || ADMIN_ID;

  let inserted = 0;
  for (const m of materials) {
    const material_id = uuidv4();
    try {
      await query(
        `INSERT IGNORE INTO materials
           (material_id, title, type, file_url, description, subject_id, topic_id, uploaded_by, visibility, download_allowed, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'public', 1, 1)`,
        [material_id, m.title, m.type, m.file_url, m.description || null,
         m.subject_id || null, m.topic_id || null, uploaded_by]
      );
      inserted++;
      process.stdout.write(`  ✓ ${m.title}\n`);
    } catch (err) {
      console.error(`  ✗ Failed: ${m.title} — ${err.message}`);
    }
  }

  console.log(`\nDone! Inserted ${inserted}/${materials.length} materials.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
