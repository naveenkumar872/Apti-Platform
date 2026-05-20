require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

(async () => {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port) || 4000,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1),
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  });

  // Reset admin password
  const adminHash = await bcrypt.hash('Admin@123', 12);
  await conn.query(
    "UPDATE users SET password_hash=?, is_verified=1, is_active=1 WHERE email='admin@aptitudeplatform.com'",
    [adminHash]
  );
  console.log('✓ Admin password reset to: Admin@123');

  // Create a demo student if not exists
  const { v4: uuidv4 } = require('uuid');
  const studentHash = await bcrypt.hash('Student@123', 12);
  await conn.query(
    `INSERT IGNORE INTO users (user_id, name, email, password_hash, role, is_verified, is_active, college, branch, year)
     VALUES (?, 'Demo Student', 'student@aptitudeplatform.com', ?, 'student', 1, 1, 'Demo College', 'CSE', 3)`,
    [uuidv4(), studentHash]
  );
  console.log('✓ Demo student created: student@aptitudeplatform.com / Student@123');

  await conn.end();
})();
