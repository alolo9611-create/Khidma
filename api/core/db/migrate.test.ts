import { describe, expect, it } from 'vitest';
import { fakeClock } from '../../test/helpers.js';
import { openDatabase } from './connection.js';
import { MIGRATIONS_DIR, runMigrations } from './migrate.js';

const clock = fakeClock(new Date('2026-01-01T00:00:00Z'));

describe('runMigrations', () => {
  it('applies every migration once, in filename order', async () => {
    const db = openDatabase(':memory:');
    expect(await runMigrations(db, MIGRATIONS_DIR, clock)).toEqual([
      '001_accounts.sql', '002_catalog.sql', '003_requests.sql', '004_declared_documents.sql', '005_reference_sequences.sql',
      '006_certificates.sql', '007_comments.sql', '008_notifications.sql', '009_activity_log_immutable.sql',
    ]);
    expect(await runMigrations(db, MIGRATIONS_DIR, clock)).toEqual([]);
  });

  it('enforces the users CHECK constraints', async () => {
    const db = openDatabase(':memory:');
    await runMigrations(db, MIGRATIONS_DIR, clock);
    await db.run("INSERT INTO departments (id, name) VALUES (1, 'Licensing')");
    const insert = (...args: (string | number | null)[]) => db.run(
      'INSERT INTO users (nationalId, name, email, role, departmentId, passwordHash) VALUES (?, ?, ?, ?, ?, ?)', ...args,
    );
    await expect(insert('0000000101', 'A', 'a@x.test', 'APPLICANT', 1, 'h')).rejects.toThrow(/CHECK/);
    await expect(insert('0000000102', 'R', 'r@x.test', 'REVIEWER', null, 'h')).rejects.toThrow(/CHECK/);
    await expect(insert('000000010', 'S', 's@x.test', 'APPLICANT', null, 'h')).rejects.toThrow(/CHECK/);
  });
});
