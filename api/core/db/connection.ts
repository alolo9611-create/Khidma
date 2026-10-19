import BetterSqlite3 from 'better-sqlite3';

export type Database = BetterSqlite3.Database;

// Accepts ':memory:' for tests.
export function openDatabase(path: string): Database {
  const db = new BetterSqlite3(path);
  db.pragma('foreign_keys = ON');
  return db;
}
