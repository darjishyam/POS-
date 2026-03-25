'use client'

import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { 
    Users, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Phone, 
    Mail, 
    MapPin, 
    ShoppingBag, 
    ChevronRight,
    TrendingUp,
    Briefcase
} from 'lucide-react'

interface Supplier {
    id: string
    name: string
    contactPerson: string | null
    email: string | null
    phone: string | null
    address: string | null
    totalPurchaseVolume: number
    _count?: {
        purchases: number
    }
}

export default function SupplierClient() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: ''
    })

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const fetchSuppliers = async () => {
        try {
            const res = await fetch('/api/suppliers')
            const data = await res.json()
            setSuppliers(data)
        } catch (error) {
            toast.error('Failed to load supplier registry')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = editingSupplier ? 'PATCH' : 'POST'
        const loadingToast = toast.loading(editingSupplier ? 'Updating Profile...' : 'Registering Supplier...')
        
        try {
            const res = await fetch('/api/suppliers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingSupplier ? { ...formData, id: editingSupplier.id } : formData)
            })
            
            if (res.ok) {
                toast.success(`Supplier ${editingSupplier ? 'updated' : 'registered'}`, { id: loadingToast })
                setIsModalOpen(false)
                setEditingSupplier(null)
                setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' })
                fetchSuppliers()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Operation failed', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Network breach detected', { id: loadingToast })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will purge the supplier profile but keep historical purchase logs for audit integrity.')) return
        
        const loadingToast = toast.loading('Purging Profile...')
        try {
            const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Profile purged', { id: loadingToast })
                fetchSuppliers()
            }
        } catch (error) {
            toast.error('Purge failed', { id: loadingToast })
        }
    }

    const openEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setFormData({
            name: supplier.name,
            contactPerson: supplier.contactPerson || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || ''
        })
        setIsModalOpen(true)
    }

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery) ||
        s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-[0_4px_12px_-4px_rgba(59,130,246,0.2)]">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Procurement Registry</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Supplier <span className="text-blue-600 NOT-italic font-black text-7xl inline-block -translate-y-1">Profile Matrix</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group flex-1 md:flex-none min-w-[300px]">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search registry..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all font-bold text-sm shadow-xl shadow-slate-200/20 placeholder:text-slate-300"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setEditingSupplier(null)
                                setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' })
                                setIsModalOpen(true)
                            }}
                            className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 group border border-blue-500/20"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 group-hover:text-blue-400 transition-all duration-500" />
                            Register Vendor
                        </button>
                    </div>
                </div>

                {/* Suppliers List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        <div className="col-span-full py-24 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Accessing Supplier Matrix...</div>
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="col-span-full py-20 text-center flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                                <Users className="w-10 h-10" />
                            </div>
                            <span className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] italic">Zero Records Detected in Search Range</span>
                        </div>
                    ) : filteredSuppliers.map((s) => (
                        <div key={s.id} className="group bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50 hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden flex flex-col h-full">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <Briefcase className="w-24 h-24 text-blue-600" />
                            </div>

                            <div className="flex justify-between items-start mb-8 relative">
                                <div className="p-5 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-100/20">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(s)} className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 relative flex-1">
                                <h3 className="text-3xl font-black text-gray-950 uppercase italic tracking-tighter leading-none mb-4 group-hover:text-blue-600 transition-colors">{s.name}</h3>
                                
                                <div className="space-y-3 pt-2">
                                    {s.contactPerson && (
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Users className="w-3 h-3 text-blue-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{s.contactPerson}</span>
                                        </div>
                                    )}
                                    {s.phone && (
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Phone className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{s.phone}</span>
                                        </div>
                                    )}
                                    {s.email && (
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Mail className="w-3 h-3 text-amber-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest lowercase">{s.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-10 pt-10 border-t border-gray-50 grid grid-cols-2 gap-4 relative">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3 text-slate-300" /> Procurement Vol
                                    </span>
                                    <p className="text-xl font-black text-slate-900 tracking-tighter italic">₹{s.totalPurchaseVolume.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Order Logs</span>
                                    <p className="text-xl font-black text-slate-900 tracking-tighter italic">{s._count?.purchases || 0}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-12">
                            <h3 className="text-4xl font-black text-gray-950 tracking-tighter italic mb-10">
                                {editingSupplier ? 'Modify' : 'Initialize'} <span className="text-blue-600 NOT-italic font-black">Vendor Account</span>
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">Enterprise Entity Name</label>
                                        <input
                                            type="text" required
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                            placeholder="e.g. TECH FLOW SOLUTIONS"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">Primary Liaison</label>
                                        <input
                                            type="text"
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                            placeholder="e.g. John Matrix"
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">Comm Channel (Email)</label>
                                        <input
                                            type="email"
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                            placeholder="vendor@matrix.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">Secure Line (Phone)</label>
                                        <input
                                            type="tel"
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">Operational Base (Address)</label>
                                    <textarea
                                        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 h-28 resize-none"
                                        placeholder="Physical headquarters location..."
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 border-b-4 border-blue-600"
                                    >
                                        Seal Enterprise Agreement
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
