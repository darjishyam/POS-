'use client'

import { useState, useEffect } from 'react'
import {
    Package,
    AlertCircle,
    ArrowLeft,
    ShoppingCart,
    Edit3,
    Search,
    ChevronRight,
    TrendingDown,
    Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/context/SettingsContext'
import { toast, Toaster } from 'react-hot-toast'

function AlertsClient() {
    const router = useRouter()
    const { settings } = useSettings()
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/products', { cache: 'no-store' })
                const data = await res.json()
                setProducts(Array.isArray(data) ? data : [])
            } catch (err) {
                toast.error('Neural data link lost.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const criticalProducts = products.filter(p =>
        p.manageStock &&
        p.stock <= p.alertQuantity &&
        (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-rose-100 min-h-screen bg-transparent animate-in fade-in duration-700">
            <Toaster position="bottom-right" />

            <div className="relative z-10 max-w-7xl mx-auto space-y-12">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.push('/dashboard/inventory')}
                            className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black uppercase tracking-widest text-[10px] mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Return to Matrix Hub
                        </button>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full border border-rose-500/20 shadow-sm">
                            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(225,29,72,1)]" />
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Inventory Conflict Terminal</span>
                        </div>
                        <h2 className="text-7xl font-black text-slate-950 tracking-tighter italic leading-none">
                            Stock <span className="text-rose-600 NOT-italic font-black">Alerts</span>
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[11px] italic">Critical Material Scarcity Report</p>
                    </div>

                    <div className="flex items-center gap-6 bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl min-w-[300px]">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-600 border border-rose-500/20">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Active Conflicts</p>
                            <p className="text-4xl font-black text-rose-600 italic tracking-tighter">
                                {criticalProducts.length.toString().padStart(2, '0')} <span className="text-[10px] text-slate-400 NOT-italic uppercase tracking-widest ml-1">SKUs</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sub-Filters */}
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Scan for specific conflicts (Name or SKU)..."
                        className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] py-6 pl-14 pr-8 font-black text-slate-900 italic tracking-widest text-xs placeholder:text-slate-300 focus:ring-4 focus:ring-rose-500/5 transition-all outline-none shadow-xl shadow-slate-100"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-rose-500" />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-40 bg-white/50 animate-pulse rounded-[2.5rem] border border-white" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {criticalProducts.length === 0 ? (
                            <div className="col-span-full py-40 text-center bg-white/50 backdrop-blur-xl rounded-[3.5rem] border-2 border-dashed border-slate-200">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-emerald-500">
                                    <Zap className="w-10 h-10 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter mb-2">Omniscient Supply Level</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No material integrity conflicts detected in the current cycle.</p>
                            </div>
                        ) : criticalProducts.map(prod => (
                            <div key={prod.id} className="group bg-white rounded-[3rem] p-8 border border-white hover:border-rose-500/30 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-rose-500/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />

                                <div className="flex items-center gap-5 mb-8 relative">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                                        {prod.image ? (
                                            <img src={prod.image} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <Package className="w-6 h-6 text-slate-200" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="text-lg font-black text-slate-950 tracking-tight leading-tight truncate px-1">{prod.name}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{prod.sku || 'UNCLASSIFIED'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8 relative">
                                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100/50">
                                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Current Vol</p>
                                        <p className="text-2xl font-black text-rose-600 italic tracking-tighter">{prod.stock}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Alert Floor</p>
                                        <p className="text-2xl font-black text-slate-950 italic tracking-tighter">≤ {prod.alertQuantity}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 relative">
                                    <button
                                        onClick={() => router.push(`/dashboard/purchases?productId=${prod.id}`)}
                                        className="flex-1 bg-slate-950 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-600 transition-all flex items-center justify-center gap-3 group/btn active:scale-95 shadow-xl shadow-rose-950/10"
                                    >
                                        <ShoppingCart className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        Restock
                                    </button>
                                    <button
                                        onClick={() => router.push(`/dashboard/inventory/edit/${prod.id}`)}
                                        className="p-5 bg-slate-50 text-slate-400 hover:text-slate-950 hover:bg-white rounded-2xl border border-slate-100 transition-all shadow-sm"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-600 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-rose-500 rounded-full blur-[150px]" />
            </div>
        </div>
    )
}

export default AlertsClient;
