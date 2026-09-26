import { waitForDatabase } from '../db/init.js';
import { runSeed } from '../db/seed.js';
import { pool } from '../db/pool.js';

try {
  await waitForDatabase();
  await runSeed();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
