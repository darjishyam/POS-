'use client'

import { Construction, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'

export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#f8fafc] font-sans">
            <Header />
            
            <div className="max-w-4xl mx-auto mt-20 text-center space-y-8">
                <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-indigo-500/20 shadow-2xl shadow-indigo-500/5">
                    <Construction className="w-12 h-12 text-indigo-500" />
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">
                        {title} <span className="text-indigo-600 NOT-italic">Protocol.</span>
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px]">Strategic Module under construction</p>
                </div>

                <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                    This advanced operational node is currently being synthesized. Full system integration is scheduled for the next deployment cycle.
                </p>

                <div className="pt-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                        <ArrowLeft className="w-4 h-4" />
                        Return to Command Center
                    </Link>
                </div>
            </div>
        </div>
    )
}
