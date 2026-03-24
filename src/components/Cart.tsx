'use client'

import { useCart } from '@/context/CartContext'
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function Cart() {
    const { cart, removeFromCart, updateQuantity, totalAmount, totalItems, isCartOpen, setIsCartOpen } = useCart()

    if (!isCartOpen) return null

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md animate-in slide-in-from-right duration-500">
                    <div className="h-full flex flex-col bg-white shadow-2xl rounded-l-[3rem] overflow-hidden border-l border-gray-100 font-sans">
                        {/* Header */}
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-950 tracking-tighter italic uppercase leading-none">Marketplace <span className="text-emerald-600 NOT-italic">Cart</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{totalItems} System Assets Reserved</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all text-slate-300 hover:text-red-500 shadow-sm">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-12">
                                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
                                        <ShoppingBag className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Zero Assets in Registry</p>
                                        <p className="text-xs text-slate-300 font-medium max-w-[200px]">Browse the marketplace and initialize your first project acquisition.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsCartOpen(false)}
                                        className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-90 italic"
                                    >
                                        Return to Marketplace
                                    </button>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="group relative flex gap-6 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all">
                                        <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                            {item.image ? (
                                                <img src={item.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" alt={item.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                    <ShoppingBag className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-black text-slate-900 leading-tight uppercase italic line-clamp-2">{item.name}</h3>
                                                <button onClick={() => removeFromCart(item.id)} className="text-slate-200 hover:text-red-500 transition-colors p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-emerald-600 shadow-sm">
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-emerald-600 shadow-sm">
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="text-lg font-bold text-gray-900 tracking-tighter italic font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer / Summary */}
                        {cart.length > 0 && (
                            <div className="p-8 bg-slate-50/50 border-t border-gray-100 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                        <span>Subtotal Ledger</span>
                                        <span className="text-slate-900">${totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                        <span>Taxation (0.00%)</span>
                                        <span className="text-slate-900">$0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                        <span className="text-xs font-black text-slate-950 uppercase tracking-[0.2em] italic">Total Acquisition Cost</span>
                                        <span className="text-3xl font-black text-emerald-600 italic tracking-tighter font-mono">${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <Link 
                                    href="/checkout"
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full bg-gray-950 hover:bg-black text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/10 transition-all active:scale-95 flex items-center justify-center gap-3 group italic border border-emerald-500/20"
                                >
                                    Proceed to Authorization
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500 text-emerald-400" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
