/**
 * Global error handler middleware. Recognises both PostgreSQL SQLSTATE codes
 * (kept for backwards compatibility) and MySQL/TiDB error codes so DB
 * constraint violations come back as proper 4xx responses instead of opaque 500s.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack || err.message || err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Payload too large (multer / body-parser)
  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Uploaded file is too large' });
  }

  // Unique violation: PG=23505 | MySQL/TiDB=1062 (ER_DUP_ENTRY) | also code 'ER_DUP_ENTRY'
  if (err.code === '23505' || err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  // Foreign-key violation: PG=23503 | MySQL/TiDB=1452 (ER_NO_REFERENCED_ROW_2), 1451 (parent has children)
  if (err.code === '23503' || err.errno === 1452 || err.errno === 1451 || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  // Unknown column / table — usually means a migration hasn't run.
  if (err.errno === 1054 || err.errno === 1146 || err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      error: 'Database schema mismatch — please run pending migrations',
      hint: 'cd backend && npm run migrate',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
};

/**
 * 404 handler
 */
const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
};

/**
 * Create an error with a status code
 */
const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, notFound, createError };
