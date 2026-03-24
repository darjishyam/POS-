'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { ArrowRight, LayoutGrid } from 'lucide-react'

export function Hero() {
    const { user } = useAuth()
    const isAdmin = user?.email === "professorshyam123@gmail.com"

    return (
        <div className="py-24 md:py-32 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 mb-8 animate-fade-in shadow-sm">
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">v2.5 Marketplace Update</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-gray-950 tracking-tighter leading-[0.9] italic mb-8 max-w-4xl">
                Next Generation <br />
                <span className="text-emerald-600 NOT-italic">Business Logic.</span>
            </h1>

            <p className="text-xl text-gray-500 font-medium max-w-2xl mb-12 leading-relaxed">
                The most advanced POS execution engine designed for scale. Now and forever integrated with a global marketplace for premium projects.
            </p>

            <div className="flex flex-wrap justify-center gap-6">
                {isAdmin ? (
                    <Link href="/dashboard" className="bg-gray-950 text-white px-10 py-6 rounded-[2rem] font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/20 italic flex items-center gap-3 group border border-emerald-500/10">
                        <LayoutGrid className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                        ACCESS TERMINAL CONSOLE
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                ) : (
                    <Link href="#gallery" className="bg-gray-950 text-white px-10 py-6 rounded-[2rem] font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/20 italic flex items-center gap-3 group border border-emerald-500/20">
                        BROWSE MARKETPLACE
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
                
                <Link href={isAdmin ? "/dashboard/inventory" : "#gallery"} className="bg-white text-gray-900 border border-gray-200 px-10 py-6 rounded-[2rem] font-black transition-all hover:bg-gray-50 flex items-center gap-3">
                    {isAdmin ? "MANAGE INVENTORY" : "VIEW PROJECTS"}
                </Link>
            </div>
        </div>
    )
}
