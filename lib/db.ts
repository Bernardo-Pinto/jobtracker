'use server';

import type { Database } from 'better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import { Application } from '../types';

let db: Database | null = null;

// Open SQLite database connection
export async function openDb(): Promise<Database> {
    if (!db) {
        db = new BetterSqlite3('./database.db');
    }
    return db;
}

// Fetch all Applications
export async function getApplications(): Promise<Application[]> {
    const db = await openDb();
    return db.prepare('SELECT * FROM applications').all() as Application[];
}

export async function addApplication(application: Application): Promise<void> {
    try {
        console.log("addApplication called with:");
        console.log(application);

        const db = await openDb();

        db.prepare(`INSERT INTO applications 
            (company, title, link, applied_on, salary_min, salary_max, status, last_step, last_updated, notes) 
            VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
            application.company, application.title, application.link, application.applied_on, 
            application.salary_min, application.salary_max, application.status, application.last_step, 
            application.last_updated, application.notes
        );

        console.log("Insertion successful.");
    } catch (error) {
        console.error("Error in addApplication:", error);
    }
}

// Update an existing application
export async function updateApplication(application: Application): Promise<void> {
    const db = await openDb();
    db.prepare(
        `UPDATE applications SET
            company = ?,
            title = ?,
            link = ?,
            applied_on = ?,
            salary_min = ?,
            salary_max = ?,
            status = ?,
            last_step = ?,
            last_updated = ?,
            notes = ?
        WHERE id = ?`
    ).run(
        application.company,
        application.title,
        application.link,
        application.applied_on,
        application.salary_min,
        application.salary_max,
        application.status,
        application.last_step,
        new Date().toISOString(), // Update last_updated to the current time
        application.notes,
        application.id,
    );
}

// delete application
export async function deleteApplication(id: number): Promise<void> {
    const db = await openDb();
    const stmt = db.prepare('DELETE FROM applications WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
        throw new Error('Application not found');
    }
}