'use client'

import { useState, useEffect } from 'react'
import { 
    MapPin, 
    Plus, 
    Home, 
    Warehouse, 
    Store, 
    Navigation,
    Search,
    Edit3,
    Trash2,
    Settings2,
    CheckCircle2
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

interface Location {
    id: string
    name: string
    address: string | null
    type: string
    _count: {
        stocks: number
    }
}

export default function LocationsClient() {
    const [locations, setLocations] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({ name: '', address: '', type: 'STORE' })

    useEffect(() => {
        fetchLocations()
    }, [])

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/locations')
            const data = await res.json()
            setLocations(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error('Failed to load locations')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const loadingToast = toast.loading('Registering site...')
        try {
            const res = await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success('Site registered in registry', { id: loadingToast })
                setIsModalOpen(false)
                setFormData({ name: '', address: '', type: 'STORE' })
                fetchLocations()
            }
        } catch (error) {
            toast.error('Registration failure', { id: loadingToast })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-emerald-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <Navigation className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Global Node Topology</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Site <span className="text-emerald-600 NOT-italic font-black">Architecture</span>
                        </h2>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 group border border-emerald-500/20"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 group-hover:text-emerald-400 transition-all duration-500" />
                        Initialize New Site
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[3rem] border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(locations || []).map(loc => (
                            <div key={loc.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    {loc.type === 'WAREHOUSE' ? <Warehouse className="w-24 h-24" /> : <Store className="w-24 h-24" />}
                                </div>
                                
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-all transform group-hover:-translate-y-1 ${
                                    loc.type === 'WAREHOUSE' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                    {loc.type === 'WAREHOUSE' ? <Warehouse className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                                </div>

                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter uppercase italic leading-none mb-4">{loc.name}</h3>
                                <div className="flex items-center gap-2 mb-8">
                                    <MapPin className="w-4 h-4 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{loc.address || 'Location Coordinates Redacted'}</p>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Inventory Nodes</p>
                                        <p className="text-2xl font-black text-slate-900 leading-none">{loc._count.stocks}</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                        loc.type === 'WAREHOUSE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {loc.type}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Add Site Placeholder */}
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-50 border-2 border-dashed border-gray-200 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 group hover:bg-white hover:border-emerald-200 transition-all min-h-[300px]"
                        >
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-200 group-hover:text-emerald-600 shadow-sm transition-all group-hover:shadow-lg">
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] group-hover:text-emerald-600 transition-colors">Expand Network</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 font-sans">
                        <div className="p-12">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <Settings2 className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic">
                                    Site <span className="text-emerald-600 NOT-italic font-black">Initialization</span>
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Site Designation</label>
                                    <input
                                        required type="text"
                                        placeholder="e.g. MAIN WAREHOUSE ALPHA"
                                        className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 uppercase tracking-widest placeholder:tracking-normal"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operational Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'STORE' })}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                                                formData.type === 'STORE' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-gray-50 bg-slate-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                        >
                                            <Store className="w-6 h-6" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Retail Store</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'WAREHOUSE' })}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                                                formData.type === 'WAREHOUSE' ? 'border-amber-600 bg-amber-50 text-amber-600' : 'border-gray-50 bg-slate-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                        >
                                            <Warehouse className="w-6 h-6" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Warehouse</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location Coordinates</label>
                                    <textarea
                                        placeholder="Enter physical address or GPS registry..."
                                        className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 h-32 resize-none"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'Transmitting...' : 'Finalize Initialization'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
