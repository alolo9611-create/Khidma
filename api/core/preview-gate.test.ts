import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../create-app.js';
import { fakeClock, seededDb, TEST_SECRET } from '../test/helpers.js';

const GATE = { user: 'khidma', password: 'correct-horse-battery-staple' };
const basic = (u: string, p: string) => 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');

async function gatedApp() {
  return createApp({ db: await seededDb(), clock: fakeClock(new Date('2026-10-18T07:00:00Z')), jwtSecret: TEST_SECRET, previewGate: GATE });
}

describe('preview-access gate', () => {
  it('blocks API, SPA and static paths without the shared credentials', async () => {
    const app = await gatedApp();
    for (const path of ['/api/v1/services', '/catalog', '/assets/index.js', '/']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
      expect(res.headers['www-authenticate']).toMatch(/^Basic realm="Khidma preview"/);
      expect(res.text).not.toMatch(/khidma\.test|Passw0rd|JWT|stack/i);
    }
    expect((await request(app).post('/api/v1/auth/login').send({ email: 'faisal@khidma.test', password: 'x' })).status).toBe(401);
  });

  it('rejects a wrong password or user', async () => {
    const app = await gatedApp();
    expect((await request(app).get('/api/v1/services').set('Authorization', basic('khidma', 'wrong'))).status).toBe(401);
    expect((await request(app).get('/api/v1/services').set('Authorization', basic('other', GATE.password))).status).toBe(401);
  });

  it('lets the team through, and the app sign-in still applies behind it', async () => {
    const app = await gatedApp();
    expect((await request(app).get('/api/v1/services').set('Authorization', basic(GATE.user, GATE.password))).status).toBe(200);
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', basic(GATE.user, GATE.password));
    expect(me.status).toBe(401); // gate passed, but not signed in to Khidma
  });

  it('leaves only the health check open, and it returns no data', async () => {
    const res = await request(await gatedApp()).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  it('is off when not configured (local dev)', async () => {
    const app = createApp({ db: await seededDb(), clock: fakeClock(new Date()), jwtSecret: TEST_SECRET });
    expect((await request(app).get('/api/v1/services')).status).toBe(200);
  });
});
