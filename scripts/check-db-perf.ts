
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim().replace(/^"|"$/g, '');
        }
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            supabaseKey = line.split('=')[1].trim().replace(/^"|"$/g, '');
        }
    }
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPerf() {
    const phone = '9710374330'; // The phone number from the log
    const cleanPhone = phone.slice(-10);

    console.log(`Testing performance for phone: ${cleanPhone}`);

    const start = Date.now();

    console.log('--- RPC Query Check ---');
    const t_rpc = Date.now();
    const { data, error } = await supabase.rpc('get_user_profile', { phone_input: cleanPhone });

    console.log(`RPC Time: ${Date.now() - t_rpc}ms`);

    if (error) {
        console.error('RPC Error:', error);
        console.log('Suggestion: Did you run the "optimizations_2026_02_04.sql" migration in Supabase?');
    } else {
        console.log('RPC Result:', data);
        if (!data) console.log('User not found (or data is null)');
        else console.log('User found:', data.name, data.role);
    }
}

checkPerf();
