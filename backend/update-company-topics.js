require('dotenv').config();
const mysql = require('mysql2/promise');

const dbUrl = new URL(process.env.DATABASE_URL);
const pool = mysql.createPool({
  host: dbUrl.hostname, port: parseInt(dbUrl.port) || 4000,
  user: decodeURIComponent(dbUrl.username), password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.slice(1),
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
});

const COMPANY_TOPICS = {
  'TCS': {
    mostImportant: ["Number System", "Percentages", "Time and Work"],
    important: ["Coding Decoding", "Syllogism", "Time Speed Distance", "Profit and Loss", "Series Completion"],
    needToSee: ["Blood Relations", "Reading Comprehension", "Probability", "Algebra", "Averages", "Para Jumbles", "Bar Charts"]
  },
  'Infosys': {
    mostImportant: ["Puzzles", "Seating Arrangement", "Data Interpretation"],
    important: ["Logical Reasoning", "Reading Comprehension", "Probability", "Series Completion", "Blood Relations"],
    needToSee: ["Time and Work", "Bar Charts", "Pie Charts", "Tables", "Line Graphs", "Vocabulary", "Caselets"]
  },
  'Wipro': {
    mostImportant: ["Number System", "Time Speed Distance", "Coding Decoding"],
    important: ["Syllogism", "Vocabulary", "Bar Charts", "Time and Work", "Blood Relations"],
    needToSee: ["Seating Arrangement", "Percentages", "Reading Comprehension", "Sentence Completion", "Series Completion", "Para Jumbles", "Probability"]
  },
  'Accenture': {
    mostImportant: ["Profit and Loss", "Percentages", "Blood Relations"],
    important: ["Para Jumbles", "Pie Charts", "Reading Comprehension", "Time and Work", "Coding Decoding"],
    needToSee: ["Syllogism", "Seating Arrangement", "Averages and Mixtures", "Series Completion", "Grammar and Usage", "Vocabulary", "Number System"]
  },
  'Capgemini': {
    mostImportant: ["Algebra", "Permutation and Combination", "Coding Decoding"],
    important: ["Sentence Completion", "Tables", "Syllogism", "Series Completion", "Puzzles"],
    needToSee: ["Time and Work", "Number System", "Reading Comprehension", "Blood Relations", "Averages", "Pie Charts", "Probability"]
  },
  'Cognizant': {
    mostImportant: ["Averages and Mixtures", "Ratio and Proportion", "Series Completion"],
    important: ["Grammar and Usage", "Line Graphs", "Blood Relations", "Time and Work", "Seating Arrangement"],
    needToSee: ["Coding Decoding", "Probability", "Number System", "Percentages", "Puzzles", "Reading Comprehension", "Bar Charts"]
  },
};

async function run() {
  const conn = await pool.getConnection();
  for (const [name, topics] of Object.entries(COMPANY_TOPICS)) {
    const json = JSON.stringify(topics);
    const [res] = await conn.execute('UPDATE companies SET important_topics = ? WHERE name = ?', [json, name]);
    console.log(`${name}: updated ${res.affectedRows} row(s)`);
  }
  conn.release();
  await pool.end();
  console.log('Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
