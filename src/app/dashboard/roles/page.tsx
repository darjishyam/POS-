'use client'

import Header from '@/components/Header'
import { Shield, Lock, Settings, CheckCircle2 } from 'lucide-react'

export default function RolesPage() {
    const roles = [
        { name: 'Admin', description: 'Full system access, manage all users, products, and settings.', permissions: ['All Access'] },
        { name: 'Cashier', description: 'Limited access to POS terminal and personal sales reports.', permissions: ['Sales', 'Recent Orders', 'Personal Stats'] },
        { name: 'Manager', description: 'Access to inventory, purchases, and basic reports.', permissions: ['Inventory', 'Purchases', 'Analytical Reports'] },
    ]

    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#f8fafc] font-sans">
            <Header />

            <div className="max-w-7xl mx-auto space-y-12">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                        Access <span className="text-blue-600 NOT-italic">Privileges</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px]">Permission Matrix & Role definitions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {roles.map((role) => (
                        <div key={role.name} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 group">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mb-4">{role.name}</h3>
                            <p className="text-gray-400 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">{role.description}</p>
                            
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Core Permissions:</p>
                                {role.permissions.map(p => (
                                    <div key={p} className="flex items-center gap-3 text-emerald-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-600 p-12 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-200">
                    <div className="space-y-4 text-center md:text-left">
                        <h2 className="text-4xl font-black tracking-tighter italic">Custom <span className="opacity-50 NOT-italic">Security Protocols?</span></h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Define granular access levels for specialized departments</p>
                    </div>
                    <button className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all active:scale-95 shadow-xl">
                        Construct New Role
                    </button>
                </div>
            </div>
        </div>
    )
}
