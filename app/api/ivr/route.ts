import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Server-side Supabase client for IVR (Uses Service Role to bypass RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST BE SET IN ENV
);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const Caller = formData.get('From') as string; // Twilio format: +919999999999

        console.log(`[IVR] Incoming call from ${Caller}`);

        // 1. Normalize Phone Number (Remove +91 or +)
        const phone = Caller ? Caller.replace(/\D/g, '').slice(-10) : '';

        if (!phone) {
            return new NextResponse(
                `<Response><Say>Caller ID not found. Goodbye.</Say></Response>`,
                { headers: { 'Content-Type': 'text/xml' } }
            );
        }

        // 2. Lookup Farmer
        const { data: farmer, error } = await supabase
            .from('farmers')
            .select('name')
            .eq('phone', phone)
            .single();

        // 3. Generate TwiML Response (Single Menu for Everyone)
        const greeting = farmer ? `Welcome back, ${farmer.name}.` : 'Welcome to Agri Drone Service.';

        const twiml = `
            <Response>
                <Say>${greeting}</Say>
                <Gather action="/api/ivr/booking" numDigits="1" timeout="10">
                    <Say>Press 1 to book a agriculture drone spray service.</Say>
                </Gather>
                <Say>We did not receive any input. Goodbye.</Say>
            </Response>
        `;


        return new NextResponse(twiml, {
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error: any) {
        console.error('[IVR Error]', error);
        return new NextResponse(
            `<Response><Say>An error occurred. Please call back later.</Say></Response>`,
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }
}
