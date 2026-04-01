'use client'

import { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { 
    Truck, 
    Plus, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Package, 
    Search,
    Edit3,
    Trash2,
    Settings2,
    Download,
    FileText
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useSettings } from '@/context/SettingsContext'

interface Supplier {
    id: string
    name: string
    contactPerson: string | null
    email: string | null
    phone: string | null
    address: string | null
    _count: {
        purchases: number
    }
    totalPurchaseVolume: number
}

export default function SuppliersClient() {
    const { settings } = useSettings()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: ''
    })

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const fetchSuppliers = async () => {
        try {
            const res = await fetch('/api/suppliers')
            const data = await res.json()
            setSuppliers(Array.isArray(data) ? data : [])
            setLoading(false)
        } catch (error) {
            toast.error('Failed to load suppliers')
            setLoading(false)
        }
    }

    const filteredSuppliers = (suppliers || []).filter(s => 
        (s?.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (s?.contactPerson || '').toLowerCase().includes(search.toLowerCase())
    )

    const openModal = (supplier: Supplier | null = null) => {
        if (supplier) {
            setEditingSupplier(supplier)
            setFormData({
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || ''
            })
        } else {
            setEditingSupplier(null)
            setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const url = editingSupplier ? `/api/suppliers` : '/api/suppliers'
            const method = editingSupplier ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingSupplier ? { ...formData, id: editingSupplier.id } : formData)
            })
            if (res.ok) {
                toast.success(editingSupplier ? 'Entity calibrated' : 'Entity registered')
                setIsModalOpen(false)
                fetchSuppliers()
            }
        } catch (error) {
            toast.error('Transmission failure')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Abort this entity? This operation is IRREVERSIBLE.')) return
        try {
            const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Registry purged')
                fetchSuppliers()
            }
        } catch (error) {
            toast.error('Purge failed')
        }
    }
    const exportToCSV = () => {
        const headers = ['Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Total Purchases']
        const rows = filteredSuppliers.map(s => [
            s.name,
            s.contactPerson || 'N/A',
            s.email || 'N/A',
            s.phone || 'N/A',
            `"${(s.address || '').replace(/"/g, '""')}"`,
            s.totalPurchaseVolume.toFixed(2)
        ])
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `BardPOS_Vendors_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
        toast.success('CSV Registry Exported')
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredSuppliers.map(s => ({
            'Name': s.name,
            'Contact Person': s.contactPerson || 'N/A',
            'Email': s.email || 'N/A',
            'Phone': s.phone || 'N/A',
            'Address': s.address || 'N/A',
            [`Total Purchases (${settings.currencySymbol})`]: s.totalPurchaseVolume
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors")
        XLSX.writeFile(workbook, `BardPOS_Vendors_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Excel Registry Exported')
    }

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        doc.setFontSize(20)
        doc.text('BardPOS Vendor Portfolio Registry', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
        
        const tableData = filteredSuppliers.map(s => [
            s.name,
            s.contactPerson || 'N/A',
            s.email || 'N/A',
            s.phone || 'N/A',
            `${settings.currencySymbol}${s.totalPurchaseVolume.toFixed(2)}`
        ])

        autoTable(doc, {
            head: [['Vendor Entity', 'Contact Agent', 'Email', 'Communications', 'Volume']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        })

        doc.save(`BardPOS_Vendors_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('High-Fidelity PDF Details Exported')
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 border-b border-gray-100 pb-12">
                    <div className="space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest leading-none">External Nodes: Supply Chain</span>
                        </div>
                        <h2 className="text-8xl font-black text-slate-950 tracking-tighter leading-[0.85] italic uppercase">
                            Vendor <br className="lg:hidden" /> <span className="text-blue-600 NOT-italic font-black">Portfolio</span>
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-xl shadow-gray-100/30 flex items-center gap-6 px-8">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Nodes</p>
                                <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{suppliers.length.toString().padStart(2, '0')}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="bg-slate-950 text-white px-10 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-900/10 active:scale-95 flex items-center gap-4 group border border-blue-500/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Truck className="w-6 h-6 group-hover:translate-x-1 group-hover:text-sky-400 transition-all duration-500 relative z-10" />
                            <span className="relative z-10">Initialize Vendor</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/40 mb-12 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 relative group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH VENDOR INTELLIGENCE (NAME, AGENT-ID)..."
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
                                    <th className="px-8 py-6">Vendor Entity</th>
                                    <th className="px-8 py-6">Comm Protocol</th>
                                    <th className="px-8 py-6">Procurement Status</th>
                                    <th className="px-8 py-6 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSuppliers.map(s => (
                                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center border border-white shadow-inner">
                                                    <Truck className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black text-slate-900 tracking-tight leading-tight italic uppercase">{s.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.contactPerson || 'Unknown Agent'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Mail className="w-3 h-3 text-blue-600" />
                                                    {s.email || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    <Phone className="w-3 h-3 text-sky-500" />
                                                    {s.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-blue-100 w-fit">
                                                    <Package className="w-3 h-3" />
                                                    {s._count.purchases} Orders
                                                </div>
                                                <p className="text-2xl font-black text-slate-950 tracking-tighter italic ml-1">
                                                    {settings.currencySymbol}{(s.totalPurchaseVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => openModal(s)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-5 h-5" />
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
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto font-sans">
                        <div className="p-12">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <Settings2 className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic">
                                    {editingSupplier ? 'Calibrate' : 'Register'} <span className="text-emerald-600 NOT-italic font-black">Entity</span>
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entity Name</label>
                                    <input
                                        required type="text"
                                        placeholder="e.g. Global Logistics Inc."
                                        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Agent</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="John Carter"
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        />
                                        <User className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comm Channel (Phone)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="+1 800-..."
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                        <Phone className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Digital Identity (Email)</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder="contact@entity.registry"
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        <Mail className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Physical HQ Address</label>
                                    <div className="relative">
                                        <textarea
                                            placeholder="Headquarters location..."
                                            className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-800 h-32 resize-none"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                        <MapPin className="w-4 h-4 absolute right-5 top-6 text-slate-300" />
                                    </div>
                                </div>

                                <div className="col-span-2 pt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] py-8 bg-slate-950 hover:bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/10 transition-all active:scale-95 disabled:opacity-50 border border-blue-500/10 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <span className="relative z-10">{submitting ? 'Transmitting...' : editingSupplier ? 'Commit Calibration' : 'Finalize Registration'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
