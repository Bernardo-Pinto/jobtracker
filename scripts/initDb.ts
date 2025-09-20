import { openDb } from '../lib/db';

async function initDb() {
    await openDb(); // runMigrations is called inside openDb
    console.log('Database initialized (migrations applied)');
}

initDb();