#!/usr/bin/env node
// Smoke test for a deployed Khidma preview: access gate, SPA, API errors and the three role flows.
// Usage: PREVIEW_URL=https://<service>.onrender.com PREVIEW_PASSWORD=<gate password> node scripts/verify-preview.mjs
// Creates one demo request (approved). The preview database is disposable (see README).
import { readFileSync } from 'node:fs';

const BASE = (process.env.PREVIEW_URL ?? '').replace(/\/$/, '');
const PW = process.env.PREVIEW_PASSWORD ?? '';
const USER = process.env.PREVIEW_USER ?? 'khidma';
if (!BASE || !PW) { console.error('Set PREVIEW_URL and PREVIEW_PASSWORD.'); process.exit(2); }
const SEED_PW = /SEED_PASSWORD = '([^']+)'/.exec(readFileSync(new URL('../api/core/db/seed.ts', import.meta.url), 'utf8'))[1];
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PW}`).toString('base64');
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failures++; };

async function call(method, path, { body, cookie, auth = AUTH } = {}) {
  const headers = {};
  if (auth) headers.Authorization = auth;
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  return { status: res.status, text: await res.text(), headers: res.headers };
}
const json = (r) => JSON.parse(r.text);

const health = await call('GET', '/healthz', { auth: null }); // wakes a sleeping free instance (≈1 min)
check('health check open, no data', health.status === 200 && health.text === 'ok');
for (const p of ['/', '/catalog', '/api/v1/services', '/assets/']) {
  const r = await call('GET', p, { auth: null });
  check(`gate blocks ${p} without credentials`, r.status === 401 && /Basic/.test(r.headers.get('www-authenticate') ?? ''));
}
check('gate rejects a wrong password', (await call('GET', '/api/v1/services', { auth: 'Basic ' + Buffer.from(`${USER}:wrong-password-123`).toString('base64') })).status === 401);
const page = await call('GET', '/catalog');
check('SPA served behind the gate over HTTPS', page.status === 200 && page.text.includes('<div id="root">') && BASE.startsWith('https://'));
const asset = /src="(\/assets\/[^"]+\.js)"/.exec(page.text);
check('SPA asset served', asset ? (await call('GET', asset[1])).status === 200 : false);
const unknown = await call('GET', '/api/v1/nope');
check('unknown API route → problem+json 404', unknown.status === 404 && /problem\+json/.test(unknown.headers.get('content-type') ?? ''));
check('app sign-in still required behind the gate', (await call('GET', '/api/v1/auth/me')).status === 401);
check('wrong app password → INVALID_CREDENTIALS', (await call('POST', '/api/v1/auth/login', { body: { email: 'faisal@khidma.test', password: 'wrong' } })).text.includes('INVALID_CREDENTIALS'));

async function session(email) {
  const r = await call('POST', '/api/v1/auth/login', { body: { email, password: SEED_PW } });
  const c = r.headers.get('set-cookie') ?? '';
  check(`sign in as ${email.split('@')[0]} (Secure, HttpOnly cookie)`, r.status === 200 && /Secure/.test(c) && /HttpOnly/.test(c));
  return /(khidma_session=[^;]+)/.exec(c)?.[1];
}
const fa = await session('faisal@khidma.test');
const no = await session('noura@khidma.test');
const kh = await session('khalid@khidma.test');
const draft = await call('POST', '/api/v1/requests', { cookie: fa, body: { serviceCode: 'SHOP-LIC' } });
check('applicant creates a draft', draft.status === 201);
const id = json(draft).id;
check('incomplete submit → REQ_INCOMPLETE', (await call('POST', `/api/v1/requests/${id}/submit`, { cookie: fa, body: {} })).status === 422);
await call('PATCH', `/api/v1/requests/${id}`, { cookie: fa, body: { formData: { shopName: 'Demo Cafe', shopAddress: '12 Sample Street', activityType: 'Coffee shop' }, documents: { LEASE_CONTRACT: 'LC-1', CR_NUMBER: 'CR-1' } } });
const sub = await call('POST', `/api/v1/requests/${id}/submit`, { cookie: fa, body: {} });
check('submit → reference number and due date', sub.status === 200 && json(sub).referenceNo?.startsWith('KH-') && !!json(sub).dueAt);
check('reviewer sees the national ID masked before picking', json(await call('GET', `/api/v1/requests/${id}`, { cookie: no })).applicant.nationalId.startsWith('******'));
check('reviewer picks', (await call('POST', `/api/v1/requests/${id}/pick`, { cookie: no, body: {} })).status === 200);
const appr = await call('POST', `/api/v1/requests/${id}/approve`, { cookie: kh, body: {} });
check('supervisor approves → certificate', appr.status === 200 && json(appr).certificate?.status === 'VALID');
const ver = await call('GET', `/api/v1/verify/${json(appr).certificate?.certificateNo}`);
check('verify shows no personal data', ver.status === 200 && !/Faisal|nationalId/.test(ver.text));
check('supervisor dashboard', (await call('GET', '/api/v1/dashboard', { cookie: kh })).status === 200);
check('reviewer blocked from the dashboard (403)', (await call('GET', '/api/v1/dashboard', { cookie: no })).status === 403);
check('applicant notified of status changes', json(await call('GET', '/api/v1/notifications', { cookie: fa })).unread >= 3);
console.log(failures ? `RESULT: ${failures} FAILED` : 'RESULT: ALL PASS');
process.exit(failures ? 1 : 0);
