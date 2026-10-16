import type { Request, Response } from 'express';

const ONEMAP_SEARCH_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';

export interface OneMapSearchResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

export interface OneMapSearchResponse {
  found: number;
  totalNumPages: number;
  pageNum: number;
  results: OneMapSearchResult[];
}

/**
 * Fetch live data from OneMap Singapore Elastic Search API (no key required)
 */
export async function fetchOneMapSearch(params: {
  searchVal?: string;
  returnGeom?: string;
  getAddrDetails?: string;
  pageNum?: string | number;
}): Promise<OneMapSearchResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const searchVal = params.searchVal || '178903';
  const returnGeom = params.returnGeom || 'Y';
  const getAddrDetails = params.getAddrDetails || 'Y';
  const pageNum = String(params.pageNum || '1');

  const url = new URL(ONEMAP_SEARCH_URL);
  url.searchParams.set('searchVal', searchVal);
  url.searchParams.set('returnGeom', returnGeom);
  url.searchParams.set('getAddrDetails', getAddrDetails);
  url.searchParams.set('pageNum', pageNum);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SGAirWatch-OneMap/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OneMap responded with HTTP ${res.status}`);
    }

    return (await res.json()) as OneMapSearchResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Serverless / Express handler for GET /api/onemap
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
    const query = req.query || {};
    const searchVal = (query.searchVal as string) || '178903';
    const returnGeom = (query.returnGeom as string) || 'Y';
    const getAddrDetails = (query.getAddrDetails as string) || 'Y';
    const pageNum = (query.pageNum as string) || '1';

    const data = await fetchOneMapSearch({
      searchVal,
      returnGeom,
      getAddrDetails,
      pageNum,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data from OneMap API:', error);
    return res.status(502).json({
      error: 'Failed to fetch live data from OneMap Singapore',
      message: (error as Error).message,
      endpoint: ONEMAP_SEARCH_URL,
    });
  }
}
