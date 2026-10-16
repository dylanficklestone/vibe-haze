import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler from './api/health';
import psiHandler from './api/psi';
import pm25Handler from './api/pm25';
import onemapHandler from './api/onemap';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Mount API endpoints from root /api folder
  app.all('/api/health', (req, res) => healthHandler(req, res));
  app.all('/api/psi', (req, res) => psiHandler(req, res));
  app.all('/api/pm25', (req, res) => pm25Handler(req, res));
  app.all('/api/onemap', (req, res) => onemapHandler(req, res));

  // Also support /api/psi/ts in case of path-based query
  app.all('/api/psi/ts', (req, res) => psiHandler(req, res));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG AirWatch Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
