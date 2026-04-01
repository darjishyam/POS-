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
    AlertCircle,
    Undo2,
    Minus,
    Plus,
    RotateCcw,
    X,
    IndianRupee,
    Download
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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

    // Partial Return States
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [returnItems, setReturnItems] = useState<Record<string, number>>({})
    const [returnReason, setReturnReason] = useState('Customer Satisfaction Protocol')
    const [isSubmitting, setIsSubmitting] = useState(false)

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

    const openReturnModal = (order: Order) => {
        setSelectedOrder(order)
        const initialQtys: Record<string, number> = {}
        order.items.forEach(item => {
            initialQtys[item.productId] = 0
        })
        setReturnItems(initialQtys)
        setIsReturnModalOpen(true)
    }

    const handlePartialReturn = async () => {
        if (!selectedOrder) return
        
        const itemsToReturn = selectedOrder.items
            .filter(item => returnItems[item.productId] > 0)
            .map(item => ({
                productId: item.productId,
                quantity: returnItems[item.productId],
                price: item.price
            }))

        if (itemsToReturn.length === 0) {
            return toast.error('No items selected for reversal')
        }

        setIsSubmitting(true)
        const loadingToast = toast.loading('Executing Reverse Logistics...')
        
        try {
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    reason: returnReason,
                    items: itemsToReturn
                })
            })

            if (res.ok) {
                toast.success('Inventory Re-calibrated: Partial Return Complete', { id: loadingToast })
                setIsReturnModalOpen(false)
                fetchOrders()
            } else {
                toast.error('Partial Return Protocol Failure', { id: loadingToast })
            }
        } catch (err) {
            toast.error('Sync Error', { id: loadingToast })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleShip = async (order: Order) => {
        const carrier = prompt('Enter Carrier (FedEx, UPS, SELF):', 'SELF')
        if (!carrier) return
        const trackingNumber = prompt('Enter Tracking Number (Optional):') || ''
        
        try {
            const res = await fetch('/api/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    carrier,
                    trackingNumber,
                    items: order.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    }))
                })
            })

            if (res.ok) {
                toast.success('Asset Dispatched: Shipment Profile Created')
            } else {
                toast.error('Dispatch Protocol Failed')
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

    const exportToCSV = () => {
        const headers = ['Order ID', 'Date', 'Customer', 'Status', 'Payment Method', 'Total Amount']
        const rows = filteredOrders.map(o => [
            o.id.toUpperCase(),
            format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
            o.customer?.name || 'Guest',
            o.status,
            o.paymentMethod,
            o.totalAmount.toFixed(2)
        ])
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `BardPOS_Orders_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
        toast.success('Orders Exported to CSV')
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredOrders.map(o => ({
            'Order ID': o.id.toUpperCase(),
            'Date': format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
            'Customer': o.customer?.name || 'Guest',
            'Status': o.status,
            'Payment Method': o.paymentMethod,
            'Total Amount': o.totalAmount
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")
        XLSX.writeFile(workbook, `BardPOS_Orders_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Orders Exported to Excel')
    }

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        doc.setFontSize(20)
        doc.text('BardPOS Sales Ledger', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
        
        const tableData = filteredOrders.map(o => [
            o.id.slice(-8).toUpperCase(),
            format(new Date(o.createdAt), 'MMM dd, HH:mm'),
            o.customer?.name || 'Guest',
            o.status,
            o.paymentMethod,
            `₹${o.totalAmount.toFixed(2)}`
        ])

        autoTable(doc, {
            head: [['ID', 'Date', 'Customer', 'Status', 'Method', 'Total']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }
        })

        doc.save(`BardPOS_Orders_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('Orders Exported to PDF')
    }

    const titleSuffix = statusFilter 
        ? (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) + 's')
        : 'History'

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o?.totalAmount || 0), 0)

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-sm">
                            <Receipt className="w-3 h-3 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Transaction Audit Trail</span>
                        </div>
                        <h2 className="text-7xl font-black text-slate-950 tracking-tighter leading-none italic uppercase">
                            Sales <span className="text-blue-600 NOT-italic font-black">{titleSuffix}</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={exportToCSV}
                                title="Export CSV Ledger"
                                className="p-5 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">CSV</span>
                                <Download className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>

                            <button 
                                onClick={exportToExcel}
                                title="Export Excel"
                                className="p-5 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">Excel</span>
                                <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>

                            <button 
                                onClick={exportToPDF}
                                title="Export PDF"
                                className="p-5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all border border-slate-100 hover:border-rose-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">PDF</span>
                                <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{statusFilter ? 'Subtotal' : 'Gross Inflow'}</p>
                            <div className="flex items-center gap-2 text-3xl font-black text-gray-950 italic tracking-tighter">
                                <span className="text-blue-600 NOT-italic font-black">₹</span>
                                {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
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
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
                        <button 
                            onClick={() => router.push('/dashboard/orders')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                !statusFilter ? 'bg-white shadow-sm text-slate-900 border border-gray-100 italic' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            ALL AUDIT
                        </button>
                        <button 
                            onClick={() => router.push('/dashboard/orders?status=completed')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                statusFilter === 'completed' ? 'bg-white shadow-sm text-blue-600 border border-blue-100 italic' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            COMPLETED
                        </button>
                        <button 
                            onClick={() => router.push('/dashboard/orders?status=return_requested')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                statusFilter === 'return_requested' ? 'bg-white shadow-sm text-amber-600 border border-amber-100 italic' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            RETURN REQ {orders.filter(o => o.status === 'RETURN_REQUESTED').length > 0 && `(${orders.filter(o => o.status === 'RETURN_REQUESTED').length})`}
                        </button>
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
                                <tr className="bg-slate-50/50 border-b border-gray-50 uppercase tracking-widest text-[10px] font-black text-slate-600 italic">
                                    <th className="px-8 py-8">Order Signature</th>
                                    <th className="px-8 py-8">Status Condition</th>
                                    <th className="px-8 py-8">Execution Date</th>
                                    <th className="px-8 py-8">Settlement</th>
                                    <th className="px-8 py-8 text-center">Payload</th>
                                    <th className="px-8 py-8 text-right px-10">Value Signature</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-32 text-center bg-white">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                                                <Receipt className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] italic mb-2">Audit Ledger Null</p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matching transaction signatures found in the current temporal frame.</p>
                                        </td>
                                    </tr>
                                ) : (filteredOrders || []).map((order) => (
                                    <tr key={order.id} className="group hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    <Hash className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight uppercase">#{order.id.slice(-8).toUpperCase()}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.customer?.name || 'GUEST-ENTITY'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest ${
                                                order.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                order.status === 'RETURN_REQUESTED' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                                                order.status === 'RETURNED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                                {order.status === 'RETURN_REQUESTED' && <AlertCircle className="w-3 h-3" />}
                                                {order.status}
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
                                                    order.paymentMethod === 'CASH' ? 'bg-blue-50 text-blue-600' : 'bg-blue-50 text-blue-600'
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
                                                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 group/resume"
                                                            title="Resume Draft"
                                                        >
                                                            <ShoppingCart className="w-4 h-4 group-hover/resume:scale-110 transition-transform" />
                                                        </button>
                                                    )
                                                )}

                                                {(order.status === 'COMPLETED' || order.status === 'RETURN_REQUESTED' || order.status === 'RETURNED') && (
                                                    <div className="flex gap-2">
                                                        <Link 
                                                            href={`/dashboard/orders/${order.id}`}
                                                            className="p-3 bg-white hover:bg-slate-950 text-slate-400 hover:text-white rounded-xl border border-slate-100 hover:border-slate-950 transition-all group/view shadow-sm active:scale-95"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4 group-hover/view:scale-110 transition-transform" />
                                                        </Link>
                                                        {order.status === 'COMPLETED' && (
                                                            <button 
                                                                onClick={() => handleShip(order)}
                                                                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/10 group/ship active:scale-95 border border-blue-400"
                                                                title="Ship Asset"
                                                            >
                                                                <Package className="w-4 h-4 group-hover/ship:scale-110 transition-transform" />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => openReturnModal(order)}
                                                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group/return border border-red-500/20 active:scale-95"
                                                            title={order.status === 'RETURN_REQUESTED' ? "Approve Return Request" : "Partial Return Protocol"}
                                                        >
                                                            <RotateCcw className="w-4 h-4 group-hover/return:rotate-[-90deg] transition-transform" />
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span className="text-2xl font-black text-gray-950 tracking-tighter italic">
                                                        ₹{order.totalAmount.toFixed(2)}
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

