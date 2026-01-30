'use client';

import { useAuth } from '@/lib/auth-context';
import { useBookings } from '@/lib/booking-context';
import {
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Wheat,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    CheckCircle,
    AlertCircle,
    Activity,
    Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';

export default function OperatorSchedulePage() {
    const { user } = useAuth();
    const { bookings, updateStatus, rejectBooking, confirmBooking, isLoading } = useBookings();

    const [selectedJob, setSelectedJob] = useState<any>(null);

    const myJobs = useMemo(() => {
        return bookings.filter(job => job.operator === user?.name && job.status !== 'rejected');
    }, [bookings, user]);

    // Grouping Logic
    const groups = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        return {
            today: myJobs.filter(j => j.date === todayStr),
            tomorrow: myJobs.filter(j => j.date === tomorrowStr),
            upcoming: myJobs.filter(j => j.date > tomorrowStr).sort((a, b) => a.date.localeCompare(b.date))
        };
    }, [myJobs]);

    if (isLoading) return <div className="p-8">Syncing schedule...</div>;

    const isToday = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    const JobDetailsModal = ({ job, onClose }: { job: any; onClose: () => void }) => {
        if (!job) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="relative h-32 bg-[var(--primary)]/10 flex items-center justify-center">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-[var(--foreground)]"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                        <div className="bg-[var(--glass-bg)] p-4 rounded-2xl shadow-lg mt-8">
                            <Wheat className="h-10 w-10 text-[var(--primary)]" />
                        </div>
                    </div>

                    <div className="p-6 pt-12 space-y-6">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-black text-[var(--foreground)]">{job.farmerName}</h2>
                            <div className="flex justify-center gap-2">
                                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] uppercase tracking-wider">
                                    {job.crop}
                                </span>
                                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[var(--muted)]/10 text-[var(--muted)] uppercase tracking-wider">
                                    {job.acres} Acres
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-panel p-3 space-y-1">
                                <p className="text-[10px] font-black uppercase text-[var(--muted)] tracking-widest">Date</p>
                                <div className="flex items-center gap-2 font-bold text-[var(--foreground)]">
                                    <CalendarIcon className="h-4 w-4 text-[var(--primary)]" />
                                    {job.date}
                                </div>
                            </div>
                            <div className="glass-panel p-3 space-y-1">
                                <p className="text-[10px] font-black uppercase text-[var(--muted)] tracking-widest">Contact</p>
                                <div className="flex items-center gap-2 font-bold text-[var(--foreground)]">
                                    <Smartphone className="h-4 w-4 text-[var(--primary)]" />
                                    <a href={`tel:${job.phone}`} className="hover:underline">{job.phone}</a>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-[var(--primary)] mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-[var(--muted)] tracking-widest mb-1">Location Details</p>
                                    <p className="font-bold text-[var(--foreground)]">{job.location || 'No specific address provided'}</p>
                                    <p className="text-sm text-[var(--muted)] mt-1">{job.village ? `${job.village}, ` : ''}{job.pincode}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            {job.status === 'assigned' && (
                                <>
                                    <button
                                        onClick={() => { rejectBooking(job.id); onClose(); }}
                                        className="flex-1 py-3 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => { confirmBooking(job.id); onClose(); }}
                                        className="flex-[2] glass-button glass-button-primary py-3 text-xs uppercase tracking-widest font-black"
                                    >
                                        Confirm Job
                                    </button>
                                </>
                            )}
                            {(job.status === 'confirmed' || job.status === 'assigned') && isToday(job.date) && (
                                <button
                                    onClick={() => { updateStatus(job.id, 'completed'); onClose(); }}
                                    className="w-full glass-button bg-emerald-600 text-white hover:bg-emerald-700 py-3 text-xs uppercase tracking-widest font-black flex justify-center items-center gap-2"
                                >
                                    <CheckCircle2 className="h-4 w-4" /> Mark Completed
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const JobCard = ({ job }: { job: any }) => (
        <div
            onClick={() => setSelectedJob(job)}
            className={`cursor-pointer p-4 md:p-6 glass-card shadow-sm transition-all hover:shadow-md hover:scale-[1.01] border-l-[3px] ${job.status === 'confirmed' ? 'border-emerald-500/30' :
                job.status === 'completed' ? 'opacity-70 bg-[var(--muted)]/5' : 'border-[var(--glass-border)]'
                }`}
        >
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start md:items-center">
                <div className="flex items-start gap-3 md:gap-4 flex-1">
                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shrink-0 ${job.status === 'completed' ? 'bg-[var(--muted)]/10 text-[var(--muted)]' : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                        }`}>
                        <Wheat className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <h3 className="text-lg md:text-xl font-black text-[var(--foreground)] leading-tight">{job.farmerName}</h3>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest ${job.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' :
                                job.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                                    'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                }`}>
                                {job.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] md:text-xs text-[var(--muted)] font-bold uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.pincode}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.acres} Acres</span>
                            <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {job.date}</span>
                            <span className="text-[var(--primary)] whitespace-nowrap">{job.crop}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <div className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest flex items-center gap-1 md:hidden">
                        Tap for details <ChevronLeft className="h-3 w-3 rotate-180" />
                    </div>
                </div>
                <div className="hidden md:flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                    {job.status === 'assigned' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); rejectBooking(job.id); }}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm md:shadow-none"
                            >
                                <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); confirmBooking(job.id); }}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/10 hover:scale-[1.02] transition-all"
                            >
                                <CheckCircle2 className="h-4 w-4" /> Confirm
                            </button>
                        </>
                    )}
                    {(job.status === 'confirmed' || job.status === 'assigned') && isToday(job.date) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(job.id, 'completed'); }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2 border rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${job.status === 'confirmed'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                : 'bg-gray-50 dark:bg-white/5 text-[var(--muted)] border-[var(--glass-border)]'
                                }`}
                        >
                            <CheckCircle className="h-4 w-4" /> Mark Completed
                        </button>
                    )}
                    {job.status === 'completed' && (
                        <div className="flex items-center justify-center flex-1 md:flex-none gap-2 px-4 py-2 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-green-100/50 dark:border-green-500/10">
                            <CheckCircle2 className="h-4 w-4" /> Job Finished
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const Section = ({ title, jobs, icon: Icon, color }: any) => (
        <div className="space-y-4">
            <div className={`flex items-center gap-3 px-2 ${color}`}>
                <Icon className="h-5 w-5" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">{title}</h2>
                <div className="flex-1 h-[1px] bg-[var(--muted)]/20" />
                <span className="text-[10px] font-black px-2 py-0.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full text-[var(--foreground)]">{jobs.length}</span>
            </div>
            <div className="space-y-4">
                {jobs.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-[var(--muted)]/20 rounded-[2rem] text-center text-[var(--muted)] italic text-sm">
                        No tasks scheduled for {title.toLowerCase()}.
                    </div>
                ) : (
                    jobs.map((job: any) => <JobCard key={job.id} job={job} />)
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-10 max-w-5xl mx-auto pb-20 px-4 md:px-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4">
                    <Link href="/dashboard/operator" className="p-2 hover:bg-[var(--glass-bg)] rounded-full transition-colors shrink-0">
                        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-[var(--muted)]" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black text-[var(--foreground)] tracking-tight leading-tight">Deployment Schedule</h1>
                        <p className="text-[10px] md:text-sm text-[var(--muted)] font-bold uppercase tracking-widest mt-1">Pilot <span className="text-[var(--primary)]">{user?.name}</span> Timeline</p>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                <Section
                    title="Today"
                    jobs={groups.today}
                    icon={Activity}
                    color="text-emerald-600 dark:text-emerald-400"
                />

                <Section
                    title="Tomorrow"
                    jobs={groups.tomorrow}
                    icon={Clock}
                    color="text-blue-600 dark:text-blue-400"
                />

                <Section
                    title="Upcoming"
                    jobs={groups.upcoming}
                    icon={CalendarIcon}
                    color="text-amber-600 dark:text-amber-400"
                />
            </div>

            <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
        </div>
    );
}
