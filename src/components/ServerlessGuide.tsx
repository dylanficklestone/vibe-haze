import React, { useState } from 'react';
import { Server, Copy, Check, Terminal, ExternalLink, ArrowRight } from 'lucide-react';

export const ServerlessGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTestEndpoint = async () => {
    if (!customUrl) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(customUrl);
      if (res.ok) {
        const json = await res.json();
        setTestResult(`Success! Endpoint responded with HTTP ${res.status}. Received ${Object.keys(json).length} fields.`);
      } else {
        setTestResult(`Server responded with error status: HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      setTestResult(`Network or CORS error connecting to endpoint: ${(err as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const cloudflareWorkerCode = `// Cloudflare Worker / Vercel Edge Function
export default {
  async fetch(request, env, ctx) {
    // 1. Fetch live Singapore NEA data
    const [psiRes, pm25Res] = await Promise.all([
      fetch('https://api.data.gov.sg/v1/environment/psi'),
      fetch('https://api.data.gov.sg/v1/environment/pm25')
    ]);

    const psiData = await psiRes.json();
    const pm25Data = await pm25Res.json();

    // 2. Return combined payload with CORS headers
    return new Response(JSON.stringify({ psi: psiData, pm25: pm25Data }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // 5 min cache
      }
    });
  }
};`;

  const nodeExpressCode = `// AWS Lambda / Cloud Run / Node.js Serverless Handler
import express from 'express';
import fetch from 'node-fetch';

const app = express();

app.get('/api/air-quality', async (req, res) => {
  try {
    const [psiRes, pm25Res] = await Promise.all([
      fetch('https://api.data.gov.sg/v1/environment/psi'),
      fetch('https://api.data.gov.sg/v1/environment/pm25')
    ]);

    const psi = await psiRes.json();
    const pm25 = await pm25Res.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ psi, pm25, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch NEA feeds' });
  }
});

export default app;`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-6">
      <div className="flex items-center gap-2">
        <Server className="w-5 h-5 text-cyan-500" />
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Serverless Backend Connector
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Plug your serverless backend (Cloudflare Workers, AWS Lambda, Cloud Run, Firebase) into this frontend anytime
          </p>
        </div>
      </div>

      {/* Endpoint tester */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
        <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">
          Custom Serverless API Endpoint URL
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Once your backend is deployed, you can supply its URL below to test connectivity.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            placeholder="https://your-api.workers.dev/api/air-quality"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
          />
          <button
            onClick={handleTestEndpoint}
            disabled={isTesting || !customUrl}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {testResult && (
          <div className="mt-3 p-3 rounded-lg text-xs font-mono bg-slate-900 text-slate-200 border border-slate-700">
            {testResult}
          </div>
        )}
      </div>

      {/* Code Snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Snippet 1 */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              Cloudflare Worker / Vercel Edge
            </span>
            <button
              onClick={() => copyCode(cloudflareWorkerCode, 1)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-300 text-[11px] font-mono overflow-x-auto flex-1 leading-relaxed">
            <code>{cloudflareWorkerCode}</code>
          </pre>
        </div>

        {/* Snippet 2 */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              AWS Lambda / Google Cloud Run (Node)
            </span>
            <button
              onClick={() => copyCode(nodeExpressCode, 2)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 2 ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-300 text-[11px] font-mono overflow-x-auto flex-1 leading-relaxed">
            <code>{nodeExpressCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
