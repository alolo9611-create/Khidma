// Vercel entry (zero-config Express: the first of app/index/server.ts that imports express). Local runs use server.ts.
// Vercel serves the built SPA from public/ on its CDN; proxy.ts gates every path before the CDN and this function.
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

export default app;
