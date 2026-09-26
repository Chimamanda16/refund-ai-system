import { checkDatabase } from './pool.js';
import { runMigrations } from './migrate.js';
import { runSeed, isDatabaseEmpty } from './seed.js';
import { env } from '../config/env.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForDatabase({ retries = 30, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await checkDatabase();
      return;
    } catch (err) {
      console.log(`[db] waiting for PostgreSQL (${attempt}/${retries}): ${err.message}`);
      await sleep(delayMs);
    }
  }
  throw new Error('PostgreSQL did not become ready in time');
}

/** Wait, migrate, seed, only if the database is empty (when AUTO_SEED=true). */
export async function initDatabase() {
  await waitForDatabase();
  await runMigrations();
  if (env.autoSeed && (await isDatabaseEmpty())) {
    await runSeed();
  }
}
