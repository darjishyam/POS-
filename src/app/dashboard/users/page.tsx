'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Header from '@/components/Header'
import { 
    Search, Plus, MoreVertical, Edit2, Eye, Trash2, 
    FileText, Download, Printer, Filter, ChevronRight, User
} from 'lucide-react'

export default function UserManagementPage() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUsers(data)
                }
                setLoading(false)
            })
            .catch(err => {
                console.error('Fetch Users Error:', err)
                setLoading(false)
            })
    }, [])

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const ActionButton = ({ icon: Icon, label, color, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`p-2 rounded-lg border border-transparent transition-all hover:border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 group ${color}`}
            title={label}
        >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden group-hover:inline-block transition-all">{label}</span>
        </button>
    )

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#f8fafc] font-sans">
            <Header />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Top Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                            User <span className="text-blue-600 NOT-italic font-black">Management</span>
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Access Control & Identity Matrix</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Export Buttons */}
                        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                            <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all rounded-lg" title="Export CSV"><Download className="w-4 h-4" /></button>
                            <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all rounded-lg" title="Export PDF"><FileText className="w-4 h-4" /></button>
                            <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all rounded-lg" title="Print"><Printer className="w-4 h-4" /></button>
                        </div>
                        
                        <button className="bg-blue-600 hover:bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-200 flex items-center gap-3 active:scale-95">
                            <Plus className="w-4 h-4" />
                            Add System User
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY NAME OR EMAIL..."
                            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-[10px] font-bold tracking-widest focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 border-r border-gray-200">
                            Showing {filteredUsers.length} of {users.length} Records
                        </span>
                        <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-lg border border-gray-100 italic cursor-pointer hover:bg-gray-100 transition-all">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest pr-2">Filter</span>
                            <Filter className="w-3 h-3 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-100">
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">User Profile</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Role</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Email Integrity</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Account Created</th>
                                    <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic text-right">Strategic Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={5} className="p-8">
                                                <div className="flex items-center gap-4 animate-pulse">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-48 bg-gray-100 rounded" />
                                                        <div className="h-3 w-32 bg-gray-50 rounded" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-200">
                                                    <User className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Zero Identities Found In Matrix</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                                    {u.name ? <span className="text-sm font-black italic">{u.name[0].toUpperCase()}</span> : <User className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">{u.name || 'Anonymous User'}</div>
                                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px]">{u.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                                u.role === 'admin' 
                                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' 
                                                : 'bg-slate-100 border-gray-200 text-slate-500'
                                            }`}>
                                                <span className={`w-1 h-1 rounded-full ${u.role === 'admin' ? 'bg-blue-600' : 'bg-slate-400'}`} />
                                                {u.role}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-[10px] font-bold text-slate-600 font-mono tracking-tighter">{u.email}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(u.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <ActionButton icon={Eye} label="View" color="text-slate-400 hover:text-blue-600" />
                                                <ActionButton icon={Edit2} label="Edit" color="text-slate-400 hover:text-emerald-600" />
                                                <ActionButton icon={Trash2} label="Delete" color="text-slate-400 hover:text-red-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Placeholder */}
                    <div className="p-6 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Matrix Page 01 Control Block</p>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-all cursor-not-allowed">Previous</button>
                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-900 uppercase tracking-widest hover:text-blue-600 transition-all">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
