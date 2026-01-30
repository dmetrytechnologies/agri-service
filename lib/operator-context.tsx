'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

export interface Operator {
    id: string;
    name: string;
    phone: string;
    status: 'Idle' | 'In-Field' | 'Off-Duty';
    jobsCompleted: number;
    location: string;
    district?: string;
    service_pincodes: string[];
    service_villages?: string[]; // Optional to support legacy data
    available_dates?: string[];
}

interface OperatorContextType {
    operators: Operator[];
    addOperator: (operator: Omit<Operator, 'id' | 'status' | 'jobsCompleted'>) => void;
    updateOperatorStatus: (id: string, status: Operator['status']) => void;
    deleteOperator: (id: string) => void;
    editOperator: (id: string, data: Partial<Omit<Operator, 'id' | 'jobsCompleted' | 'status'>>) => void;
    isLoading: boolean;
}

const OperatorContext = createContext<OperatorContextType | undefined>(undefined);


export function OperatorProvider({ children }: { children: ReactNode }) {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOperators = async () => {
        try {
            const { data, error } = await supabase
                .from('operators')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setOperators(data);
        } catch (error: any) {
            console.error('Error fetching operators:', error.message || error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOperators();

        // Optional: Subscribe to changes for realtime updates
        const channel = supabase
            .channel('operators_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'operators' }, () => {
                fetchOperators();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addOperator = async (data: Omit<Operator, 'id' | 'status' | 'jobsCompleted'>) => {
        try {
            const { error } = await supabase
                .from('operators')
                .insert({
                    name: data.name,
                    phone: data.phone,
                    location: data.location,
                    district: data.district,
                    service_pincodes: data.service_pincodes,
                    service_villages: data.service_villages || [],
                    available_dates: data.available_dates || [],
                    jobs_completed: 0,
                    status: 'Idle'
                });

            if (error) throw error;
            // fetchOperators() is called automatically via subscription, or we can call it manually to be safe
            fetchOperators();
        } catch (error: any) {
            console.error('Error adding operator:', error.message || error);
            alert('Failed to add operator. Please try again.');
        }
    };

    const deleteOperator = async (id: string) => {
        try {
            const { error } = await supabase
                .from('operators')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchOperators();
        } catch (error) {
            console.error('Error deleting operator:', error);
            alert('Failed to delete operator.');
        }
    };

    const updateOperatorStatus = async (id: string, status: Operator['status']) => {
        try {
            const { error } = await supabase
                .from('operators')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            fetchOperators();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const editOperator = async (id: string, data: Partial<Omit<Operator, 'id' | 'jobsCompleted' | 'status'>>) => {
        try {
            const { error } = await supabase
                .from('operators')
                .update({
                    name: data.name,
                    phone: data.phone,
                    location: data.location,
                    district: data.district,
                    service_pincodes: data.service_pincodes,
                    service_villages: data.service_villages,
                    available_dates: data.available_dates
                })
                .eq('id', id);

            if (error) throw error;
            fetchOperators();
        } catch (error) {
            console.error('Error editing operator:', error);
            alert('Failed to update operator details.');
        }
    };

    return (
        <OperatorContext.Provider value={{ operators, addOperator, updateOperatorStatus, deleteOperator, editOperator, isLoading }}>
            {children}
        </OperatorContext.Provider>
    );
}

export function useOperators() {
    const context = useContext(OperatorContext);
    if (context === undefined) {
        throw new Error('useOperators must be used within an OperatorProvider');
    }
    return context;
}
