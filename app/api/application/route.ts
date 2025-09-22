import { getApplications, addApplication, openDb } from '../../../lib/db';
import { Application } from '../../../types';
import { NextResponse } from 'next/server';

// GET /api/application
export async function GET(): Promise<NextResponse<Application[]>> {
    const applications = await getApplications();
    return NextResponse.json(applications);
}

// POST /api/application
export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = await request.json();
        console.log("POST /api/application payload:", body);

        // Basic sanitization and validation
        const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
        const toNumberOrNull = (v: unknown) => (v === '' || v == null ? null : Number(v));
        const isValidDate = (s: unknown) => {
            const d = new Date(typeof s === 'string' ? s : String(s));
            return !isNaN(d.getTime());
        };

        const company = trim(body.company);
        const title = trim(body.title);
        const link = typeof body.link === 'string' ? body.link : '';
        const appliedOnRaw = body.applied_on;
        const salaryMin = toNumberOrNull(body.salary_min);
        const salaryMax = toNumberOrNull(body.salary_max);
    const modality = body.modality == null || body.modality === '' ? null : Number(body.modality);
    const status = Number(body.status);
    const lastStep = Number(body.last_step);
        const notes = typeof body.notes === 'string' ? body.notes : '';

    if (!company || !title || !status || !lastStep || !appliedOnRaw) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (company.length > 200 || title.length > 200) {
            return NextResponse.json({ error: 'Company/Title too long' }, { status: 400 });
        }

        if (typeof link === 'string' && link.length > 500) {
            return NextResponse.json({ error: 'Link too long' }, { status: 400 });
        }

        if (salaryMin !== null && (isNaN(salaryMin) || salaryMin < 0)) {
            return NextResponse.json({ error: 'salary_min must be a non-negative number or null' }, { status: 400 });
        }
        if (salaryMax !== null && (isNaN(salaryMax) || salaryMax < 0)) {
            return NextResponse.json({ error: 'salary_max must be a non-negative number or null' }, { status: 400 });
        }
        if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
            return NextResponse.json({ error: 'salary_min cannot exceed salary_max' }, { status: 400 });
        }

        // Validate against field_values in DB
        const db = await openDb();
        const existsById = (type: 'status'|'last_step'|'modality', id?: number | null) => {
            if (id == null) return type === 'modality'; // modality can be null
            if (!Number.isInteger(id)) return false;
            const row = db.prepare(`SELECT id FROM field_values WHERE type = ? AND id = ? AND is_active = 1`).get(type, id) as { id: number } | undefined;
            return !!row;
        };
        if (!existsById('status', status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        if (!existsById('last_step', lastStep)) return NextResponse.json({ error: 'Invalid last_step' }, { status: 400 });
        if (modality !== null && !existsById('modality', modality)) return NextResponse.json({ error: 'Invalid modality' }, { status: 400 });

        if (!isValidDate(appliedOnRaw)) {
            return NextResponse.json({ error: 'Invalid applied_on date' }, { status: 400 });
        }
        const applied_on = new Date(appliedOnRaw).toISOString();
        const last_updated = new Date().toISOString();

        const app: Application = {
            id: 0,
            company,
            title,
            link,
            applied_on,
            salary_min: salaryMin ?? 0,
            salary_max: salaryMax ?? 0,
            modality,
            status,
            last_step: lastStep,
            last_updated,
            notes,
        };

        const newId = await addApplication(app);
        return NextResponse.json({ message: 'Application added successfully', id: newId });
    } catch (error) {
        console.error("Error in POST function:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
