import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import type { Database } from './connection.js';
import { normalizeEmail } from '../../modules/accounts/email.js';

export const SEED_PASSWORD = 'Passw0rd!'; // PRD §06 seed data
export const SEED_FILE = fileURLToPath(new URL('../../../db/seed/accounts.json', import.meta.url));

interface SeedFile {
  departments: { id: number; name: string; maxActivePerReviewer: number }[];
  users: { id: number; nationalId: string; name: string; email: string; role: string; departmentId: number | null }[];
}

export async function seedAccounts(db: Database, seedFile: string): Promise<{ departments: number; users: number }> {
  const data = JSON.parse(readFileSync(seedFile, 'utf8')) as SeedFile;
  const hashes = await Promise.all(data.users.map(() => argon2.hash(SEED_PASSWORD, { type: argon2.argon2id })));

  const insertDepartment = db.prepare(
    'INSERT OR IGNORE INTO departments (id, name, maxActivePerReviewer) VALUES (?, ?, ?)',
  );
  const insertUser = db.prepare(
    `INSERT OR IGNORE INTO users (id, nationalId, name, email, role, departmentId, passwordHash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  db.transaction(() => {
    for (const d of data.departments) insertDepartment.run(d.id, d.name, d.maxActivePerReviewer);
    data.users.forEach((u, i) => {
      insertUser.run(u.id, u.nationalId, u.name, normalizeEmail(u.email), u.role, u.departmentId, hashes[i]);
    });
  })();

  const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  return { departments: count('departments'), users: count('users') };
}
