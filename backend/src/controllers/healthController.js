import * as healthService from '../services/healthService.js';

export async function getHealth(_req, res) {
  const health = await healthService.getHealth();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
}
