import type { Clock } from '../core/clock.js';
import { openDatabase, type Database } from '../core/db/connection.js';
import { MIGRATIONS_DIR, runMigrations } from '../core/db/migrate.js';
import { SEED_FILE, seedAccounts } from '../core/db/seed.js';

export const TEST_SECRET = 'test-secret';

export function fakeClock(start: Date): Clock & { advance(ms: number): void } {
  let t = start.getTime();
  return { now: () => new Date(t), advance: (ms) => { t += ms; } };
}

export async function seededDb(): Promise<Database> {
  const db = openDatabase(':memory:');
  runMigrations(db, MIGRATIONS_DIR, fakeClock(new Date('2026-01-01T00:00:00Z')));
  await seedAccounts(db, SEED_FILE);
  return db;
}
