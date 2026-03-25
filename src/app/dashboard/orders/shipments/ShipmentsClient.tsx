'use client'

import { useState, useEffect } from 'react'
import { 
    Package, 
    Search, 
    Truck, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Hash, 
    ArrowUpRight,
    Filter,
    MapPin
} from 'lucide-react'
import { format } from 'date-fns'
import { toast, Toaster } from 'react-hot-toast'

interface ShipmentItem {
    id: string
    productId: string
    quantity: number
    product: {
        name: string
    }
}

interface Shipment {
    id: string
    orderId: string
    carrier: string
    trackingNumber: string | null
    status: 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'
    estimatedDelivery: string | null
    shippedAt: string | null
    deliveredAt: string | null
    createdAt: string
    order: {
        customer?: {
            name: string
        }
    }
    items: ShipmentItem[]
}

export function ShipmentsClient() {
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const fetchShipments = async () => {
        try {
            const res = await fetch('/api/shipments')
            const data = await res.json()
            setShipments(Array.isArray(data) ? data : [])
        } catch (err) {
            toast.error('Failed to sync shipment ledger')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchShipments()
    }, [])

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/shipments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })

            if (res.ok) {
                toast.success(`Shipment Updated to ${status}`)
                fetchShipments()
            } else {
                toast.error('Status Update Failed')
            }
        } catch (err) {
            toast.error('Sync Error')
        }
    }

    const filteredShipments = shipments.filter(s => {
        const matchesSearch = s.orderId.toLowerCase().includes(search.toLowerCase()) ||
                             s.carrier.toLowerCase().includes(search.toLowerCase()) ||
                             (s.trackingNumber || '').toLowerCase().includes(search.toLowerCase())
        
        const matchesStatus = statusFilter === 'ALL' ? true : s.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-[0_4px_12px_-4px_rgba(59,130,246,0.2)]">
                            <Truck className="w-3 h-3 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Asset Dispatch Matrix</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Shipments <span className="text-blue-600 NOT-italic font-black">Control</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">In-Transit Capacity</p>
                            <div className="flex items-center gap-2 text-3xl font-black text-gray-950 italic tracking-tighter">
                                <Package className="w-6 h-6 text-blue-600" />
                                {shipments.filter(s => s.status !== 'DELIVERED').length.toString().padStart(3, '0')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-sm mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <input
                            type="text"
                            placeholder="Search shipments (Order ID, Carrier, Tracking)..."
                            className="w-full bg-slate-100/50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-gray-100">
                        {['ALL', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].map((st) => (
                            <button 
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    statusFilter === st ? 'bg-white shadow-sm text-blue-900 border border-gray-100' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
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
                                    <th className="px-8 py-6">Consignment Signature</th>
                                    <th className="px-8 py-6">Logistic Status</th>
                                    <th className="px-8 py-6">Carrier Node</th>
                                    <th className="px-8 py-6 text-right">Dispatch Metrics</th>
                                    <th className="px-8 py-6 text-right">Fulfillment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredShipments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Shipment Log Null</td>
                                    </tr>
                                ) : filteredShipments.map((ship) => (
                                    <tr key={ship.id} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    <Hash className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight uppercase">#{ship.orderId.slice(-8).toUpperCase()}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ship.order?.customer?.name || 'GUEST-ENTITY'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest ${
                                                ship.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                ship.status === 'IN_TRANSIT' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                                                'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {ship.status === 'DELIVERED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {ship.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-slate-300" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{ship.carrier}</span>
                                                <span className="text-slate-200">|</span>
                                                <span className="text-[10px] font-black text-slate-400 italic">{ship.trackingNumber || 'LOCAL-HANDOFF'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-xs font-black text-slate-950 italic tracking-tighter">
                                                    {ship.shippedAt ? format(new Date(ship.shippedAt), 'MMM dd') : 'PENDING'}
                                                </p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {ship.items.length} Units
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {ship.status !== 'DELIVERED' && (
                                                    <button 
                                                        onClick={() => updateStatus(ship.id, 'DELIVERED')}
                                                        className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 group/check"
                                                        title="Mark as Delivered"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 group-hover/check:scale-110 transition-transform" />
                                                    </button>
                                                )}
                                                {ship.status === 'DISPATCHED' && (
                                                    <button 
                                                        onClick={() => updateStatus(ship.id, 'IN_TRANSIT')}
                                                        className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                                                        title="Mark as In Transit"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
