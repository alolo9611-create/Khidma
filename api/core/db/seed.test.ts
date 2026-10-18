import argon2 from 'argon2';
import { describe, expect, it } from 'vitest';
import { seededDb } from '../../test/helpers.js';
import { SEED_FILE, seedAccounts } from './seed.js';

describe('seedAccounts', () => {
  it('seeds 2 departments and 6 users by role', async () => {
    const db = await seededDb();
    const departments = db.prepare('SELECT name FROM departments ORDER BY id').all();
    expect(departments).toEqual([{ name: 'Licensing' }, { name: 'Events' }]);
    const roles = db.prepare('SELECT role, COUNT(*) AS n FROM users GROUP BY role ORDER BY role').all();
    expect(roles).toEqual([
      { role: 'APPLICANT', n: 2 },
      { role: 'REVIEWER', n: 3 },
      { role: 'SUPERVISOR', n: 1 },
    ]);
  });

  it('stores Argon2id hashes, never plaintext, and lowercase emails', async () => {
    const db = await seededDb();
    const users = db.prepare('SELECT * FROM users').all() as Record<string, unknown>[];
    for (const u of users) {
      const hash = u.passwordHash as string;
      expect(hash.startsWith('$argon2id$')).toBe(true);
      expect(await argon2.verify(hash, 'Passw0rd!')).toBe(true);
      expect(Object.values(u)).not.toContain('Passw0rd!');
      expect(u.email).toBe((u.email as string).toLowerCase());
    }
  });

  it('is idempotent', async () => {
    const db = await seededDb();
    expect(await seedAccounts(db, SEED_FILE)).toEqual({ departments: 2, users: 6 });
  });
});
