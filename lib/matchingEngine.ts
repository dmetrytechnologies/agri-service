import { supabase } from './supabase';
import { Operator } from './operator-context';

export interface MatchingResult {
    perfectMatches: Operator[];      // Priority 1: Village + Date
    villageMatches: Operator[];      // Priority 2: Village Match
    pincodePerfectMatches: Operator[]; // Priority 3: Pincode + Date
    pincodeMatches: Operator[];      // Priority 4: Pincode Match
    districtMatches: Operator[];     // Priority 5: District Match
    manual: Operator[];              // Priority 6: Manual Override
}

export async function getPilotMatches(jobId: string, supabaseClient?: any): Promise<MatchingResult> {
    const sb = supabaseClient || supabase;

    // 1. Fetch Job Details
    console.log(`[MatchingEngine] Fetching job: ${jobId}`);
    const { data: jobs, error: jobError } = await sb
        .from('jobs')
        .select(`
            *,
            farmers (
                village,
                pincode,
                district
            )
        `)
        .eq('id', jobId);

    if (jobError) {
        console.error('[MatchingEngine] Job fetch error:', jobError);
        throw new Error(jobError.message);
    }

    if (!jobs || jobs.length === 0) {
        console.error('[MatchingEngine] Job not found:', jobId);
        throw new Error('Job not found');
    }

    // Use the first match to avoid "Cannot coerce" errors if duplicates exist
    const job = jobs[0];

    // Extract relevant data (handling nested farmers data or flat job data)
    const farmerVillage = job.village || job.farmers?.village;
    const farmerPincode = job.pincode || job.farmers?.pincode;
    const farmerDistrict = job.district || job.farmers?.district;
    const preferredDate = job.preferred_date;

    // 2. Fetch All Active Pilots
    const { data: pilots, error: pilotsError } = await sb
        .from('operators')
        .select('*')
        .eq('status', 'Idle'); // Assuming only Idle pilots can be matched automatically? Or all except Off-Duty?
    // Requirement says "pilot is active" and "pilot is NOT off-duty"

    // Re-fetch with a broader filter to include In-Field but active pilots if needed
    // Actually, let's fetch all except 'Off-Duty' as per rule "pilot is active"
    const { data: activePilots, error: activePilotsError } = await sb
        .from('operators')
        .select('*')
        .neq('status', 'Off-Duty');

    if (activePilotsError) {
        throw new Error(activePilotsError.message);
    }

    const results: MatchingResult = {
        perfectMatches: [],
        villageMatches: [],
        pincodePerfectMatches: [],
        pincodeMatches: [],
        districtMatches: [],
        manual: []
    };

    const seenIds = new Set<string>();

    const categorizedPilots = (activePilots || []).map(p => {
        const hasVillage = farmerVillage && p.service_villages?.some((v: string) => v.toLowerCase() === farmerVillage.toLowerCase());
        const hasPincode = farmerPincode && p.service_pincodes?.includes(farmerPincode);
        const hasDistrict = farmerDistrict && p.district?.toLowerCase() === farmerDistrict.toLowerCase();
        const availableDate = preferredDate && p.available_dates?.includes(preferredDate);

        return { ...p, hasVillage, hasPincode, hasDistrict, availableDate };
    });

    // Priority 1: Village + Date Match
    categorizedPilots.forEach(p => {
        if (p.hasVillage && p.availableDate && !seenIds.has(p.id)) {
            results.perfectMatches.push(p);
            seenIds.add(p.id);
        }
    });

    // Priority 2: Village Match (Date Flexible)
    categorizedPilots.forEach(p => {
        if (p.hasVillage && !seenIds.has(p.id)) {
            results.villageMatches.push(p);
            seenIds.add(p.id);
        }
    });

    // Priority 3: Pincode + Date Match
    categorizedPilots.forEach(p => {
        if (p.hasPincode && p.availableDate && !seenIds.has(p.id)) {
            results.pincodePerfectMatches.push(p);
            seenIds.add(p.id);
        }
    });

    // Priority 4: Pincode Match (Date Flexible)
    categorizedPilots.forEach(p => {
        if (p.hasPincode && !seenIds.has(p.id)) {
            results.pincodeMatches.push(p);
            seenIds.add(p.id);
        }
    });

    // Priority 5: District Match
    categorizedPilots.forEach(p => {
        if (p.hasDistrict && !seenIds.has(p.id)) {
            results.districtMatches.push(p);
            seenIds.add(p.id);
        }
    });

    // Priority 6: Manual Override (Any active pilot)
    categorizedPilots.forEach(p => {
        if (!seenIds.has(p.id)) {
            results.manual.push(p);
            seenIds.add(p.id);
        }
    });

    return results;
}
