import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import { createApp } from './app.js';
import { systemClock } from './core/clock.js';
import { loadConfig } from './core/config.js';
import { openDatabase } from './core/db/connection.js';

const { port, jwtSecret, databasePath, timezone, trustProxy, staticDir } = loadConfig(process.env);
const db = openDatabase(databasePath);
const app = createApp({ db, clock: systemClock, jwtSecret, timezone });

if (trustProxy) app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

// Production: serve the built SPA same-origin with the API (cookie + CSRF design, D-3).
if (staticDir) {
  const dir = resolve(staticDir);
  if (!existsSync(resolve(dir, 'index.html'))) throw new Error(`STATIC_DIR has no index.html: ${dir}`);
  app.use(express.static(dir, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => (req.method === 'GET' && !req.path.startsWith('/api/') ? res.sendFile(resolve(dir, 'index.html')) : next()));
}

app.listen(port, () => {
  console.log(`Khidma API listening on :${port}${staticDir ? ' (serving the SPA)' : ''}`);
});
