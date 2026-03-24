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
    Users
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AgentsClient() {
    const [agents, setAgents] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)
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
        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success('Agent recruited successfully')
                setShowForm(false)
                setFormData({ name: '', email: '', phone: '', commissionRate: '5.0' })
                fetchAgents()
            } else {
                toast.error('Recruitment authorization failed')
            }
        } catch (error) {
            toast.error('Network protocol error')
        } finally {
            setIsSubmitting(false)
        }
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
                </div>
                
                <button 
                    onClick={() => setShowForm(!showForm)}
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
                        Agent Registration Protocol
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
                        <div className="lg:col-span-4 pt-4">
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full md:w-fit bg-blue-600 hover:bg-black text-white px-16 py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3 italic"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {isSubmitting ? 'Authorizing...' : 'Finalize Recruitment'}
                            </button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {agents.map((agent) => (
                        <div key={agent.id} className="group bg-white rounded-[3rem] p-10 border border-slate-100 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/10 transition-all rounded-full" />
                            
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                    <UserCircle className="w-8 h-8" />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Active Status</span>
                                </div>
                            </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none truncate">{agent.name}</h3>
                                        <div className="mt-4 flex flex-col gap-2">
                                            {agent.email && (
                                                <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none">
                                                    <Mail className="w-3 h-3 text-blue-400" />
                                                    {agent.email}
                                                </div>
                                            )}
                                            {agent.phone && (
                                                <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none">
                                                    <Phone className="w-3 h-3 text-blue-400" />
                                                    {agent.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none italic">Total Sales</p>
                                            <p className="text-xl font-black text-slate-900 italic tracking-tighter">${(agent.totalSalesValue || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none italic">Order Volume</p>
                                            <p className="text-xl font-black text-slate-900 italic tracking-tighter">{agent.totalOrders || 0}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">Accrued Commission</p>
                                            <p className="text-3xl font-black text-blue-600 italic tracking-tighter underline underline-offset-8 decoration-blue-200">${(agent.totalCommission || 0).toFixed(2)}</p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-blue-100 group-hover:text-blue-500 transition-colors duration-500" />
                                    </div>
                                </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
