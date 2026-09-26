import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Malformed JSON body (thrown by express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
  }

  // PostgreSQL constraint errors that reach the handler are client-caused.
  if (err.code === '23503') {
    return res.status(409).json({ error: { code: 'FOREIGN_KEY_VIOLATION', message: 'Referenced record does not exist' } });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: { code: 'UNIQUE_VIOLATION', message: 'Record already exists' } });
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: { code: 'CONSTRAINT_VIOLATION', message: 'Value violates a data constraint' } });
  }

  console.error('[error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.nodeEnv === 'production' ? 'Internal server error' : err.message,
    },
  });
}
