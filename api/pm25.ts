import type { Request, Response } from 'express';
import { fetchPm25Data } from './psi';

const DATA_GOV_PM25_URL = 'https://api-open.data.gov.sg/v2/real-time/api/pm25';

/**
 * Serverless / Express handler for GET /api/pm25
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = await fetchPm25Data();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data from data.gov.sg PM2.5 endpoint:', error);
    return res.status(502).json({
      error: 'Failed to fetch live PM2.5 data from data.gov.sg',
      message: (error as Error).message,
      endpoint: DATA_GOV_PM25_URL,
    });
  }
}
