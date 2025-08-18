import { NextResponse } from 'next/server';
import { updateApplication, deleteApplication } from '../../../../lib/db';
import { Application } from '../../../../types';

export async function PUT(
    request : Request,
    context : { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const application: Application = await request.json();
        const id = Number((await context.params).id);
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
        if (application.id !== id) {
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

export async function DELETE(
    request: Request, 
    context: { params: Promise<{ id: string }> })
    : Promise<NextResponse> {
        try{
            const id = Number((await context.params).id);
            if (isNaN(id)) {
                return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
            }

            // Update the application in the database
            await deleteApplication(id);

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Error deleting application:', error);
            return NextResponse.json(
                { error: 'Failed to delete application' },
                { status: 500 }
            );
        }
    }