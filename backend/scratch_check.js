require('dotenv').config();
const { query } = require('./src/config/database');

async function main() {
  try {
    const res = await query("SELECT * FROM practice_sessions WHERE session_id IN ('4fd11888-73e9-46a4-b187-df2d567bb584', 'f736d303-6d6d-40b5-98d7-d647f53a8dae')");
    console.log("Full Session rows:", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
