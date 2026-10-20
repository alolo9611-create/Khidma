import { loadConfig } from '../core/config.js';
import { openDatabase } from '../core/db/connection.js';
import { CATALOG_SEED_FILE, SEED_FILE, seedAccounts, seedCatalog } from '../core/db/seed.js';

const { databasePath, databaseAuthToken } = loadConfig(process.env);
const db = openDatabase(databasePath, databaseAuthToken ?? undefined);
const counts = await seedAccounts(db, SEED_FILE);
console.log(`departments: ${counts.departments}, users: ${counts.users}`);
const catalog = await seedCatalog(db, CATALOG_SEED_FILE);
console.log(`services: ${catalog.services}, documents: ${catalog.documents}`);
db.close();
