'use client'

import { useState, useEffect } from 'react'
import { 
    Layers, 
    Plus, 
    Search, 
    Edit3, 
    Trash2, 
    Users, 
    Percent, 
    Zap,
    X,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

interface CustomerGroup {
    id: string
    name: string
    discount: number
    _count: {
        customers: number
    }
}

export default function CustomerGroupsClient() {
    const [groups, setGroups] = useState<CustomerGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', discount: 0 })

    useEffect(() => {
        fetchGroups()
    }, [])

    const fetchGroups = async () => {
        try {
            const res = await fetch('/api/customer-groups')
            const data = await res.json()
            setGroups(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error('Failed to sync classification matrix')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const loadingToast = toast.loading('Calibrating Group...')
        try {
            const res = await fetch('/api/customer-groups', {
                method: editingId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData)
            })
            if (res.ok) {
                toast.success(editingId ? 'Tier Reprogrammed' : 'Classification Tier Authorized', { id: loadingToast })
                setIsModalOpen(false)
                setEditingId(null)
                setFormData({ name: '', discount: 0 })
                fetchGroups()
            }
        } catch (error) {
            toast.error('Authorization Failure', { id: loadingToast })
        } finally {
            setSubmitting(false)
        }
    }

    const deleteGroup = async (id: string) => {
        if (!confirm('Purge this classification tier?')) return
        const tid = toast.loading('Purging tier...')
        try {
            const res = await fetch(`/api/customer-groups?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Tier Purged successfully.', { id: tid })
                fetchGroups()
            }
        } catch (error) {
            toast.error('Purge intercept failure.', { id: tid })
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
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Client Classification Matrix</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Customer <span className="text-emerald-600 NOT-italic font-black">Groups</span>
                        </h2>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 group border border-emerald-500/20"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 group-hover:text-emerald-400 transition-all duration-500" />
                        Define New Tier
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
                        {(groups || []).map(group => (
                            <div key={group.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Layers className="w-24 h-24" />
                                </div>
                                
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 shadow-sm transition-all transform group-hover:-translate-y-1">
                                    <Users className="w-8 h-8" />
                                </div>

                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter uppercase italic leading-none mb-4">{group.name}</h3>
                                
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 italic">
                                        <Percent className="w-3 h-3" />
                                        <span className="text-xs font-black">{group.discount}% Tier</span>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Privilege Level ALPHA</div>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Registered Entities</p>
                                        <p className="text-2xl font-black text-slate-900 leading-none">{group._count?.customers || 0}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                setEditingId(group.id)
                                                setFormData({ name: group.name, discount: group.discount })
                                                setIsModalOpen(true)
                                            }}
                                            className="p-3 bg-slate-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => deleteGroup(group.id)}
                                            className="p-3 bg-slate-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-slate-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-50 border-2 border-dashed border-gray-200 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 group hover:bg-white hover:border-indigo-200 transition-all min-h-[300px]"
                        >
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-200 group-hover:text-indigo-600 shadow-sm transition-all group-hover:shadow-lg">
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] group-hover:text-indigo-600 transition-colors">Expand Classification</span>
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
                                    <Zap className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic">
                                    Tier <span className="text-emerald-600 NOT-italic font-black">{editingId ? 'Reprogramming' : 'Initialization'}</span>
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification Designation</label>
                                    <input
                                        required type="text"
                                        className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 uppercase tracking-widest"
                                        placeholder="e.g. VIP PLATINUM tier"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Privilege Discount (%)</label>
                                    <div className="relative">
                                        <input
                                            required type="number" step="0.1" min="0" max="100"
                                            className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                            placeholder="0.00"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                                        />
                                        <Percent className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false)
                                            setEditingId(null)
                                            setFormData({ name: '', discount: 0 })
                                        }}
                                        className="flex-1 py-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'Transmitting Tier...' : (editingId ? 'Execute Update' : 'Authorize Tier')}
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
