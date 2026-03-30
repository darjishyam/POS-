'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Package, Calendar, Tag, ArrowRight, RotateCcw, Search, Clock, Truck, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { toast, Toaster } from 'react-hot-toast'
import Link from 'next/link'

interface OrderItem {
    id: string
    productId: string
    quantity: number
    price: number
    product: {
        name: string
        image?: string
    }
}

interface Order {
    id: string
    totalAmount: number
    status: string
    createdAt: string
    items: OrderItem[]
    shipments: any[]
}

export function OrdersClient() {
    const { user, token } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const fetchMyOrders = async () => {
        if (!token) return
        try {
            const res = await fetch('/api/orders/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            setOrders(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error('Failed to sync order history')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchMyOrders()
    }, [token])

    const handleRequestReturn = async (order: Order) => {
        if (!confirm('Request Return for this order? Our team will review your request.')) return

        try {
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    reason: 'User Requested Return (Marketplace)',
                    status: 'RETURN_REQUESTED',
                    items: order.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                })
            })

            if (res.ok) {
                toast.success('Return Request Transmitted: Awaiting Review')
                fetchMyOrders()
            } else {
                toast.error('Transmission Failure')
            }
        } catch (error) {
            toast.error('Sync Error')
        }
    }

    const filteredOrders = orders.filter(o => 
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.items.some(i => i.product.name.toLowerCase().includes(search.toLowerCase()))
    )

    if (loading) {
        return (
            <div className="w-full mx-auto py-12">
                <div className="h-12 w-64 bg-slate-100 animate-pulse rounded-2xl mb-8" />
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 w-full bg-slate-50 animate-pulse rounded-[2.5rem] border border-slate-100" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full mx-auto py-12">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-5xl font-black text-slate-950 tracking-tight italic leading-none">Order <span className="text-emerald-600 NOT-italic">Chronicle</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-3 italic">Historical transaction database for {user?.email}</p>
                </div>

                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input 
                        type="text"
                        placeholder="SEARCH TRANSACTIONS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-5 pl-14 pr-6 text-[10px] font-black tracking-widest text-slate-950 shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300"
                    />
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="bg-slate-50 rounded-[3rem] p-24 text-center border border-dashed border-slate-200">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200/50">
                        <Package className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-950 italic mb-2">No Transactions Found</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto mb-12">The ledger is currently empty. Initialize a checkout session to begin your acquisition history.</p>
                    <Link href="/products">
                        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20">
                            BROWSE MARKETPLACE
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-gray-100/20 overflow-hidden hover:border-emerald-100 transition-colors group">
                            {/* Order Header */}
                            <div className="bg-slate-50/50 px-10 py-6 flex flex-wrap justify-between items-center gap-6 border-b border-slate-100">
                                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 mb-1">Transaction ID</span>
                                        <span className="text-slate-950">#{order.id.slice(-8)}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200" />
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 mb-1">Authenticated On</span>
                                        <span className="text-slate-950 flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-emerald-500" />
                                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200" />
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 mb-1">Status Protocol</span>
                                        <span className={`flex items-center gap-2 ${
                                            order.status === 'COMPLETED' ? 'text-emerald-600' : 
                                            order.status === 'RETURNED' ? 'text-blue-600' :
                                            order.status === 'RETURN_REQUESTED' ? 'text-amber-600' :
                                            'text-slate-600'
                                        }`}>
                                            <Clock className="w-3 h-3" />
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {order.status === 'COMPLETED' && (
                                        <button 
                                            onClick={() => handleRequestReturn(order)}
                                            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 hover:border-red-100 transition-all font-black text-[10px] uppercase tracking-widest group/btn"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 group-hover/btn:rotate-[-90deg] transition-transform" />
                                            Request Return
                                        </button>
                                    )}
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">authorized Total</p>
                                        <p className="text-2xl font-black text-slate-950 tracking-tighter italic">₹{order.totalAmount.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Shipment Tracking Protocol */}
                            {order.shipments && order.shipments.length > 0 && (
                                <div className="mx-10 mt-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Logistics Roadmap</p>
                                            <h5 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                                                {order.shipments[0].carrier}
                                                <span className="text-blue-300">/</span>
                                                <span className="text-blue-600 italic">#{order.shipments[0].trackingNumber || 'LOCAL-OFFLOAD'}</span>
                                            </h5>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${
                                            order.shipments[0].status === 'DELIVERED' ? 'bg-emerald-500 text-white border-emerald-400' :
                                            'bg-blue-600 text-white border-blue-500 animate-pulse'
                                        }`}>
                                            <MapPin className="w-3.5 h-3.5" />
                                            {order.shipments[0].status.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Items */}
                            <div className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-6 group/item">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 shadow-lg shadow-slate-200/20">
                                                {item.product.image ? (
                                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Package className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-black text-slate-950 tracking-tight italic group-hover/item:text-emerald-600 transition-colors uppercase">{item.product.name}</h4>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Tag className="w-3 h-3" />
                                                        Qty: {item.quantity}
                                                    </span>
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">₹{item.price.toFixed(2)} / unit
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
