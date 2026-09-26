import { waitForDatabase } from '../db/init.js';
import { runMigrations } from '../db/migrate.js';
import { pool } from '../db/pool.js';

try {
  await waitForDatabase();
  await runMigrations();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
