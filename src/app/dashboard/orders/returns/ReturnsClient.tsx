'use client'

import { useState, useEffect } from 'react'
import { 
    RotateCcw, 
    Search, 
    ArrowUpRight, 
    Clock, 
    User, 
    Hash, 
    IndianRupee,
    CheckCircle2,
    AlertCircle,
    Package,
    XCircle,
    Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { toast, Toaster } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ReturnItem {
    id: string
    productId: string
    quantity: number
    price: number
    product: {
        name: string
    }
}

interface SalesReturn {
    id: string
    orderId: string
    reason: string
    totalRefund: number
    status: 'PENDING' | 'COMPLETED'
    createdAt: string
    order: {
        customer?: {
            name: string
        }
    }
    items: ReturnItem[]
}

export function ReturnsClient() {
    const [returns, setReturns] = useState<SalesReturn[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')
    const [dateFilter, setDateFilter] = useState('')
    const router = useRouter()

    const fetchReturns = async () => {
        try {
            const res = await fetch('/api/returns')
            const data = await res.json()
            setReturns(Array.isArray(data) ? data : [])
        } catch (err) {
            toast.error('Failed to sync return ledger')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReturns()
    }, [])

    const handleApprove = async (ret: SalesReturn) => {
        if (!confirm('Authorize this return request? This will re-increment inventory stock.')) return

        try {
            const res = await fetch('/api/returns', {
                method: 'POST', // Re-using the POST logic but with status='COMPLETED' to trigger re-stock
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: ret.orderId,
                    reason: `Approved: ${ret.reason}`,
                    items: ret.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                })
            })

            if (res.ok) {
                toast.success('Return Approved & Inventory Restored')
                fetchReturns()
            } else {
                toast.error('Approval Protocol Failed')
            }
        } catch (err) {
            toast.error('Sync Error')
        }
    }

    const filteredReturns = returns.filter(r => {
        const matchesSearch = r.orderId.toLowerCase().includes(search.toLowerCase()) ||
                             r.order.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
                             r.reason.toLowerCase().includes(search.toLowerCase())
        
        const matchesStatus = statusFilter === 'ALL' ? true : r.status === statusFilter
        
        const matchesDate = dateFilter 
            ? format(new Date(r.createdAt), 'yyyy-MM-dd') === dateFilter
            : true

        return matchesSearch && matchesStatus && matchesDate
    })

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-emerald-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-[0_4px_12px_-4px_rgba(59,130,246,0.2)]">
                            <RotateCcw className="w-3 h-3 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Reverse Logistics Protocol</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Returns <span className="text-blue-600 NOT-italic font-black">Ledger</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Refund Value</p>
                            <div className="flex items-center gap-2 text-3xl font-black text-gray-950 italic tracking-tighter">
                                <IndianRupee className="w-6 h-6 text-blue-600" />
                                {returns.reduce((sum, r) => sum + r.totalRefund, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-sm mb-12 flex flex-wrap gap-6 items-center">
                    <div className="flex-1 min-w-[300px] relative group">
                        <input
                            type="text"
                            placeholder="Search returns (Order ID, Customer, Reason)..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>

                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        {(['ALL', 'PENDING', 'COMPLETED'] as const).map(status => (
                            <button 
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    statusFilter === status ? 'bg-white shadow-sm text-blue-600 italic' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <input 
                            type="date" 
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
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
                                <tr className="bg-slate-100/30 border-b border-slate-200 uppercase tracking-widest text-[10px] font-black text-slate-900 italic">
                                    <th className="px-8 py-8">Return Signature</th>
                                    <th className="px-8 py-8">Audit Status</th>
                                    <th className="px-8 py-8 text-center uppercase">Asset Payload</th>
                                    <th className="px-8 py-8 text-right">Refund Value</th>
                                    <th className="px-8 py-8 text-right">Decision Console</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {filteredReturns.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-32 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                                                <Package className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] italic mb-2">Transaction Ledger Null</p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matching return signatures found in the current audit matrix.</p>
                                        </td>
                                    </tr>
                                ) : filteredReturns.map((ret) => (
                                    <tr key={ret.id} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Hash className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight uppercase">#{ret.orderId.slice(-8).toUpperCase()}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ret.order?.customer?.name || 'GUEST-ENTITY'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest ${
                                                ret.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                            }`}>
                                                {ret.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {ret.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="bg-slate-50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-gray-100">
                                                {ret.items.length} Assets
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-slate-950 italic tracking-tighter">₹{ret.totalRefund.toFixed(2)}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {ret.status === 'PENDING' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleApprove(ret)}
                                                            className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 group/approve border border-emerald-400"
                                                            title="Approve & Restock"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 group-hover/approve:rotate-12 transition-transform" />
                                                        </button>
                                                        <button 
                                                            className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-400 transition-all shadow-lg shadow-red-500/20 active:scale-95 group/reject border border-red-400"
                                                            title="Reject Return Request"
                                                        >
                                                            <XCircle className="w-4 h-4 group-hover/reject:scale-110 transition-transform" />
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    className="p-3 bg-white text-slate-400 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
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
