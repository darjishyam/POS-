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
    FileText
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useRouter } from 'next/navigation'

export default function InventoryClient() {
    const router = useRouter()
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    useEffect(() => {
        const fetchData = async () => {
            const [prodRes, catRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/categories')
            ])
            const [prods, cats] = await Promise.all([prodRes.json(), catRes.json()])
            setProducts(Array.isArray(prods) ? prods : [])
            setCategories(Array.isArray(cats) ? cats : [])
            setLoading(false)
        }
        fetchData()
    }, [])

    const filteredProducts = (products || []).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
        const matchesCat = selectedCategory === 'All' || p.category?.name === selectedCategory
        return matchesSearch && matchesCat
    })


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
            'Price ($)': p.price,
            'Stock Count': p.stock
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory")
        XLSX.writeFile(workbook, `BardPOS_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Excel Ledger Exported')
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
            `$${p.price.toFixed(2)}`,
            p.stock.toString()
        ])

        autoTable(doc, {
            head: [['Asset Name', 'SKU Code', 'Classification', 'Unit Price', 'Reserved Stock']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        })

        doc.save(`BardPOS_Inventory_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('High-Fidelity PDF Exported')
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-emerald-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Global Asset Ledger</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Inventory <span className="text-emerald-500 NOT-italic font-black">Matrix</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            {/* CSV Export */}
                            <button 
                                onClick={exportToCSV}
                                title="Export Global CSV"
                                className="p-5 bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100 hover:border-emerald-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">CSV</span>
                                <Download className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>

                            {/* Excel Export */}
                            <button 
                                onClick={exportToExcel}
                                title="Export Global Excel"
                                className="p-5 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">Excel</span>
                                <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>

                            {/* PDF Export */}
                            <button 
                                onClick={exportToPDF}
                                title="Export Global PDF"
                                className="p-5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all border border-slate-100 hover:border-rose-200 shadow-sm group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">PDF</span>
                                <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                            </button>
                        </div>

                        <button
                            onClick={() => router.push('/dashboard/inventory/create')}
                            className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 group border border-emerald-500/20"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 group-hover:text-emerald-400 transition-all duration-500" />
                            Initialize New SKU
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-sm mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <input
                            type="text"
                            placeholder="Search inventory matrix (Name or SKU)..."
                            className="w-full bg-slate-100/50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex gap-2">
                        {['All', ...categories.map(c => c.name)].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${selectedCategory === cat
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-105'
                                        : 'bg-white text-slate-500 hover:bg-emerald-50 border border-slate-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-white/50 animate-pulse rounded-3xl border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-gray-50 uppercase tracking-widest text-[10px] font-black text-slate-400">
                                    <th className="px-8 py-6">Product Intelligence</th>
                                    <th className="px-8 py-6">Category</th>
                                    <th className="px-8 py-6">Unit Price</th>
                                    <th className="px-8 py-6">Reserved Stock</th>
                                    <th className="px-8 py-6 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts.map(prod => (
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
                                            <span className="text-xl font-black text-gray-900 italic tracking-tighter">${prod.price.toFixed(2)}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${prod.stock < 10 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                <span className="text-lg font-black text-slate-700 whitespace-nowrap">{prod.stock} Units</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => router.push(`/dashboard/inventory/edit/${prod.id}`)}
                                                className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
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
