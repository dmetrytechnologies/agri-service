'use client';

import { useBookings } from '@/lib/booking-context';
import {
    Users,
    ShoppingBag,
    ChevronRight,
    Calendar,
    MapPin,
    Wheat,
    Maximize,
    Activity,
    Smartphone,
    Search,
    UserPlus,
    X,
    Plus
} from 'lucide-react';
import { CROP_OPTIONS, getCropLabel } from '@/lib/constants';
import { useMemo, useState, useEffect } from 'react';

export default function AdminFarmersPage() {
    const { bookings, isLoading: isBookingsLoading } = useBookings();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [registeredFarmers, setRegisteredFarmers] = useState<any[]>([]);

    // Sync Farmer Registry from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('agri_farmers');
        if (stored) {
            setRegisteredFarmers(JSON.parse(stored));
        }
    }, []);

    const farmers = useMemo(() => {
        const uniqueFarmers = new Map();

        // 1. Populate from Registered Farmers (The Ground Truth)
        registeredFarmers.forEach(rf => {
            uniqueFarmers.set(rf.phone, {
                name: rf.name,
                phone: rf.phone,
                pincode: rf.pincode,
                address: rf.address || 'Not Provided',
                history: []
            });
        });

        // 2. Cross-reference with Bookings (Fill in gaps for legacy or non-registered)
        bookings.forEach(b => {
            if (!uniqueFarmers.has(b.phone)) {
                uniqueFarmers.set(b.phone, {
                    name: b.farmerName,
                    phone: b.phone,
                    pincode: b.pincode,
                    address: 'Inferred from booking',
                    history: []
                });
            }
            uniqueFarmers.get(b.phone).history.push({
                id: b.id,
                date: b.date,
                crop: b.crop,
                acres: b.acres,
                status: b.status
            });
        });

        return Array.from(uniqueFarmers.values()).filter(f =>
            f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.phone.includes(searchTerm) ||
            f.pincode.includes(searchTerm)
        );
    }, [bookings, registeredFarmers, searchTerm]);

    const handleAddFarmer = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newFarmer = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            pincode: formData.get('pincode'),
            address: formData.get('address'),
            createdAt: new Date().toISOString()
        };

        const existing = [...registeredFarmers];
        if (existing.find(f => f.phone === newFarmer.phone)) {
            alert("Farmer with this phone is already registered.");
            return;
        }

        const updated = [...existing, newFarmer];
        localStorage.setItem('agri_farmers', JSON.stringify(updated));
        setRegisteredFarmers(updated);
        setIsModalOpen(false);
    };

    if (isBookingsLoading) return <div className="p-8 text-center font-bold text-[var(--muted)] uppercase tracking-widest">Syncing Farmer Directory...</div>;

    return (
        <div className="space-y-6 md:space-y-10 px-4 md:px-0 relative">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight">Farmer Directory</h1>
                    <p className="text-sm md:text-base text-[var(--muted)] font-medium">CRM overview of all serviced farmers</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4 group-focus-within:text-[var(--primary)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, phone..."
                            className="glass-input pl-12 h-12 md:h-14 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="glass-button glass-button-primary flex items-center justify-center gap-2 h-12 md:h-14 px-6 whitespace-nowrap shadow-lg"
                    >
                        <UserPlus className="h-5 w-5" /> Quick Farmer
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {farmers.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-panel rounded-[3rem]">
                        <p className="text-[var(--muted)] italic">No farmers found matching your search.</p>
                    </div>
                ) : (
                    farmers.map((farmer) => (
                        <div key={farmer.phone} className="group relative">
                            <div className="glass-card p-6 flex flex-col h-full hover:translate-y-[-4px] hover:shadow-xl hover:bg-white/30 transition-all duration-300">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="glass-icon-btn h-16 w-16 text-[var(--primary)] font-black text-2xl">
                                        {farmer.name.charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Total Bookings</p>
                                        <p className="text-2xl font-black text-[var(--foreground)]">{farmer.history.length}</p>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-6">
                                    <h3 className="text-xl font-black text-[var(--foreground)] leading-tight">{farmer.name}</h3>
                                    <div className="flex items-center gap-2 text-[var(--muted)] font-bold text-sm">
                                        <Smartphone className="h-3 w-3" /> {farmer.phone}
                                    </div>
                                </div>

                                <div className="mt-auto space-y-4 pt-6 border-t border-white/10">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1.5 text-[var(--muted)] font-black uppercase tracking-tighter">
                                            <MapPin className="h-3 w-3" /> Primary PIN
                                        </span>
                                        <span className="font-bold text-[var(--foreground)] bg-white/10 px-2 py-0.5 rounded-lg shadow-inner">{farmer.pincode}</span>
                                    </div>

                                    {/* History Summary Tooltip Area */}
                                    <div className="relative group/history">
                                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 text-[10px] font-black text-[var(--muted)] uppercase tracking-widest rounded-2xl shadow-inner hover:text-[var(--primary)] transition-all duration-300 backdrop-blur-sm">
                                            <Activity className="h-3.5 w-3.5" /> Recent Service History
                                        </button>

                                        {/* Hover Overlay */}
                                        <div className="absolute bottom-full left-0 right-0 mb-4 opacity-0 pointer-events-none group-hover/history:opacity-100 group-hover/history:pointer-events-auto transition-all duration-300 z-20">
                                            <div className="glass-card p-4 rounded-3xl shadow-2xl border border-white/20 space-y-3 bg-[var(--glass-bg)] backdrop-blur-xl">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] border-b border-white/10 pb-2">Last 3 Engagements</p>
                                                <div className="space-y-2">
                                                    {farmer.history.length === 0 ? (
                                                        <p className="text-[10px] text-gray-400 italic py-2 text-center">New Farmer - No jobs yet</p>
                                                    ) : (
                                                        farmer.history.slice(0, 3).map((job: any) => (
                                                            <div key={job.id} className="flex items-center justify-between gap-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-[var(--foreground)]">{getCropLabel(job.crop)}</span>
                                                                    <span className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-tighter">{job.date}</span>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[11px] font-black text-[var(--primary)]">{job.acres} Ac</span>
                                                                    <span className="text-[8px] font-black uppercase text-[var(--muted)]">{job.status}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-4 h-4 bg-[var(--glass-bg)] border-b border-r border-white/20 rotate-45 mx-auto -mt-2 shadow-2xl backdrop-blur-xl" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick Farmer Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative glass-card w-full max-w-lg p-8 shadow-2xl animate-in zoom-in duration-300 bg-[var(--glass-bg)]">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Onboard Farmer</h2>
                                <p className="text-sm text-[var(--muted)] font-bold">Manual partner registration</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="glass-icon-btn h-10 w-10">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddFarmer} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest ml-1">Full Name</label>
                                    <input name="name" required className="glass-input h-14 font-bold" placeholder="e.g. Ramesh Reddy" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest ml-1">Phone Number</label>
                                    <input name="phone" required maxLength={10} className="glass-input h-14 font-bold" placeholder="9999999999" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest ml-1">PIN Code</label>
                                        <input name="pincode" required maxLength={6} className="glass-input h-14 font-bold" placeholder="500001" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest ml-1">Village/Area</label>
                                        <input name="address" required className="glass-input h-14 font-bold" placeholder="Village Name" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="glass-button glass-button-primary w-full py-5 text-lg shadow-xl shadow-green-900/10 mt-4">
                                Confirm Registration
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
