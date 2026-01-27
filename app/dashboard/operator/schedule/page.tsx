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
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function OperatorSchedulePage() {
    const { user } = useAuth();
    const { bookings, updateStatus, rejectBooking, confirmBooking, isLoading } = useBookings();

    const myJobs = useMemo(() => {
        return bookings.filter(job => job.operator === user?.name && job.status !== 'Rejected');
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

    const JobCard = ({ job }: { job: any }) => (
        <div className={`p-4 md:p-6 bg-white rounded-3xl border shadow-sm transition-all hover:shadow-md ${job.status === 'Confirmed' ? 'border-emerald-500/30' :
            job.status === 'Completed' ? 'opacity-70 bg-gray-50' : 'border-gray-100'
            }`}>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start md:items-center">
                <div className="flex items-start gap-3 md:gap-4 flex-1">
                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shrink-0 ${job.status === 'Completed' ? 'bg-gray-200 text-gray-500' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        <Wheat className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight">{job.farmerName}</h3>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest ${job.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                job.status === 'Confirmed' ? 'bg-emerald-500 text-white' :
                                    'bg-blue-50 text-blue-700'
                                }`}>
                                {job.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.pincode}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.acres} Acres</span>
                            <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {job.date}</span>
                            <span className="text-[var(--primary)] whitespace-nowrap">{job.crop}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                    {job.status === 'Assigned' && (
                        <>
                            <button
                                onClick={() => rejectBooking(job.id)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm md:shadow-none"
                            >
                                <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button
                                onClick={() => confirmBooking(job.id)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2 bg-[var(--primary)] text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/10 hover:scale-[1.02] transition-all"
                            >
                                <CheckCircle2 className="h-4 w-4" /> Confirm
                            </button>
                        </>
                    )}
                    {(job.status === 'Confirmed' || job.status === 'Assigned') && (
                        <button
                            onClick={() => updateStatus(job.id, 'Completed')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2 border rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${job.status === 'Confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-50 text-gray-400 border-gray-100'
                                }`}
                        >
                            <CheckCircle className="h-4 w-4" /> Mark Completed
                        </button>
                    )}
                    {job.status === 'Completed' && (
                        <div className="flex items-center justify-center flex-1 md:flex-none gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-green-100/50">
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
                <div className="flex-1 h-[1px] bg-gray-100" />
                <span className="text-[10px] font-black px-2 py-0.5 bg-white border rounded-full">{jobs.length}</span>
            </div>
            <div className="space-y-4">
                {jobs.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] text-center text-gray-300 italic text-sm">
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
                    <Link href="/dashboard/operator" className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">Deployment Schedule</h1>
                        <p className="text-[10px] md:text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Pilot {user?.name} Timeline</p>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                <Section
                    title="Today"
                    jobs={groups.today}
                    icon={Activity}
                    color="text-emerald-600"
                />

                <Section
                    title="Tomorrow"
                    jobs={groups.tomorrow}
                    icon={Clock}
                    color="text-blue-600"
                />

                <Section
                    title="Upcoming"
                    jobs={groups.upcoming}
                    icon={CalendarIcon}
                    color="text-amber-600"
                />
            </div>
        </div>
    );
}
