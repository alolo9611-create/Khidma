import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

// Shared preview-access gate for hosted trial deployments. It sits in front of everything — SPA, static files
// and API — and is separate from the app's own sign-in and role checks. HTTP Basic over HTTPS: browsers prompt
// once and resend the credentials on every same-origin request, including the SPA's fetch calls.
export interface PreviewGate { user: string; password: string }

const same = (a: string, b: string) => {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** True when an `Authorization` header carries the gate's Basic credentials. Shared with the Vercel proxy (proxy.ts). */
export function isAuthorized(header: string | null | undefined, gate: PreviewGate): boolean {
  if (!header?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const i = decoded.indexOf(':');
  return i >= 0 && same(decoded.slice(0, i), gate.user) && same(decoded.slice(i + 1), gate.password);
}

export const GATE_CHALLENGE = { header: 'Basic realm="Khidma preview", charset="UTF-8"', body: 'Khidma preview: team access only.' };

export function previewGate(gate: PreviewGate): RequestHandler {
  return (req, res, next) => {
    if (req.path === '/healthz') return next(); // host health check; returns no data
    if (isAuthorized(req.headers.authorization, gate)) return next();
    res.set('WWW-Authenticate', GATE_CHALLENGE.header).set('Cache-Control', 'no-store')
      .status(401).type('text/plain').send(GATE_CHALLENGE.body);
  };
}
