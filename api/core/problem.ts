import type { ErrorRequestHandler } from 'express';

export type ProblemCode = 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'UNAUTHENTICATED'; // UNAUTHENTICATED: Q-16

// Approved public wording (Q-15, Q-16).
export const PROBLEM_TITLES: Record<ProblemCode, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  VALIDATION_ERROR: 'Email and password are required.',
  RATE_LIMITED: 'Too many failed login attempts. Try again later.',
  UNAUTHENTICATED: 'Not signed in.',
};

export class ProblemError extends Error {
  constructor(readonly status: number, readonly code: ProblemCode, readonly title: string) { super(title); }
}

export function problemMiddleware(): ErrorRequestHandler {
  return (err, _req, res, next) => {
    let problem: ProblemError | undefined;
    if (err instanceof ProblemError) problem = err;
    else if (err?.type === 'entity.parse.failed') {
      problem = new ProblemError(400, 'VALIDATION_ERROR', PROBLEM_TITLES.VALIDATION_ERROR);
    }
    if (!problem) return next(err);
    res
      .status(problem.status)
      .type('application/problem+json')
      .send(JSON.stringify({ type: 'about:blank', title: problem.title, status: problem.status, code: problem.code }));
  };
}
