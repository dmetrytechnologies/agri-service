import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to generate TwiML response
function generateTwiML(content: string) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`;
    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'text/xml',
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        // Parse form data from IVR provider
        const formData = await req.formData();
        const caller = formData.get('Caller') as string;
        const callSid = formData.get('CallSid') as string;
        const digits = formData.get('Digits') as string;

        if (!callSid || !caller) {
            return NextResponse.json({ error: 'Missing CallSid or Caller' }, { status: 400 });
        }

        // Check for existing active session (INIT state)
        const { data: activeJob, error: fetchError } = await supabase
            .from('jobs')
            .select('*')
            .eq('call_id', callSid)
            .eq('status', 'INIT')
            .single();

        // SCENARIO 1: New Call (No Digits) or unexpected input at start
        // Action: Play Welcome Message
        if (!digits) {
            // We don't necessarily need to create a job here, we can wait for the first user action.
            // But if we want to log the call start, we could.
            // For this flow: "Farmer presses 1 -> Request drone service".
            // So request 1: Prompt "Welcome... Press 1".
            return generateTwiML(`
        <Gather numDigits="1" action="/api/ivr" method="POST">
          <Say>Welcome to DMETRY Agri Drone Service. To request drone spraying service, press 1.</Say>
        </Gather>
        <Say>We did not receive any input. Goodbye.</Say>
      `);
        }

        // SCENARIO 2: User Pressed 1 (Request Service)
        // Condition: No active job (or first step) AND Input is '1'
        if (!activeJob && digits === '1') {
            // Create Job in INIT state
            const { error: insertError } = await supabase
                .from('jobs')
                .insert({
                    farmer_phone: caller,
                    status: 'INIT',
                    source: 'IVR',
                    call_id: callSid
                });

            if (insertError) {
                console.error('Error creating job:', insertError);
                return generateTwiML('<Say>Sorry, an error occurred. Please try again later.</Say>');
            }

            return generateTwiML(`
        <Gather numDigits="1" action="/api/ivr" method="POST">
          <Say>Select your preferred service date. Press 1 for tomorrow. Press 2 for day after tomorrow. Press 3 for the next day.</Say>
        </Gather>
        <Say>We did not receive any input. Goodbye.</Say>
      `);
        }

        // SCENARIO 3: User Selected Date
        // Condition: Active INIT job exists AND Input is 1/2/3
        if (activeJob && ['1', '2', '3'].includes(digits)) {
            const today = new Date();
            const daysToAdd = parseInt(digits); // 1, 2, or 3

            const preferredDate = new Date(today);
            preferredDate.setDate(today.getDate() + daysToAdd);

            const dateString = preferredDate.toISOString().split('T')[0]; // YYYY-MM-DD

            // Update Job
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'NEW',
                    preferred_date: dateString
                })
                .eq('id', activeJob.id);

            if (updateError) {
                console.error('Error updating job:', updateError);
                return generateTwiML('<Say>Sorry, an error occurred while saving your request.</Say>');
            }

            // Format date for speech (e.g., "January 26th")
            const verbalDate = preferredDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

            return generateTwiML(`
        <Say>Your drone service request has been received on ${verbalDate}. Goodbye.</Say>
        <Hangup/>
      `);
        }

        // Fallback for Invalid Input
        return generateTwiML(`
      <Say>Invalid input.</Say>
      <Redirect>/api/ivr</Redirect>
    `);

    } catch (error) {
        console.error('IVR Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
