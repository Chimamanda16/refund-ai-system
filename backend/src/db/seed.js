import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { pool } from './pool.js';

export async function isDatabaseEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM customers');
  return rows[0].n === 0;
}

/** Wipes application tables and reloads database/seeds/seed.sql in one transaction. */
export async function runSeed(log = console.log) {
  const sql = await fs.readFile(path.join(env.databaseDir, 'seeds', 'seed.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    log('[db] seed data loaded');
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`Seeding failed: ${err.message}`);
  } finally {
    client.release();
  }
}
