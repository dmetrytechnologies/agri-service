'use client';

import { useState } from 'react';
import { useOperators } from '@/lib/operator-context';
import { useBookings } from '@/lib/booking-context';
import {
    Users,
    Shield,
    MapPin,
    Activity,
    Settings,
    UserCheck,
    UserPlus,
    X,
    Smartphone,
    ClipboardList,
    ChevronRight,
    Calendar,
    CheckCircle2,
    Clock,
    Ban,
    Trash2,
    Check,
    Phone,
    Globe
} from 'lucide-react';
import ServiceAreaSelector from '@/components/ServiceAreaSelector';

export default function OperatorsPage() {
    const { operators, addOperator, deleteOperator, editOperator, isLoading: isOperatorsLoading } = useOperators();
    const { bookings, isLoading: isBookingsLoading } = useBookings();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newOp, setNewOp] = useState<{
        name: string;
        phone: string;
        location: string;
        district: string;
        service_pincodes: string[];
        service_villages: string[];
    }>({
        name: '',
        phone: '',
        location: '',
        district: '',
        service_pincodes: [],
        service_villages: []
    });
    const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

    const handleCopyPhone = (phone: string, id: string) => {
        navigator.clipboard.writeText(phone);
        setCopiedPhoneId(id);
        setTimeout(() => setCopiedPhoneId(null), 2000);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In-Field': return 'bg-blue-100 text-blue-700';
            case 'Idle': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const handleAddOperator = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            editOperator(editingId, {
                name: newOp.name,
                phone: newOp.phone,
                location: newOp.location,
                district: newOp.district,
                service_pincodes: newOp.service_pincodes,
                service_villages: newOp.service_villages,
                available_dates: [new Date().toISOString().split('T')[0]]
            });
        } else {
            addOperator({
                name: newOp.name,
                phone: newOp.phone,
                location: newOp.location,
                district: newOp.district,
                service_pincodes: newOp.service_pincodes.length > 0 ? newOp.service_pincodes : ['600001'],
                service_villages: newOp.service_villages,
                available_dates: [new Date().toISOString().split('T')[0]]
            });
        }
        setIsModalOpen(false);
        setEditingId(null);
        setNewOp({ name: '', phone: '', location: '', district: '', service_pincodes: [], service_villages: [] });
    };

    const openEditModal = (op: any) => {
        setEditingId(op.id);
        const pincodes = Array.isArray(op.service_pincodes) ? op.service_pincodes : (op.service_pincodes ? [op.service_pincodes] : []);
        const villages = Array.isArray(op.service_villages) ? op.service_villages : (op.service_villages ? [op.service_villages] : []);

        setNewOp({
            name: op.name,
            phone: op.phone,
            location: op.location,
            district: op.district || '',
            service_pincodes: pincodes,
            service_villages: villages
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setNewOp({ name: '', phone: '', location: '', district: '', service_pincodes: [], service_villages: [] });
    };

    const isLoading = isOperatorsLoading || isBookingsLoading;
    if (isLoading) return <div className="p-8 text-[var(--foreground)] font-bold">Syncing operator fleet...</div>;

    return (
        <div className="space-y-6 relative px-4 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight">Drone Pilots</h1>
                    <p className="text-sm md:text-base text-[var(--muted)] font-medium">Fleet management with live task oversight</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setNewOp({ name: '', phone: '', location: '', district: '', service_pincodes: [], service_villages: [] });
                        setIsModalOpen(true);
                    }}
                    className="glass-button glass-button-primary flex items-center justify-center gap-2 w-full md:w-auto py-3 md:py-2"
                >
                    <UserPlus className="h-4 w-4" /> Register Pilot
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {operators.map((op) => {
                    const assignedJobs = bookings.filter(b => b.operator === op.name);

                    return (
                        <div key={op.id} className="glass-card hover:bg-white/10 transition-all flex flex-col h-full group border-l-4" style={{ borderLeftColor: op.status === 'In-Field' ? '#3b82f6' : op.status === 'Idle' ? '#22c55e' : '#9ca3af' }}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-black text-xl border border-[var(--primary)]/20 shadow-inner">
                                    {op.name.charAt(0)}
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(op.status)}`}>
                                    {op.status}
                                </span>
                            </div>

                            <h3 className="font-black text-[var(--foreground)] text-lg mb-0.5">{op.name}</h3>
                            <div className="flex items-center gap-2 mb-4 group/phone">
                                <a
                                    href={`tel:${op.phone}`}
                                    className="text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors font-mono font-bold"
                                >
                                    {op.phone}
                                </a>
                                <button
                                    onClick={() => handleCopyPhone(op.phone, op.id)}
                                    className={`p-1 rounded transition-all ${copiedPhoneId === op.id
                                        ? 'text-green-500 bg-green-500/10'
                                        : 'text-[var(--muted)] opacity-0 group-hover/phone:opacity-100 hover:text-[var(--primary)]'
                                        }`}
                                    title="Copy Phone Number"
                                >
                                    {copiedPhoneId === op.id ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <Smartphone className="h-3 w-3" />
                                    )}
                                </button>
                            </div>

                            <div className="space-y-3 py-4 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--muted)] flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter">
                                        <MapPin className="h-3 w-3" /> Base
                                    </span>
                                    <span className="font-bold text-[var(--foreground)]">{op.location}</span>
                                </div>
                                {op.district && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--muted)] flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter">
                                            <Shield className="h-3 w-3" /> District
                                        </span>
                                        <span className="font-bold text-[var(--foreground)]">{op.district}</span>
                                    </div>
                                )}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[var(--muted)] text-[10px] uppercase font-black tracking-widest">Assigned Tasks ({assignedJobs.length})</span>
                                    {assignedJobs.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {assignedJobs.map(job => (
                                                <button
                                                    key={job.id}
                                                    onClick={() => setSelectedJob(job)}
                                                    className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg transition-all group"
                                                >
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-[11px] font-black text-[var(--foreground)]">{job.crop}</span>
                                                        <span className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-tighter">{job.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {job.status === 'completed' ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                        ) : (
                                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                        )}
                                                        <ChevronRight className="h-3 w-3 text-[var(--muted)] group-hover:text-[var(--primary)] transform group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-[var(--muted)] italic py-1">No tasks assigned</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/10 flex gap-2">
                                <button className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white/5 text-[var(--muted)] rounded-lg hover:bg-white/10 border border-transparent transition-colors">
                                    Fleet Sync
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm(`Are you sure you want to delete ${op.name}?`)) deleteOperator(op.id);
                                    }}
                                    className="p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                    title="Delete Operator"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => openEditModal(op)}
                                    className="p-2 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors border border-transparent hover:border-[var(--primary)]/20"
                                >
                                    <Settings className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* JOB DETAILS MODAL */}
            {selectedJob && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedJob(null)} />
                    <div className="relative w-full max-w-sm glass-card p-8 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="h-16 w-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--primary)]/20">
                                <ClipboardList className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-black text-[var(--foreground)] leading-tight">Job Details</h2>
                            <p className="text-xs font-black text-[var(--primary)] uppercase tracking-[0.2em] mt-1">{selectedJob.id}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <div>
                                    <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Crop Type</p>
                                    <p className="font-bold text-[var(--foreground)]">{selectedJob.crop}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">Land Size</p>
                                    <p className="font-bold text-[var(--foreground)]">{selectedJob.acres} Acres</p>
                                </div>
                            </div>

                            <div className="space-y-3 px-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-[var(--muted)]" />
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Service Date</p>
                                        <p className="font-bold text-[var(--foreground)]">{selectedJob.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="h-4 w-4 text-[var(--muted)]" />
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Location</p>
                                        <p className="font-bold text-[var(--foreground)]">{selectedJob.address || 'Field Location'} ({selectedJob.pincode})</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Activity className="h-4 w-4 text-[var(--muted)]" />
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">Field Status</p>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${selectedJob.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {selectedJob.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedJob(null)}
                            className="w-full glass-button glass-button-primary py-4 rounded-2xl mt-8 shadow-xl"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}

            {/* ADD OPERATOR MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div className="relative w-full max-w-md glass-card p-8 rounded-3xl shadow-2xl border border-white/10 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-[var(--foreground)] italic">{editingId ? 'Edit Pilot' : 'Register Pilot'}</h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddOperator} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Full Name</label>
                                <div className="relative">
                                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                    <input
                                        required
                                        className="glass-input pl-10"
                                        placeholder="e.g. Rahul Sharma"
                                        value={newOp.name}
                                        onChange={e => setNewOp({ ...newOp, name: e.target.value })}
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
                                            placeholder="8888XXXXXX"
                                            value={newOp.phone}
                                            onChange={e => setNewOp({ ...newOp, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">District</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                        <input
                                            required
                                            className="glass-input pl-10"
                                            placeholder="e.g. Coimbatore"
                                            value={newOp.district}
                                            onChange={e => setNewOp({ ...newOp, district: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Base/Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                                    <input
                                        required
                                        className="glass-input pl-10"
                                        placeholder="Zone/Block"
                                        value={newOp.location}
                                        onChange={e => setNewOp({ ...newOp, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <ServiceAreaSelector
                                onUpdate={(data) => setNewOp(prev => ({ ...prev, service_pincodes: data.pincodes, service_villages: data.villages }))}
                                initialPincodes={newOp.service_pincodes}
                                initialVillages={newOp.service_villages}
                            />

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 py-3 text-sm font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] glass-button glass-button-primary py-3 shadow-xl"
                                >
                                    {editingId ? 'Save Changes' : 'Confirm Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
