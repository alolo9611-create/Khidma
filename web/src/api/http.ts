export const SESSION_EXPIRED = 'khidma:session-expired';

// Same-origin JSON client. The session lives only in the HttpOnly cookie (D-3).
export class ApiProblem extends Error {
  constructor(readonly status: number, readonly code: string, title: string, readonly body: Record<string, unknown> = {}) { super(title); }
  get fields(): string[] { return Array.isArray(this.body.fields) ? (this.body.fields as string[]) : []; }
}

export async function toProblem(res: Response): Promise<ApiProblem> {
  const body = await res.json().catch(() => ({}));
  return new ApiProblem(res.status, body.code ?? 'UNKNOWN', body.title ?? res.statusText, body);
}

export async function api<T>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const problem = await toProblem(res);
    // Session expired or revoked mid-use (D-3: 1-hour JWT): let the SessionProvider sign the user out.
    if (problem.status === 401 && problem.code === 'UNAUTHENTICATED') window.dispatchEvent(new Event(SESSION_EXPIRED));
    throw problem;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
