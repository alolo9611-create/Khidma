import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import type { Clock } from './core/clock.js';
import type { Database } from './core/db/connection.js';
import { problemMiddleware } from './core/problem.js';
import { authRouter } from './modules/accounts/auth.routes.js';
import { createLoginRateLimiter, type LoginRateLimiter } from './modules/accounts/login-rate-limiter.js';

export interface AppDeps { db: Database; clock: Clock; jwtSecret: string; limiter?: LoginRateLimiter }

// No CORS middleware: the SPA reaches the API same-origin (see the CSRF note in the plan).
export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/auth', authRouter({ ...deps, limiter: deps.limiter ?? createLoginRateLimiter(deps.clock) }));
  app.use(problemMiddleware());
  return app;
}
