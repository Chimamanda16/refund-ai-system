import { checkDatabase } from '../db/pool.js';

export async function getHealth() {
  let database = 'up';
  try {
    await checkDatabase();
  } catch {
    database = 'down';
  }
  return {
    status: database === 'up' ? 'ok' : 'degraded',
    api: 'up',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
