import { getApplications, addApplication } from '../../../lib/db';
import { Application } from '../../../types';
import { NextResponse } from 'next/server';

// GET /api/application
export async function GET(): Promise<NextResponse<Application[]>> {
    const applications = await getApplications();
    return NextResponse.json(applications);
}

// POST /api/application
export async function POST(request: Request): Promise<NextResponse> {
    const application = await request.json();
    await addApplication(application);
    return NextResponse.json({ message: 'Application added successfully' });
}