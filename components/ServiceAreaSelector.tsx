'use client';

import { useState } from 'react';
import { Search, Check, Plus, X, Trash2 } from 'lucide-react';

interface ServiceAreaSelectorProps {
    onUpdate: (data: { pincodes: string[], villages: string[] }) => void;
    initialPincodes?: string[];
    initialVillages?: string[];
}

export default function ServiceAreaSelector({ onUpdate, initialPincodes = [], initialVillages = [] }: ServiceAreaSelectorProps) {
    const [pincode, setPincode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchedVillages, setFetchedVillages] = useState<string[]>([]);
    const [selectedVillages, setSelectedVillages] = useState<string[]>([]);

    // Stored confirmed areas: { pincode: string, villages: string[] }
    // We try to reconstruct initial state if possible, though mapping villages to pincodes is hard if not stored that way.
    // For now, we will just treat new additions as discrete blocks.
    interface AreaBlock {
        pincode: string;
        villages: string[];
    }
    const [confirmedAreas, setConfirmedAreas] = useState<AreaBlock[]>([]);

    // We also maintain a "Legacy" block for initial data if we can't map it back
    const [legacyPincodes, setLegacyPincodes] = useState<string[]>(initialPincodes);
    const [legacyVillages, setLegacyVillages] = useState<string[]>(initialVillages);

    const handleFetchVillages = async () => {
        if (pincode.length !== 6) return;
        setIsLoading(true);
        setFetchedVillages([]);
        setSelectedVillages([]);

        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await res.json();

            if (data && data[0].Status === 'Success') {
                const villages = data[0].PostOffice.map((po: any) => po.Name);
                // unique villages
                setFetchedVillages([...new Set(villages)] as string[]);
            } else {
                alert('Invalid Pincode or no data found.');
            }
        } catch (error) {
            console.error('Error fetching pincode:', error);
            alert('Failed to fetch village data.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleVillage = (v: string) => {
        if (selectedVillages.includes(v)) {
            setSelectedVillages(selectedVillages.filter(item => item !== v));
        } else {
            setSelectedVillages([...selectedVillages, v]);
        }
    };

    const confirmSelection = () => {
        if (selectedVillages.length === 0) return;

        const newBlock = { pincode, villages: selectedVillages };
        const updatedAreas = [...confirmedAreas, newBlock];
        setConfirmedAreas(updatedAreas);

        // Reset input for next entry
        setPincode('');
        setFetchedVillages([]);
        setSelectedVillages([]);

        triggerUpdate(updatedAreas, legacyPincodes, legacyVillages);
    };

    const removeArea = (index: number) => {
        const updated = confirmedAreas.filter((_, i) => i !== index);
        setConfirmedAreas(updated);
        triggerUpdate(updated, legacyPincodes, legacyVillages);
    };

    const removeLegacyPincode = (p: string) => {
        const updated = legacyPincodes.filter(item => item !== p);
        setLegacyPincodes(updated);
        triggerUpdate(confirmedAreas, updated, legacyVillages);
    };

    const removeLegacyVillage = (v: string) => {
        const updated = legacyVillages.filter(item => item !== v);
        setLegacyVillages(updated);
        triggerUpdate(confirmedAreas, legacyPincodes, updated);
    };

    const triggerUpdate = (areas: AreaBlock[], lPincodes: string[], lVillages: string[]) => {
        const allPincodes = new Set([...lPincodes]);
        const allVillages = new Set([...lVillages]);

        areas.forEach(area => {
            allPincodes.add(area.pincode);
            area.villages.forEach(v => allVillages.add(v));
        });

        onUpdate({
            pincodes: Array.from(allPincodes),
            villages: Array.from(allVillages)
        });
    };

    return (
        <div className="space-y-4">
            <div className="glass-panel p-4 rounded-xl space-y-4">
                <label className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest block">Add Service Area</label>

                <div className="flex gap-2">
                    <input
                        className="glass-input flex-1 font-mono text-sm"
                        placeholder="Enter 6-digit Pincode"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    />
                    <button
                        type="button"
                        onClick={handleFetchVillages}
                        disabled={pincode.length !== 6 || isLoading}
                        className="glass-button glass-button-primary p-3"
                    >
                        {isLoading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" /> : <Search className="h-4 w-4" />}
                    </button>
                </div>

                {fetchedVillages.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[var(--muted)]">Select Villages from {pincode}</span>
                            <button
                                type="button"
                                onClick={() => setSelectedVillages(fetchedVillages)}
                                className="text-[10px] text-[var(--primary)] font-bold hover:underline"
                            >
                                Select All
                            </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2 p-2 bg-white/5 rounded-lg border border-white/10 custom-scrollbar">
                            {fetchedVillages.map(v => (
                                <label key={v} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer text-xs font-medium text-[var(--foreground)]">
                                    <input
                                        type="checkbox"
                                        checked={selectedVillages.includes(v)}
                                        onChange={() => toggleVillage(v)}
                                        className="rounded border-[var(--glass-border)] bg-[var(--glass-bg)] checked:bg-[var(--primary)]"
                                    />
                                    <span className="truncate" title={v}>{v}</span>
                                </label>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={confirmSelection}
                            disabled={selectedVillages.length === 0}
                            className="w-full glass-button glass-button-success py-2 text-xs flex items-center justify-center gap-2"
                        >
                            <Plus className="h-3 w-3" /> Add {selectedVillages.length} Villages to Profile
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmed List */}
            {(confirmedAreas.length > 0 || legacyPincodes.length > 0) && (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest block">Selected Service Areas</label>
                    <div className="space-y-2">
                        {/* Legacy Data Display */}
                        {legacyPincodes.length > 0 && (
                            <div className="glass-panel p-3 rounded-lg flex flex-col gap-2 relative group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-mono text-sm font-bold text-[var(--primary)] flex flex-wrap gap-2">
                                            {legacyPincodes.map(p => (
                                                <span key={p} className="bg-[var(--primary)]/10 px-1 rounded flex items-center gap-1">
                                                    {p}
                                                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeLegacyPincode(p)} />
                                                </span>
                                            ))}
                                        </div>
                                        {legacyVillages.length > 0 && (
                                            <div className="text-[10px] text-[var(--muted)] mt-1 leading-relaxed">
                                                {legacyVillages.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {confirmedAreas.map((area, idx) => (
                            <div key={idx} className="glass-panel p-3 rounded-lg flex flex-col gap-2 relative group animate-in zoom-in-95 duration-300">
                                <button
                                    type="button"
                                    onClick={() => removeArea(idx)}
                                    className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400/10 rounded"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                                <div>
                                    <div className="font-mono text-sm font-bold text-[var(--primary)]">{area.pincode}</div>
                                    <div className="text-[10px] text-[var(--muted)] mt-1 leading-relaxed">
                                        {area.villages.join(', ')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
