import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('requires JWT_SECRET', () => {
    expect(() => loadConfig({})).toThrow('JWT_SECRET is required');
  });
  it('uses the PRD defaults (port 3000, Asia/Riyadh)', () => {
    expect(loadConfig({ JWT_SECRET: 'x' })).toMatchObject({ port: 3000, timezone: 'Asia/Riyadh', trustProxy: null, staticDir: null });
  });
  it('refuses the example or a short secret in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'dev-only-change-me-to-a-long-random-string' })).toThrow(/production/);
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'short' })).toThrow(/production/);
    expect(loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'q'.repeat(48) }).jwtSecret).toHaveLength(48);
  });
});
