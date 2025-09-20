'use server';

import type { Database } from 'better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import { Application, ApplicationDoc } from '../types';
import { runMigrations } from '../scripts/runMigrations';

let db: Database | null = null;

// Open SQLite database connection
export async function openDb(): Promise<Database> {
    if (!db) {
        const dbPath = process.env.DATABASE_PATH || './database.db';
        db = new BetterSqlite3(dbPath);
        // Apply pending migrations once when the connection is first created
        runMigrations(db);
    }
    return db;
}

// Fetch all Applications
export async function getApplications(): Promise<Application[]> {
    const db = await openDb();
    const rows = db.prepare('SELECT * FROM applications').all() as Array<{
        id: number;
        company: string;
        title: string;
        link: string;
        applied_on: string;
        salary_min: number | null;
        salary_max: number | null;
        modality: string | null;
        status: string;
        last_step: string;
        last_updated: string;
        notes: string;
    }>;
    // Coerce integer docs_sent (0/1) to boolean for the Application type
    return rows.map((r) => ({
        id: r.id,
        company: r.company,
        title: r.title,
        link: r.link,
        applied_on: r.applied_on,
        salary_min: r.salary_min,
        salary_max: r.salary_max,
    modality: r.modality,
        status: r.status,
        last_step: r.last_step,
        last_updated: r.last_updated,
        notes: r.notes,
    }));
}

export async function addApplication(application: Application): Promise<void> {
    try {
        console.log("addApplication called with:");
        console.log(application);

        const db = await openDb();

        db.prepare(`INSERT INTO applications 
            (company, title, link, applied_on, salary_min, salary_max, modality, status, last_step, last_updated, notes) 
            VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
            application.company,
            application.title,
            application.link,
            application.applied_on,
            application.salary_min,
            application.salary_max,
            application.modality,
            application.status,
            application.last_step,
            application.last_updated,
            application.notes
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
            modality = ?,
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
        application.modality,
        application.status,
        application.last_step,
        new Date().toISOString(), // Update last_updated to the current time
        application.notes,
        application.id,
    );
}

// Docs helpers
export async function addApplicationDoc(appId: number, filename: string, mime: string, storedPath: string): Promise<void> {
    const db = await openDb();
    db.prepare(
        `INSERT INTO application_docs (application_id, filename, mime_type, stored_path) VALUES (?,?,?,?)`
    ).run(appId, filename, mime, storedPath);
}

export async function getDocsForApplications(appIds: number[]): Promise<Record<number, ApplicationDoc[]>> {
    if (appIds.length === 0) return {};
    const db = await openDb();
    const placeholders = appIds.map(() => '?').join(',');
    const rows = db
        .prepare(
            `SELECT * FROM application_docs WHERE application_id IN (${placeholders}) ORDER BY uploaded_at DESC`
        )
        .all(...appIds) as ApplicationDoc[];
    const map: Record<number, ApplicationDoc[]> = {};
    for (const doc of rows) {
        if (!map[doc.application_id]) map[doc.application_id] = [];
        map[doc.application_id].push(doc);
    }
    return map;
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