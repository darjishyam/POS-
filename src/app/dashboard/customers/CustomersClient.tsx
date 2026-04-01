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
    FileText,
    Smartphone,
    Eye
} from 'lucide-react'
import Link from 'next/link'
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
        toast.success('High-Fidelity PDF Details Exported')
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen bg-transparent border-none">
            
            <div className="relative z-10 w-full space-y-12">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,1)]" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Client Portfolio Analysis</span>
                        </div>
                        <h2 className="text-7xl font-black text-slate-950 tracking-tighter italic leading-none">
                            Customer <span className="text-blue-600 NOT-italic font-black">Registry</span>
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[11px] italic">Strategic Entity Resource Management</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => openModal()}
                            className="bg-slate-950 text-white px-10 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center gap-3 group border border-blue-500/10"
                        >
                            <UserPlus className="w-5 h-5 group-hover:scale-110 group-hover:text-blue-400 transition-all duration-500" />
                            Enroll Entry
                        </button>
                    </div>
                </div>

                {/* Strategic Detail Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center justify-between group">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total Entities</p>
                            <p className="text-5xl font-black text-slate-950 italic tracking-tighter">{customers.length.toString().padStart(3, '0')}</p>
                        </div>
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/20 group-hover:rotate-6 transition-all">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center justify-between group">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Active Segments</p>
                            <p className="text-5xl font-black text-slate-950 italic tracking-tighter">{groups.length.toString().padStart(2, '0')}</p>
                        </div>
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-500/20 group-hover:rotate-6 transition-all">
                            <Star className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
                        <div className="flex gap-3">
                            <button onClick={exportToCSV} className="p-4 bg-slate-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all text-slate-400"><Download className="w-4 h-4" /></button>
                            <button onClick={exportToExcel} className="p-4 bg-slate-50 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all text-slate-400"><FileText className="w-4 h-4" /></button>
                            <button onClick={exportToPDF} className="p-4 bg-slate-50 rounded-2xl hover:bg-rose-600 hover:text-white transition-all text-slate-400"><FileText className="w-4 h-4" /></button>
                        </div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Export Protocol</p>
                    </div>
                </div>

                {/* Search & Filter Matrix */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full relative group">
                        <input
                            type="text"
                            placeholder="Search client matrix (Name, Phone, Email)..."
                            className="w-full bg-white/60 backdrop-blur-xl border-2 border-slate-100 focus:border-slate-950 rounded-[2rem] py-6 pl-14 pr-8 font-black text-[12px] text-slate-900 outline-none transition-all shadow-xl shadow-slate-100 placeholder:text-slate-300 uppercase tracking-widest italic"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors" />
                    </div>

                    <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-white shadow-xl flex gap-1">
                        <button className="px-8 py-3 rounded-[1.5rem] text-[9px] font-black bg-slate-950 text-white shadow-lg tracking-[0.2em] italic">ALL ENTITIES</button>
                        <button className="px-8 py-3 rounded-[1.5rem] text-[9px] font-black text-slate-400 hover:text-slate-900 transition-all tracking-[0.2em] italic">HIGH-VALUE</button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[3.5rem] border border-gray-100" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredCustomers.map((c) => (
                            <div key={c.id} className="bg-white/80 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white shadow-2xl shadow-slate-200/50 hover:scale-[1.02] transition-all group relative overflow-hidden active:scale-95">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    <UserCircle className="w-32 h-32" />
                                </div>
                                
                                <div className="flex items-start justify-between mb-10">
                                    <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-blue-400 shadow-2xl group-hover:rotate-6 transition-all duration-700">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <div className="bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest italic">ID: #{c.id.slice(-4).toUpperCase()}</span>
                                    </div>
                                </div>

                                <h3 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none mb-6 truncate pr-12">{c.name}</h3>
                                
                                <div className="space-y-4 mb-10">
                                    <div className="group/sig flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/sig:bg-blue-600 group-hover/sig:text-white transition-all">
                                            <Smartphone className="w-3 h-3" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Comm-Sig</p>
                                            <p className="text-xs font-black text-slate-900 tracking-widest">{c.phone || 'NO SECURE LINK'}</p>
                                        </div>
                                    </div>
                                    <div className="group/sig flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/sig:bg-blue-600 group-hover/sig:text-white transition-all">
                                            <Mail className="w-3 h-3" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Digital Address</p>
                                            <p className="text-xs font-black text-slate-900 tracking-widest lowercase">{c.email || 'NO DATA RECORD'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] italic leading-none ml-1">Portfolio Engagement</p>
                                        <div className="flex items-center gap-2">
                                            <History className="w-4 h-4 text-blue-600" />
                                            <p className="text-2xl font-black text-slate-950 italic tracking-tighter leading-none">{c._count.orders} <span className="text-blue-600 NOT-italic">Leads</span></p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => openModal(c)}
                                        className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
                                        title="Calibrate Identity"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                {c.customerGroup && (
                                    <div className="absolute top-8 right-32 px-4 py-1.5 bg-slate-950 text-emerald-400 text-[8px] font-black uppercase tracking-[0.3em] rounded-full border border-emerald-500/30 shadow-2xl flex items-center gap-2 italic">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        {c.customerGroup.name}
                                    </div>
                                )}
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
