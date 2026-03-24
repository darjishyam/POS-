'use client'

import { useState, useEffect } from 'react'
import { 
    Receipt, 
    Calendar, 
    Hash, 
    Package, 
    CreditCard, 
    Search, 
    ArrowUpRight, 
    Clock, 
    CheckCircle2,
    Filter,
    MoreVertical,
    FileText,
    ShoppingCart,
    Eye,
    RotateCcw
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { format } from 'date-fns'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'

interface Order {
    id: string
    totalAmount: number
    paymentMethod: string
    upiId?: string
    customerId?: string | null
    status: string
    createdAt: string
    items: any[]
    customer?: { name: string }
}

export default function OrdersClient() {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const searchParams = useSearchParams()
    const statusFilter = searchParams.get('status')
    const { addToCart, clearCart } = useCart()
    const router = useRouter()

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/orders')
            const data = await res.json()
            setOrders(Array.isArray(data) ? data : [])
        } catch (err) {
            toast.error('Failed to sync transaction ledger')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReturn = async (order: Order) => {
        if (!confirm('Initiate Reverse Logistics Protocol (Full Return)?')) return
        
        try {
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    reason: 'Admin-Initiated Return',
                    items: order.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                })
            })

            if (res.ok) {
                toast.success('Inventory Re-incremented: Return Complete')
                fetchOrders()
            } else {
                toast.error('Return Protocol Failed')
            }
        } catch (err) {
            toast.error('Sync Error')
        }
    }

    const filteredOrders = (orders || []).filter(o => {
        const matchesSearch = (o.id || '').toLowerCase().includes(search.toLowerCase()) || 
                             (o.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                             (o.paymentMethod || '').toLowerCase().includes(search.toLowerCase())
        
        const matchesStatus = statusFilter 
            ? o.status?.toLowerCase() === statusFilter.toLowerCase()
            : true
            
        return matchesSearch && matchesStatus
    })

    const titleSuffix = statusFilter 
        ? (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) + 's')
        : 'History'

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o?.totalAmount || 0), 0)

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-emerald-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <Receipt className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Transaction Audit Trail</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Sales <span className="text-emerald-600 NOT-italic font-black">{titleSuffix}</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{statusFilter ? 'Subtotal' : 'Gross Inflow'}</p>
                            <div className="flex items-center gap-2 text-3xl font-black text-gray-950 italic tracking-tighter">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                                {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="h-12 w-px bg-gray-200" />
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{statusFilter ? 'Record Count' : 'Batch Count'}</p>
                            <p className="text-3xl font-black text-gray-950 italic tracking-tighter">
                                {filteredOrders.length.toString().padStart(3, '0')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-sm mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <input
                            type="text"
                            placeholder="Search transaction matrix (ID, Customer, Method)..."
                            className="w-full bg-slate-100/50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-gray-100">
                        <button className="px-6 py-2.5 rounded-xl bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-900 border border-gray-100 font-black italic">Net Sales</button>
                        <button className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Refunds</button>
                    </div>
                </div>

                {isLoading ? (
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
                                    <th className="px-8 py-6">Order Signature</th>
                                    <th className="px-8 py-6">Timestamp</th>
                                    <th className="px-8 py-6">Settlement</th>
                                    <th className="px-8 py-6 text-center">Payload</th>
                                    <th className="px-8 py-6 text-right">Value Signature</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <span className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Transaction Log Null</span>
                                        </td>
                                    </tr>
                                ) : (filteredOrders || []).map((order) => (
                                    <tr key={order.id} className="group hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                    <Hash className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight uppercase">#{order.id.slice(-8).toUpperCase()}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.customer?.name || 'GUEST-ENTITY'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-xs font-black text-slate-600">
                                                <Clock className="w-3 h-3 text-slate-300" />
                                                {format(new Date(order.createdAt), 'HH:mm')}
                                                <span className="text-slate-300 mx-1">/</span>
                                                {format(new Date(order.createdAt), 'MMM dd')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${
                                                    order.paymentMethod === 'CASH' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    <CreditCard className="w-3 h-3" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{order.paymentMethod}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="bg-slate-50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-gray-100">
                                                {order.items?.length || 0} Modules
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                {order.status === 'DRAFT' && (
                                                    order.customerId ? (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-400">
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">User Controlled</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => {
                                                                clearCart()
                                                                order.items.forEach(item => {
                                                                    addToCart({
                                                                        id: item.productId,
                                                                        name: item.product?.name || 'Asset',
                                                                        price: item.price,
                                                                        quantity: item.quantity,
                                                                        image: item.product?.image || ''
                                                                    })
                                                                })
                                                                // Also restore payment intent if any
                                                                localStorage.setItem('pos_resume_payment_method', order.paymentMethod || 'CASH');
                                                                if (order.upiId) localStorage.setItem('pos_resume_upi_id', order.upiId);
                                                                
                                                                toast.success('Draft Session Restored')
                                                                router.push('/checkout')
                                                            }}
                                                            className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 group/resume"
                                                            title="Resume Draft"
                                                        >
                                                            <ShoppingCart className="w-4 h-4 group-hover/resume:scale-110 transition-transform" />
                                                        </button>
                                                    )
                                                )}

                                                {order.status === 'COMPLETED' && (
                                                    <button 
                                                        onClick={() => handleReturn(order)}
                                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group/return border border-red-500/20"
                                                        title="Return Order"
                                                    >
                                                        <RotateCcw className="w-4 h-4 group-hover/return:rotate-[-90deg] transition-transform" />
                                                    </button>
                                                )}
                                                
                                                <div className="flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span className="text-2xl font-black text-gray-950 tracking-tighter italic">
                                                        ${order.totalAmount.toFixed(2)}
                                                    </span>
                                                </div>
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

function DollarSign(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    )
}
