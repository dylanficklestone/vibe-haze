import type { Request, Response } from 'express';

const DATA_GOV_PSI_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';
const DATA_GOV_PM25_URL = 'https://api-open.data.gov.sg/v2/real-time/api/pm25';

export interface DataGovV2Response<T = unknown> {
  code: number;
  data: {
    regionMetadata: Array<{
      name: string;
      labelLocation: {
        latitude: number;
        longitude: number;
      };
    }>;
    items: Array<{
      date: string;
      updatedTimestamp: string;
      timestamp: string;
      readings: T;
    }>;
  };
  errorMsg: string;
}

/**
 * Fetch live PSI data directly from Data.gov.sg open API (no API key required)
 */
export async function fetchPsiData(): Promise<DataGovV2Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(DATA_GOV_PSI_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SGAirWatch-Serverless/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Data.gov.sg PSI responded with HTTP ${res.status}`);
    }

    return (await res.json()) as DataGovV2Response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch live PM2.5 data directly from Data.gov.sg open API (no API key required)
 */
export async function fetchPm25Data(): Promise<DataGovV2Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(DATA_GOV_PM25_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SGAirWatch-Serverless/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Data.gov.sg PM25 responded with HTTP ${res.status}`);
    }

    return (await res.json()) as DataGovV2Response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Serverless / Express handler for GET /api/psi
 * Supports query param ?include_pm25=true to fetch both in parallel
 */
export default async function handler(req: Request, res: Response) {
  // Set open CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const includePm25 =
      req.query?.include_pm25 === 'true' ||
      req.query?.include_pm25 === '1' ||
      req.query?.combined === 'true';

    if (includePm25) {
      const [psiResult, pm25Result] = await Promise.all([
        fetchPsiData(),
        fetchPm25Data().catch((err) => ({
          error: (err as Error).message,
          data: null,
        })),
      ]);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

      return res.status(200).json({
        success: true,
        source: 'https://api-open.data.gov.sg/v2/real-time/api',
        timestamp: new Date().toISOString(),
        psi: psiResult,
        pm25: pm25Result,
      });
    }

    const psiData = await fetchPsiData();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

    return res.status(200).json(psiData);
  } catch (error) {
    console.error('Error fetching data from data.gov.sg PSI endpoint:', error);
    return res.status(502).json({
      error: 'Failed to fetch live PSI data from data.gov.sg',
      message: (error as Error).message,
      endpoint: DATA_GOV_PSI_URL,
    });
  }
}
