'use client';

import { useState } from 'react';
import { useBookings } from '@/lib/booking-context';
import { useOperators, Operator } from '@/lib/operator-context';
import { CROP_OPTIONS, getCropLabel } from '@/lib/constants';
import {
    Calendar,
    Search,
    CheckCircle,
    MapPin,
    Share2,
    Check,
    X,
    ClipboardList,
    Clock,
    Activity,
    Plus,
    UserCircle,
    Smartphone,
    Globe,
    Edit,
    Filter,
    ArrowUpDown
} from 'lucide-react';

export default function AllBookingsPage() {
    const { bookings, addBooking, updateBooking, assignOperator, isLoading: isBookingsLoading } = useBookings();
    const { operators, isLoading: isOperatorsLoading } = useOperators();

    const [filter, setFilter] = useState<'All' | 'Pending' | 'Assigned' | 'Completed'>('All');
    const [dateFilter, setDateFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [newManualBooking, setNewManualBooking] = useState({
        farmerName: '',
        phone: '',
        crop: '',
        acres: '',
        pincode: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Pincode validation
        if (!/^\d{6}$/.test(newManualBooking.pincode)) {
            alert('Pincode must be exactly 6 digits');
            return;
        }

        // Acreage validation (1-100)
        const acres = Number(newManualBooking.acres);
        if (isNaN(acres) || acres < 1 || acres > 100) {
            alert('Operational Limit: Acreage must be between 1 and 100 acres.');
            return;
        }

        // Crop validation
        if (!newManualBooking.crop) {
            alert('Please select a crop type');
            return;
        }

        if (editingId) {
            updateBooking(editingId, newManualBooking);
        } else {
            addBooking(newManualBooking);
        }

        setIsManualModalOpen(false);
        setEditingId(null);
        setNewManualBooking({
            farmerName: '',
            phone: '',
            crop: '',
            acres: '',
            pincode: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const openEditModal = (booking: any) => {
        setEditingId(booking.id);
        setNewManualBooking({
            farmerName: booking.farmerName,
            phone: booking.phone,
            crop: booking.crop,
            acres: booking.acres,
            pincode: booking.pincode,
            date: booking.date
        });
        setIsManualModalOpen(true);
    };

    const handleAssign = (id: string, operatorName: string) => {
        assignOperator(id, operatorName);
    };

    const copyToWhatsApp = (booking: any) => {
        const text = `🚜 *Agri-Drone Assignment* 🚜\n\n` +
            `*Booking ID:* ${booking.id}\n` +
            `*Farmer:* ${booking.farmerName}\n` +
            `*Contact:* ${booking.phone}\n` +
            `*Crop:* ${booking.crop}\n` +
            `*Land Size:* ${booking.acres} Acres\n` +
            `*Service Date:* ${booking.date}\n` +
            `*Location:* ${booking.pincode} (${booking.address || 'Field'})\n` +
            `*Assigned Pilot:* ${booking.operator}\n\n` +
            `_Generated via Dmetry Agri Hub_`;

        navigator.clipboard.writeText(text);
        setCopiedId(booking.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredBookings = bookings.filter(b => {
        const matchesFilter = filter === 'All' || b.status === filter;
        const matchesSearch = b.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.id.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (dateFilter) {
            matchesDate = b.date === dateFilter;
        } else if (monthFilter) {
            matchesDate = b.date.startsWith(monthFilter);
        }

        return matchesFilter && matchesSearch && matchesDate;
    }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const getAvailableOperators = (booking: any) => {
        const exactMatch = operators.filter((op: Operator) =>
            op.service_pincodes.includes(booking.pincode) &&
            op.available_dates.includes(booking.date)
        );
        if (exactMatch.length > 0) return { type: 'Perfect Match', ops: exactMatch };

        const pinMatch = operators.filter((op: Operator) =>
            op.service_pincodes.includes(booking.pincode)
        );
        if (pinMatch.length > 0) return { type: 'PIN Match', ops: pinMatch };

        return { type: 'All Pilots', ops: operators };
    };

    const isLoading = isBookingsLoading || isOperatorsLoading;
    if (isLoading) return <div className="p-8 text-[var(--foreground)] font-bold">Syncing records...</div>;

    return (
        <div className="space-y-4 md:space-y-6 px-4 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight">Booking Management</h1>
                    <p className="text-sm md:text-base text-[var(--muted)] font-medium">Live synchronization with Farmer requests</p>
                </div>
                <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="glass-button glass-button-primary flex items-center justify-center gap-2 w-full md:w-auto py-3 md:py-2"
                >
                    <Plus className="h-4 w-4" /> Create Booking
                </button>
            </div>

            {/* Controls */}
            <div className="glass-card flex flex-col gap-4 py-4 px-4 transition-all duration-300">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search by ID or Farmer Name..."
                            className="glass-input pl-10 h-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`p-2.5 rounded-xl border transition-all ${isFilterOpen
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg'
                            : 'bg-white/5 text-[var(--muted)] border-white/10 hover:bg-white/10 hover:text-[var(--foreground)]'
                            }`}
                        title="Toggle Filters"
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                </div>

                {isFilterOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Sort Order</label>
                            <div className="relative">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-3.5 w-3.5" />
                                <select
                                    className="glass-input pl-9 h-10 text-xs w-full appearance-none"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-3.5 w-3.5" />
                                <input
                                    type="date"
                                    className="glass-input pl-9 h-10 w-full text-xs"
                                    value={dateFilter}
                                    onChange={(e) => {
                                        setDateFilter(e.target.value);
                                        setMonthFilter('');
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Month</label>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] h-3.5 w-3.5" />
                                <input
                                    type="month"
                                    className="glass-input pl-9 h-10 w-full text-xs"
                                    value={monthFilter}
                                    onChange={(e) => {
                                        setMonthFilter(e.target.value);
                                        setDateFilter('');
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Status</label>
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                {(['All', 'Pending', 'Assigned', 'Completed'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center ${filter === f
                                            ? 'bg-[var(--primary)] text-white shadow-md'
                                            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bookings Table */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-medium">
                        <thead className="bg-black/5 dark:bg-white/5 border-b border-white/10 text-xs uppercase text-[var(--muted)] font-black tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Booking</th>
                                <th className="px-6 py-4">Farmer Details</th>
                                <th className="px-6 py-4">Match Filter</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Assigned Pilot</th>
                                <th className="px-6 py-4 text-center">Assign Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-[var(--muted)] italic font-bold">No live bookings found.</td>
                                </tr>
                            ) : (
                                filteredBookings.map((b) => {
                                    const suitableOps = getAvailableOperators(b);
                                    return (
                                        <tr key={b.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedBooking(b)}
                                                        className="font-black text-[var(--primary)] hover:underline decoration-2 underline-offset-4"
                                                    >
                                                        {b.id}
                                                    </button>
                                                    {b.isManual && (
                                                        <button
                                                            onClick={() => openEditModal(b)}
                                                            className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                                                            title="Edit Manual Booking"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[var(--foreground)]">{b.farmerName}</span>
                                                    <span className="text-xs text-[var(--muted)] font-mono">{b.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-emerald-500/20">
                                                        <MapPin className="h-3 w-3" /> PIN: {b.pincode}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-amber-500/20">
                                                        <Calendar className="h-3 w-3" /> {b.date}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${b.status === 'Completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/20' :
                                                    b.status === 'Assigned' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20' :
                                                        'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ring-yellow-500/20'
                                                    }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                                                {b.operator ? (
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                                            <span className="font-bold">{b.operator}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => copyToWhatsApp(b)}
                                                            className={`p-2 rounded-lg transition-all border ${copiedId === b.id
                                                                ? 'bg-green-500 text-white border-green-600 shadow-lg'
                                                                : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                                                                }`}
                                                            title="Copy for WhatsApp"
                                                        >
                                                            {copiedId === b.id ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--muted)] italic text-xs">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {b.status === 'Pending' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="relative">
                                                            <select
                                                                className="glass-input h-9 text-xs py-1 pr-8 w-full font-bold"
                                                                onChange={(e) => handleAssign(b.id, e.target.value)}
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>{suitableOps.type} ({suitableOps.ops.length})</option>
                                                                {suitableOps.ops.map((op: Operator) => (
                                                                    <option key={op.id} value={op.name} className="text-black">
                                                                        {op.name} {suitableOps.type === 'All Pilots' ? `(${op.location})` : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {suitableOps.type === 'All Pilots' && (
                                                            <p className="text-[9px] text-amber-500 font-bold bg-amber-500/10 p-1 rounded mt-1 text-center">No local match - showing all</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* QUICK VIEW MODAL */}
            {
                selectedBooking && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedBooking(null)} />
                        <div className="relative w-full max-w-sm glass-card p-8 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in zoom-in duration-300">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="h-16 w-16 bg-green-500/10 text-[var(--primary)] rounded-2xl flex items-center justify-center mb-4 border border-green-500/20">
                                    <ClipboardList className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-black text-[var(--foreground)] leading-tight">Booking Info</h2>
                                <p className="text-xs font-black text-[var(--primary)] uppercase tracking-[0.2em] mt-1">{selectedBooking.id}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Crop Type</p>
                                        <p className="font-bold text-[var(--foreground)]">{getCropLabel(selectedBooking.crop)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Land Size</p>
                                        <p className="font-bold text-[var(--foreground)]">{selectedBooking.acres} Acres</p>
                                    </div>
                                </div>

                                <div className="space-y-3 px-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-[var(--muted)]" />
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Service Date</p>
                                            <p className="font-bold text-[var(--foreground)]">{selectedBooking.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-[var(--muted)]" />
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Location</p>
                                            <p className="font-bold text-[var(--foreground)]">{selectedBooking.address || 'Field Location'} ({selectedBooking.pincode})</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Activity className="h-4 w-4 text-[var(--muted)]" />
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Field Status</p>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${selectedBooking.status === 'Completed' ? 'bg-green-500/10 text-green-600' :
                                                selectedBooking.status === 'Assigned' ? 'bg-blue-500/10 text-blue-600' : 'bg-yellow-500/10 text-yellow-600'
                                                }`}>
                                                {selectedBooking.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="w-full glass-button glass-button-primary py-4 rounded-2xl mt-8 shadow-xl"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )
            }

            {/* MANUAL BOOKING MODAL */}
            {
                isManualModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsManualModalOpen(false)} />
                        <div className="relative w-full max-w-md glass-card p-8 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in zoom-in duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-[var(--foreground)] italic">{editingId ? 'Edit Booking' : 'Quick Booking'}</h2>
                                <button
                                    onClick={() => {
                                        setIsManualModalOpen(false);
                                        setEditingId(null);
                                    }}
                                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleManualSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Farmer Name</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                        <input
                                            required
                                            className="glass-input pl-10"
                                            placeholder="Farmer Full Name"
                                            value={newManualBooking.farmerName}
                                            onChange={e => setNewManualBooking({ ...newManualBooking, farmerName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Phone</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                            <input
                                                required
                                                className="glass-input pl-10"
                                                placeholder="Contact No"
                                                value={newManualBooking.phone}
                                                onChange={e => setNewManualBooking({ ...newManualBooking, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Pincode</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                            <input
                                                required
                                                className="glass-input pl-10"
                                                placeholder="6 Digits"
                                                value={newManualBooking.pincode}
                                                onChange={e => setNewManualBooking({ ...newManualBooking, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Crop</label>
                                        <select
                                            required
                                            className="glass-input !h-12 !py-2 px-4 text-[var(--foreground)] bg-transparent border-white/20"
                                            value={newManualBooking.crop}
                                            onChange={e => setNewManualBooking({ ...newManualBooking, crop: e.target.value })}
                                        >
                                            <option value="" disabled className="text-gray-500 bg-[var(--glass-bg)] dark:bg-slate-900">Select Crop</option>
                                            {CROP_OPTIONS.map(crop => (
                                                <option key={crop.value} value={crop.value} className="text-[var(--foreground)] bg-white dark:bg-slate-800">{crop.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Land Size (1-100 Ac)</label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="glass-input"
                                            placeholder="Acreage"
                                            value={newManualBooking.acres}
                                            onChange={e => setNewManualBooking({ ...newManualBooking, acres: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Service Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="glass-input"
                                        value={newManualBooking.date}
                                        onChange={e => setNewManualBooking({ ...newManualBooking, date: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsManualModalOpen(false)}
                                        className="flex-1 py-3 text-sm font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] glass-button glass-button-primary py-3 shadow-xl"
                                    >
                                        {editingId ? 'Update Booking' : 'Confirm Booking'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
