'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useBookings } from '@/lib/booking-context';
import { Calendar, Clock, CheckCircle, Wheat, Maximize, ChevronDown, MapPin } from 'lucide-react';

import { CROP_OPTIONS, getCropLabel } from '@/lib/constants';

export default function FarmerDashboard() {
    const { user } = useAuth();
    const { bookings, addBooking, isLoading: isBookingsLoading } = useBookings();

    const [newBooking, setNewBooking] = useState({ date: '', acres: '', crop: CROP_OPTIONS[0].value });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter bookings for the current farmer
    const farmerBookings = bookings.filter(b => b.phone === user?.phone);

    const handleBook = (e: React.FormEvent) => {
        e.preventDefault();

        const acresNum = parseFloat(newBooking.acres);
        if (acresNum < 1 || acresNum > 100) {
            alert("Please enter land area between 1 and 100 acres.");
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            addBooking({
                farmerName: user?.name || 'Unknown',
                phone: user?.phone || '',
                pincode: user?.pincode || '600001',
                date: newBooking.date,
                acres: newBooking.acres,
                crop: newBooking.crop,
                location: user?.address || 'My Farm'
            });
            setNewBooking({ date: '', acres: '', crop: CROP_OPTIONS[0].value });
            setIsSubmitting(false);
        }, 800);
    };

    if (isBookingsLoading) return <div className="p-8 text-[var(--foreground)] font-bold">Loading bookings...</div>;

    return (
        <div className="space-y-4 md:space-y-8 max-w-6xl mx-auto px-4 md:px-0">
            <header className="mb-6 md:mb-8 pl-2">
                <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] italic leading-tight">Vanakkam, {user?.name}</h1>
                <p className="text-sm md:text-base text-[var(--muted)] font-medium">Book your high-speed drone spraying service below</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* New Booking Form */}
                <section className="lg:col-span-1">
                    <div className="glass-card h-full">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--primary)]">
                            <Calendar className="h-6 w-6" />
                            New Spraying Request
                        </h2>
                        <form onSubmit={handleBook} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest pl-1">Select Crop</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Wheat className="h-4 w-4 text-[var(--primary)]" />
                                        </div>
                                        <select
                                            required
                                            className="glass-input pl-10 appearance-none cursor-pointer font-medium text-[var(--foreground)] [&>option]:text-black"
                                            value={newBooking.crop}
                                            onChange={e => setNewBooking({ ...newBooking, crop: e.target.value })}
                                        >
                                            {CROP_OPTIONS.map(crop => (
                                                <option key={crop.value} value={crop.value}>{crop.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)] pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="glass-panel px-4 py-3 border border-white/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" />
                                            <span className="uppercase tracking-[0.1em] opacity-60 text-[10px] font-bold text-[var(--primary)]">Service Address</span>
                                        </div>
                                        <p className="text-[var(--foreground)] normal-case mb-2 font-medium text-sm">{user?.address || 'Main St, Village Area'}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="uppercase tracking-[0.1em] opacity-60 text-[10px] font-bold text-[var(--muted)]">Pincode:</span>
                                            <span className="bg-[var(--primary)] text-white px-2 py-0.5 rounded-md font-black text-xs shadow-sm">
                                                {user?.pincode || '600001'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest pl-1">Area of Land (1-100 Acres)</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Maximize className="h-4 w-4 text-[var(--primary)]" />
                                    </div>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="100"
                                        step="0.1"
                                        placeholder="Enter size (1 to 100)"
                                        className="glass-input pl-10"
                                        value={newBooking.acres}
                                        onChange={e => setNewBooking({ ...newBooking, acres: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest pl-1">Service Date</label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="glass-input dark:invert"
                                    value={newBooking.date}
                                    onChange={e => setNewBooking({ ...newBooking, date: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="glass-button glass-button-primary w-full py-4 text-lg mt-2 shadow-lg"
                            >
                                {isSubmitting ? 'Sending Request...' : 'Confirm Spraying'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* Booking History */}
                <section className="lg:col-span-2">
                    <div className="h-full">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--foreground)] pl-2">
                            <Clock className="h-6 w-6 text-[var(--primary)]" />
                            Request Status
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            {farmerBookings.length === 0 ? (
                                <div className="glass-panel text-center py-16 rounded-3xl opacity-60">
                                    <p className="text-[var(--muted)] font-medium">No spraying requests found.</p>
                                    <p className="text-xs text-[var(--muted)] mt-1">Your new bookings will appear here.</p>
                                </div>
                            ) : (
                                farmerBookings.map((booking) => (
                                    <div key={booking.id} className="glass-card p-6 flex flex-col sm:flex-row justify-between items-start gap-4 hover:translate-y-[-4px] hover:bg-white/30 transition-all">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-4">
                                                <div className="glass-icon-btn h-12 w-12 text-[var(--primary)]">
                                                    <Wheat className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-[var(--foreground)] leading-none text-lg">
                                                        {getCropLabel(booking.crop)} Spraying
                                                    </h3>
                                                    <p className="text-xs text-[var(--muted)] mt-1 font-bold uppercase tracking-tighter">
                                                        {booking.date}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-[var(--foreground)] pl-1">
                                                <div className="flex items-center gap-2">
                                                    <Maximize className="h-4 w-4 text-[var(--primary)]" />
                                                    <span className="font-medium">{booking.acres} Acres</span>
                                                </div>
                                                <span className="text-[var(--muted)]">|</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[var(--muted)] uppercase tracking-tighter text-xs">PIN: {booking.pincode}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-md ${booking.status === 'completed' ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30' :
                                                booking.status === 'assigned' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30' :
                                                    'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30'
                                                }`}>
                                                {booking.status}
                                            </span>
                                            {booking.operator && (
                                                <p className="text-[10px] font-bold text-[var(--primary)] uppercase">Pilot: {booking.operator}</p>
                                            )}
                                            {booking.status === 'completed' && (
                                                <div className="text-[var(--primary)] flex items-center gap-1 text-xs font-black">
                                                    <CheckCircle className="h-4 w-4" /> VERIFIED
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
