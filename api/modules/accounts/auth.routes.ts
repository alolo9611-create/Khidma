import { Router, type CookieOptions } from 'express';
import { PROBLEM_TITLES, ProblemError } from '../../core/problem.js';
import { authenticate, resolveSession, SESSION_COOKIE, SESSION_TTL_SECONDS, type AuthDeps } from './auth.service.js';
import type { LoginRateLimiter } from './login-rate-limiter.js';

const COOKIE_OPTIONS: CookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' };

export function authRouter(deps: AuthDeps & { limiter: LoginRateLimiter }): Router {
  const router = Router();

  router.post('/login', async (req, res) => {
    const ip = req.ip ?? 'unknown';
    if (deps.limiter.isBlocked(ip)) {
      throw new ProblemError(429, 'RATE_LIMITED', PROBLEM_TITLES.RATE_LIMITED);
    }
    // Express 5 leaves req.body undefined when no JSON body was parsed.
    const body = req.body ?? {};
    const { email, password } = body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      throw new ProblemError(400, 'VALIDATION_ERROR', PROBLEM_TITLES.VALIDATION_ERROR);
    }
    let result;
    try {
      result = await authenticate(deps, email, password);
    } catch (err) {
      if (err instanceof ProblemError && err.code === 'INVALID_CREDENTIALS') deps.limiter.recordFailure(ip);
      throw err;
    }
    res.cookie(SESSION_COOKIE, result.token, { ...COOKIE_OPTIONS, maxAge: SESSION_TTL_SECONDS * 1000 });
    res.status(200).json(result.user);
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS);
    res.status(204).end();
  });

  router.get('/me', (req, res) => {
    res.status(200).json(resolveSession(deps, req.cookies?.[SESSION_COOKIE]));
  });

  return router;
}
