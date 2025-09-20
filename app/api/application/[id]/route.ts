import { NextResponse } from 'next/server';
import { updateApplication, deleteApplication } from '../../../../lib/db';
import { Application } from '../../../../types';
import { statusOptions, lastStepOptions, modalitiesOptions } from '../../../../constants/constants';

export async function PUT(
    request : Request,
    context : { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const body: Application = await request.json();
        const id = Number((await context.params).id);

        // Required
        if (!body.company || !body.title || !body.status || !body.last_step || !body.applied_on) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // ID match
        if (body.id !== id) {
            return NextResponse.json({ error: 'ID mismatch' }, { status: 400 });
        }

        // String lengths
        if (body.company.length > 200 || body.title.length > 200) {
            return NextResponse.json({ error: 'Company/Title too long' }, { status: 400 });
        }
        if (typeof body.link === 'string' && body.link.length > 500) {
            return NextResponse.json({ error: 'Link too long' }, { status: 400 });
        }

        // Salary
        const min = body.salary_min == null ? null : Number(body.salary_min);
        const max = body.salary_max == null ? null : Number(body.salary_max);
        if (min !== null && (isNaN(min) || min < 0)) {
            return NextResponse.json({ error: 'salary_min must be a non-negative number or null' }, { status: 400 });
        }
        if (max !== null && (isNaN(max) || max < 0)) {
            return NextResponse.json({ error: 'salary_max must be a non-negative number or null' }, { status: 400 });
        }
        if (min !== null && max !== null && min > max) {
            return NextResponse.json({ error: 'salary_min cannot exceed salary_max' }, { status: 400 });
        }

        // Enums
        const statusSet = new Set(statusOptions);
        const lastStepSet = new Set(lastStepOptions);
        const modalitySet = new Set(modalitiesOptions);
        if (!statusSet.has(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        if (!lastStepSet.has(body.last_step)) return NextResponse.json({ error: 'Invalid last_step' }, { status: 400 });
        if (body.modality !== null && body.modality !== undefined && !modalitySet.has(body.modality)) {
            return NextResponse.json({ error: 'Invalid modality' }, { status: 400 });
        }

        // Dates
        const applied = new Date(body.applied_on);
        if (isNaN(applied.getTime())) return NextResponse.json({ error: 'Invalid applied_on date' }, { status: 400 });

        // Force last_updated on server
        const updated: Application = { ...body, last_updated: new Date().toISOString() };

        // Update the application in the database
        await updateApplication(updated);

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