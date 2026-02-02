'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

export interface Booking {
    id: string;
    farmerName: string;
    phone: string;
    pincode: string;
    date: string;
    acres: string;
    crop: string;
    status: 'pending' | 'assigned' | 'confirmed' | 'completed' | 'rejected';
    isManual?: boolean;
    operator?: string;
    location?: string;
    village?: string;
    district?: string;
}

export interface Farmer {
    id: string;
    name: string;
    phone: string;
    pincode: string;
    address: string;
    village?: string;
    district?: string;
    created_at?: string;
}

interface BookingContextType {
    bookings: Booking[];
    farmers: Farmer[];
    addBooking: (booking: Omit<Booking, 'id' | 'status' | 'isManual'>) => void;
    updateBooking: (id: string, updates: Partial<Booking>) => void;
    assignOperator: (bookingId: string, operatorName: string) => void;
    updateStatus: (bookingId: string, status: Booking['status']) => void;
    rejectBooking: (bookingId: string) => void;
    confirmBooking: (bookingId: string) => void;
    updateFarmer: (id: string, updates: Partial<Farmer>) => Promise<void>;
    refreshData: () => Promise<void>;
    isLoading: boolean;

}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const DEFAULT_BOOKINGS: Booking[] = [];

export function BookingProvider({ children }: { children: ReactNode }) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookings = async () => {
        try {
            // Connectivity Check
            // try {
            //     const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            //     if (url) {
            //         const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            //         // console.log('Supabase connectivity check:', res.type);
            //     }
            // } catch (e) {
            //     console.warn('Supabase URL is unreachable:', e);
            // }

            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (jobsError) throw jobsError;

            // Fetch farmers
            const { data: farmersData, error: farmersError } = await supabase
                .from('farmers')
                .select('*')
                .order('created_at', { ascending: false });

            if (farmersError) throw farmersError;

            const currentFarmers = farmersData || [];
            setFarmers(currentFarmers);

            if (jobsData) {
                const farmerPhoneMap = new Map(currentFarmers.map(f => [f.phone, f.name]));
                const farmerIdMap = new Map(currentFarmers.map(f => [f.id, f.name]));

                const mappedBookings: Booking[] = jobsData.map((job: any) => {
                    let name = 'Unknown Farmer';
                    if (job.farmer_id && farmerIdMap.has(job.farmer_id)) {
                        name = farmerIdMap.get(job.farmer_id)!;
                    } else if (job.farmer_phone && farmerPhoneMap.has(job.farmer_phone)) {
                        name = farmerPhoneMap.get(job.farmer_phone)!;
                    } else if (job.farmer_name) {
                        name = job.farmer_name; // Fallback if name is denormalized in jobs table
                    }

                    return {
                        id: job.id,
                        farmerName: name,
                        phone: job.farmer_phone,
                        pincode: job.pincode || '',
                        date: job.preferred_date || '',
                        acres: job.acres || '',
                        crop: job.crop || '',
                        status: job.status,
                        isManual: job.source === 'MANUAL',
                        operator: job.operator,
                        location: job.location,
                        village: currentFarmers.find(f => f.phone === job.farmer_phone)?.village || ''
                    };
                });

                setBookings(mappedBookings);
            }
        } catch (error: any) {
            console.error('Error fetching data:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                fullError: error
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();

        // Subscribe to realtime changes
        const jobsChannel = supabase
            .channel('jobs_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => fetchBookings())
            .subscribe();

        const farmersChannel = supabase
            .channel('farmers_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'farmers' }, () => fetchBookings())
            .subscribe();

        return () => {
            supabase.removeChannel(jobsChannel);
            supabase.removeChannel(farmersChannel);
        };
    }, []);

    const addBooking = async (data: Omit<Booking, 'id' | 'status' | 'isManual'>) => {
        try {
            console.log('Attempting to add booking:', data);

            // 1. Ensure Farmer Exists
            let targetFarmerId = null;

            // 1. Ensure Farmer Exists and Get ID
            const { data: existingFarmer } = await supabase
                .from('farmers')
                .select('id')
                .eq('phone', data.phone)
                .single();

            if (existingFarmer) {
                targetFarmerId = existingFarmer.id;
            } else {
                // Create new farmer and return ID
                const { data: newFarmer, error: createError } = await supabase
                    .from('farmers')
                    .insert({
                        name: data.farmerName,
                        phone: data.phone,
                        pincode: data.pincode,
                        address: data.location || ''
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating farmer:', createError);
                    throw createError;
                }
                targetFarmerId = newFarmer.id;
            }

            // 2. Create Job
            const jobPayload = {
                farmer_id: targetFarmerId,
                farmer_phone: data.phone,
                preferred_date: data.date,
                crop: data.crop,
                acres: data.acres,
                pincode: data.pincode,
                location: data.location || '', // Ensure no undefined value
                // source: 'MANUAL',
                status: 'pending'
            };

            const { error, data: insertedJob } = await supabase
                .from('jobs')
                .insert(jobPayload)
                .select()
                .single();

            if (error) {
                console.error('Supabase Error creating job:', error);
                throw error;
            }

            fetchBookings(); // Refresh

        } catch (error: any) {
            console.error('Error creating booking:', error);
            const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            alert(`Failed to create booking: ${errorMessage}`);
        }
    };

    const updateBooking = async (id: string, updates: Partial<Booking>) => {
        try {
            // Map frontend updates to DB columns
            const dbUpdates: any = {};
            if (updates.date) dbUpdates.preferred_date = updates.date;
            if (updates.phone) dbUpdates.farmer_phone = updates.phone;
            if (updates.crop) dbUpdates.crop = updates.crop;
            if (updates.acres) dbUpdates.acres = updates.acres;
            if (updates.pincode) dbUpdates.pincode = updates.pincode;
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.operator) dbUpdates.operator = updates.operator;

            const { error } = await supabase
                .from('jobs')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
            fetchBookings();
        } catch (error: any) {
            console.error('Error updating booking:', error.message || error);
        }
    };

    const assignOperator = async (bookingId: string, operatorName: string) => {
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status: 'assigned', operator: operatorName })
                .eq('id', bookingId);

            if (error) throw error;
            fetchBookings();
        } catch (error: any) {
            console.error('Error assigning operator:', error.message || error);
        }
    };

    const updateStatus = async (bookingId: string, status: Booking['status']) => {
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status })
                .eq('id', bookingId);

            if (error) throw error;
            fetchBookings();
        } catch (error: any) {
            console.error('Error updating status:', error.message || error);
        }
    };

    const rejectBooking = (bookingId: string) => updateStatus(bookingId, 'rejected');
    const confirmBooking = (bookingId: string) => updateStatus(bookingId, 'confirmed');

    const updateFarmer = async (id: string, updates: Partial<Farmer>) => {
        try {
            const { error } = await supabase
                .from('farmers')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            fetchBookings(); // Refresh farmers list
        } catch (error: any) {
            console.error('Error updating farmer:', error.message || error);
            throw error;
        }
    };

    return (
        <BookingContext.Provider value={{ bookings, farmers, addBooking, updateBooking, assignOperator, updateStatus, rejectBooking, confirmBooking, updateFarmer, refreshData: fetchBookings, isLoading }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBookings() {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error('useBookings must be used within a BookingProvider');
    }
    return context;
}
