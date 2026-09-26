import { env } from './config/env.js';
import { createApp } from './app.js';
import { pool } from './db/pool.js';

const server = createApp().listen(env.port, () => {
  console.log(`[api] listening on :${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal) {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
