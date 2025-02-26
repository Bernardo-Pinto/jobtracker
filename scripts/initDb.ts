import { openDb } from '../lib/db';

async function initDb() {
    const db = await openDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            title TEXT NOT NULL,
            link TEXT,
            applied_on TEXT NOT NULL, -- Store dates as ISO strings
            salary_min INTEGER,
            salary_max INTEGER,
            status TEXT NOT NULL,
            last_step TEXT NOT NULL,
            last_updated TEXT NOT NULL, -- Store dates as ISO strings
            notes TEXT
        )
    `);
    console.log('Database initialized');
}

initDb();