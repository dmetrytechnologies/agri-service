'use client';

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
    UserMinus,

    RefreshCw,
    Database
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function AdminOverview() {
    const { user } = useAuth();
    const { bookings, isLoading: isBookingsLoading } = useBookings();
    const { operators, isLoading: isOperatorsLoading } = useOperators();

    const handleSeedData = () => {
        if (typeof window !== 'undefined' && confirm('Inject sample data? This will overwrite existing records.')) {
            const todayStr = new Date().toLocaleDateString('en-CA');

            // Sample Operators
            const mockOperators = [
                { id: 'OP101', name: 'Rajesh Kumar', phone: '9876543210', status: 'In-Field', jobsCompleted: 12, location: 'North Zone', service_pincodes: ['600001', '600002'], available_dates: [todayStr] },
                { id: 'OP102', name: 'Priya Singh', phone: '9876543211', status: 'Idle', jobsCompleted: 8, location: 'East Zone', service_pincodes: ['600003', '600004'], available_dates: [todayStr] },
                { id: 'OP103', name: 'Amit Patel', phone: '9876543212', status: 'Off-Duty', jobsCompleted: 45, location: 'West Zone', service_pincodes: ['600005', '600006'], available_dates: [] },
                { id: 'OP104', name: 'Suresh Reddy', phone: '9876543213', status: 'In-Field', jobsCompleted: 30, location: 'South Zone', service_pincodes: ['600007', '600008'], available_dates: [todayStr] },
                { id: 'OP105', name: 'Vikram Malhotra', phone: '9876543214', status: 'Idle', jobsCompleted: 5, location: 'Central Zone', service_pincodes: ['600009', '600010'], available_dates: [todayStr] }
            ];

            // Sample Bookings
            const mockBookings = [
                { id: 'BK001', farmerName: 'Ramesh Gupta', phone: '9988776655', pincode: '600001', date: todayStr, acres: '12', crop: 'Wheat', status: 'Assigned', isManual: true, operator: 'Rajesh Kumar' },
                { id: 'BK002', farmerName: 'Sunita Devi', phone: '9988776656', pincode: '600003', date: todayStr, acres: '5', crop: 'Rice', status: 'Pending', isManual: true },
                { id: 'BK003', farmerName: 'Anil Yadav', phone: '9988776657', pincode: '600007', date: todayStr, acres: '25', crop: 'Sugarcane', status: 'Completed', isManual: false, operator: 'Suresh Reddy' },
                { id: 'BK004', farmerName: 'Kavita Iyer', phone: '9988776658', pincode: '600002', date: todayStr, acres: '8', crop: 'Cotton', status: 'Rejected', isManual: true },
                { id: 'BK005', farmerName: 'Mohd. Khan', phone: '9988776659', pincode: '600009', date: todayStr, acres: '15', crop: 'Maize', status: 'Pending', isManual: true },
                { id: 'BK006', farmerName: 'John D\'Souza', phone: '9988776660', pincode: '600005', date: todayStr, acres: '10', crop: 'Tea', status: 'Confirmed', isManual: false, operator: 'Amit Patel' },
                { id: 'BK007', farmerName: 'Gurpreet Singh', phone: '9988776661', pincode: '600001', date: todayStr, acres: '30', crop: 'Mustard', status: 'Pending', isManual: true }
            ];

            // Sample Farmers
            const mockFarmers = mockBookings.map(b => ({
                id: `F${b.id.substring(2)}`,
                name: b.farmerName,
                phone: b.phone,
                location: `Zone ${b.pincode}`,
                total_bookings: 1,
                total_acres: Number(b.acres)
            }));

            localStorage.setItem('agri_operators', JSON.stringify(mockOperators));
            localStorage.setItem('agri_bookings', JSON.stringify(mockBookings));
            localStorage.setItem('agri_farmers', JSON.stringify(mockFarmers));

            window.location.reload();
        }
    };

    const handleSystemReset = () => {
        if (typeof window !== 'undefined' && confirm('CRITICAL: This will delete ALL bookings, pilots, and farmer records. Are you sure?')) {
            localStorage.removeItem('agri_bookings');
            localStorage.removeItem('agri_operators');
            localStorage.removeItem('agri_farmers');
            localStorage.removeItem('agri_farmersRegistry');
            window.location.reload();
        }
    };

    const stats = useMemo(() => {
        const todayStr = new Date().toLocaleDateString('en-CA');

        const totalAcres = bookings.reduce((sum, b) => sum + Number(b.acres || 0), 0);
        const pendingCount = bookings.filter(b => b.status === 'Pending').length;
        const activePilots = operators.filter(op => op.status === 'In-Field').length;

        // Daily Ops
        const todayBookings = bookings.filter(b => b.date === todayStr);
        const todayReceived = todayBookings.length;
        const todayOngoing = todayBookings.filter(b => b.status === 'Assigned' || b.status === 'Confirmed').length;
        const todayCompleted = todayBookings.filter(b => b.status === 'Completed').length;
        const todayRejected = todayBookings.filter(b => b.status === 'Rejected').length;
        const pilotsOnLeave = operators.filter(op => op.status === 'Off-Duty').length;

        const storedFarmers = localStorage.getItem('agri_farmers');
        const farmerCount = storedFarmers ? JSON.parse(storedFarmers).length : 0;

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
    }, [bookings, operators]);

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
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleSystemReset}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 transition-all shadow-lg backdrop-blur-sm"
                        title="Clear All System Data"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Reset
                    </button>
                    <button
                        onClick={handleSeedData}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-500/20 transition-all shadow-lg backdrop-blur-sm"
                        title="Inject Sample Data"
                    >
                        <Database className="h-3.5 w-3.5" /> Seed Data
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>

            {/* Live Operations Widget */}
            <div className="glass-card bg-gradient-to-br from-[#1b4332]/80 to-[#081c15]/90 text-white p-8 border-none relative overflow-hidden ring-1 ring-emerald-500/20 shadow-2xl">
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
            </div>
        </div>
    );
}
