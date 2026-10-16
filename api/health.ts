import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  service: string;
  version: string;
  environment: string;
}

/**
 * Serverless / Express health check handler
 * GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const payload: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'sg-airwatch-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(payload);
}
