import { createApp } from './app.js';
import { systemClock } from './core/clock.js';
import { loadConfig } from './core/config.js';
import { openDatabase } from './core/db/connection.js';

const { port, jwtSecret, databasePath } = loadConfig(process.env);
const db = openDatabase(databasePath);
createApp({ db, clock: systemClock, jwtSecret }).listen(port, () => {
  console.log(`Khidma API listening on :${port}`);
});
