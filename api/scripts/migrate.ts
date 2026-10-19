import { loadConfig } from '../core/config.js';
import { systemClock } from '../core/clock.js';
import { openDatabase } from '../core/db/connection.js';
import { MIGRATIONS_DIR, runMigrations } from '../core/db/migrate.js';

const { databasePath } = loadConfig(process.env);
const db = openDatabase(databasePath);
const applied = runMigrations(db, MIGRATIONS_DIR, systemClock);
console.log(applied.length ? applied.join('\n') : 'No migrations to apply.');
db.close();
