'use client'

import { useAuth } from '@/context/AuthContext'
import { LogOut, User as UserIcon, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
    const { user, loading, logout } = useAuth()
    const isSignedIn = !!user
    const role = 'admin' // Default for dev, or fetch from Firestore later

    if (loading) return <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-xl" />

    return (
        <header className="mb-12 flex justify-between items-center bg-white/50 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/50 shadow-sm">
            <Link href={isSignedIn ? "/dashboard" : "/"} className="hover:opacity-80 transition-all active:scale-95 group">
                <h1 className="text-3xl font-black text-slate-950 tracking-tighter italic">Bard<span className="text-emerald-600 NOT-italic font-black group-hover:text-emerald-500 transition-colors">POS</span></h1>
                <p className="text-emerald-600/60 text-[10px] font-black uppercase tracking-widest mt-1">Universal Execution Platform</p>
            </Link>
            <div className="flex items-center gap-6">
                {!isSignedIn ? (
                    <Link href="/sign-in">
                        <button className="bg-gray-950 text-white px-8 py-3 rounded-2xl font-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-black/20 italic flex items-center gap-2 text-xs uppercase tracking-widest">
                            SYSTEM ACCESS
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                ) : (
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-4 border-r border-slate-200 pr-6 mr-2">
                            {role === 'admin' && (
                                <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors relative group">
                                    Management
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full" />
                                </Link>
                            )}
                        </nav>

                        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${role === 'admin'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {role === 'admin' ? 'COMMANDER' : 'CUSTOMER'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-5 h-5 text-slate-300" />
                                )}
                            </div>
                            <button 
                                onClick={() => logout()}
                                className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
