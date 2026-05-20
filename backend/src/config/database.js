const mysql = require('mysql2/promise');

const dbUrl = new URL(process.env.DATABASE_URL);

const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 4000,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.slice(1),
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  typeCast: function (field, next) {
    // Parse JSON type columns
    if (field.type === 'JSON') {
      const val = field.string('utf8');
      if (val === null) return null;
      try { return JSON.parse(val); } catch { return val; }
    }
    // TiDB returns JSON columns as BLOB — try to parse if it looks like JSON
    if (field.type === 'BLOB') {
      const val = field.string('utf8');
      if (val === null) return null;
      const trimmed = val.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try { return JSON.parse(trimmed); } catch {}
      }
      return val;
    }
    return next();
  },
});

const query = async (text, params) => {
  try {
    const [rows] = await pool.query(text, params || []);
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executed:', text.substring(0, 80));
    }
    return { rows };
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

const getClient = async () => {
  const conn = await pool.getConnection();
  return {
    query: async (text, params) => {
      const [rows] = await conn.query(text, params || []);
      return { rows };
    },
    release: () => conn.release(),
  };
};

module.exports = { query, getClient, pool };
