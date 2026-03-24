'use client'

import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { 
    Users, 
    ShieldCheck, 
    User, 
    ShieldAlert, 
    AtSign, 
    HardDrive,
    ArrowUpRight,
    Trash2
} from 'lucide-react'

export default function AdminUsersClient() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            const data = await res.json()
            if (res.ok) setUsers(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error('Failed to load personnel data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchUsers() }, [])

    const updateRole = async (userId: string, newRole: string) => {
        const tid = toast.loading(`Upgrading to ${newRole.toUpperCase()}...`)
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            })

            if (res.ok) {
                toast.success(`Role updated to ${newRole.toUpperCase()}`, { id: tid })
                fetchUsers()
            } else {
                toast.error('Update failed via uplink.', { id: tid })
            }
        } catch (error) {
            toast.error('Network synchronization error.', { id: tid })
        }
    }

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you certain you want to purge this identity from the system?')) return
        
        const tid = toast.loading('Purging Personnel Matrix...')
        try {
            const res = await fetch(`/api/users?userId=${userId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Identity purged successfully.', { id: tid })
                fetchUsers()
            } else {
                toast.error('Identity protection active. Purge failed.', { id: tid })
            }
        } catch (error) {
            toast.error('Network synchronization error.', { id: tid })
        }
    }

    return (
        <div className="p-8 md:p-12 font-sans selection:bg-emerald-100 min-h-screen">
            <Toaster position="top-center" />
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.2)]">
                            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Personnel Registry Control</span>
                        </div>
                        <h2 className="text-6xl font-black text-gray-950 tracking-tighter leading-none italic">
                            System <span className="text-emerald-600 NOT-italic font-black">Personnel</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="px-4 py-2 border-r border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active nodes</p>
                            <p className="text-xl font-black text-slate-900">{users.length}</p>
                        </div>
                        <div className="px-4 py-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Privileged</p>
                            <p className="text-xl font-black text-emerald-600">{(users || []).filter(u => u.role === 'admin').length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-gray-50 uppercase tracking-widest text-[10px] font-black text-slate-400">
                                <th className="px-8 py-6">Identity matrix</th>
                                <th className="px-8 py-6">Auth Link</th>
                                <th className="px-8 py-6">Internal Role</th>
                                <th className="px-8 py-6 text-right">Access Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Synchronizing with Clerk Database...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={user.imageUrl} className="w-14 h-14 rounded-2xl shadow-sm border border-white" />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                                    {user.role === 'admin' ? <ShieldCheck className="w-3 h-3 text-emerald-500" /> : <User className="w-3 h-3 text-emerald-500" />}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900 tracking-tight leading-tight italic uppercase">{user.firstName} {user.lastName || ''}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">ID: {user.id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-mono text-xs font-bold text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <AtSign className="w-3 h-3 text-slate-300" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                                            user.role === 'admin' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                            {user.role === 'admin' ? 'COMMANDER' : 'CUSTOMER'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => updateRole(user.id, 'admin')} 
                                                className={`p-3 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                                    user.role === 'admin' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                }`}
                                            >
                                                <ShieldCheck className="w-3 h-3" />
                                                Elevate to Admin
                                            </button>
                                            <button 
                                                onClick={() => updateRole(user.id, 'user')} 
                                                className={`p-3 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                                    user.role !== 'admin' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                                }`}
                                            >
                                                <User className="w-3 h-3" />
                                                Mark as Customer
                                            </button>
                                            <button 
                                                onClick={() => deleteUser(user.id)} 
                                                className="p-3 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-20 flex items-center justify-between py-10 border-t border-gray-100 opacity-30">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">BardPOS Fleet Management Protocol v4.5.1</p>
                    <div className="flex gap-4">
                        <HardDrive className="w-4 h-4 text-slate-400" />
                        <ShieldAlert className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </div>
        </div>
    )
}
