'use client'

import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Link from 'next/link'

export default function DeniedPage() {
    const { logout } = useAuth()

    return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full" />

            <div className="max-w-md w-full text-center space-y-8 relative z-10">
                <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-900/20">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic">Access <span className="text-red-500 NOT-italic">Restricted</span></h1>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed px-8">
                        Your current credentials do not have administrative clearance for this terminal sector.
                    </p>
                </div>

                <div className="pt-8 flex flex-col gap-4">
                    <Link href="/" className="inline-flex items-center justify-center px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-xl">
                        Return to Command Center
                    </Link>
                    <button 
                        onClick={() => logout()}
                        className="inline-flex items-center justify-center px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                    >
                        Switch Terminal Account
                    </button>
                </div>

                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Protocol 403 • unauthorized_access_error</p>
            </div>
        </div>
    )
}
