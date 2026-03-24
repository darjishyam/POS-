'use client'

import { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { 
    Package, 
    Plus, 
    Truck, 
    Calendar, 
    Hash, 
    Layers,
    ArrowUpRight,
    Search,
    Trash2,
    CheckCircle2,
    X,
    ShoppingCart,
    DollarSign
} from 'lucide-react'

interface Product {
    id: string
    name: string
    price: number
    sku: string
}

interface Supplier {
    id: string
    name: string
}

interface Purchase {
    id: string
    totalAmount: number
    referenceNumber: string | null
    status: string
    createdAt: string
    supplier: {
        name: string
    }
    _count: {
        items: number
    }
}

export default function PurchasesClient() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')

    // Form states
    const [supplierId, setSupplierId] = useState('')
    const [locationId, setLocationId] = useState('')
    const [referenceNumber, setReferenceNumber] = useState('')
    const [items, setItems] = useState<any[]>([{ productId: '', quantity: 1, unitCost: 0 }])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [pRes, sRes, prRes, lRes] = await Promise.all([
                fetch('/api/purchases'),
                fetch('/api/suppliers'),
                fetch('/api/products'),
                fetch('/api/locations')
            ])
            const pData = await pRes.json()
            const sData = await sRes.json()
            const prData = await prRes.json()
            const lData = await lRes.json()
            setPurchases(Array.isArray(pData) ? pData : [])
            setSuppliers(Array.isArray(sData) ? sData : [])
            setProducts(Array.isArray(prData) ? prData : [])
            setLocations(Array.isArray(lData) ? lData : [])
            setLoading(false)
        } catch (error) {
            toast.error('Failed to load procurement data')
            setLoading(false)
        }
    }

    const filteredPurchases = (purchases || []).filter(p => 
        (p?.supplier?.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (p?.referenceNumber || '').toLowerCase().includes(search.toLowerCase())
    )

    const addItem = () => {
        setItems([...items, { productId: '', quantity: 1, unitCost: 0 }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supplierId) return toast.error('Select a supplier')
        if (!locationId) return toast.error('Select a destination location')
        if (items.some(item => !item.productId || item.quantity <= 0)) return toast.error('Invalid items')

        setSubmitting(true)
        const loadingToast = toast.loading('Executing Batch Procurement...')

        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId,
                    locationId,
                    referenceNumber,
                    totalAmount,
                    items
                })
            })

            if (res.ok) {
                toast.success('Batch Stock-In Successful', { id: loadingToast })
                setIsModalOpen(false)
                setItems([{ productId: '', quantity: 1, unitCost: 0 }])
                setSupplierId('')
                setLocationId('')
                setReferenceNumber('')
                fetchData()
            }
        } catch (error) {
            toast.error('Procurement failure', { id: loadingToast })
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <Layers className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Inventory Replenishment Ledger</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Stock <span className="text-emerald-600 NOT-italic font-black">Procurement</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Procurement Vol</p>
                            <p className="text-3xl font-black text-gray-950 italic tracking-tighter">
                                ${(purchases || []).reduce((s, p) => s + (p?.totalAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 group border border-emerald-500/20"
                        >
                            <ShoppingCart className="w-5 h-5 group-hover:scale-110 group-hover:text-emerald-400 transition-all duration-500" />
                            Initialize Stock-In
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-sm mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <input
                            type="text"
                            placeholder="Search procurement history (Vendor, Ref)..."
                            className="w-full bg-slate-100/50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-gray-100">
                        <button className="px-6 py-2.5 rounded-xl bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-900 border border-gray-100">All Batches</button>
                        <button className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Pending</button>
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
                                    <th className="px-8 py-6">Execution Date</th>
                                    <th className="px-8 py-6">Supplier Entity</th>
                                    <th className="px-8 py-6 text-center">Batch Vol</th>
                                    <th className="px-8 py-6 text-right">Value Signature</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPurchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center">
                                            <span className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Procurement History Null</span>
                                        </td>
                                    </tr>
                                ) : filteredPurchases.map((purchase) => (
                                    <tr key={purchase.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-slate-300" />
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg tracking-tight uppercase italic">{new Date(purchase.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {purchase.id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-black text-slate-900 italic uppercase">
                                                    <Truck className="w-3 h-3 text-emerald-600" />
                                                    {purchase.supplier.name}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    REF: {purchase.referenceNumber || 'INTERNAL-LOG'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                <Package className="w-3 h-3" />
                                                {purchase._count.items} Units
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 group-hover:text-emerald-600 transition-colors">
                                                <ArrowUpRight className="w-4 h-4" />
                                                <span className="text-2xl font-black text-gray-950 tracking-tighter">
                                                    ${purchase.totalAmount.toFixed(2)}
                                                </span>
                                            </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col font-sans">
                        <div className="p-12 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-950 tracking-tighter italic">
                                    Initialize <span className="text-emerald-600 NOT-italic font-black">Batch Procurement</span>
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-red-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 flex flex-col h-full overflow-hidden">
                            <div className="grid grid-cols-3 gap-8 mb-10 shrink-0">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Supplier Entity</label>
                                    <select
                                        required
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none"
                                    >
                                        <option value="">Select Vendor...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Destination Site</label>
                                    <select
                                        required
                                        value={locationId}
                                        onChange={(e) => setLocationId(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none"
                                    >
                                        <option value="">Select Location...</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Invoice / Reference Signature</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={referenceNumber}
                                            onChange={(e) => setReferenceNumber(e.target.value)}
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                                            placeholder="INV-XXXXX"
                                        />
                                        <Hash className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto mb-10 pr-4 space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-6 items-end bg-slate-50/50 p-6 rounded-[2.5rem] border border-gray-100 group hover:border-emerald-200 transition-all">
                                        <div className="col-span-6 space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Entity Selection</label>
                                            <select
                                                required
                                                value={item.productId}
                                                onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                className="w-full bg-white border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                                            >
                                                <option value="">Choose Asset...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">QTY</label>
                                            <input
                                                type="number" min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                className="w-full bg-white border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost / Unit ($)</label>
                                            <div className="relative">
                                                <input
                                                    type="number" step="0.01" min="0"
                                                    value={item.unitCost}
                                                    onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value))}
                                                    className="w-full bg-white border-none rounded-2xl p-4 pl-10 font-bold text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                                                />
                                                <DollarSign className="w-3 h-3 absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                                            </div>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="w-full border-2 border-dashed border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 py-6 rounded-[2.5rem] flex items-center justify-center gap-3 text-gray-400 hover:text-emerald-600 transition-all group"
                                >
                                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Append Entity to Batch</span>
                                </button>
                            </div>

                            <div className="border-t border-gray-100 pt-10 flex items-center justify-between shrink-0">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Calculated Procurement Value</p>
                                    <div className="flex items-center gap-2">
                                        <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                                        <p className="text-5xl font-black text-gray-950 italic tracking-tighter">
                                            ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'Executing Batch...' : 'Finalize Stock-In'}
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
