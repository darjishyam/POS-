'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ShoppingCart, LayoutGrid, ArrowRight, Archive } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { UserProfileDropdown } from './UserProfileDropdown'

export function StoreHeader() {
    const { user, role, loading, logout } = useAuth()
    const { totalItems, setIsCartOpen } = useCart()
    const isSignedIn = !!user
    

    if (loading) return <div className="h-20 w-full bg-slate-50 animate-pulse rounded-[2rem] border border-slate-100" />

    return (
        <header className="w-full mb-12 flex justify-between items-center bg-white/70 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-gray-100/30 relative mt-8">
            <Link href="/" className="hover:opacity-100 transition-all active:scale-95 group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-[1.4rem] flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:rotate-[15deg] transition-all duration-700 border border-blue-400/30">
                        <span className="text-white font-black text-2xl italic">B</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-950 tracking-tighter italic leading-none group-hover:tracking-tight transition-all">Bard<span className="text-blue-600 NOT-italic font-black">POS</span></h1>
                        <p className="text-blue-600/60 text-[9px] font-black uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Enterprise Resource Protocol
                        </p>
                    </div>
                </div>
            </Link>

            <div className="flex items-center gap-4">
                {isSignedIn && role === 'admin' && (
                    <Link href="/dashboard" className="hidden md:flex items-center gap-3 px-6 py-4 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-transparent hover:border-blue-100 group">
                        <LayoutGrid className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Terminal Console</span>
                    </Link>
                )}

                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-2xl shadow-blue-500/30 active:scale-90 group border border-blue-400 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ShoppingCart className="w-6 h-6 relative z-10 group-hover:-translate-y-1 transition-transform" />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                            {totalItems}
                        </span>
                    )}
                </button>

                <div className="hidden md:block w-px h-8 bg-slate-200 mx-2" />

                <div className="flex items-center gap-4">
                    {!isSignedIn ? (
                        <Link href="/sign-in">
                            <button className="bg-slate-950 hover:bg-blue-600 text-white px-8 py-5 rounded-2xl font-black transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-2xl shadow-slate-900/20 italic flex items-center gap-4 text-[10px] uppercase tracking-widest border border-white/5 group">
                                INITIALIZE SESSION
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </button>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/orders" className="p-3 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-xl transition-all mr-2" title="My Orders">
                                <Archive className="w-5 h-5" />
                            </Link>
                            
                            <UserProfileDropdown />
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
