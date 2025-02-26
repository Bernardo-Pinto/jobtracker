'use server';

import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Application } from '../types';

let db: Database | null = null;

// Open SQLite database connection
export async function openDb(): Promise<Database> {
    if (!db) {
        db = await open({
            filename: './database.db',
            driver: sqlite3.Database,
        });
    }
    return db;
}

// Fetch all Applications
export async function getApplications(): Promise<Application[]> {
    const db = await openDb();
    return db.all<Application[]>('SELECT * FROM Applications');
}

export async function addApplication(application: Application): Promise<void> {
    try {
        console.log("addApplication called with:");
        console.log(application);


        const db = await openDb();

        await db.run(`INSERT INTO applications 
            (company, title, link, applied_on, salary_min, salary_max, status, last_step, last_updated, notes) 
            VALUES (?,?,?,?,?,?,?,?,?,?)`, 
            [
                application.company, application.title, application.link, application.applied_on, 
                application.salary_min, application.salary_max, application.status, application.last_step, 
                application.last_updated, application.notes
            ]
        );

        console.log("Insertion successful.");
    } catch (error) {
        console.error("Error in addApplication:", error);
    }
}


// Update an existing application
export async function updateApplication(application: Application): Promise<void> {
    const db = await openDb();
    await db.run(
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
        WHERE id = ?`,
        [
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
        ]
    );
}