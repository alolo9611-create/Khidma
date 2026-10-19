import type { ErrorRequestHandler } from 'express';

export type ProblemCode =
  | 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'UNAUTHENTICATED' // Story 28 (Q-15, Q-16)
  | 'FORBIDDEN' | 'NOT_FOUND' | 'REQ_INCOMPLETE' | 'REQ_DUPLICATE_OPEN' | 'SERVICE_INACTIVE'
  | 'INVALID_TRANSITION' | 'LOAD_LIMIT' | 'INFO_LIMIT'; // PQ-08 / PQ-09

// Approved public wording. VALIDATION_ERROR here is the login-only text (Q-15);
// every other endpoint uses GENERIC_VALIDATION_TITLE with a `fields` list (PQ-09).
export const PROBLEM_TITLES: Record<ProblemCode, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  VALIDATION_ERROR: 'Email and password are required.',
  RATE_LIMITED: 'Too many failed login attempts. Try again later.',
  UNAUTHENTICATED: 'Not signed in.',
  FORBIDDEN: 'You do not have access to this resource.',
  NOT_FOUND: 'Not found.',
  REQ_INCOMPLETE: 'Complete all required fields and documents before submitting.',
  REQ_DUPLICATE_OPEN: 'You already have an open request for this service.',
  SERVICE_INACTIVE: 'This service is not currently available.',
  INVALID_TRANSITION: "This action is not allowed in the request's current status.",
  LOAD_LIMIT: 'You have reached your active request limit.',
  INFO_LIMIT: 'This request has reached the maximum number of information requests.',
};
export const GENERIC_VALIDATION_TITLE = 'Some fields are invalid.';

export class ProblemError extends Error {
  constructor(
    readonly status: number,
    readonly code: ProblemCode,
    readonly title: string,
    readonly extra: Record<string, unknown> = {},
  ) { super(title); }
}

const STATUS: Record<ProblemCode, number> = {
  INVALID_CREDENTIALS: 401, VALIDATION_ERROR: 400, RATE_LIMITED: 429, UNAUTHENTICATED: 401, FORBIDDEN: 403,
  NOT_FOUND: 404, REQ_INCOMPLETE: 422, REQ_DUPLICATE_OPEN: 409, SERVICE_INACTIVE: 409, INVALID_TRANSITION: 409,
  LOAD_LIMIT: 409, INFO_LIMIT: 409,
};

/** Shorthand for the decided status + title of a code. */
export function problem(code: Exclude<ProblemCode, 'VALIDATION_ERROR'>, extra: Record<string, unknown> = {}): ProblemError {
  return new ProblemError(STATUS[code], code, PROBLEM_TITLES[code], extra);
}

/** Non-login validation failure: generic title plus the invalid field names (PQ-09). */
export function invalid(fields: string[]): ProblemError {
  return new ProblemError(400, 'VALIDATION_ERROR', GENERIC_VALIDATION_TITLE, { fields });
}

function send(res: Parameters<ErrorRequestHandler>[2], status: number, body: Record<string, unknown>) {
  res.status(status).type('application/problem+json').send(JSON.stringify({ type: 'about:blank', status, ...body }));
}

export function problemMiddleware(): ErrorRequestHandler {
  return (err, req, res, _next) => {
    let p: ProblemError | undefined;
    if (err instanceof ProblemError) p = err;
    else if (err?.type === 'entity.parse.failed') {
      p = req.originalUrl.startsWith('/api/v1/auth/login')
        ? new ProblemError(400, 'VALIDATION_ERROR', PROBLEM_TITLES.VALIDATION_ERROR)
        : invalid(['body']);
    } else if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500 && err.expose) {
      // body-parser client errors (too large, bad encoding…): problem+json, never an HTML page or stack trace.
      return send(res, err.status, { title: 'The request could not be read.', code: 'VALIDATION_ERROR', fields: ['body'] });
    }
    if (!p) {
      console.error(err); // unexpected: log server-side only
      return send(res, 500, { title: 'Something went wrong.', code: 'INTERNAL_ERROR' });
    }
    send(res, p.status, { title: p.title, code: p.code, ...p.extra });
  };
}

/** Unknown /api routes answer problem+json 404 instead of Express's HTML page. */
export const apiNotFound: import('express').RequestHandler = (_req, _res, next) => next(problem('NOT_FOUND'));
