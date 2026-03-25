'use client'

import { useState, useEffect } from 'react'
import { 
    UserCircle, 
    Zap, 
    ShieldCheck, 
    Mail, 
    Phone, 
    TrendingUp, 
    Plus, 
    Loader2, 
    Trash2,
    Users,
    Edit3,
    FileDown,
    Download
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export default function AgentsClient() {
    const [agents, setAgents] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        commissionRate: '5.0'
    })

    useEffect(() => {
        fetchAgents()
    }, [])

    const fetchAgents = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/agents')
            const data = await res.json()
            setAgents(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error('Failed to sync agent matrix')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const loadingToast = toast.loading(editingId ? 'Recalibrating agent profile...' : 'Recruiting new agent...')
        try {
            const url = editingId ? `/api/agents/${editingId}` : '/api/agents'
            const method = editingId ? 'PUT' : 'POST'
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success(editingId ? 'Agent profile updated' : 'Agent recruited successfully', { id: loadingToast })
                setShowForm(false)
                setEditingId(null)
                setFormData({ name: '', email: '', phone: '', commissionRate: '5.0' })
                fetchAgents()
            } else {
                toast.error('Protocol authorization failed', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Network protocol error', { id: loadingToast })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to terminate the connection for agent ${name}? This action is irreversible.`)) return
        
        const loadingToast = toast.loading('Terminating agent connection...')
        try {
            const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Agent connection terminated', { id: loadingToast })
                fetchAgents()
            } else {
                toast.error('Termination failed', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Network protocol error', { id: loadingToast })
        }
    }

    const startEdit = (agent: any) => {
        setEditingId(agent.id)
        setFormData({
            name: agent.name,
            email: agent.email || '',
            phone: agent.phone || '',
            commissionRate: agent.commissionRate.toString()
        })
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Export Functions
    const exportPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(20)
        doc.text('Field Agent Matrix', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

        const tableData = agents.map(a => [
            a.name,
            a.email || 'N/A',
            a.phone || 'N/A',
            `${a.commissionRate}%`,
            `₹${(a.totalSalesValue || 0).toFixed(2)}`,
            `₹${(a.totalCommission || 0).toFixed(2)}`
        ])

        ;(doc as any).autoTable({
            head: [['Name', 'Email', 'Phone', 'Comm. Rate', 'Total Sales', 'Accrued Comm.']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
        })

        doc.save(`Agent_Matrix_${Date.now()}.pdf`)
    }

    const exportCSV = () => {
        const data = agents.map(a => ({
            Name: a.name,
            Email: a.email || 'N/A',
            Phone: a.phone || 'N/A',
            CommissionRate: `${a.commissionRate}%`,
            TotalSales: (a.totalSalesValue || 0).toFixed(2),
            AccruedCommission: (a.totalCommission || 0).toFixed(2)
        }))
        const csv = Papa.unparse(data)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.setAttribute('download', `Agent_Matrix_${Date.now()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const exportExcel = () => {
        const data = agents.map(a => ({
            Name: a.name,
            Email: a.email || 'N/A',
            Phone: a.phone || 'N/A',
            CommissionRate: `${a.commissionRate}%`,
            TotalSales: (a.totalSalesValue || 0).toFixed(2),
            AccruedCommission: (a.totalCommission || 0).toFixed(2)
        }))
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Agents")
        XLSX.writeFile(workbook, `Agent_Matrix_${Date.now()}.xlsx`)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            <Toaster position="bottom-right" />
            
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-slate-200 pb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.3em] text-[10px]">
                        <Users className="w-4 h-4" />
                        Independent Distributor Matrix
                    </div>
                    <h1 className="text-6xl font-black text-slate-950 tracking-tighter italic leading-none">
                        Sales <span className="text-blue-600 NOT-italic">Agents.</span>
                    </h1>
                    
                    {/* Export Console */}
                    {!isLoading && agents.length > 0 && (
                        <div className="flex items-center gap-2 mt-6">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
                                <FileDown className="w-3 h-3" />
                                Export Protocol
                            </span>
                            <button onClick={exportPDF} className="p-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100 group" title="Export PDF">
                                <Download className="w-4 h-4" />
                            </button>
                            <button onClick={exportCSV} className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-all border border-transparent hover:border-emerald-100" title="Export CSV">
                                <span className="text-[10px] font-black uppercase tracking-tighter">CSV</span>
                            </button>
                            <button onClick={exportExcel} className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-blue-100" title="Export Excel">
                                <span className="text-[10px] font-black uppercase tracking-tighter">XLSX</span>
                            </button>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={() => {
                        setShowForm(!showForm)
                        if (showForm) setEditingId(null)
                    }}
                    className="bg-slate-950 text-white px-10 py-6 rounded-3xl font-black uppercase text-xs tracking-widest transition-all hover:bg-blue-600 shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-3 italic"
                >
                    {showForm ? 'Cancel Operation' : 'Recruit New Agent'}
                    {showForm ? null : <Plus className="w-5 h-5" />}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-[3rem] p-12 border border-blue-100 shadow-2xl shadow-blue-900/5 animate-in slide-in-from-top-4 duration-500">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic mb-10 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-blue-600" />
                        {editingId ? 'Edit Agent Protocol' : 'Agent Registration Protocol'}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Identity (Name)</label>
                            <input 
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Communication Node (Email)</label>
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="Email Address"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Uplink (Phone)</label>
                            <input 
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="+1 (000) 000-0000"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commission Yield (%)</label>
                            <div className="relative">
                                <input 
                                    type="number"
                                    step="0.1"
                                    value={formData.commissionRate}
                                    onChange={e => setFormData({ ...formData, commissionRate: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="lg:col-span-4 pt-4 flex gap-4">
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full md:w-fit bg-blue-600 hover:bg-black text-white px-16 py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3 italic"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {isSubmitting ? 'Processing...' : (editingId ? 'Update Identity' : 'Finalize Recruitment')}
                            </button>
                            {editingId && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null)
                                        setShowForm(false)
                                        setFormData({ name: '', email: '', phone: '', commissionRate: '5.0' })
                                    }}
                                    className="px-8 py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all italic text-slate-400"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse border border-slate-100" />
                    ))}
                </div>
            ) : agents.length === 0 ? (
                <div className="bg-white p-24 rounded-[4rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center space-y-10 group transition-all hover:shadow-2xl">
                    <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-[3rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-700">
                        <UserCircle className="w-16 h-16" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Matrix Offline</h2>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] max-w-sm mx-auto leading-relaxed">
                            No active sales commission agents detected in the network. Initialize recruitment to scale distribution.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left italic">Agent Identity</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left italic">Contact Node</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center italic">Yield (%)</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right italic">Performance</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center italic">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {agents.map((agent) => (
                                <tr key={agent.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                <UserCircle className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-black text-slate-900 uppercase tracking-tight italic">{agent.name}</span>
                                                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">ID: {agent.id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col gap-1.5">
                                            {agent.email && (
                                                <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-wider leading-none">
                                                    <Mail className="w-3 h-3 text-blue-400" />
                                                    {agent.email}
                                                </div>
                                            )}
                                            {agent.phone && (
                                                <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-wider leading-none">
                                                    <Phone className="w-3 h-3 text-blue-400" />
                                                    {agent.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-slate-900 italic tracking-tighter bg-slate-100 px-3 py-1 rounded-lg">
                                                {agent.commissionRate}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-slate-900 tracking-tighter italic">₹{(agent.totalSalesValue || 0).toFixed(2)}</span>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Accrued: ${(agent.totalCommission || 0).toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center justify-center gap-3 transition-all duration-300">
                                            <button 
                                                onClick={() => startEdit(agent)}
                                                className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm border border-blue-100 transition-all active:scale-90"
                                                title="Edit Profile"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(agent.id, agent.name)}
                                                className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl shadow-sm border border-rose-100 transition-all active:scale-90"
                                                title="Terminate Connection"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
    )
}
