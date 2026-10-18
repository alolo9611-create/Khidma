import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database } from './connection.js';
import type { Clock } from '../clock.js';

export const MIGRATIONS_DIR = fileURLToPath(new URL('../../../db/migrations/', import.meta.url));

// Returns the names of the migrations applied by this run.
export function runMigrations(db: Database, migrationsDir: string, clock: Clock): string[] {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, appliedAt TEXT NOT NULL)');
  const applied = new Set(
    (db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[]).map((r) => r.name),
  );
  const pending = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql') && !applied.has(f)).sort();
  const record = db.prepare('INSERT INTO schema_migrations (name, appliedAt) VALUES (?, ?)');
  for (const name of pending) {
    const sql = readFileSync(join(migrationsDir, name), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      record.run(name, clock.now().toISOString());
    })();
  }
  return pending;
}
