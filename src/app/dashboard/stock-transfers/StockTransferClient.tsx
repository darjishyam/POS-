'use client'

import { useState, useEffect } from 'react'
import { 
    ArrowLeftRight, 
    Plus, 
    Box, 
    Truck, 
    Calendar, 
    Hash, 
    Search, 
    Trash2, 
    CheckCircle2, 
    X,
    LayoutGrid,
    Navigation,
    ArrowRight,
    Loader2,
    IndianRupee,
    Package
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { format } from 'date-fns'

interface Location {
    id: string
    name: string
    type: string
}

interface Product {
    id: string
    name: string
    sku: string
    stock: number
}

interface Transfer {
    id: string
    referenceNo: string | null
    status: string
    createdAt: string
    fromLocation: { name: string }
    toLocation: { name: string }
    _count: { items: number }
}

export default function StockTransferClient() {
    const [transfers, setTransfers] = useState<Transfer[]>([])
    const [locations, setLocations] = useState<Location[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')

    // Form states
    const [fromLocationId, setFromLocationId] = useState('')
    const [toLocationId, setToLocationId] = useState('')
    const [referenceNo, setReferenceNo] = useState('')
    const [items, setItems] = useState<any[]>([{ productId: '', quantity: 1 }])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [tRes, lRes, pRes] = await Promise.all([
                fetch('/api/stock-transfers'),
                fetch('/api/locations'),
                fetch('/api/products')
            ])
            const tData = await tRes.json()
            const lData = await lRes.json()
            const pData = await pRes.json()
            setTransfers(Array.isArray(tData) ? tData : [])
            setLocations(Array.isArray(lData) ? lData : [])
            setProducts(Array.isArray(pData) ? pData : [])
        } catch (error) {
            toast.error('Failed to sync logistics data')
        } finally {
            setLoading(false)
        }
    }

    const filteredTransfers = (transfers || []).filter(t => 
        (t.fromLocation?.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (t.toLocation?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.referenceNo || '').toLowerCase().includes(search.toLowerCase())
    )

    const addItem = () => setItems([...items, { productId: '', quantity: 1 }])
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (fromLocationId === toLocationId) return toast.error('Source and Destination nodes must differ')
        if (items.some(i => !i.productId || i.quantity <= 0)) return toast.error('Invalid payload detected')

        setSubmitting(true)
        const loadingToast = toast.loading('Executing Stock Movement...')
        try {
            const res = await fetch('/api/stock-transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromLocationId, toLocationId, referenceNo, items })
            })
            if (res.ok) {
                toast.success('Logistics Movement Authorized', { id: loadingToast })
                setIsModalOpen(false)
                resetForm()
                fetchData()
            }
        } catch (error) {
            toast.error('Movement Authorization Failed', { id: loadingToast })
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setFromLocationId('')
        setToLocationId('')
        setReferenceNo('')
        setItems([{ productId: '', quantity: 1 }])
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <ArrowLeftRight className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Inventory Logistics Protocol</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Stock <span className="text-emerald-600 NOT-italic font-black">Transfers</span>
                        </h2>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#020617] hover:bg-black text-white px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/10 transition-all active:scale-95 flex items-center gap-3 group border border-emerald-500/20"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 group-hover:text-emerald-400 transition-all duration-500" />
                        Execute Movement
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-sm mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <input
                            type="text"
                            placeholder="Search logistics matrix (Site, Ref, Status)..."
                            className="w-full bg-slate-100/50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-gray-100">
                        <button className="px-6 py-2.5 rounded-xl bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-900 border border-gray-100 italic">Global Log</button>
                        <button className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Transit</button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-white/50 animate-pulse rounded-[3rem] border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-gray-50 uppercase tracking-widest text-[10px] font-black text-slate-400">
                                    <th className="px-8 py-6">Timestamp</th>
                                    <th className="px-8 py-6">Movement Vector</th>
                                    <th className="px-8 py-6 text-center">Payload Vol</th>
                                    <th className="px-8 py-6 text-right">Protocol Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTransfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center">
                                            <span className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Zero Movements Logged</span>
                                        </td>
                                    </tr>
                                ) : filteredTransfers.map((t) => (
                                    <tr key={t.id} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-slate-300" />
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg tracking-tight uppercase italic">
                                                        {t.createdAt ? format(new Date(t.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">REF: {t.referenceNo || t.id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</p>
                                                    <p className="font-black text-slate-900 text-sm uppercase">{t.fromLocation.name}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-gray-100 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                                                    <p className="font-black text-emerald-600 text-sm uppercase">{t.toLocation.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm border border-white">
                                                <Box className="w-3 h-3" />
                                                {t._count?.items || 0} SKU Modules
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300 overflow-y-auto">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 font-sans my-auto mb-10">
                        <div className="p-12 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-emerald-500 text-white rounded-[1.5rem] shadow-xl shadow-emerald-200">
                                    <Truck className="w-8 h-8" />
                                </div>
                                <h2 className="text-4xl font-black text-gray-950 tracking-tighter italic">
                                    Initialize <span className="text-emerald-600 NOT-italic font-black">Stock Movement</span>
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all text-slate-300 hover:text-red-500 shadow-sm">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-12">
                            <div className="grid grid-cols-3 gap-8 p-8 bg-slate-50/50 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        Origin Node
                                    </label>
                                    <select
                                        required value={fromLocationId}
                                        onChange={(e) => setFromLocationId(e.target.value)}
                                        className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none shadow-sm"
                                    >
                                        <option value="">Select Origin...</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>)}
                                    </select>
                                </div>

                                <div className="flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Destination Node
                                    </label>
                                    <select
                                        required value={toLocationId}
                                        onChange={(e) => setToLocationId(e.target.value)}
                                        className="w-full p-5 bg-white border-2 border-emerald-50 rounded-2xl font-bold text-emerald-900 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none shadow-sm"
                                    >
                                        <option value="">Select Destination...</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Package className="w-3 h-3" />
                                        Payload Manifest
                                    </h4>
                                    <button
                                        type="button" onClick={addItem}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        + Append Item
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-6 items-end bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group hover:border-emerald-200 transition-all">
                                            <div className="col-span-8 space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Entity Module</label>
                                                <select
                                                    required value={item.productId}
                                                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                                                >
                                                    <option value="">Choose Asset...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-3 space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">QTY</label>
                                                <input
                                                    type="number" min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                                                />
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button
                                                    type="button" onClick={() => removeItem(index)}
                                                    className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-10 flex items-center justify-between border-t border-gray-100">
                                <div className="space-y-2 max-w-xs">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Protocol Ref Signature</label>
                                    <div className="relative">
                                        <input
                                            type="text" value={referenceNo}
                                            onChange={(e) => setReferenceNo(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800 text-xs"
                                            placeholder="LOG-MOVEMENT-XXXX"
                                        />
                                        <Hash className="w-3 h-3 absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit" disabled={submitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        Authorize Movement
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
