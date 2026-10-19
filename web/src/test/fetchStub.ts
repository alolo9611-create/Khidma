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

type Handler = (init?: RequestInit, url?: string) => Response;

export const SERVICES = [
  { id: 1, code: 'SHOP-LIC', name: 'Shop licence renewal', slaDays: 5, allowMultiple: false, isActive: true, department: { id: 1, name: 'Licensing' },
    documents: [{ typeCode: 'LEASE_CONTRACT', label: 'Lease contract number', mandatory: true }, { typeCode: 'CR_NUMBER', label: 'Commercial registration number', mandatory: true }],
    fields: [{ name: 'shopName', label: 'Shop name', type: 'text', min: 3, max: 100 }] },
];

// Read-only defaults so the app shell can render; tests override what they exercise.
const DEFAULTS: Record<string, Handler> = {
  '/api/v1/notifications': () => json(200, { unread: 0, items: [] }),
  '/api/v1/services': () => json(200, SERVICES),
  '/api/v1/requests/mine': () => json(200, []),
  '/api/v1/queue': () => json(200, []),
  '/api/v1/me/load': () => json(200, { active: 0, limit: 10 }),
  '/api/v1/dashboard': () => json(200, { department: { id: 1, name: 'Licensing' }, open: 0, atRisk: 0, overdue: 0, reviewers: [] }),
};

// Stubs global fetch. Handlers match the path without the query string. /me answers 401 unless overridden.
export function stubFetch(handlers: Record<string, Handler> = {}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.split('?')[0];
    const handler = handlers[url] ?? handlers[path] ?? DEFAULTS[path];
    if (handler) return handler(init, url);
    if (path === '/api/v1/auth/me') return problem(401, 'UNAUTHENTICATED', 'Not signed in.');
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const me = (u: SessionUser) => () => json(200, u);
