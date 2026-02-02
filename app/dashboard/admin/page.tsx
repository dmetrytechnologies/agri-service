'use client';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useBookings } from '@/lib/booking-context';
import { useOperators } from '@/lib/operator-context';
import {
    Users,
    Calendar,
    AlertCircle,
    TrendingUp,
    ArrowUpRight,
    Map as MapIcon,
    ShoppingBag,
    Maximize,
    Activity,
    CheckCircle2,
    XCircle,
    Timer,
    UserMinus
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function AdminOverview() {
    const { user } = useAuth();
    const { bookings, farmers, isLoading: isBookingsLoading } = useBookings();
    const { operators, isLoading: isOperatorsLoading } = useOperators();
    const [isResetting, setIsResetting] = useState(false);

    const stats = useMemo(() => {
        const todayStr = new Date().toLocaleDateString('en-CA');

        const totalAcres = bookings.reduce((sum, b) => sum + Number(b.acres || 0), 0);
        const pendingCount = bookings.filter(b => b.status === 'pending').length;
        const activePilots = operators.filter(op => op.status === 'In-Field').length;

        // Daily Ops
        const todayBookings = bookings.filter(b => b.date === todayStr);
        const todayReceived = todayBookings.length;
        const todayOngoing = todayBookings.filter(b => b.status === 'assigned' || b.status === 'confirmed').length;
        const todayCompleted = bookings.filter(b => b.status === 'completed').length;
        const todayRejected = bookings.filter(b => b.status === 'rejected').length;
        const pilotsOnLeave = operators.filter(op => op.status === 'Off-Duty').length;

        // Use Context Data
        const farmerCount = farmers.length;

        return {
            bookings: bookings.length,
            acres: totalAcres,
            pending: pendingCount,
            pilots: operators.length,
            activePilots,
            farmers: farmerCount,
            daily: {
                received: todayReceived,
                ongoing: todayOngoing,
                completed: todayCompleted,
                rejected: todayRejected,
                onLeave: pilotsOnLeave
            }
        };
    }, [bookings, operators, farmers]);

    const isLoading = isBookingsLoading || isOperatorsLoading;
    if (isLoading) return <div className="p-8 text-[var(--foreground)] font-bold">Loading fleet metrics...</div>;

    const StatsCard = ({ title, value, sub, icon: Icon, colorClass, iconColorClass }: any) => (
        <div className="glass-card relative overflow-hidden group hover:bg-white/30 transition-all duration-300">
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${colorClass} group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="h-24 w-24 -mr-4 -mt-4 opacity-50" />
            </div>
            <div className="relative z-10">
                <p className="text-xs font-black text-[var(--muted)] uppercase tracking-[0.2em]">{title}</p>
                <h3 className="text-4xl font-black text-[var(--foreground)] mt-2 tracking-tight">{value}</h3>
                <p className={`text-xs mt-3 flex items-center gap-1 font-bold ${iconColorClass}`}>
                    <ArrowUpRight className="h-3 w-3" /> {sub}
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-10 px-4 md:px-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight">System Overview</h1>
                    <p className="text-sm md:text-base text-[var(--muted)] mt-1 font-medium">Live monitoring of Agri Drone operations</p>
                </div>
            </div>

            {/* Stats Grid */}
            < div className="grid grid-cols-1 md:grid-cols-3 gap-6" >
                <StatsCard
                    title="Total Bookings"
                    value={stats.bookings}
                    sub={`${stats.acres} Acres Area Sprayed`}
                    icon={Calendar}
                    colorClass="text-amber-500"
                    iconColorClass="text-amber-600 dark:text-amber-400"
                />
                <StatsCard
                    title="Active Fleet"
                    value={stats.pilots}
                    sub={`${stats.activePilots} Pilots In-Field`}
                    icon={Users}
                    colorClass="text-blue-500"
                    iconColorClass="text-blue-600 dark:text-blue-400"
                />
                <StatsCard
                    title="Farmers"
                    value={stats.farmers}
                    sub={`${stats.pending} Pending Requests`}
                    icon={ShoppingBag}
                    colorClass="text-emerald-500"
                    iconColorClass="text-emerald-600 dark:text-emerald-400"
                />
            </div >

            {/* Live Operations Widget */}
            < div className="bg-gradient-to-br from-[#1b4332]/80 to-[#081c15]/90 text-white p-8 border-none relative overflow-hidden ring-1 ring-emerald-500/20 shadow-2xl rounded-2xl" >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="h-64 w-64 -mr-16 -mt-16 animate-pulse" style={{ animationDuration: '3s' }} />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black italic tracking-tighter text-white">Today's Live Hub</h2>
                            <p className="text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mt-1 opacity-80">Real-time Dispatch Stats</p>
                        </div>
                        <div className="px-4 py-1.5 bg-emerald-400/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400/20 backdrop-blur-md text-emerald-200">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
                        <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-300 shadow-inner">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100/40 mb-1">Received</p>
                                <p className="text-3xl font-black text-white">{stats.daily.received}</p>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-300 shadow-inner">
                                <Timer className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100/40 mb-1">On-Going</p>
                                <p className="text-3xl font-black text-white">{stats.daily.ongoing}</p>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-300 shadow-inner">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100/40 mb-1">Completed</p>
                                <p className="text-3xl font-black text-white">{stats.daily.completed}</p>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-300 shadow-inner">
                                <XCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-100/40 mb-1">Rejected</p>
                                <p className="text-3xl font-black text-white">{stats.daily.rejected}</p>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-300 shadow-inner">
                                <UserMinus className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-100/40 mb-1">On Leave</p>
                                <p className="text-3xl font-black text-white">{stats.daily.onLeave}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
