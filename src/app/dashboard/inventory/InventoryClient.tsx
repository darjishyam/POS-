'use client'

import { useState, useEffect } from 'react'
import { 
    Package, 
    Plus, 
    Search, 
    Edit3, 
    Image as ImageIcon,
    LayoutGrid,
    AlertCircle,
    CheckCircle2,
    Download,
    FileText,
    Printer,
    X,
    ArrowUpRight
} from 'lucide-react'
import BarcodeLabel from '@/components/BarcodeLabel'
import { toast, Toaster } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/context/SettingsContext'
import * as htmlToImage from 'html-to-image'

export default function InventoryClient() {
    const router = useRouter()
    const { settings } = useSettings()
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [barcodeProduct, setBarcodeProduct] = useState<any | null>(null)
    const [mounted, setMounted] = useState(false)
    const [editingCell, setEditingCell] = useState<{ id: string, field: 'price' | 'stock' } | null>(null)
    const [editValue, setEditValue] = useState('')

    useEffect(() => {
        setMounted(true)
        const fetchData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    fetch('/api/products', { cache: 'no-store' }),
                    fetch('/api/categories', { cache: 'no-store' })
                ])
                const [prods, cats] = await Promise.all([prodRes.json(), catRes.json()])
                setProducts(Array.isArray(prods) ? prods : [])
                setCategories(Array.isArray(cats) ? cats : [])
            } catch (err) {
                // silently fail polling if network drops
            } finally {
                setLoading(false)
            }
        }
        
        // Initial Fetch
        fetchData()

        // Real-Time Web Polling (Magic Sync every 3 seconds)
        const intervalId = setInterval(fetchData, 3000)

        // Cleanup on unmount
        return () => clearInterval(intervalId)
    }, [])

    const filteredProducts = (products || []).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
        const matchesCat = selectedCategory === 'All' || p.category?.name === selectedCategory
        return matchesSearch && matchesCat
    })

    const handleDoubleClick = (id: string, field: 'price' | 'stock', value: number) => {
        setEditingCell({ id, field })
        setEditValue(value.toString())
    }

    const handleCellSave = async (id: string, field: 'price' | 'stock') => {
        if (!editingCell || editingCell.id !== id || editingCell.field !== field) return;
        
        const val = parseFloat(editValue);
        if (isNaN(val) || val < 0) {
            toast.error(`Invalid ${field}`);
            setEditingCell(null);
            return;
        }

        // Optimistic update
        setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
        setEditingCell(null);

        // API Call
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: val })
            });
            if (!res.ok) throw new Error();
            toast.success(`${field === 'price' ? 'Valuation' : 'Volume'} Matrix Calibrated`);
        } catch (error) {
            toast.error('Sync failed');
            // Data will self-correct on next magic sync poll
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, id: string, field: 'price' | 'stock') => {
        if (e.key === 'Enter') {
            handleCellSave(id, field);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    }


    const exportToCSV = () => {
        const headers = ['Name', 'SKU', 'Category', 'Price', 'Stock']
        const rows = filteredProducts.map(p => [
            p.name,
            p.sku || 'N/A',
            p.category?.name || 'Unclassified',
            p.price.toFixed(2),
            p.stock.toString()
        ])
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `BardPOS_Inventory_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
        toast.success('CSV Ledger Exported')
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredProducts.map(p => ({
            'Name': p.name,
            'SKU': p.sku || 'N/A',
            'Category': p.category?.name || 'Unclassified',
            [`Price (${settings.currencySymbol})`]: p.price,
            'Stock Count': p.stock
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory")
        XLSX.writeFile(workbook, `BardPOS_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Excel Ledger Exported')
    }

    const exportToJPG = async () => {
        const element = document.getElementById('inventory-table-container')
        if (!element) return

        try {
            toast.loading('Capturing Asset Matrix...', { id: 'jpgCapture' })
            const imageStr = await htmlToImage.toJpeg(element, { quality: 0.9, backgroundColor: '#ffffff', pixelRatio: 2 })
            const link = document.createElement('a')
            link.href = imageStr
            link.download = `BardPOS_Inventory_Matrix_${new Date().toISOString().split('T')[0]}.jpg`
            link.click()
            toast.success('Visual Ledger Exported', { id: 'jpgCapture' })
        } catch (error) {
            toast.error('Capture Failed', { id: 'jpgCapture' })
        }
    }

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        doc.setFontSize(20)
        doc.text('BardPOS Global Asset Ledger', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
        
        const tableData = filteredProducts.map(p => [
            p.name,
            p.sku || 'N/A',
            p.category?.name || 'Unclassified',
            `${settings.currencySymbol}${p.price.toFixed(2)}`,
            p.stock.toString()
        ])

        autoTable(doc, {
            head: [['Asset Name', 'SKU Code', 'Classification', 'Unit Price', 'Reserved Stock']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }
        })

        doc.save(`BardPOS_Inventory_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('High-Fidelity PDF Exported')
    }

    const printBarcode = () => {
        const printContent = document.getElementById('printable-barcode');
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        const barcodeHtml = printContent.innerHTML;

        // Create a temporary print window or just replace body
        document.body.innerHTML = `
            <html>
                <head>
                    <title>Print Barcode Label</title>
                    <style>
                        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                        @page { size: auto; margin: 0mm; }
                    </style>
                </head>
                <body>
                    ${barcodeHtml}
                </body>
            </html>
        `;

        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Refresh to restore React state
    }

    const downloadBarcodeJPG = async () => {
        const element = document.getElementById('printable-barcode')
        if (!element || !barcodeProduct) return

        try {
            toast.loading('Capturing Barcode Signature...', { id: 'barcodeJpg' })
            const imageStr = await htmlToImage.toJpeg(element, { quality: 1.0, backgroundColor: '#ffffff', pixelRatio: 4 })
            const link = document.createElement('a')
            link.href = imageStr
            link.download = `BardPOS_Barcode_${barcodeProduct.sku || barcodeProduct.id}.jpg`
            link.click()
            toast.success('Barcode Core Extracted', { id: 'barcodeJpg' })
        } catch (error) {
            console.error("Barcode capture failed:", error)
            toast.error('Capture Failed', { id: 'barcodeJpg' })
        }
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,1)]" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Asset Ledger</span>
                        </div>
                        <h2 className="text-7xl font-black text-slate-950 tracking-tighter italic leading-none">
                            Inventory <span className="text-blue-600 NOT-italic font-black">Matrix</span>
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[11px] italic">Strategic Material Resource Repository</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/inventory/create')}
                            className="bg-slate-950 text-white px-10 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center gap-3 group border border-blue-500/10"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 group-hover:text-blue-400 transition-all duration-500" />
                            Construct Asset
                        </button>
                    </div>
                </div>

                {/* Strategic Asset Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center justify-between group">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total SKUs</p>
                            <p className="text-5xl font-black text-slate-950 italic tracking-tighter">{products.length.toString().padStart(3, '0')}</p>
                        </div>
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/20 group-hover:rotate-6 transition-all">
                            <Package className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center justify-between group">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Asset Valuation</p>
                            <p className="text-4xl font-black text-slate-950 italic tracking-tighter">
                                {settings.currencySymbol}{products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/20 group-hover:rotate-6 transition-all">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center justify-between group">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Critical Nodes</p>
                            <p className="text-5xl font-black text-rose-600 italic tracking-tighter">{products.filter(p => p.stock < 10).length.toString().padStart(2, '0')}</p>
                        </div>
                        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-500/20 group-hover:rotate-6 transition-all">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filters & Protocols */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-white shadow-xl flex gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
                        {['All', ...categories.map(c => c.name)].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-8 py-3 rounded-[1.5rem] text-[9px] font-black tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                                    selectedCategory === cat 
                                    ? "bg-slate-950 text-white shadow-lg shadow-slate-200 scale-105" 
                                    : "text-slate-400 hover:text-slate-900 hover:bg-white"
                                }`}
                            >
                                {cat.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white shadow-lg flex gap-1">
                            <button onClick={exportToCSV} className="p-4 hover:bg-blue-600 hover:text-white text-slate-400 rounded-xl transition-all"><Download className="w-4 h-4" /></button>
                            <button onClick={exportToExcel} className="p-4 hover:bg-sky-600 hover:text-white text-slate-400 rounded-xl transition-all"><FileText className="w-4 h-4" /></button>
                            <button onClick={exportToPDF} className="p-4 hover:bg-rose-600 hover:text-white text-slate-400 rounded-xl transition-all"><Printer className="w-4 h-4" /></button>
                            <button onClick={exportToJPG} className="p-4 hover:bg-emerald-600 hover:text-white text-slate-400 rounded-xl transition-all"><ImageIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search inventory matrix (Name or SKU)..."
                        className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] py-6 pl-14 pr-8 font-black text-slate-900 italic tracking-widest text-xs placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-xl shadow-slate-100"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" />
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-white/50 animate-pulse rounded-3xl border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <div id="inventory-table-container" className="bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400 italic">
                                    <th className="px-8 py-10">Material Intelligence</th>
                                    <th className="px-8 py-10">Classification</th>
                                    <th className="px-8 py-10">Unit Valuation</th>
                                    <th className="px-8 py-10">Current Vol</th>
                                    <th className="px-8 py-10 text-right pr-12">Administration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-40 text-center bg-white">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                                                <Package className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-[0.4em] italic mb-2">Asset Portfolio Null</p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matching digital signatures found in the global repository.</p>
                                        </td>
                                    </tr>
                                ) : (filteredProducts || []).map(prod => (
                                    <tr key={prod.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-white">
                                                    {prod.image ? (
                                                        <img src={prod.image} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <ImageIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-slate-900 tracking-tight leading-tight">{prod.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                        {prod.sku ? `SKU: ${prod.sku}` : `ID: ${prod.id.slice(-8).toUpperCase()}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                {prod.category?.name || 'Unclassified'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            {editingCell?.id === prod.id && editingCell?.field === 'price' ? (
                                                <div className="relative w-32">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{settings.currencySymbol}</span>
                                                    <input
                                                        autoFocus
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleCellSave(prod.id, 'price')}
                                                        onKeyDown={(e) => handleKeyDown(e, prod.id, 'price')}
                                                        className="w-full pl-8 pr-4 py-2 bg-white border-2 border-blue-500 rounded-xl focus:outline-none font-black text-slate-900 italic tracking-tighter shadow-lg shadow-blue-500/20"
                                                    />
                                                </div>
                                            ) : (
                                                <span 
                                                    onDoubleClick={() => handleDoubleClick(prod.id, 'price', prod.price)}
                                                    className="text-2xl font-black text-slate-950 italic tracking-tighter cursor-pointer hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-200"
                                                    title="Double-click to edit price"
                                                >
                                                    {settings.currencySymbol}{prod.price.toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            {editingCell?.id === prod.id && editingCell?.field === 'stock' ? (
                                                <div className="w-24">
                                                    <input
                                                        autoFocus
                                                        type="number"
                                                        step="1"
                                                        min="0"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={() => handleCellSave(prod.id, 'stock')}
                                                        onKeyDown={(e) => handleKeyDown(e, prod.id, 'stock')}
                                                        className="w-full px-4 py-2 bg-white border-2 border-blue-500 rounded-xl focus:outline-none font-black text-slate-900 italic tracking-tighter shadow-lg shadow-blue-500/20"
                                                    />
                                                </div>
                                            ) : (
                                                <div 
                                                    onDoubleClick={() => handleDoubleClick(prod.id, 'stock', prod.stock)}
                                                    className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-2 -ml-2 rounded-xl transition-all w-fit"
                                                    title="Double-click to edit stock"
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${prod.stock < 10 ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(225,29,72,1)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,1)]'}`} />
                                                    <span className="text-xl font-black text-slate-900 italic tracking-tighter group-hover:text-blue-600 transition-colors">{prod.stock.toString().padStart(2, '0')} <span className="text-[10px] text-slate-400 NOT-italic uppercase tracking-widest ml-1">Units</span></span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setBarcodeProduct(prod)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm group"
                                                    title="Generate Barcode Label"
                                                >
                                                    <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/dashboard/inventory/edit/${prod.id}`)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                                                    title="Edit Product"
                                                >
                                                    <Edit3 className="w-5 h-5" />
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

            {/* Barcode Preview Modal */}
            {barcodeProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-xl overflow-hidden shadow-2xl border border-white flex flex-col animate-in zoom-in-95 duration-500">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter italic">Barcode <span className="text-blue-600 NOT-italic">Protocol</span></h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">Label Generation Terminal v1.0</p>
                            </div>
                            <button 
                                onClick={() => setBarcodeProduct(null)}
                                className="w-12 h-12 bg-white border border-slate-100 text-slate-400 hover:text-slate-950 rounded-2xl transition-all shadow-sm flex items-center justify-center group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-all duration-500" />
                            </button>
                        </div>

                        <div className="p-16 flex flex-col items-center justify-center space-y-12 bg-white">
                            <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner group transition-all" id="printable-barcode">
                                <div className="group-hover:scale-105 transition-all duration-700">
                                    <BarcodeLabel 
                                        value={barcodeProduct.sku || barcodeProduct.id} 
                                        name={barcodeProduct.name}
                                        price={barcodeProduct.price.toFixed(2)}
                                        currencySymbol={settings.currencySymbol}
                                    />
                                </div>
                            </div>
                            
                            <div className="w-full space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button 
                                        onClick={printBarcode}
                                        className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-95"
                                    >
                                        <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Print Protocol
                                    </button>
                                    <button 
                                        onClick={downloadBarcodeJPG}
                                        className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 group active:scale-95 border border-blue-400/30"
                                    >
                                        <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                                        Download JPG
                                    </button>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hardware Sync: <span className="text-blue-600">Active</span></p>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest text-center">
                                        Optimized for standard 50x25mm thermal adhesive labels
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
