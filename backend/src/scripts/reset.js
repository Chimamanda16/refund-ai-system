import { env } from '../config/env.js';
import { waitForDatabase } from '../db/init.js';
import { runMigrations } from '../db/migrate.js';
import { runSeed } from '../db/seed.js';
import { pool } from '../db/pool.js';

if (env.nodeEnv === 'production') {
  console.error('Refusing to reset the database in production.');
  process.exit(1);
}

try {
  await waitForDatabase();
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  console.log('[db] schema dropped');
  await runMigrations();
  await runSeed();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
