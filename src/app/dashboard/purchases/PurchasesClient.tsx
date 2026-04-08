'use client'

import { useState, useEffect, useRef } from 'react'
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
    FileText,
    Eye,
    PlusCircle
} from 'lucide-react'
import Link from 'next/link'
import ProductForm from '@/components/ProductForm'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PurchaseFlowProduct {
    id: string
    name: string
    price: number
    sku: string
    purchasePriceExcTax?: number
    purchasePriceIncTax?: number
    taxId?: string
    taxType?: string
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
    const [products, setProducts] = useState<PurchaseFlowProduct[]>([])
    const [locations, setLocations] = useState<{ id: string, name: string, address?: string | null }[]>([])
    const [taxes, setTaxes] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')
    const [mounted, setMounted] = useState(false)
    const urlInitialized = useRef(false)
    const searchParams = useSearchParams()
    const productIdFromUrl = searchParams.get('productId')
    const createFromUrl = searchParams.get('create')

    // Form states
    const [supplierId, setSupplierId] = useState('')
    const [locationId, setLocationId] = useState('')
    const [referenceNumber, setReferenceNumber] = useState('')
    const [amountPaid, setAmountPaid] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [items, setItems] = useState<any[]>([{ 
        productId: '', 
        quantity: 1, 
        unitCost: 0, 
        unitCostExcTax: 0, 
        unitCostIncTax: 0, 
        taxId: '', 
        taxType: 'EXCLUSIVE', 
        taxRate: 0, 
        syncPrice: false, 
        newPrice: 0 
    }])

    useEffect(() => {
        setMounted(true)
        fetchData()
    }, [])

    useEffect(() => {
        // Handle direct product replenishment from URL
        if (productIdFromUrl && products.length > 0 && !isModalOpen && items[0]?.productId === '' && !urlInitialized.current) {
            const product = products.find(p => p.id === productIdFromUrl) as PurchaseFlowProduct
            if (product) {
                setItems([{ 
                    productId: productIdFromUrl, 
                    quantity: 1, 
                    unitCost: product.purchasePriceExcTax || 0,
                    unitCostExcTax: product.purchasePriceExcTax || 0,
                    unitCostIncTax: product.purchasePriceIncTax || 0,
                    taxId: product.taxId || '',
                    taxType: product.taxType || 'EXCLUSIVE',
                    syncPrice: false, 
                    newPrice: 0 
                }])
                setIsModalOpen(true)
                urlInitialized.current = true
                toast.success(`Replenishing ${product.name}`)
            }
        }

        // Handle Redirect from 'Construct Asset' in Inventory
        if (createFromUrl === 'true' && !isModalOpen && !urlInitialized.current) {
            setIsModalOpen(true)
            setActiveItemIndex(0)
            setIsProductModalOpen(true)
            urlInitialized.current = true
        }
    }, [productIdFromUrl, createFromUrl, products, isModalOpen])

    const fetchData = async () => {
        try {
            const [pRes, sRes, prRes, lRes, tRes] = await Promise.all([
                fetch('/api/purchases'),
                fetch('/api/suppliers'),
                fetch('/api/products'),
                fetch('/api/locations'),
                fetch('/api/taxes')
            ])
            const pData = await pRes.json()
            const sData = await sRes.json()
            const prData = await prRes.json()
            const lData = await lRes.json()
            const tData = await tRes.json()
            setPurchases(Array.isArray(pData) ? pData : [])
            setSuppliers(Array.isArray(sData) ? sData : [])
            setProducts(Array.isArray(prData) ? prData : [])
            setLocations(Array.isArray(lData) ? lData : [])
            setTaxes(Array.isArray(tData) ? tData : [])
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
            headStyles: { fillColor: [37, 99, 235] }
        })

        doc.save(`BardPOS_Purchases_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('Purchases Exported to PDF')
    }

    const addItem = () => setItems([...items, { 
        productId: '', 
        quantity: 1, 
        unitCost: 0, 
        unitCostExcTax: 0, 
        unitCostIncTax: 0, 
        taxId: '', 
        taxType: 'EXCLUSIVE', 
        taxRate: 0, 
        syncPrice: false, 
        newPrice: 0 
    }])

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }

        // Initialize newPrice if productId changes
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].newPrice = product.price || 0;
            }
        }

        // Trigger dynamic fiscal calculations if tax or cost changes
        if (field === 'taxId' || field === 'taxType' || field === 'unitCostExcTax' || field === 'unitCostIncTax' || field === 'productId') {
            const item = newItems[index]
            const selectedTax = taxes.find(t => t.id === (field === 'taxId' ? value : item.taxId))
            const rate = selectedTax ? selectedTax.rate : 0
            
            if (field === 'unitCostIncTax') {
                const inc = parseFloat(value) || 0
                item.unitCostExcTax = inc / (1 + rate / 100)
                item.unitCost = item.unitCostExcTax // Legacy compatibility
            } else {
                const exc = parseFloat(field === 'unitCostExcTax' ? value : item.unitCostExcTax) || 0
                item.unitCostIncTax = exc * (1 + rate / 100)
                item.unitCost = exc // Legacy compatibility
            }
            item.taxRate = rate
        }

        setItems(newItems)
    }

    const calculateTotal = () => items.reduce((sum, item) => sum + (item.quantity * (item.taxType === 'INCLUSIVE' ? item.unitCostIncTax : item.unitCostExcTax)), 0)

    const [purchaseStatus, setPurchaseStatus] = useState('RECEIVED')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supplierId) return toast.error('Select a supplier')
        if (!locationId) return toast.error('Select a destination location')
        if (items.some(item => !item.productId || item.quantity <= 0)) return toast.error('Invalid items')

        setSubmitting(true)
        const loadingToast = toast.loading('Sinking Purchase Order...')

        try {
            const taxAmountTotal = items.reduce((acc, item) => acc + ((item.unitCostIncTax - item.unitCostExcTax) * item.quantity), 0)
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId,
                    locationId,
                    referenceNumber,
                    totalAmount: calculateTotal(),
                    taxAmount: taxAmountTotal,
                    amountPaid: Number(amountPaid),
                    paymentMethod,
                    status: purchaseStatus,
                    items
                })
            })

            if (res.ok) {
                toast.success('Procurement Successful', { id: loadingToast })
                setIsModalOpen(false)
                setItems([{ productId: '', quantity: 1, unitCost: 0, unitCostExcTax: 0, unitCostIncTax: 0, taxId: '', taxType: 'EXCLUSIVE', taxRate: 0, syncPrice: false, newPrice: 0 }])
                setSupplierId('')
                setLocationId('')
                setReferenceNumber('')
                fetchData()
            }
        } catch (error) {
            toast.error('Sync failed', { id: loadingToast })
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

    const handleNewProductSave = async (data: any) => {
        const loadingToast = toast.loading('Registering New Asset...')
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            const newProduct = await res.json()
            if (res.ok) {
                toast.success('Asset Globally Recognized', { id: loadingToast })
                
                // Refresh local product list
                const prRes = await fetch('/api/products')
                const prData = await prRes.json()
                setProducts(Array.isArray(prData) ? prData : [])

                // Update the active item row with new fiscal metadata
                if (activeItemIndex !== null) {
                    const newItems = [...items]
                    const item = newItems[activeItemIndex]
                    item.productId = newProduct.id
                    item.unitCostExcTax = parseFloat(newProduct.purchasePriceExcTax) || 0
                    item.taxId = newProduct.taxId || ''
                    item.taxType = newProduct.taxType || 'EXCLUSIVE'
                    
                    // Recalculate Inc Tax for this row
                    const selectedTax = taxes.find(t => t.id === item.taxId)
                    const rate = selectedTax ? selectedTax.rate : 0
                    item.unitCostIncTax = item.unitCostExcTax * (1 + rate / 100)
                    item.unitCost = item.unitCostExcTax
                    
                    setItems(newItems)
                }
                
                setIsProductModalOpen(false)
                setActiveItemIndex(null)
            } else {
                toast.error('Registration Protocol Failure', { id: loadingToast })
            }
        } catch (error) {
            toast.error('System Synchronization Error', { id: loadingToast })
        }
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 border-b border-gray-100 pb-12">
                    <div className="space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest leading-none">Procurement Protocol: Assets</span>
                        </div>
                        <h2 className="text-8xl font-black text-slate-950 tracking-tighter leading-[0.85] italic uppercase">
                            Stock <br className="lg:hidden" /> <span className="text-blue-600 NOT-italic font-black">Procurement</span>
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-xl shadow-gray-100/30 flex items-center gap-6">
                            <div className="px-8 py-2 border-r border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Metric</p>
                                <p className="text-3xl font-black text-slate-900 italic tracking-tighter">₹{(purchases || []).reduce((s, p) => s + (p?.totalAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                            </div>
                            <div className="px-8 py-2 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Batches</p>
                                <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{purchases.length.toString().padStart(2, '0')}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-950 text-white px-10 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-900/10 active:scale-95 flex items-center gap-4 group border border-blue-500/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <ShoppingCart className="w-6 h-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative z-10" />
                            <span className="relative z-10">Initialize Stock-In</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/40 mb-12 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 relative group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH PROCUREMENT HISTORY (VENDOR, REF-SIGNATURE)..."
                            className="w-full bg-slate-50 border-none rounded-[1.5rem] py-5 pl-14 pr-6 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 border-l border-gray-100 pl-6 h-12">
                        <button 
                            onClick={exportToCSV}
                            className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-blue-100"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={exportToPDF}
                            className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100"
                        >
                            <FileText className="w-5 h-5" />
                        </button>
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
                                                    <p className="font-black text-slate-900 text-lg tracking-tight uppercase italic">{mounted ? new Date(purchase.createdAt).toLocaleDateString() : '...'}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {purchase.id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-black text-slate-900 italic uppercase">
                                                    <Truck className="w-3 h-3 text-blue-600" />
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
                                                            pStatus === 'PAID' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
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
                                                <div className="flex items-center gap-2 font-black text-gray-950 tracking-tighter text-xl italic group-hover:text-blue-600 transition-colors">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    ₹{purchase.totalAmount.toFixed(0)}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span>PAID: ₹{(purchase as any).amountPaid?.toFixed(0) || '0'}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span className={((purchase as any).totalAmount - ((purchase as any).amountPaid || 0)) > 0 ? "text-rose-600" : "text-blue-600"}>
                                                        DUE: ₹{((purchase as any).totalAmount - ((purchase as any).amountPaid || 0)).toFixed(0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-3">
                                                <Link 
                                                    href={`/dashboard/purchases/${purchase.id}`}
                                                    className="p-4 bg-white hover:bg-slate-950 text-slate-400 hover:text-white rounded-xl border border-slate-100 hover:border-slate-950 transition-all group/view shadow-sm active:scale-95"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4 group-hover/view:scale-110 transition-transform" />
                                                </Link>
                                                {purchase.status === 'ORDERED' && (
                                                    <button 
                                                        onClick={() => handleReceive(purchase.id)}
                                                        className="p-4 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-slate-900 transition-all border border-blue-500"
                                                        title="Receive Stock"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(purchase.totalAmount - (purchase.amountPaid || 0)) > 0 && (
                                                    <button 
                                                        onClick={() => openPaymentModal(purchase)}
                                                        className="p-4 bg-white hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl border border-slate-100 hover:border-blue-500 shadow-sm transition-all"
                                                        title="Settle Liability"
                                                    >
                                                        <IndianRupee className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => openReturnModal(purchase)}
                                                    className="p-4 bg-white hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl border border-slate-100 hover:border-rose-500 shadow-sm transition-all"
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
                                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
                                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-4xl font-black text-slate-950 tracking-tighter italic uppercase">
                                    Initialize <br className="md:hidden" /> <span className="text-blue-600 NOT-italic font-black">Batch Procurement</span>
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
                                            className={`flex-1 py-7 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${purchaseStatus === 'RECEIVED' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}
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
                                                type="number" step="0.01" min="0" max={calculateTotal()}
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
                                        <div key={index} className="grid grid-cols-12 gap-5 items-end bg-white/60 p-6 rounded-[2.5rem] border border-gray-100 group hover:border-emerald-200 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                                            <div className="col-span-4">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Entity Selection</label>
                                                <div className="flex items-center gap-3">
                                                    <select
                                                        required
                                                        value={item.productId}
                                                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                                        className="flex-1 bg-white border-none rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                                                    >
                                                        <option value="">Choose Asset...</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                                                    </select>
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveItemIndex(index)
                                                            setIsProductModalOpen(true)
                                                        }}
                                                        className="p-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all border border-emerald-100 italic font-black text-[10px] uppercase tracking-tighter"
                                                        title="Create New Asset"
                                                    >
                                                        New?
                                                    </button>
                                                </div>

                                                {/* Line Item Fiscal Hub */}
                                                <div className="mt-6 grid grid-cols-2 gap-4 bg-white/40 p-3 rounded-2xl border border-white/60 shadow-inner">
                                                    <div className="space-y-1">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax Strategy</label>
                                                        <select
                                                            value={item.taxId}
                                                            onChange={(e) => updateItem(index, 'taxId', e.target.value)}
                                                            className="w-full bg-white border-none rounded-lg p-2 text-[9px] font-black focus:ring-2 focus:ring-blue-500/10 outline-none"
                                                        >
                                                            <option value="">No Tax</option>
                                                            {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol</label>
                                                        <select
                                                            value={item.taxType}
                                                            onChange={(e) => updateItem(index, 'taxType', e.target.value)}
                                                            className="w-full bg-white border-none rounded-lg p-2 text-[9px] font-black focus:ring-2 focus:ring-blue-500/10 outline-none"
                                                        >
                                                            <option value="EXCLUSIVE">Exc (+)</option>
                                                            <option value="INCLUSIVE">Inc (-)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-2 space-y-2">
                                                <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 italic">Buy Price (Net)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-rose-300 italic">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.unitCostIncTax}
                                                        onChange={(e) => updateItem(index, 'unitCostIncTax', e.target.value)}
                                                        className="w-full pl-7 pr-4 py-5 bg-rose-50/30 border border-rose-100 rounded-2xl font-black text-sm text-rose-700 italic focus:ring-2 focus:ring-rose-500/10 outline-none shadow-sm"
                                                    />
                                                </div>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest px-2 group-hover:text-rose-400 transition-colors">Base Cost: ₹{item.unitCostExcTax.toFixed(2)}</p>
                                            </div>

                                            <div className="col-span-2 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest ml-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 italic">Sell Price (Mkt)</label>
                                                    <div className="flex items-center gap-1 group/sync relative">
                                                        <input 
                                                            type="checkbox"
                                                            checked={item.syncPrice}
                                                            onChange={(e) => updateItem(index, 'syncPrice', e.target.checked)}
                                                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer transition-transform active:scale-125"
                                                        />
                                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Auto-Sync</span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-blue-300 italic">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.newPrice}
                                                        onChange={(e) => updateItem(index, 'newPrice', parseFloat(e.target.value))}
                                                        className={`w-full pl-7 pr-4 py-5 bg-white border border-slate-100 rounded-2xl font-black text-sm italic focus:ring-2 focus:ring-blue-500/10 outline-none transition-all ${item.syncPrice ? 'text-blue-700 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10' : 'text-slate-900 shadow-sm'}`}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest px-2">Inventory Sync: {item.syncPrice ? 'ACTIVE' : 'OFF'}</p>
                                            </div>

                                            <div className="col-span-2 space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Volume (Qty)</label>
                                                <div className="relative">
                                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                    <input
                                                        type="number"
                                                        required
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-5 font-black text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none shadow-sm italic"
                                                        placeholder="1"
                                                    />
                                                </div>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest px-2 italic text-center">Batch Intake Unit</p>
                                            </div>

                                            <div className="col-span-1 flex justify-center pb-4">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-4 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 shadow-sm animate-in fade-in"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="w-full border-2 border-dashed border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 py-8 rounded-[2.5rem] flex items-center justify-center gap-4 text-slate-400 hover:text-blue-600 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
                                    >
                                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-90">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.4em]">Append Entity to Batch</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Fixed Footer */}
                            <div className="p-10 bg-slate-50/80 backdrop-blur-md border-t border-gray-100 flex items-center justify-between shrink-0">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Calculated Disbursement Metrics</p>
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col items-end">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">Cumulative Ledger Value</p>
                                            <div className="text-7xl font-black text-slate-950 italic tracking-tighter flex items-center gap-6">
                                                <span className="text-blue-600 NOT-italic font-black">₹</span>
                                                {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                            </div>
                                        </div>
                                        <div className="w-px h-16 bg-slate-200" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">LIABILITY DUE</span>
                                            <p className="text-5xl font-black text-rose-600 italic tracking-tighter">
                                                ₹{(calculateTotal() - (amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 0 })}
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
                                        className="bg-slate-950 text-white px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-900/10 active:scale-95 flex items-center gap-4 group border border-blue-500/10 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <CheckCircle2 className="w-5 h-5 group-hover:scale-125 transition-all relative z-10" />
                                        <span className="relative z-10">{submitting ? 'Executing Batch...' : 'Finalize Stock-In'}</span>
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
                            <div className="flex items-center gap-5 mb-10">
                                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-xl shadow-blue-500/5">
                                    <IndianRupee className="w-7 h-7 text-blue-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-black text-slate-950 tracking-tighter italic uppercase">Liability <span className="text-blue-600 NOT-italic font-black">Settlement</span></h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic leading-none">Authorization Code: {selectedPurchase.referenceNumber || selectedPurchase.id.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disbursement Amount</label>
                                    <div className="relative">
                                        <input
                                            required type="number" step="0.01" min="0.01" max={selectedPurchase.totalAmount - (selectedPurchase.amountPaid || 0)}
                                            className="w-full p-8 bg-slate-50 border-none rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-4xl text-slate-950 tracking-tighter italic"
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(parseFloat(e.target.value))}
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</span>
                                            <span className="text-sm font-black text-blue-600 italic">₹{(selectedPurchase.totalAmount - (selectedPurchase.amountPaid || 0)).toFixed(0)}</span>
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

                                <div className="pt-10 flex gap-5">
                                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-6 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Abort</button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting} 
                                        className="flex-[2] py-8 bg-slate-950 hover:bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/10 transition-all active:scale-95 disabled:opacity-50 border border-blue-500/20"
                                    >
                                        Execute Settlement
                                    </button>
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

            {/* New Product Strategy Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsProductModalOpen(false)} />
                    <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col font-sans max-h-[95vh]">
                        <div className="px-12 py-8 border-b border-gray-100 flex justify-between items-center bg-emerald-50/30">
                            <div>
                                <h2 className="text-2xl font-black text-slate-950 tracking-tighter italic uppercase">
                                    Strategic <span className="text-emerald-600 NOT-italic font-black">Asset Construction</span>
                                </h2>
                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">Real-time procurement registry ingestion</p>
                            </div>
                            <button 
                                onClick={() => setIsProductModalOpen(false)} 
                                className="w-12 h-12 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm flex items-center justify-center group"
                            >
                                <X className="w-6 h-6 group-hover:rotate-90 transition-all duration-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <ProductForm 
                                isModal={true}
                                onSave={handleNewProductSave}
                                onCancel={() => setIsProductModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
