import type { Request, RequestHandler } from 'express';
import { problem } from '../../core/problem.js';
import { resolveSession, SESSION_COOKIE, type AuthDeps } from './auth.service.js';
import type { PublicUser, Role } from './users.repository.js';

// F-02 / BR-18. Mount before route handlers so errors reach problemMiddleware().
declare module 'express-serve-static-core' {
  interface Request { user?: PublicUser }
}

/** 401 UNAUTHENTICATED without a valid session (Q-16); 403 FORBIDDEN when the role is not allowed (PQ-08). */
export function requireRole(deps: AuthDeps, roles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = resolveSession(deps, req.cookies?.[SESSION_COOKIE]);
    if (roles.length > 0 && !roles.includes(user.role)) return next(problem('FORBIDDEN'));
    req.user = user;
    next();
  };
}

export function currentUser(req: Request): PublicUser {
  if (!req.user) throw problem('UNAUTHENTICATED');
  return req.user;
}
