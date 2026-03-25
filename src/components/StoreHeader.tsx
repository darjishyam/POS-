'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ShoppingCart, LayoutGrid, LogOut, User as UserIcon, ArrowRight, Archive } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export function StoreHeader() {
    const { user, role, loading, logout } = useAuth()
    const { totalItems, setIsCartOpen } = useCart()
    const isSignedIn = !!user
    

    if (loading) return <div className="h-20 w-full bg-slate-50 animate-pulse rounded-[2rem] border border-slate-100" />

    return (
        <header className="mb-12 flex justify-between items-center bg-white/70 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-gray-100/30 sticky top-8 z-[50]">
            <Link href="/" className="hover:opacity-80 transition-all active:scale-95 group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
                        <span className="text-white font-black text-xl italic">B</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-950 tracking-tighter italic leading-none">Bard<span className="text-emerald-600 NOT-italic font-black">POS</span></h1>
                        <p className="text-emerald-600/40 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Universal Marketplace</p>
                    </div>
                </div>
            </Link>

            <div className="flex items-center gap-4">
                {isSignedIn && role === 'admin' && (
                    <Link href="/dashboard" className="hidden md:flex items-center gap-3 px-6 py-4 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-transparent hover:border-emerald-100 group">
                        <LayoutGrid className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Terminal Console</span>
                    </Link>
                )}

                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-90 group border border-emerald-400 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ShoppingCart className="w-6 h-6 relative z-10 group-hover:-translate-y-1 transition-transform" />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                            {totalItems}
                        </span>
                    )}
                </button>

                <div className="hidden md:block w-px h-8 bg-slate-200 mx-2" />

                <div className="flex items-center gap-4">
                    {!isSignedIn ? (
                        <Link href="/sign-in">
                            <button className="bg-gray-950 hover:bg-black text-white px-8 py-4 rounded-2xl font-black transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl shadow-black/20 italic flex items-center gap-3 text-[10px] uppercase tracking-widest border border-emerald-500/20">
                                INITIALIZE SESSION
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3 group/user relative">
                            <Link href="/orders" className="p-3 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 rounded-xl transition-all mr-2" title="My Orders">
                                <Archive className="w-5 h-5" />
                            </Link>
                            <div className="flex flex-col items-end mr-2">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{user?.displayName || 'Active Operator'}</p>
                                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Terminal Online</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl shadow-inner border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-6 h-6 text-slate-300" />
                                )}
                            </div>
                            <button 
                                onClick={() => logout()}
                                className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"
                                title="Terminate Session"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
