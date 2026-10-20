import type { Clock } from '../core/clock.js';
import { openDatabase, type Database } from '../core/db/connection.js';
import { MIGRATIONS_DIR, runMigrations } from '../core/db/migrate.js';
import { CATALOG_SEED_FILE, SEED_FILE, seedAccounts, seedCatalog } from '../core/db/seed.js';

export const TEST_SECRET = 'test-secret';

export function fakeClock(start: Date): Clock & { advance(ms: number): void } {
  let t = start.getTime();
  return { now: () => new Date(t), advance: (ms) => { t += ms; } };
}

export async function seededDb(): Promise<Database> {
  const db = openDatabase(':memory:');
  await runMigrations(db, MIGRATIONS_DIR, fakeClock(new Date('2026-01-01T00:00:00Z')));
  await seedAccounts(db, SEED_FILE);
  await seedCatalog(db, CATALOG_SEED_FILE);
  return db;
}

import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../create-app.js';

/** Session cookie without Argon2 (keeps the suite under a minute). The user must exist. */
export function sessionCookie(userId: number, role: string, clock: Clock): string {
  const token = jwt.sign({ sub: String(userId), role, iat: Math.floor(clock.now().getTime() / 1000) }, TEST_SECRET, { algorithm: 'HS256', expiresIn: 3600 });
  return `khidma_session=${token}`;
}

// Seeded users (db/seed/accounts.json): 1 Faisal, 2 Huda (APPLICANT); 3 Noura, 4 Omar (REVIEWER, Licensing);
// 5 Layla (REVIEWER, Events); 6 Khalid (SUPERVISOR, Licensing).
export const USERS = {
  faisal: { id: 1, role: 'APPLICANT' }, huda: { id: 2, role: 'APPLICANT' },
  noura: { id: 3, role: 'REVIEWER' }, omar: { id: 4, role: 'REVIEWER' }, layla: { id: 5, role: 'REVIEWER' },
  khalid: { id: 6, role: 'SUPERVISOR' },
} as const;

/** Sunday 18 Oct 2026, 10:00 Riyadh (07:00Z). */
export const SUNDAY_10AM = new Date('2026-10-18T07:00:00Z');

export async function testApp(start = SUNDAY_10AM) {
  const db = await seededDb();
  const clock = fakeClock(start);
  const app = createApp({ db, clock, jwtSecret: TEST_SECRET, timezone: 'Asia/Riyadh' });
  const as = (who: keyof typeof USERS) => {
    const cookie = () => sessionCookie(USERS[who].id, USERS[who].role, clock);
    return {
      get: (url: string) => request(app).get(url).set('Cookie', cookie()),
      post: (url: string, body: object = {}) => request(app).post(url).set('Cookie', cookie()).send(body),
      patch: (url: string, body: object = {}) => request(app).patch(url).set('Cookie', cookie()).send(body),
    };
  };
  return { db, clock, app, as };
}

export const COMPLETE_SHOP_LIC = {
  formData: { shopName: 'Demo Cafe', shopAddress: '12 Sample Street', activityType: 'Coffee shop' },
  documents: { LEASE_CONTRACT: 'LC-2026-0001', CR_NUMBER: 'CR-1010101010' },
};
