import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database } from './connection.js';
import type { Clock } from '../clock.js';

export const MIGRATIONS_DIR = fileURLToPath(new URL('../../../db/migrations/', import.meta.url));

// Returns the names of the migrations applied by this run.
export async function runMigrations(db: Database, migrationsDir: string, clock: Clock): Promise<string[]> {
  await db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, appliedAt TEXT NOT NULL)');
  const applied = new Set((await db.all<{ name: string }>('SELECT name FROM schema_migrations')).map((r) => r.name));
  const pending = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql') && !applied.has(f)).sort();
  for (const name of pending) {
    const sql = readFileSync(join(migrationsDir, name), 'utf8');
    await db.transaction(async () => {
      await db.exec(sql);
      await db.run('INSERT INTO schema_migrations (name, appliedAt) VALUES (?, ?)', name, clock.now().toISOString());
    });
  }
  return pending;
}
