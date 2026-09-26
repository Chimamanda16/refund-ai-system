import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

// Local runs read the repo-root .env. In Docker the file is absent and
// variables come from docker-compose (dotenv silently ignores a missing file).
dotenv.config({ path: path.join(repoRoot, '.env'), quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL'),
  databaseDir: process.env.DATABASE_DIR ?? path.join(repoRoot, 'database'),
  autoSeed: (process.env.AUTO_SEED ?? 'true') === 'true',
});
