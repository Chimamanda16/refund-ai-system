import pg from 'pg';
import { env } from '../config/env.js';

// NUMERIC (oid 1700) -> JS number. Fine for display and simple checks;
// the policy engine should compare money in cents or with a decimal library.
pg.types.setTypeParser(1700, (value) => parseFloat(value));

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => console.error('[db] idle client error:', err.message));

const toCamel = (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const camelizeRow = (row) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamel(key), value]));

/**
 * Parameterized query helper. Always pass values via `params` ($1, $2, ...),
 * never by string interpolation. Returns rows with camelCase keys.
 */
export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows.map(camelizeRow);
}

export async function checkDatabase() {
  await pool.query('SELECT 1');
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
