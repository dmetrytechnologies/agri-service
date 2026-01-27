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
    status: 'Pending' | 'Assigned' | 'Confirmed' | 'Completed' | 'Rejected';
    isManual?: boolean;
    operator?: string;
    location?: string;
}

interface BookingContextType {
    bookings: Booking[];
    addBooking: (booking: Omit<Booking, 'id' | 'status' | 'isManual'>) => void;
    updateBooking: (id: string, updates: Partial<Booking>) => void;
    assignOperator: (bookingId: string, operatorName: string) => void;
    updateStatus: (bookingId: string, status: Booking['status']) => void;
    rejectBooking: (bookingId: string) => void;
    confirmBooking: (bookingId: string) => void;
    isLoading: boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const DEFAULT_BOOKINGS: Booking[] = [];

export function BookingProvider({ children }: { children: ReactNode }) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookings = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Map DB columns to frontend interface if needed
                const mappedBookings: Booking[] = data.map((job: any) => ({
                    id: job.id,
                    farmerName: '', // We might need to fetch this from farmers table or store in jobs. For now assuming jobs doesn't have name directly unless joined.
                    // Wait, the plan said "jobs has farmer_phone". We need to get name.
                    // Option A: Join query.
                    // Option B: Query farmers and map.
                    // Let's do a join or simple fetch for now. To keep it simple, I'll fetch farmers too.
                    phone: job.farmer_phone,
                    pincode: job.pincode || '',
                    date: job.preferred_date || '',
                    acres: job.acres || '',
                    crop: job.crop || '',
                    status: job.status,
                    isManual: job.source === 'MANUAL',
                    operator: job.operator,
                    location: job.location
                }));

                // Fetch farmer names
                const { data: farmers } = await supabase.from('farmers').select('phone, name');
                if (farmers) {
                    const farmerMap = new Map(farmers.map(f => [f.phone, f.name]));
                    mappedBookings.forEach(b => {
                        b.farmerName = farmerMap.get(b.phone) || 'Unknown Farmer';
                    });
                }

                setBookings(mappedBookings);
            }
        } catch (error: any) {
            console.error('Error fetching bookings:', error.message || error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('jobs_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
                fetchBookings();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addBooking = async (data: Omit<Booking, 'id' | 'status' | 'isManual'>) => {
        try {
            // 1. Ensure Farmer Exists
            const { data: existingFarmer } = await supabase
                .from('farmers')
                .select('id')
                .eq('phone', data.phone)
                .single();

            if (!existingFarmer) {
                // Create new farmer
                await supabase.from('farmers').insert({
                    name: data.farmerName,
                    phone: data.phone,
                    pincode: data.pincode,
                    address: data.location || '' // Using location as address proxy
                });
            }

            // 2. Create Job
            const { error } = await supabase.from('jobs').insert({
                farmer_phone: data.phone,
                preferred_date: data.date,
                crop: data.crop,
                acres: data.acres,
                pincode: data.pincode,
                location: data.location,
                source: 'MANUAL',
                status: 'Pending'
            });

            if (error) throw error;
            fetchBookings(); // Refresh

        } catch (error: any) {
            console.error('Error creating booking:', error.message || error);
            alert('Failed to create booking. Please try again.');
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
                .update({ status: 'Assigned', operator: operatorName })
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

    const rejectBooking = (bookingId: string) => updateStatus(bookingId, 'Rejected');
    const confirmBooking = (bookingId: string) => updateStatus(bookingId, 'Confirmed');

    return (
        <BookingContext.Provider value={{ bookings, addBooking, updateBooking, assignOperator, updateStatus, rejectBooking, confirmBooking, isLoading }}>
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
