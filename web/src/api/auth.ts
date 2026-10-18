export type Role = 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR';
export interface SessionUser { id: number; name: string; email: string; role: Role; departmentId: number | null }

export class ApiProblem extends Error {
  constructor(readonly status: number, readonly code: string, title: string) { super(title); }
}

async function toProblem(res: Response): Promise<ApiProblem> {
  const body = await res.json().catch(() => ({}));
  return new ApiProblem(res.status, body.code ?? 'UNKNOWN', body.title ?? res.statusText);
}

// The HttpOnly cookie plus /me is the only session persistence (D-3): nothing goes to web storage.
export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await toProblem(res);
  return res.json();
}

export async function logout(): Promise<void> {
  const res = await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
  if (!res.ok) throw await toProblem(res);
}

export async function fetchMe(): Promise<SessionUser | null> {
  const res = await fetch('/api/v1/auth/me', { credentials: 'same-origin' });
  if (res.status === 401) return null;
  if (!res.ok) throw await toProblem(res);
  return res.json();
}
