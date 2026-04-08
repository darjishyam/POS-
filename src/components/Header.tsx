'use client'

import { useAuth } from '@/context/AuthContext'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { UserProfileDropdown } from './UserProfileDropdown'

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
                        
                        <UserProfileDropdown />
                    </div>
                )}
            </div>
        </header>
    )
}
