'use client';

import { useAuth } from '@/lib/auth-context';
import { useBookings } from '@/lib/booking-context';
import { useOperators } from '@/lib/operator-context';
import { MapPin, Calendar, CheckSquare, Navigation, Wheat, Maximize, XCircle, Activity, Power } from 'lucide-react';

export default function OperatorDashboard() {
    const { user } = useAuth();
    const { bookings, updateStatus, isLoading } = useBookings();
    const { operators, updateOperatorStatus } = useOperators();

    // Find current operator's status
    const currentOperator = operators.find(op => op.name === user?.name);
    const isOnLeave = currentOperator?.status === 'Off-Duty';

    const toggleStatus = () => {
        if (!currentOperator) return;
        const newStatus = isOnLeave ? 'Idle' : 'Off-Duty';
        updateOperatorStatus(currentOperator.id, newStatus);
    };

    // Filter jobs explicitly assigned to this operator
    // Matches by exact name string from the global booking context
    const myJobs = bookings.filter(job => job.operator === user?.name);

    const activeJobs = myJobs.filter(j => j.status === 'assigned' || j.status === 'confirmed');
    const completedJobs = myJobs.filter(j => j.status === 'completed');
    const rejectedJobs = myJobs.filter(j => j.status === 'rejected');

    if (isLoading) return <div>Syncing fleet data...</div>;

    return (
        <div className="space-y-6 md:space-y-8 px-4 md:px-0">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-[var(--foreground)] leading-none">Pilot Command</h1>
                    <p className="text-[var(--muted)] font-bold text-sm md:text-base mt-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[var(--primary)]" />
                        Authenticated: <span className="text-[var(--foreground)]">{user?.name}</span>
                    </p>
                </div>
                <div className="px-3 md:px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${isOnLeave ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                    <span className={`text-[10px] md:text-xs font-black ${isOnLeave ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'} uppercase tracking-widest leading-none`}>
                        {isOnLeave ? 'System Offline' : 'System Live'}
                    </span>
                </div>

                <button
                    onClick={toggleStatus}
                    className={`px-4 py-2 rounded-2xl border flex items-center gap-2 transition-all ${isOnLeave
                        ? 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10 text-[var(--muted)] hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200'
                        : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
                        }`}
                >
                    <Power className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">
                        {isOnLeave ? 'Go Online' : 'Go Offline'}
                    </span>
                </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* Reserved for Stats */}
            </div>



            {/* Summary Footer */}
            <section className="glass-panel p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
                <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                    <div className="text-center group cursor-pointer">
                        <p className="text-xs font-black text-[var(--muted)] uppercase mb-1">Lifetime</p>
                        <p className="text-2xl font-black text-[var(--foreground)]">{completedJobs.length}</p>
                    </div>
                    <div className="hidden md:block h-8 w-[2px] bg-[var(--muted)]/20" />
                    <div className="text-center group cursor-pointer">
                        <p className="text-xs font-black text-[var(--muted)] uppercase mb-1">Active</p>
                        <p className="text-2xl font-black text-blue-500">{activeJobs.length}</p>
                    </div>
                    <div className="hidden md:block h-8 w-[2px] bg-[var(--muted)]/20" />
                    <div className="text-center group cursor-pointer">
                        <p className="text-xs font-black text-[var(--muted)] uppercase mb-1">Rejected</p>
                        <p className="text-2xl font-black text-red-500">{rejectedJobs.length}</p>
                    </div>
                </div>
                <p className="text-xs text-[var(--muted)] italic">Live Fleet Status • Verified Sync</p>
            </section>
        </div>
    );
}
