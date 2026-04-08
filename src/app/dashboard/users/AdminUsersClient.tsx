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
    Trash2,
    UserPlus,
    Mail,
    UserCircle,
    Key,
    Plus,
    X,
    Loader2,
    ExternalLink,
    ArrowRight
} from 'lucide-react'

export default function AdminUsersClient() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', personnelRole: 'CASHIER' })

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

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const tid = toast.loading('Synchronizing Personnel Data...')
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success('Personnel Identity Authorized', { id: tid })
                setIsModalOpen(false)
                setFormData({ name: '', email: '', personnelRole: 'CASHIER' })
                fetchUsers()
            } else {
                toast.error('Enrollment Refused', { id: tid })
            }
        } catch (error) {
            toast.error('Network synchronization error.', { id: tid })
        } finally {
            setIsSubmitting(false)
        }
    }

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
        <div className="p-8 md:p-12 font-sans selection:bg-blue-100 min-h-screen">
            
            <div className="relative z-10">
                {/* Module Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 border-b border-gray-100 pb-12">
                    <div className="space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest leading-none">Management Protocol: Identity</span>
                        </div>
                        <h2 className="text-8xl font-black text-slate-950 tracking-tighter leading-[0.85] italic uppercase">
                            System <br className="lg:hidden" /> <span className="text-blue-600 NOT-italic font-black">Personnel</span>
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-xl shadow-gray-100/30 flex items-center gap-6">
                            <div className="px-8 py-2 border-r border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active nodes</p>
                                <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{users.length.toString().padStart(2, '0')}</p>
                            </div>
                            <div className="px-8 py-2 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Privileged</p>
                                <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{(users || []).filter(u => u.role?.toLowerCase() === 'admin').length.toString().padStart(2, '0')}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-950 text-white px-10 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-900/10 active:scale-95 flex items-center gap-4 group border border-blue-500/10 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <UserPlus className="w-6 h-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative z-10" />
                            <span className="relative z-10">Enroll Personnel</span>
                        </button>
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
                                                <img src={user.imageUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-14 h-14 rounded-2xl shadow-sm border border-white" />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                                    {user.role?.toLowerCase() === 'admin' ? <ShieldCheck className="w-3 h-3 text-blue-500" /> : <User className="w-3 h-3 text-blue-500" />}
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
                                            user.role?.toLowerCase() === 'admin' ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' : 'bg-slate-100 border-slate-200 text-slate-600 font-bold'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.role?.toLowerCase() === 'admin' ? 'bg-white' : 'bg-slate-400'}`} />
                                            {user.role?.toLowerCase() === 'admin' ? 'COMMANDER' : 'OPERATOR'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => updateRole(user.id, 'admin')} 
                                                className={`p-3 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-3 ${
                                                    user.role?.toLowerCase() === 'admin' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                                }`}
                                            >
                                                <ShieldCheck className="w-3 h-3" />
                                                Elevate to Admin
                                            </button>
                                            <button 
                                                onClick={() => updateRole(user.id, 'user')} 
                                                className={`p-3 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-3 ${
                                                    user.role?.toLowerCase() !== 'admin' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-500/40' : 'bg-slate-50 text-slate-600 hover:bg-slate-950 hover:text-white'
                                                }`}
                                            >
                                                <User className="w-3 h-3" />
                                                Assign Operator Role
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

                {/* Enrollment Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        
                        <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
                            <div className="p-12">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4">
                                            <Key className="w-3 h-3 text-blue-600" />
                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Pre-Authorization Protocol</span>
                                        </div>
                                        <h3 className="text-4xl font-black text-slate-950 tracking-tighter italic uppercase leading-none">Enroll <span className="text-blue-600 NOT-italic">Staff</span></h3>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-red-500">
                                        <X className="w-8 h-8" />
                                    </button>
                                </div>

                                <form onSubmit={handleEnroll} className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block group-focus-within:text-blue-600 transition-colors">Personnel Identity</label>
                                            <div className="relative">
                                                <input 
                                                    required
                                                    type="text"
                                                    placeholder="e.g. Shyam Darji"
                                                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-blue-500 rounded-2xl py-5 pl-14 pr-8 text-sm font-bold outline-none transition-all"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                />
                                                <UserCircle className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block group-focus-within:text-blue-600 transition-colors">Uplink Address (Email)</label>
                                            <div className="relative">
                                                <input 
                                                    required
                                                    type="email"
                                                    placeholder="hq@matrix.core"
                                                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-blue-500 rounded-2xl py-5 pl-14 pr-8 text-sm font-bold outline-none transition-all"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                />
                                                <Mail className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block group-focus-within:text-blue-600 transition-colors">Security Clearance Level</label>
                                            <div className="flex gap-4">
                                                {['ADMIN', 'CASHIER'].map((role) => (
                                                    <button
                                                        key={role}
                                                        type="button"
                                                        onClick={() => setFormData({...formData, personnelRole: role})}
                                                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                                                            formData.personnelRole === role 
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' 
                                                            : 'bg-white border-slate-100 text-slate-400 hover:border-blue-500/30 hover:text-blue-600'
                                                        }`}
                                                    >
                                                        {role}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-slate-950 hover:bg-blue-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 italic"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    Initialize Uplink
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform duration-700" />
                                                </>
                                            )}
                                        </button>
                                        <p className="mt-6 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest px-8 leading-relaxed">
                                            The enrolled identity will automatically inherit these credentials upon first terminal handshake (Google Login).
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

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
