import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { Clock } from '../../core/clock.js';
import type { Database } from '../../core/db/connection.js';
import { PROBLEM_TITLES, ProblemError } from '../../core/problem.js';
import { normalizeEmail } from './email.js';
import { findPublicUserById, findUserByEmail, type PublicUser } from './users.repository.js';

export const SESSION_COOKIE = 'khidma_session';
export const SESSION_TTL_SECONDS = 3600;

export interface AuthDeps { db: Database; clock: Clock; jwtSecret: string }

const nowSeconds = (clock: Clock) => Math.floor(clock.now().getTime() / 1000);

export async function authenticate(deps: AuthDeps, email: string, password: string): Promise<{ user: PublicUser; token: string }> {
  const found = findUserByEmail(deps.db, normalizeEmail(email));
  // Same error for unknown email and wrong password (D-5).
  if (!found || !(await argon2.verify(found.passwordHash, password))) {
    throw new ProblemError(401, 'INVALID_CREDENTIALS', PROBLEM_TITLES.INVALID_CREDENTIALS);
  }
  const { id, name, email: storedEmail, role, departmentId } = found;
  const token = jwt.sign({ sub: String(id), role, iat: nowSeconds(deps.clock) }, deps.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: SESSION_TTL_SECONDS,
  });
  return { user: { id, name, email: storedEmail, role, departmentId }, token };
}

export function resolveSession(deps: AuthDeps, token: string | undefined): PublicUser {
  const unauthenticated = () => new ProblemError(401, 'UNAUTHENTICATED', PROBLEM_TITLES.UNAUTHENTICATED);
  if (!token) throw unauthenticated();
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, deps.jwtSecret, {
      algorithms: ['HS256'],
      clockTimestamp: nowSeconds(deps.clock),
    }) as jwt.JwtPayload;
  } catch {
    throw unauthenticated();
  }
  const user = findPublicUserById(deps.db, Number(payload.sub));
  if (!user) throw unauthenticated();
  return user;
}
