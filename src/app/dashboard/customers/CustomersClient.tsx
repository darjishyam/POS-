'use client'

import { useState, useEffect } from 'react'
import { 
    Users, 
    Plus, 
    Mail, 
    Phone, 
    Search, 
    UserPlus, 
    History, 
    MoreVertical,
    BarChart3,
    CheckCircle2,
    Calendar,
    X,
    UserCircle,
    ArrowUpRight,
    Star,
    Download,
    FileText
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Customer {
    id: string
    name: string
    email: string | null
    phone: string | null
    customerGroupId: string | null
    customerGroup?: {
        name: string
        discount: number
    }
    createdAt: string
    _count: {
        orders: number
    }
}

interface CustomerGroup {
    id: string
    name: string
    discount: number
}

export default function CustomersClient() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [groups, setGroups] = useState<CustomerGroup[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', customerGroupId: '' })

    useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        setIsLoading(true)
        try {
            const [cRes, gRes] = await Promise.all([
                fetch('/api/customers'),
                fetch('/api/customer-groups')
            ])
            const cData = await cRes.json()
            const gData = await gRes.json()
            setCustomers(Array.isArray(cData) ? cData : [])
            setGroups(Array.isArray(gData) ? gData : [])
        } catch (err) {
            toast.error('Sync failure with registries')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredCustomers = (customers || []).filter(c => 
        (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (c.phone || '').includes(search) || 
        (c.email || '').toLowerCase().includes(search.toLowerCase())
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const loadingToast = toast.loading(editingCustomer ? 'Updating Profile...' : 'Synchronizing Profile...')
        try {
            const res = await fetch('/api/customers', {
                method: editingCustomer ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCustomer ? { ...formData, id: editingCustomer.id } : formData)
            })
            if (res.ok) {
                toast.success(editingCustomer ? 'Profile Calibrated' : 'Entity Profile Registered', { id: loadingToast })
                closeModal()
                fetchCustomers()
            }
        } catch (err) {
            toast.error('Authorization Refused', { id: loadingToast })
        } finally {
            setSubmitting(false)
        }
    }

    const openModal = (customer: Customer | null = null) => {
        if (customer) {
            setEditingCustomer(customer)
            setFormData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                customerGroupId: customer.customerGroupId || ''
            })
        } else {
            setEditingCustomer(null)
            setFormData({ name: '', email: '', phone: '', customerGroupId: '' })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingCustomer(null)
        setFormData({ name: '', email: '', phone: '', customerGroupId: '' })
    }


    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Enrollment Date', 'Total Orders']
        const rows = filteredCustomers.map(c => [
            c.name,
            c.email || 'N/A',
            c.phone || 'N/A',
            new Date(c.createdAt).toLocaleDateString(),
            c._count.orders.toString()
        ])
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `BardPOS_Customers_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
        toast.success('CSV Registry Exported')
    }

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredCustomers.map(c => ({
            'Name': c.name,
            'Email': c.email || 'N/A',
            'Phone': c.phone || 'N/A',
            'Enrollment Date': new Date(c.createdAt).toLocaleDateString(),
            'Total Orders': c._count.orders
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers")
        XLSX.writeFile(workbook, `BardPOS_Customers_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Excel Registry Exported')
    }

    const exportToPDF = () => {
        const doc = new jsPDF() as any
        doc.setFontSize(20)
        doc.text('BardPOS Client Portfolio Registry', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
        
        const tableData = filteredCustomers.map(c => [
            c.name,
            c.email || 'N/A',
            c.phone || 'N/A',
            new Date(c.createdAt).toLocaleDateString(),
            c._count.orders.toString()
        ])

        autoTable(doc, {
            head: [['Name', 'Email Signature', 'Communications', 'Enrollment', 'Leads']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        })

        doc.save(`BardPOS_Customers_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('High-Fidelity PDF Dossier Exported')
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-emerald-100 min-h-screen bg-transparent">
            <Toaster position="bottom-right" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <Star className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Client Portfolio Analysis</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            Customer <span className="text-emerald-600 NOT-italic font-black">Registry</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-6 relative">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Accounts</p>
                            <p className="text-3xl font-black text-gray-950 italic tracking-tighter">
                                {customers.length.toString().padStart(3, '0')}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {/* CSV Export */}
                                <button 
                                    onClick={exportToCSV}
                                    title="Export CSV Registry"
                                    className="p-5 bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100 hover:border-emerald-200 shadow-sm group"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">CSV</span>
                                    <Download className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                                </button>

                                {/* Excel Export */}
                                <button 
                                    onClick={exportToExcel}
                                    title="Export Excel Registry"
                                    className="p-5 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm group"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">Excel</span>
                                    <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                                </button>

                                {/* PDF Export */}
                                <button 
                                    onClick={exportToPDF}
                                    title="Export High-Fidelity PDF"
                                    className="p-5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all border border-slate-100 hover:border-rose-200 shadow-sm group"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest mr-2 hidden md:inline">PDF</span>
                                    <FileText className="w-4 h-4 group-hover:translate-y-1 transition-all inline" />
                                </button>
                            </div>

                            <button
                                onClick={() => openModal()}
                                className="bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3 group border border-emerald-500/20"
                            >
                                <UserPlus className="w-5 h-5 group-hover:scale-110 group-hover:text-emerald-400 transition-all duration-500" />
                                Enroll Customer
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-sm mb-8 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <input
                            type="text"
                            placeholder="Search client matrix (Name, Phone, Email)..."
                            className="w-full bg-slate-100/50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-gray-100">
                        <button className="px-6 py-2.5 rounded-xl bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-900 border border-gray-100 italic">All Entities</button>
                        <button className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">V.I.P</button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 bg-white/50 animate-pulse rounded-[3rem] border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCustomers.map((c) => (
                            <div key={c.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <UserCircle className="w-24 h-24" />
                                </div>
                                
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all transform group-hover:rotate-6 border border-emerald-50">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Growth Stat</p>
                                        <div className="flex items-center gap-1 text-emerald-500 font-black">
                                            <ArrowUpRight className="w-3 h-3" />
                                            <span className="text-xs">+100%</span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter uppercase italic leading-none mb-4 truncate pr-10">{c.name}</h3>
                                
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                        <Phone className="w-3 h-3 text-emerald-600" />
                                        {c.phone || 'NO COMM-SIGNATURE'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                        <Mail className="w-3 h-3 text-emerald-600" />
                                        {c.email || 'NO DATA-RECORD'}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Purchase Frequency</p>
                                        <div className="flex items-center gap-2">
                                            <History className="w-3 h-3 text-slate-400" />
                                            <p className="text-xl font-black text-slate-900 leading-none">{c._count.orders} Leads</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openModal(c)}
                                            className="bg-slate-50 p-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all cursor-pointer border-none outline-none"
                                            title="Edit Profile"
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                        </button>
                                        {c.customerGroup && (
                                            <div className="absolute top-8 left-10 px-3 py-1 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg italic">
                                                {c.customerGroup.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 font-sans">
                        <div className="p-12">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                                    <UserPlus className="w-6 h-6 text-teal-600" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-950 tracking-tighter italic">
                                    Entity <span className="text-teal-600 NOT-italic font-black">{editingCustomer ? 'Calibration' : 'Registration'}</span>
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Identity Signature</label>
                                    <input
                                        required type="text"
                                        className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-800 uppercase tracking-widest"
                                        placeholder="CLIENT FULL NAME"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Link</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-800"
                                                placeholder="+X-XXXX-XXXX"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                            <Phone className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Email</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-800"
                                                placeholder="CLIENT@NETWORK.COM"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                            <Mail className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification Tier (Segment Group)</label>
                                    <select
                                        className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-slate-800 appearance-none"
                                        value={formData.customerGroupId}
                                        onChange={(e) => setFormData({ ...formData, customerGroupId: e.target.value })}
                                    >
                                        <option value="">Public Tier (No Group)</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name} ({g.discount}% Discount)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-6 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-slate-50 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-[2] py-6 bg-teal-600 hover:bg-teal-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-200 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'Transmitting Registry...' : editingCustomer ? 'Commit Calibration' : 'Finalize Profile'}
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
