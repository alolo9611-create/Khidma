import { describe, expect, it } from 'vitest';
import { fakeClock } from '../../test/helpers.js';
import { openDatabase } from './connection.js';
import { MIGRATIONS_DIR, runMigrations } from './migrate.js';

const clock = fakeClock(new Date('2026-01-01T00:00:00Z'));

describe('runMigrations', () => {
  it('applies every migration once, in filename order', () => {
    const db = openDatabase(':memory:');
    expect(runMigrations(db, MIGRATIONS_DIR, clock)).toEqual([
      '001_accounts.sql', '002_catalog.sql', '003_requests.sql', '004_declared_documents.sql', '005_reference_sequences.sql',
      '006_certificates.sql', '007_comments.sql', '008_notifications.sql', '009_activity_log_immutable.sql',
    ]);
    expect(runMigrations(db, MIGRATIONS_DIR, clock)).toEqual([]);
  });

  it('enforces the users CHECK constraints', () => {
    const db = openDatabase(':memory:');
    runMigrations(db, MIGRATIONS_DIR, clock);
    db.prepare("INSERT INTO departments (id, name) VALUES (1, 'Licensing')").run();
    const insert = db.prepare(
      'INSERT INTO users (nationalId, name, email, role, departmentId, passwordHash) VALUES (?, ?, ?, ?, ?, ?)',
    );
    expect(() => insert.run('0000000101', 'A', 'a@x.test', 'APPLICANT', 1, 'h')).toThrow(/CHECK/);
    expect(() => insert.run('0000000102', 'R', 'r@x.test', 'REVIEWER', null, 'h')).toThrow(/CHECK/);
    expect(() => insert.run('000000010', 'S', 's@x.test', 'APPLICANT', null, 'h')).toThrow(/CHECK/);
  });
});
