'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
    MapPin,
    Sparkles,
    IndianRupee,
    Download,
    FileText
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Product {
    id: string
    name: string
    price: number
    sku: string
}

interface Supplier {
    id: string
    name: string
    contactPerson?: string | null
    address?: string | null
}

interface Purchase {
    id: string
    totalAmount: number
    amountPaid: number
    paymentStatus: string
    paymentMethod: string
    referenceNumber: string | null
    status: string
    createdAt: string
    location?: { name: string }
    supplier: {
        name: string
    }
    items: any[]
    _count: {
        items: number
    }
}

export default function PurchasesClient() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [locations, setLocations] = useState<{ id: string, name: string, address?: string | null }[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')
    const searchParams = useSearchParams()
    const productIdFromUrl = searchParams.get('productId')

    // Form states
    const [supplierId, setSupplierId] = useState('')
    const [locationId, setLocationId] = useState('')
    const [referenceNumber, setReferenceNumber] = useState('')
    const [amountPaid, setAmountPaid] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [items, setItems] = useState<any[]>([{ productId: '', quantity: 1, unitCost: 0, syncPrice: false, newPrice: 0 }])

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (productIdFromUrl && products.length > 0 && !isModalOpen && items[0]?.productId === '') {
            const product = products.find(p => p.id === productIdFromUrl)
            if (product) {
                setItems([{ productId: productIdFromUrl, quantity: 1, unitCost: 0, syncPrice: false, newPrice: 0 }])
                setIsModalOpen(true)
                toast.success(`Replenishing ${product.name}`)
            }
        }
    }, [productIdFromUrl, products, isModalOpen])

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

    const exportToCSV = () => {
        const headers = ['Date', 'Supplier', 'Reference', 'Status', 'Total', 'Paid', 'Due']
        const rows = filteredPurchases.map(p => {
            const due = p.totalAmount - (p.amountPaid || 0)
            return [
                new Date(p.createdAt).toLocaleDateString(),
                p.supplier.name,
                p.referenceNumber || 'N/A',
                p.status,
                p.totalAmount.toFixed(2),
                (p.amountPaid || 0).toFixed(2),
                due.toFixed(2)
            ]
        })
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `BardPOS_Purchases_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
        toast.success('Purchases Exported to CSV')
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredPurchases.map(p => ({
            'Date': new Date(p.createdAt).toLocaleDateString(),
            'Supplier': p.supplier.name,
            'Reference': p.referenceNumber || 'N/A',
            'Status': p.status,
            'Total Amount': p.totalAmount,
            'Amount Paid': p.amountPaid || 0,
            'Balanced Due': p.totalAmount - (p.amountPaid || 0)
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchases")
        XLSX.writeFile(workbook, `BardPOS_Purchases_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Purchases Exported to Excel')
    }

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        doc.setFontSize(20)
        doc.text('BardPOS Procurement Ledger', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
        
        const tableData = filteredPurchases.map(p => [
            new Date(p.createdAt).toLocaleDateString(),
            p.supplier.name,
            p.referenceNumber || 'N/A',
            p.status,
            `₹${p.totalAmount.toFixed(2)}`,
            `₹${(p.amountPaid || 0).toFixed(2)}`,
            `₹${(p.totalAmount - (p.amountPaid || 0)).toFixed(2)}`
        ])

        autoTable(doc, {
            head: [['Date', 'Supplier', 'Reference', 'Status', 'Total', 'Paid', 'Due']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        })

        doc.save(`BardPOS_Purchases_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('Purchases Exported to PDF')
    }

    const addItem = () => {
        setItems([...items, { productId: '', quantity: 1, unitCost: 0, syncPrice: false, newPrice: 0 }])
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

    const [purchaseStatus, setPurchaseStatus] = useState('RECEIVED')

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
                    amountPaid: Number(amountPaid),
                    paymentMethod,
                    status: purchaseStatus,
                    items
                })
            })

            if (res.ok) {
                toast.success('Batch Stock-In Successful', { id: loadingToast })
                setIsModalOpen(false)
                setItems([{ productId: '', quantity: 1, unitCost: 0, syncPrice: false, newPrice: 0 }])
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
    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPurchase || amountPaid <= 0) return toast.error('Invalid payment amount')
        
        setSubmitting(true)
        const loadingToast = toast.loading('Processing Settlement...')
        try {
            const res = await fetch(`/api/purchases/${selectedPurchase.id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amountPaid, method: paymentMethod })
            })
            if (res.ok) {
                toast.success('Liability Reduced', { id: loadingToast })
                setIsPaymentModalOpen(false)
                setSelectedPurchase(null)
                setAmountPaid(0)
                fetchData()
            }
        } catch (error) {
            toast.error('Settlement Refused', { id: loadingToast })
        } finally {
            setSubmitting(false)
        }
    }

    const openPaymentModal = (purchase: any) => {
        setSelectedPurchase(purchase)
        setAmountPaid(purchase.totalAmount - (purchase.amountPaid || 0))
        setIsPaymentModalOpen(true)
    }

    const handleReturn = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPurchase || items.length === 0) return toast.error('No items to return')
        
        setSubmitting(true)
        const loadingToast = toast.loading('Executing Reverse Logistics...')
        try {
            const res = await fetch(`/api/purchases/${selectedPurchase.id}/returns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: referenceNumber, items })
            })
            if (res.ok) {
                toast.success('Stock Returned to Vendor', { id: loadingToast })
                setIsReturnModalOpen(false)
                setSelectedPurchase(null)
                fetchData()
            }
        } catch (error) {
            toast.error('Return Refused', { id: loadingToast })
        } finally {
            setSubmitting(false)
        }
    }

    const handleReceive = async (purchaseId: string) => {
        const loadingToast = toast.loading('Synchronizing Stock Arrival...')
        try {
            const res = await fetch(`/api/purchases/${purchaseId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'RECEIVED' })
            })
            if (res.ok) {
                toast.success('Inventory Updated', { id: loadingToast })
                fetchData()
            }
        } catch (error) {
            toast.error('Sync failed', { id: loadingToast })
        }
    }

    const openReturnModal = (purchase: any) => {
        setSelectedPurchase(purchase)
        setItems(purchase.items.map((i: any) => ({ 
            productId: i.productId, 
            quantity: 0,
            product: i.product,
            maxQuantity: i.quantity 
        })))
        setReferenceNumber('')
        setIsReturnModalOpen(true)
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
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={exportToCSV}
                                title="Export CSV"
                                className="p-5 bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100 hover:border-emerald-200 shadow-sm group"
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
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Procurement Vol</p>
                            <p className="text-3xl font-black text-gray-950 italic tracking-tighter">₹{(purchases || []).reduce((s, p) => s + (p?.totalAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                    <th className="px-8 py-6">Identity (Vendor / Site)</th>
                                    <th className="px-8 py-6 text-center">Batch Vol</th>
                                    <th className="px-8 py-6 text-center">Status</th>
                                    <th className="px-8 py-6 text-right">Value (Paid / Due)</th>
                                    <th className="px-8 py-6 text-center w-10">Nodes</th>
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
                                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 w-fit">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {purchase.location?.name || 'GLOBAL HUB'}
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
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                {(() => {
                                                    const due = purchase.totalAmount - (purchase.amountPaid || 0)
                                                    const pStatus = due === 0 ? 'PAID' : (purchase.amountPaid > 0 ? 'PARTIAL' : 'DUE')
                                                    return (
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border italic ${
                                                            pStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                            pStatus === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                            'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                        }`}>
                                                            {pStatus}
                                                        </span>
                                                    )
                                                })()}
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border italic ${
                                                    purchase.status === 'RECEIVED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-slate-500/10 text-slate-600 border-slate-500/20 animate-pulse'
                                                }`}>
                                                    {purchase.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2 font-black text-gray-950 tracking-tighter text-xl italic group-hover:text-emerald-600">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    ₹{purchase.totalAmount.toFixed(2)}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span>PAID: ₹{(purchase as any).amountPaid?.toFixed(2) || '0.00'}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span className={((purchase as any).totalAmount - ((purchase as any).amountPaid || 0)) > 0 ? "text-rose-500" : "text-emerald-500"}>
                                                        DUE: ₹{((purchase as any).totalAmount - ((purchase as any).amountPaid || 0)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {purchase.status === 'ORDERED' && (
                                                    <button 
                                                        onClick={() => handleReceive(purchase.id)}
                                                        className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all border border-emerald-500"
                                                        title="Receive Stock"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(purchase.totalAmount - (purchase.amountPaid || 0)) > 0 && (
                                                    <button 
                                                        onClick={() => openPaymentModal(purchase)}
                                                        className="p-3 bg-white hover:bg-emerald-600 text-slate-400 hover:text-white rounded-xl border border-slate-100 hover:border-emerald-500 shadow-sm transition-all"
                                                        title="Settle Liability"
                                                    >
                                                        <IndianRupee className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => openReturnModal(purchase)}
                                                    className="p-3 bg-white hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl border border-slate-100 border-rose-100 shadow-sm transition-all"
                                                    title="Initiate Return"
                                                >
                                                    <ArrowUpRight className="w-4 h-4 rotate-180" />
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

                        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
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
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Your Receiving Location</label>
                                        <select
                                            required
                                            value={locationId}
                                            onChange={(e) => setLocationId(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-gray-900 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none"
                                        >
                                            <option value="">Select Address...</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.name.toUpperCase()} - {l.address || 'NO ADDRESS'}</option>)}
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
                                
                                {/* Dynamic Supplier Info Card */}
                                {supplierId && (
                                    <div className="mb-10 p-6 bg-blue-50/30 border border-blue-100 rounded-3xl animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-start gap-6">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-blue-50">
                                                <Truck className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Vendor Entity Details</p>
                                                    <p className="font-black text-slate-900 italic uppercase">
                                                        {suppliers.find(s => s.id === supplierId)?.name}
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-500 mt-1">
                                                        Attn: {suppliers.find(s => s.id === supplierId)?.contactPerson || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Supplier Mailing Address</p>
                                                    <p className="text-xs font-black text-slate-600 tracking-tight italic">
                                                        {suppliers.find(s => s.id === supplierId)?.address || 'NO REGISTERED ADDRESS'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Procurement Method Toggle */}
                                <div className="space-y-4 mb-10 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-200/50">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Procurement Strategy</label>
                                    <div className="flex gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setPurchaseStatus('RECEIVED')}
                                            className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${purchaseStatus === 'RECEIVED' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}
                                        >
                                            🚀 Direct Stock-In
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setPurchaseStatus('ORDERED')}
                                            className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${purchaseStatus === 'ORDERED' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}
                                        >
                                            📝 Purchase Order (PO)
                                        </button>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 italic">
                                        {purchaseStatus === 'RECEIVED' ? 'STOCKS WILL BE UPDATED IMMEDIATELY UPON FINALIZATION.' : 'STOCKS REMAIN UNCHANGED UNTIL FORMAL RECEIPT VALIDATION.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-10 shrink-0 bg-slate-50/30 p-8 rounded-[2rem] border border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Disbursement (Amount Paid)</label>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" max={totalAmount}
                                                value={amountPaid}
                                                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                                className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black text-2xl text-slate-900 tracking-tighter italic"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                PAYMENT SIGNATURE
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Settlement Protocol (Payment Method)</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-6 font-black text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none tracking-widest uppercase text-sm"
                                        >
                                            <option value="CASH">Liquid Assets (CASH)</option>
                                            <option value="CARD">Digital Terminal (CARD)</option>
                                            <option value="UPI">Direct Transfer (UPI)</option>
                                            <option value="CREDIT">Accounts Payable (CREDIT)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Items Ledger Area */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-2">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Procurement Items Ledger</h4>
                                        <div className="h-px flex-1 bg-slate-100 mx-6" />
                                    </div>
                                    
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
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()} (CURR: ₹{p.price})</option>)}
                                                </select>
                                                {item.productId && (
                                                    <div className="flex items-center gap-4 mt-2 px-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateItem(index, 'syncPrice', !item.syncPrice)}
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${item.syncPrice ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-200' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                            {item.syncPrice ? 'Pricing Sync Active' : 'Sync Selling Price?'}
                                                        </button>
                                                        {item.syncPrice && (
                                                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">New MSRP:</span>
                                                                <input 
                                                                    type="number" step="0.01"
                                                                    value={item.newPrice}
                                                                    onChange={(e) => updateItem(index, 'newPrice', parseFloat(e.target.value))}
                                                                    className="w-16 bg-transparent border-none text-[10px] font-black text-indigo-700 focus:ring-0 p-0"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">QTY</label>
                                                <input
                                                    type="number" min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                    className="w-full bg-white border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                                                />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UNIT COST: ₹{item.unitCost?.toFixed(2)}</p>
                                            </div>

                                            <div className="col-span-3 space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost / Unit (₹)</label>
                                                <input
                                                    type="number" step="0.01"
                                                    value={item.unitCost}
                                                    onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value))}
                                                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all placeholder:text-slate-200"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Line Valuation</p>
                                                <p className="text-2xl font-black text-slate-900 italic tracking-tighter group-hover:text-emerald-600 transition-colors">
                                                    ₹{(item.quantity * item.unitCost).toFixed(2)}
                                                </p>
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
                            </div>
                            
                            {/* Fixed Footer */}
                            <div className="p-10 bg-slate-50/80 backdrop-blur-md border-t border-gray-100 flex items-center justify-between shrink-0">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Calculated Disbursement Metrics</p>
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col items-end">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">Cumulative Ledger Value</p>
                                            <div className="text-6xl font-black text-slate-950 italic tracking-tighter flex items-center gap-4">
                                                <span className="text-emerald-600 NOT-italic">₹</span>
                                                {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-slate-200" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">LIABILITY DUE</span>
                                            <p className="text-4xl font-black text-rose-600 italic tracking-tighter">
                                                ₹{(totalAmount - (amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
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
            {/* Payment Modal */}
            {isPaymentModalOpen && selectedPurchase && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 font-sans">
                        <div className="p-12">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <IndianRupee className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic">Liability <span className="text-emerald-600 NOT-italic font-black">Settlement</span></h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Protocol: {selectedPurchase.referenceNumber || selectedPurchase.id.toUpperCase()}</p>
                                </div>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disbursement Amount</label>
                                    <div className="relative">
                                        <input
                                            required type="number" step="0.01" min="0.01" max={selectedPurchase.totalAmount - (selectedPurchase.amountPaid || 0)}
                                            className="w-full p-8 bg-slate-50 border-none rounded-3xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black text-3xl text-slate-900 tracking-tighter italic"
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(parseFloat(e.target.value))}
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">OUTSTANDING</span>
                                            <span className="text-xs font-black text-slate-400 italic">₹{(selectedPurchase.totalAmount - (selectedPurchase.amountPaid || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Channel</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-6 font-black text-slate-900 outline-none appearance-none tracking-widest uppercase text-xs"
                                    >
                                        <option value="CASH">CASH ASSETS</option>
                                        <option value="CARD">BANK TERMINAL</option>
                                        <option value="UPI">UPI PROTOCOL</option>
                                    </select>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors">Abort</button>
                                    <button type="submit" disabled={submitting} className="flex-[2] py-6 bg-slate-950 hover:bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50">Settle Transaction</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {isReturnModalOpen && selectedPurchase && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsReturnModalOpen(false)} />
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] font-sans">
                        <div className="p-12 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                    <ArrowUpRight className="w-6 h-6 text-rose-600 rotate-180" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic">Reverse <span className="text-rose-600 NOT-italic font-black">Logistics</span></h3>
                            </div>
                            <button onClick={() => setIsReturnModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-red-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleReturn} className="p-12 flex flex-col h-full overflow-hidden">
                            <div className="mb-10 shrink-0">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Return Reason / Narrative</label>
                                <textarea
                                    className="w-full bg-slate-50 border-none rounded-3xl p-6 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all min-h-[100px]"
                                    placeholder="Explain the reason for this return (e.g. Damaged during logistics)..."
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto mb-10 pr-4 space-y-4">
                                {selectedPurchase.items.map((item: any, idx: number) => {
                                    const returnItem = items.find(i => i.productId === item.productId)
                                    return (
                                        <div key={item.id} className="grid grid-cols-12 gap-6 items-center bg-slate-50/30 p-6 rounded-3xl border border-gray-100">
                                            <div className="col-span-8">
                                                <p className="font-black text-slate-900 uppercase italic tracking-tighter">{item.product.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BATCH QTY: {item.quantity}</p>
                                            </div>
                                            <div className="col-span-4">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">RETURN QTY</label>
                                                <input
                                                    type="number" min="0" max={item.quantity}
                                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-black text-slate-900 outline-none focus:border-rose-500 transition-all"
                                                    value={returnItem?.quantity || 0}
                                                    onChange={(e) => {
                                                        const newItems = [...items]
                                                        newItems[idx].quantity = parseInt(e.target.value) || 0
                                                        setItems(newItems)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="border-t border-gray-100 pt-10 flex gap-4 shrink-0">
                                <button type="button" onClick={() => setIsReturnModalOpen(false)} className="flex-1 py-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors">Abort</button>
                                <button type="submit" disabled={submitting} className="flex-[2] py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 transition-all active:scale-95">Verify & Reverse Stock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
