
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestDBPage() {
    const [status, setStatus] = useState<string>('Idle');
    const [result, setResult] = useState<any>(null);

    const testInsert = async () => {
        setStatus('Testing Insert...');
        try {
            const { data, error } = await supabase
                .from('operators')
                .insert({
                    name: 'Test Pilot Debug',
                    phone: '0000000000',
                    location: 'Debug Zone',
                    status: 'Idle',
                    jobs_completed: 0,
                    service_villages: ['DebugVillage']
                })
                .select()
                .single();

            if (error) {
                setStatus('Insert Failed');
                setResult(error);
                console.error('Test Insert Error:', error);
            } else {
                setStatus('Insert Success');
                setResult(data);

                // Cleanup
                await supabase.from('operators').delete().eq('id', data.id);
            }
        } catch (e: any) {
            setStatus('Exception Caught');
            setResult({ message: e.message, stack: e.stack, full: e });
            console.error('Test Exception:', e);
        }
    };

    return (
        <div className="p-8 space-y-4 text-white">
            <h1 className="text-2xl font-bold">Database Diagnostic</h1>
            <button
                onClick={testInsert}
                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
                Run Test Insert
            </button>

            <div className="mt-4">
                <p className="font-bold">Status: {status}</p>
                <pre className="bg-gray-800 p-4 rounded mt-2 overflow-auto text-xs font-mono border border-gray-700">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
        </div>
    );
}
