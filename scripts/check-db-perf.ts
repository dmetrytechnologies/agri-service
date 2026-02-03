
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

    console.log('--- Individual Queries ---');

    const t1 = Date.now();
    const { error: err1 } = await supabase.from('admins').select('id').eq('phone', cleanPhone).maybeSingle();
    console.log(`Admins query: ${Date.now() - t1}ms ${err1 ? '(Error)' : ''}`);

    const t2 = Date.now();
    const { error: err2 } = await supabase.from('operators').select('id').eq('phone', cleanPhone).maybeSingle();
    console.log(`Operators query: ${Date.now() - t2}ms ${err2 ? '(Error)' : ''}`);

    const t3 = Date.now();
    const { error: err3 } = await supabase.from('farmers').select('id').eq('phone', cleanPhone).maybeSingle();
    console.log(`Farmers query: ${Date.now() - t3}ms ${err3 ? '(Error)' : ''}`);

    console.log('--- Parallel Queries (Promise.all) ---');
    const tp_start = Date.now();
    await Promise.all([
        supabase.from('admins').select('id').eq('phone', cleanPhone).maybeSingle(),
        supabase.from('operators').select('id').eq('phone', cleanPhone).maybeSingle(),
        supabase.from('farmers').select('id').eq('phone', cleanPhone).maybeSingle()
    ]);
    console.log(`Total Parallel Time: ${Date.now() - tp_start}ms`);
}

checkPerf();
