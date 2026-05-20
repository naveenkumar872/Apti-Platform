require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const runMigrations = async () => {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port) || 4000,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1),
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  });

  try {
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Remove BOM if present
      const cleanSql = sql.replace(/^\uFEFF/, '');

      // Split into individual statements, skip empty lines and comment-only blocks
      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => {
          // Remove lines that are only comments or whitespace
          const noComments = s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
          return noComments.length > 0;
        });

      console.log(`  Executing ${statements.length} statements...`);

      for (let i = 0; i < statements.length; i++) {
        try {
          await conn.query(statements[i]);
        } catch (err) {
          console.error(`  ✗ Statement ${i + 1} failed: ${err.message}`);
          console.error(`  SQL: ${statements[i].substring(0, 120)}...`);
          throw err;
        }
      }

      console.log(`✓ ${file} completed`);
    }

    console.log('\nAll migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
};

runMigrations();
