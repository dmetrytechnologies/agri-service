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

    const activeJobs = myJobs.filter(j => j.status === 'Assigned' || j.status === 'Confirmed');
    const completedJobs = myJobs.filter(j => j.status === 'Completed');
    const rejectedJobs = myJobs.filter(j => j.status === 'Rejected');

    if (isLoading) return <div>Syncing fleet data...</div>;

    return (
        <div className="space-y-6 md:space-y-8 px-4 md:px-0">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-none">Pilot Command</h1>
                    <p className="text-gray-500 font-bold text-sm md:text-base mt-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[var(--primary)]" />
                        Authenticated: {user?.name}
                    </p>
                </div>
                <div className="px-3 md:px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${isOnLeave ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                    <span className={`text-[10px] md:text-xs font-black ${isOnLeave ? 'text-red-700' : 'text-emerald-700'} uppercase tracking-widest leading-none`}>
                        {isOnLeave ? 'System Offline' : 'System Live'}
                    </span>
                </div>

                <button
                    onClick={toggleStatus}
                    className={`px-4 py-2 rounded-2xl border flex items-center gap-2 transition-all ${isOnLeave
                            ? 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                            : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                        }`}
                >
                    <Power className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">
                        {isOnLeave ? 'Go Online' : 'Go Offline'}
                    </span>
                </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* This div seems to be intended for stats cards, but the h2 is placed inside it.
                    Assuming the h2 should be a separate section title as in the original code,
                    and this new grid div is for new content not fully provided.
                    For now, I'll place the h2 after this new grid div,
                    and before the existing activeJobs grid, to maintain structure.
                    If the intent was for the h2 to be part of this new grid,
                    the instruction would need to be clearer.
                    Given the instruction's snippet, I'll place the h2 as shown.
                */}
            </div>

            <section className="space-y-4">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1">Current Assignments</h2>

                <div className="grid grid-cols-1 gap-6">
                    {activeJobs.length === 0 ? (
                        <div className="card bg-gray-50/50 border-dashed border-2 py-16 text-center text-gray-400 italic">
                            No active jobs assigned to you at the moment.
                        </div>
                    ) : (
                        activeJobs.map(job => (
                            <div key={job.id} className="card bg-white border-l-[6px] border-l-[var(--secondary)] overflow-hidden shadow-xl hover:-translate-y-1 transition-transform">
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-[var(--primary)] border border-emerald-100">
                                                <Wheat className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{job.farmerName}</h3>
                                                <p className="text-emerald-600 font-bold uppercase tracking-wider text-xs">{job.crop} Plantation</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Location PIN</p>
                                                <div className="flex items-center gap-2 text-gray-700 font-black">
                                                    <MapPin className="h-4 w-4 text-[var(--primary)]" />
                                                    <span>{job.pincode}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Work Area</p>
                                                <div className="flex items-center gap-2 text-gray-700 font-black">
                                                    <Maximize className="h-4 w-4 text-[var(--primary)]" />
                                                    <span>{job.acres} Acres</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Target Date</p>
                                                <div className="flex items-center gap-2 text-gray-700 font-black">
                                                    <Calendar className="h-4 w-4 text-[var(--primary)]" />
                                                    <span>{job.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 justify-center bg-gray-50/80 p-6 rounded-2xl md:w-64">
                                        <button className="btn-secondary w-full flex items-center justify-center gap-2 py-4">
                                            <Navigation className="h-5 w-5" /> Navigation
                                        </button>
                                        <button
                                            onClick={() => updateStatus(job.id, 'Completed')}
                                            className="btn-primary w-full flex items-center justify-center gap-2 py-4 shadow-green-900/20"
                                        >
                                            <CheckSquare className="h-5 w-5" /> Mark Completed
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Summary Footer */}
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
                <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                    <div className="text-center group cursor-pointer">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">Lifetime</p>
                        <p className="text-2xl font-black text-gray-900">{completedJobs.length + 12}</p>
                    </div>
                    <div className="hidden md:block h-8 w-[2px] bg-gray-100" />
                    <div className="text-center group cursor-pointer">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">Active</p>
                        <p className="text-2xl font-black text-blue-600">{activeJobs.length}</p>
                    </div>
                    <div className="hidden md:block h-8 w-[2px] bg-gray-100" />
                    <div className="text-center group cursor-pointer">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">Rejected</p>
                        <p className="text-2xl font-black text-red-500">{rejectedJobs.length}</p>
                    </div>
                </div>
                <p className="text-xs text-gray-400 italic">Live Fleet Status • Verified Sync</p>
            </section>
        </div>
    );
}
