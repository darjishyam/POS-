'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, RefreshCw, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

interface Unit {
    id: string
    name: string
    description: string | null
    status: boolean
}

export default function UnitClient() {
    const [units, setUnits] = useState<Unit[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: true
    })

    useEffect(() => {
        fetchUnits()
    }, [])

    const fetchUnits = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/units')
            if (res.ok) {
                const data = await res.json()
                setUnits(data)
            }
        } catch (error) {
            toast.error('Failed to fetch units')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = editingUnit ? 'PUT' : 'POST'
        const url = editingUnit ? `/api/units/${editingUnit.id}` : '/api/units'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success(editingUnit ? 'Unit updated' : 'Unit created')
                setEditingUnit(null)
                setFormData({ name: '', description: '', status: true })
                fetchUnits()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Operation failed')
            }
        } catch (error) {
            toast.error('Something went wrong')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this unit?')) return

        try {
            const res = await fetch(`/api/units/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Unit removed')
                fetchUnits()
            }
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const filteredUnits = units.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Unit <span className="text-emerald-500 NOT-italic">Setup</span></h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Configure measurement standards</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tighter italic">Define <span className="text-emerald-500 NOT-italic">Unit</span></h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Name *</label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="e.g. Kilogram, Piece, Box"
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-50 focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Unit details..."
                                    className="w-full p-5 bg-slate-50 border-2 border-slate-50 focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-sm resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100"
                            >
                                {editingUnit ? 'Update Unit' : 'Create Unit'}
                            </button>
                            {editingUnit && (
                                <button 
                                    type="button"
                                    onClick={() => { setEditingUnit(null); setFormData({ name: '', description: '', status: true }); }}
                                    className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-50 hover:text-rose-500 transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center sm:flex-row flex-col gap-4">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Unit <span className="text-emerald-500 NOT-italic">Registry</span></h2>
                            <div className="relative w-full sm:w-64">
                                <input 
                                    type="text"
                                    placeholder="Search units..."
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold focus:ring-2 ring-emerald-500/10"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] italic">
                                    <tr>
                                        <th className="px-8 py-5 text-left">Unit Name</th>
                                        <th className="px-8 py-5 text-left">Description</th>
                                        <th className="px-8 py-5 text-center">Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 italic">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                                            </td>
                                        </tr>
                                    ) : filteredUnits.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-slate-300">
                                                No units registered.
                                            </td>
                                        </tr>
                                    ) : filteredUnits.map(unit => (
                                        <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                                        <Layers className="w-4 h-4" />
                                                    </div>
                                                    <div className="font-black text-slate-900 text-sm uppercase">{unit.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-[10px] text-slate-400 font-bold NOT-italic truncate max-w-[200px]">
                                                {unit.description || 'N/A'}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest NOT-italic">
                                                    Active
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 text-[10px]">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingUnit(unit);
                                                            setFormData({
                                                                name: unit.name,
                                                                description: unit.description || '',
                                                                status: unit.status
                                                            });
                                                        }}
                                                        className="p-3 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(unit.id)}
                                                        className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
