'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Package, Search, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Product {
    id: string
    name: string
    sku: string
    stock: number
    alertQuantity: number
    image: string | null
    category: { name: string } | null
}

export default function StockLimitPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchLowStock()
    }, [])

    const fetchLowStock = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/products')
            if (res.ok) {
                const data = await res.json()
                // Filter products that are at or below alert quantity
                const lowStock = data.filter((p: any) => p.stock <= p.alertQuantity)
                setProducts(lowStock)
            }
        } catch (error) {
            toast.error('Failed to analyze inventory levels')
        } finally {
            setLoading(false)
        }
    }

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-100 mb-4">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Inventory Vulnerability Detected</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Stock <span className="text-rose-500 NOT-italic">Limit</span> Center</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Critical monitoring for depleted assets</p>
                </div>

                <div className="relative w-full md:w-80">
                    <input 
                        type="text"
                        placeholder="Filter vulnerable assets..."
                        className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 outline-none text-xs font-bold focus:ring-4 ring-rose-500/5 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-2xl">
                    <RefreshCw className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-6" />
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Scanning Global Logistics Network...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter mb-2">INVENTORY OPTIMAL</h2>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">All assets are currently above critical thresholds.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map(product => (
                        <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 -z-10 group-hover:bg-rose-100 transition-colors" />
                            
                            <div className="flex gap-6 items-start">
                                <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden shadow-inner border border-slate-100 flex-shrink-0">
                                    {product.image ? (
                                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200 uppercase font-black text-2xl">{product.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{product.category?.name || 'General Inventory'}</p>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-tight truncate mb-2">{product.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">SKU: {product.sku}</p>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Current Stock</p>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-black text-rose-600 italic leading-none">{product.stock}</span>
                                        <span className="text-[10px] text-rose-400 font-bold mb-0.5 uppercase tracking-tighter italic">Units</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Limit Threshold</p>
                                    <div className="flex items-end gap-1 text-slate-900">
                                        <span className="text-2xl font-black italic leading-none">{product.alertQuantity}</span>
                                        <span className="text-[10px] font-bold mb-0.5 uppercase tracking-tighter italic">Units</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-rose-500">
                                    <AlertTriangle className="w-4 h-4 fill-rose-500 animate-pulse text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Critical Shortage</span>
                                </div>
                                <Link 
                                    href={`/dashboard/inventory/purchases/new?productId=${product.id}`}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-slate-200 group/link"
                                >
                                    Restock Assets <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) }
        </div>
    )
}
