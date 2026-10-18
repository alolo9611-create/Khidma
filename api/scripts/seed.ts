import { loadConfig } from '../core/config.js';
import { openDatabase } from '../core/db/connection.js';
import { SEED_FILE, seedAccounts } from '../core/db/seed.js';

const { databasePath } = loadConfig(process.env);
const db = openDatabase(databasePath);
const counts = await seedAccounts(db, SEED_FILE);
console.log(`departments: ${counts.departments}, users: ${counts.users}`);
db.close();
