import { afterEach, describe, expect, it } from 'vitest';
import proxy from './proxy.js';

const PASSWORD = 'correct-horse-battery-staple';
const basic = (user: string, password: string) => `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
const req = (path: string, auth?: string) => new Request(`https://khidma.example${path}`, { headers: auth ? { authorization: auth } : {} });
const passes = (res: Response) => res.headers.get('x-middleware-next') === '1';

describe('Vercel proxy gate', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it('fails closed when PREVIEW_PASSWORD is missing or too short', () => {
    delete process.env.PREVIEW_PASSWORD;
    expect(proxy(req('/')).status).toBe(503);
    process.env.PREVIEW_PASSWORD = 'short';
    expect(proxy(req('/assets/app.js', basic('khidma', 'short'))).status).toBe(503);
  });

  it('challenges every path, including static files and the API, without valid credentials', () => {
    process.env.PREVIEW_PASSWORD = PASSWORD;
    for (const path of ['/', '/catalog', '/assets/index.js', '/index.html', '/api/v1/services']) {
      const res = proxy(req(path));
      expect(res.status).toBe(401);
      expect(res.headers.get('www-authenticate')).toMatch(/^Basic realm="Khidma preview"/);
    }
    expect(proxy(req('/', basic('khidma', 'wrong-password-123'))).status).toBe(401);
    expect(proxy(req('/', basic('someone', PASSWORD))).status).toBe(401);
  });

  it('passes valid credentials and the health check through', () => {
    process.env.PREVIEW_PASSWORD = PASSWORD;
    expect(passes(proxy(req('/api/v1/services', basic('khidma', PASSWORD))))).toBe(true);
    expect(passes(proxy(req('/healthz')))).toBe(true);
    process.env.PREVIEW_USER = 'team';
    expect(passes(proxy(req('/', basic('team', PASSWORD))))).toBe(true);
  });
});
