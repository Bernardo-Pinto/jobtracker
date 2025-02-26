import { NextResponse } from 'next/server';
import { updateApplication } from '../../../../lib/db';
import { Application } from '../../../../types';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const application: Application = await request.json();

        // Validate required fields
        if (
            !application.company ||
            !application.title ||
            !application.applied_on ||
            !application.status ||
            !application.last_step ||
            !application.last_updated
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Ensure the ID in the URL matches the ID in the request body
        if (application.id !== parseInt(params.id)) {
            return NextResponse.json(
                { error: 'ID mismatch' },
                { status: 400 }
            );
        }

        // Update the application in the database
        await updateApplication(application);

        return NextResponse.json(
            { message: 'Application updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating application:', error);
        return NextResponse.json(
            { error: 'Failed to update application' },
            { status: 500 }
        );
    }
}