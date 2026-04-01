'use client'

import { X, ShoppingBag, CreditCard, Banknote, Landmark, Calendar, User, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TransactionDetailModalProps {
    transactionId: string
    type: 'SALE' | 'PURCHASE'
    onClose: () => void
    currencySymbol: string
}

export default function TransactionDetailModal({ transactionId, type, onClose, currencySymbol }: TransactionDetailModalProps) {
    const [transaction, setTransaction] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const endpoint = type === 'SALE' ? `/api/orders/${transactionId}` : `/api/purchases/${transactionId}`
        
        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                setTransaction(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [transactionId, type])

    if (!transactionId) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl shadow-black/20 overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                {/* Header Action */}
                <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
                    <Link 
                        href={`/dashboard/${type === 'SALE' ? 'orders' : 'purchases'}/${transactionId}`}
                        className="px-6 py-3 bg-white/80 hover:bg-slate-950 backdrop-blur-md text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest italic rounded-2xl transition-all shadow-xl shadow-black/5"
                    >
                        Full Details
                    </Link>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 bg-slate-100 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-all flex items-center justify-center group active:scale-90"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-6">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Record...</p>
                    </div>
                ) : transaction ? (
                    <div className="flex flex-col h-[85vh]">
                        {/* Top Banner */}
                         <div className="p-12 bg-slate-50 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-2 rounded-lg ${type === 'SALE' ? 'bg-blue-600/10' : 'bg-amber-600/10'}`}>
                                    <Zap className={`w-4 h-4 ${type === 'SALE' ? 'text-blue-600' : 'text-amber-600'}`} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest italic ${type === 'SALE' ? 'text-blue-600' : 'text-amber-600'}`}>
                                    {type === 'SALE' ? 'Authorized Sales Ledger' : 'Procurement Authorization Proof'}
                                </span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-950 tracking-tighter italic leading-none uppercase">
                                Record <span className={`${type === 'SALE' ? 'text-blue-600' : 'text-amber-600'} NOT-italic`}>#{transaction?.id?.slice(-8).toUpperCase() || 'SYNCHING'}</span>
                            </h2>
                            <div className="flex flex-wrap gap-6 mt-8">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(transaction.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {type === 'SALE' ? (transaction.customer?.name || 'GUEST ASSET HOLDER') : (transaction.supplier?.name || 'VETTED VENDOR')}
                                    </span>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${type === 'SALE' ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 border-amber-500/10 text-amber-600'}`}>
                                    <Zap className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest italic">STATUS: {transaction.status || transaction.paymentStatus}</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                                {/* Itemized List */}
                                <div className="md:col-span-12 space-y-8">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-6">Asset Inventory</h3>
                                    <div className="space-y-4">
                                        {transaction.items?.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 rounded-3xl border border-slate-100 transition-all group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                        {item.product?.image ? (
                                                            <img src={item.product.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" alt={item.product.name} />
                                                        ) : (
                                                            <ShoppingBag className="w-6 h-6 text-slate-200" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 uppercase italic leading-none">{item.product?.name || 'Authorized Asset'}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                            {item.quantity} UNIT(S) @ {currencySymbol}{(item.price || item.unitCost || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-slate-950 italic font-mono tracking-tighter">
                                                        {currencySymbol}{((item.price || item.unitCost || 0) * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Summary */}
                        <div className="p-12 bg-slate-950 text-white shrink-0">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                            {transaction.paymentMethod === 'CARD' ? <CreditCard className="w-6 h-6 text-blue-400" /> : 
                                             transaction.paymentMethod === 'CASH' ? <Banknote className="w-6 h-6 text-emerald-400" /> : 
                                             <Landmark className="w-6 h-6 text-sky-400" />}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Authorization Protocol</p>
                                            <p className="text-sm font-bold uppercase italic text-blue-400">
                                                {transaction.paymentMethod} {type === 'SALE' ? 'INFLOW' : 'OUTFLOW'}
                                            </p>
                                        </div>
                                    </div>
                                     <div className="flex flex-wrap gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SUBTOTAL</p>
                                            <p className="text-sm font-bold font-mono">
                                                {currencySymbol}{(transaction.totalAmount + (transaction.discountAmount || 0) - (transaction.taxAmount || 0)).toFixed(2)}
                                            </p>
                                        </div>
                                        {transaction.discountAmount > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-emerald-500">DISCOUNT</p>
                                                <p className="text-sm font-bold font-mono text-emerald-500">-{currencySymbol}{transaction.discountAmount.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {transaction.taxAmount > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TAX (5.0%)</p>
                                                <p className="text-sm font-bold font-mono">{currencySymbol}{transaction.taxAmount.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {type === 'PURCHASE' && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">PAID</p>
                                                <p className="text-sm font-bold font-mono text-blue-400">{currencySymbol}{(transaction.amountPaid || 0).toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4 italic">Total Settlement Matrix</p>
                                    <h3 className="text-7xl font-black italic tracking-tighter leading-none">{currencySymbol}{transaction.totalAmount.toFixed(2)}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <p className="text-slate-400">Record Retrieval Failed</p>
                    </div>
                )}
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
