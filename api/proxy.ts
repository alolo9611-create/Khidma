// Vercel Routing Middleware: the shared preview gate in front of everything, including the CDN-served SPA files
// (Express's own gate never sees those requests on Vercel). Same check as core/preview-gate.ts. Fails closed.
import { next } from '@vercel/functions';
import { GATE_CHALLENGE, isAuthorized } from './core/preview-gate.js';

export default function proxy(request: Request): Response {
  if (new URL(request.url).pathname === '/healthz') return next(); // returns only "ok"
  const password = process.env.PREVIEW_PASSWORD ?? '';
  if (password.length < 16) {
    return new Response('Khidma preview: gate not configured.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  if (isAuthorized(request.headers.get('authorization'), { user: process.env.PREVIEW_USER || 'khidma', password })) return next();
  return new Response(GATE_CHALLENGE.body, {
    status: 401,
    headers: { 'WWW-Authenticate': GATE_CHALLENGE.header, 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
