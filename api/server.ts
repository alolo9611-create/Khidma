import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import { createApp } from './create-app.js';
import { systemClock } from './core/clock.js';
import { loadConfig } from './core/config.js';
import { openDatabase } from './core/db/connection.js';

const { port, jwtSecret, databasePath, databaseAuthToken, timezone, trustProxy, staticDir, host, previewGate } = loadConfig(process.env);
const db = openDatabase(databasePath, databaseAuthToken ?? undefined);
const app = createApp({ db, clock: systemClock, jwtSecret, timezone, previewGate });

if (trustProxy) app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

// Production: serve the built SPA same-origin with the API (cookie + CSRF design, D-3).
if (staticDir) {
  const dir = resolve(staticDir);
  if (!existsSync(resolve(dir, 'index.html'))) throw new Error(`STATIC_DIR has no index.html: ${dir}`);
  app.use(express.static(dir, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => (req.method === 'GET' && !req.path.startsWith('/api/') ? res.sendFile(resolve(dir, 'index.html')) : next()));
}

const onListen = () => {
  console.log(`Khidma API listening on ${host ?? ''}:${port}${staticDir ? ' (serving the SPA)' : ''}${previewGate ? ' (preview gate on)' : ''}`);
};
if (host) app.listen(port, host, onListen); else app.listen(port, onListen);
