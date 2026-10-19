import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import type { Clock } from './core/clock.js';
import type { Database } from './core/db/connection.js';
import { previewGate, type PreviewGate } from './core/preview-gate.js';
import { apiNotFound, problemMiddleware } from './core/problem.js';
import { authRouter } from './modules/accounts/auth.routes.js';
import { createLoginRateLimiter, type LoginRateLimiter } from './modules/accounts/login-rate-limiter.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { requestsRouter } from './modules/requests/requests.routes.js';
import { reviewRouter } from './modules/review/review.routes.js';
import { trustRouter } from './modules/trust/trust.routes.js';

export interface AppDeps { db: Database; clock: Clock; jwtSecret: string; limiter?: LoginRateLimiter; timezone?: string; previewGate?: PreviewGate | null }

// No CORS middleware: the SPA reaches the API same-origin (see the CSRF note in the plan).
export function createApp(deps: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  if (deps.previewGate) app.use(previewGate(deps.previewGate)); // before everything, including static files
  app.get('/healthz', (_req, res) => { res.type('text/plain').send('ok'); });
  const full = { ...deps, timezone: deps.timezone ?? 'Asia/Riyadh' };
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/auth', authRouter({ ...deps, limiter: deps.limiter ?? createLoginRateLimiter(deps.clock) }));
  app.use('/api/v1/services', catalogRouter(full));
  app.use('/api/v1/requests', requestsRouter(full));
  app.use('/api/v1', reviewRouter(full));
  app.use('/api/v1', trustRouter(full));
  app.use('/api', apiNotFound);
  app.use(problemMiddleware());
  return app;
}
