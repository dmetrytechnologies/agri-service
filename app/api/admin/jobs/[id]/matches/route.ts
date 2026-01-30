import { NextRequest, NextResponse } from 'next/server';
import { getPilotMatches } from '@/lib/matchingEngine';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const jobId = id;

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        const matches = await getPilotMatches(jobId);

        return NextResponse.json(matches);
    } catch (error: any) {
        console.error('Error fetching matches:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
