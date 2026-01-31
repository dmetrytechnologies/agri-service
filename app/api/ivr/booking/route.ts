import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables for IVR.');
    }

    return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: Request) {
    const supabase = getSupabaseAdmin();
    try {
        const formData = await request.formData();
        const Digits = formData.get('Digits') as string;
        const Caller = formData.get('From') as string;

        const phone = Caller ? Caller.replace(/\D/g, '').slice(-10) : '';

        console.log(`[IVR] Action from ${phone}: Pressed ${Digits}`);

        if (Digits === '1') {
            // BOOKING FLOW

            // 1. Fetch Full Farmer Details for Default Booking Info
            const { data: farmer } = await supabase
                .from('farmers')
                .select('*')
                .eq('phone', phone)
                .single();

            if (!farmer) {
                return new NextResponse(
                    `<Response><Say>Error identifying account.</Say></Response>`,
                    { headers: { 'Content-Type': 'text/xml' } }
                );
            }

            // 2. Create Job
            // We assume default crop/acres or generic values for IVR bookings
            const { data: job, error } = await supabase
                .from('jobs')
                .insert({
                    farmer_id: farmer.id,
                    farmer_phone: farmer.phone,
                    preferred_date: new Date().toISOString().split('T')[0], // Today/ASAP
                    crop: 'Mixed/General', // IVR Default
                    acres: '5',            // IVR Default (or fetch from last job?)
                    pincode: farmer.pincode,
                    location: farmer.address,
                    source: 'IVR',
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            return new NextResponse(
                `
                <Response>
                    <Say>Booking confirmed. Your reference is ${job.id.slice(0, 4)}.</Say>
                    <Say>A pilot will contact you shortly.</Say>
                    <Hangup/>
                </Response>
                `,
                { headers: { 'Content-Type': 'text/xml' } }
            );

        } else if (Digits === '9') {
            // SPEAK TO AGENT
            return new NextResponse(
                `
                <Response>
                    <Say>Connecting you to an agent.</Say>
                    <Dial>+919876543210</Dial>
                </Response>
                `,
                { headers: { 'Content-Type': 'text/xml' } }
            );
        } else {
            return new NextResponse(
                `<Response><Say>Invalid input. Goodbye.</Say></Response>`,
                { headers: { 'Content-Type': 'text/xml' } }
            );
        }

    } catch (error: any) {
        console.error('[IVR Booking Error]', error);
        return new NextResponse(
            `<Response><Say>System error. Please try again later.</Say></Response>`,
            { headers: { 'Content-Type': 'text/xml' } }
        );
    }
}
