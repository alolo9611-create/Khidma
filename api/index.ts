// Vercel entry (zero-config Express: the first of app/index/server.ts that imports express). Local runs use server.ts.
// proxy.ts gates every path before this function.
import { fileURLToPath } from 'node:url';
import type { Express } from 'express';
import { createApp } from './create-app.js';
import { systemClock } from './core/clock.js';
import { loadConfig } from './core/config.js';
import { openDatabase } from './core/db/connection.js';

const { jwtSecret, databasePath, databaseAuthToken, timezone, trustProxy, previewGate } = loadConfig(process.env);

// A serverless filesystem is per instance and temporary: never fall back to a local SQLite file here.
if (!/^(libsql|https):\/\//.test(databasePath)) throw new Error('DATABASE_URL must be a hosted libSQL (Turso) URL on Vercel');
if (!previewGate) throw new Error('PREVIEW_PASSWORD is required on Vercel (shared preview gate)');

const app: Express = createApp({ db: openDatabase(databasePath, databaseAuthToken ?? undefined), clock: systemClock, jwtSecret, timezone, previewGate });
if (trustProxy) app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

// The SPA build (web/dist) is copied to views/ at build time: the Vercel Express builder always bundles views/**,
// while public/ is only picked up when it exists before the build starts. Same-origin with the API, like server.ts.
const spa = fileURLToPath(new URL('./views/', import.meta.url));
app.use((req, res, next) => {
  if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api/')) return next();
  const opts = { root: spa, dotfiles: 'deny' as const };
  res.sendFile(req.path, { ...opts, maxAge: '1h' }, (err) => {
    if (!err) return;
    if (req.path.startsWith('/assets/')) return next(); // a missing asset is a 404, not the SPA shell
    res.sendFile('index.html', { ...opts, headers: { 'Cache-Control': 'no-cache' } }, (e) => e && next(e));
  });
});

export default app;
