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
    try {
        const application = await request.json();
        console.log("POST to /api/application called with:");
        console.log(application);
        await addApplication(application);

        return NextResponse.json({ message: 'Application added successfully' });
    } catch (error) {
        console.error("Error in POST function:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
