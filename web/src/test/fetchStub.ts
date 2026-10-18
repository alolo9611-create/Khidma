import { vi } from 'vitest';
import type { SessionUser } from '../api/auth';

export const USERS: Record<string, SessionUser> = {
  faisal: { id: 1, name: 'Faisal Demo', email: 'faisal@khidma.test', role: 'APPLICANT', departmentId: null },
  noura: { id: 3, name: 'Noura Demo', email: 'noura@khidma.test', role: 'REVIEWER', departmentId: 1 },
  khalid: { id: 6, name: 'Khalid Demo', email: 'khalid@khidma.test', role: 'SUPERVISOR', departmentId: 1 },
};

export function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

export const problem = (status: number, code: string, title: string) =>
  json(status, { type: 'about:blank', title, status, code });

type Handler = (init?: RequestInit) => Response;

// Stubs global fetch. /me answers 401 unless a handler overrides it.
export function stubFetch(handlers: Record<string, Handler> = {}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const handler = handlers[url];
    if (handler) return handler(init);
    if (url === '/api/v1/auth/me') return problem(401, 'UNAUTHENTICATED', 'Not signed in.');
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
