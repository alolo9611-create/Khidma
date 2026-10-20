import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../create-app.js';
import { fakeClock, seededDb, TEST_SECRET } from '../../test/helpers.js';

const LOGIN = '/api/v1/auth/login';
const D6_KEYS = ['id', 'name', 'email', 'role', 'departmentId'];
const VALID = { email: 'noura@khidma.test', password: 'Passw0rd!' };
const WRONG = { email: 'noura@khidma.test', password: 'wrong' };

async function setup() {
  const clock = fakeClock(new Date('2026-01-01T09:00:00Z'));
  const app = createApp({ db: await seededDb(), clock, jwtSecret: TEST_SECRET });
  return { app, clock };
}

function sessionToken(setCookie: string[] | string | undefined): string {
  const header = [setCookie ?? []].flat().find((c) => c.startsWith('khidma_session='))!;
  return header.split(';')[0].slice('khidma_session='.length);
}

describe('POST /api/v1/auth/login', () => {
  it.each([
    ['faisal@khidma.test', 'APPLICANT'],
    ['noura@khidma.test', 'REVIEWER'],
    ['khalid@khidma.test', 'SUPERVISOR'],
  ])('signs in %s', async (email, role) => {
    const { app } = await setup();
    const res = await request(app).post(LOGIN).send({ email, password: 'Passw0rd!' });
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(D6_KEYS);
    expect(res.body).not.toHaveProperty('nationalId');
    expect(res.body.role).toBe(role);
    const cookie = [res.headers['set-cookie']].flat().join('\n');
    for (const part of ['khidma_session=', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=3600']) {
      expect(cookie).toContain(part);
    }
  });

  it('accepts a mixed-case, space-padded email', async () => {
    const { app } = await setup();
    const res = await request(app).post(LOGIN).send({ email: '  NOURA@Khidma.TEST ', password: 'Passw0rd!' });
    expect(res.status).toBe(200);
  });

  it('answers a wrong password and an unknown email identically', async () => {
    const { app } = await setup();
    const wrong = await request(app).post(LOGIN).send(WRONG);
    const unknown = await request(app).post(LOGIN).send({ email: 'nobody@khidma.test', password: 'Passw0rd!' });
    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
      expect(res.headers['set-cookie']).toBeUndefined();
    }
    expect(wrong.body).toEqual(unknown.body);
  });

  it.each([
    ['missing email', (r: request.Test) => r.send({ password: 'Passw0rd!' })],
    ['empty password', (r: request.Test) => r.send({ email: 'noura@khidma.test', password: '' })],
    ['non-string email', (r: request.Test) => r.send({ email: 42, password: 'Passw0rd!' })],
    ['invalid JSON', (r: request.Test) => r.set('Content-Type', 'application/json').send('{"email":')],
    ['text/plain body', (r: request.Test) => r.set('Content-Type', 'text/plain').send('email=a&password=b')],
  ])('rejects %s with 400 VALIDATION_ERROR', async (_name, send) => {
    const { app } = await setup();
    const res = await send(request(app).post(LOGIN));
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('blocks the IP with 429 after 5 failures, even for correct credentials', async () => {
    const { app } = await setup();
    for (let i = 0; i < 5; i++) await request(app).post(LOGIN).send(WRONG).expect(401);
    const res = await request(app).post(LOGIN).send(VALID);
    expect(res.status).toBe(429);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('RATE_LIMITED');
  });

  it('does not count VALIDATION_ERROR towards the limit', async () => {
    const { app } = await setup();
    for (let i = 0; i < 5; i++) await request(app).post(LOGIN).send({}).expect(400);
    await request(app).post(LOGIN).send(VALID).expect(200);
  });

  it('unblocks after the 15-minute window', async () => {
    const { app, clock } = await setup();
    for (let i = 0; i < 5; i++) await request(app).post(LOGIN).send(WRONG).expect(401);
    clock.advance(15 * 60 * 1000 + 1);
    await request(app).post(LOGIN).send(VALID).expect(200);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('clears the session cookie', async () => {
    const { app } = await setup();
    const res = await request(app).post('/api/v1/auth/logout').set('Cookie', 'khidma_session=abc');
    expect(res.status).toBe(204);
    const cookie = [res.headers['set-cookie']].flat().find((c) => c.startsWith('khidma_session='))!;
    const expires = /Expires=([^;]+)/.exec(cookie)![1];
    expect(new Date(expires).getTime()).toBeLessThan(Date.UTC(2000, 0, 1));
  });

  it('returns 204 without a cookie', async () => {
    const { app } = await setup();
    await request(app).post('/api/v1/auth/logout').expect(204);
  });
});

describe('out-of-scope routes and CORS', () => {
  it.each(['register', 'reset-password', 'forgot-password'])('has no /%s route', async (path) => {
    const { app } = await setup();
    await request(app).post(`/api/v1/auth/${path}`).send(VALID).expect(404);
  });

  it('sends no CORS headers', async () => {
    const { app } = await setup();
    const res = await request(app).post(LOGIN).set('Origin', 'http://evil.test').send(VALID);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('GET /api/v1/auth/me', () => {
  it('restores the signed-in user from the session cookie', async () => {
    const { app } = await setup();
    const login = await request(app).post(LOGIN).send(VALID);
    // supertest does not resend Secure cookies over http, so set the header manually.
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', `khidma_session=${sessionToken(login.headers['set-cookie'])}`);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(D6_KEYS);
    expect(res.body).not.toHaveProperty('nationalId');
  });

  it('returns 401 UNAUTHENTICATED without a cookie', async () => {
    const { app } = await setup();
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 UNAUTHENTICATED once the session has expired', async () => {
    const { app, clock } = await setup();
    const login = await request(app).post(LOGIN).send(VALID);
    clock.advance(3600 * 1000 + 1000);
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', `khidma_session=${sessionToken(login.headers['set-cookie'])}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('is not rate-limited and does not affect the login limiter', async () => {
    const { app } = await setup();
    for (let i = 0; i < 10; i++) await request(app).get('/api/v1/auth/me').expect(401);
    await request(app).post(LOGIN).send(VALID).expect(200);
  });
});
