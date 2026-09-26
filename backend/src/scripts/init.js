import { initDatabase } from '../db/init.js';
import { pool } from '../db/pool.js';

try {
  await initDatabase();
  console.log('[db] ready');
} catch (err) {
  console.error(`[db] init failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
