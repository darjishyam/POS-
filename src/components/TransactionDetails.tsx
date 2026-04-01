'use client'

import { X, ShoppingBag, CreditCard, Banknote, Landmark, Calendar, User, Zap, ArrowLeft, Printer, Share2, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TransactionDetailsProps {
    transactionId: string
    type: 'SALE' | 'PURCHASE'
    currencySymbol: string
}

export default function TransactionDetails({ transactionId, type, currencySymbol }: TransactionDetailsProps) {
    const [transaction, setTransaction] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'copied'>('idle')

    const handleDispatch = () => {
        const receiptUrl = `${window.location.origin}/receipt/${transactionId}`
        
        // Universal Secure Copy
        navigator.clipboard.writeText(receiptUrl)
        setDispatchStatus('copied')
        setTimeout(() => setDispatchStatus('idle'), 2000)

        // Automated WhatsApp Dispatch for Sales
        if (type === 'SALE') {
            const text = `Hello! View your digital record for transaction #${transaction.id.slice(-8).toUpperCase()} here: ${receiptUrl}`
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        }
    }

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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-8 p-12">
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse italic">Neural Link Synchronizing...</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-4 uppercase tracking-widest">Retrieving Asset Signatures for #{transactionId.slice(-8).toUpperCase()}</p>
                </div>
            </div>
        )
    }

    if (!transaction || transaction.error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-red-100 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Zap className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Access Denied</h2>
                    <p className="text-sm text-slate-500 font-medium">The requested transaction details are unavailable or encrypted.</p>
                    <Link href="/dashboard" className="inline-block px-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-600 transition-all">
                        Return to Command Center
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Tactical Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <Link 
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors group no-print"
                        >
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            Back to Matrix
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${type === 'SALE' ? 'bg-blue-600/10' : 'bg-amber-600/10'}`}>
                                <Zap className={`w-6 h-6 ${type === 'SALE' ? 'text-blue-600' : 'text-amber-600'}`} />
                            </div>
                            <h1 className="text-6xl font-black text-slate-950 tracking-tighter italic leading-none uppercase">
                                <span className={`${type === 'SALE' ? 'text-blue-600' : 'text-amber-600'} NOT-italic font-black`}>#{transaction.id.slice(-8).toUpperCase()}</span> Details
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-4 no-print">
                        <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm uppercase tracking-widest italic group"
                        >
                            <Printer className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            Print Proof
                        </button>
                        <button 
                            onClick={handleDispatch}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black transition-all shadow-xl uppercase tracking-widest italic group ${
                                dispatchStatus === 'copied' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white hover:bg-blue-600'
                            }`}
                        >
                            {dispatchStatus === 'copied' ? (
                                <Check className="w-4 h-4 animate-in zoom-in duration-300" />
                            ) : (
                                <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            )}
                            {dispatchStatus === 'copied' ? 'Link Copied' : 'Dispatch Link'}
                        </button>
                    </div>
                </div>

                <style jsx global>{`
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                        body {
                            background: white !important;
                            padding: 0 !important;
                        }
                        .max-w-7xl {
                            max-width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                    }
                `}</style>

                {/* Core Intelligence Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left: Itemized Ledger */}
                    <div className="lg:col-span-8 space-y-12">
                        <div className="bg-white rounded-[3.5rem] border border-white shadow-2xl shadow-slate-200/50 overflow-hidden">
                            <div className="p-12 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Manifest Intelligence</h3>
                                <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest italic border ${
                                    (transaction.status === 'COMPLETED' || transaction.paymentStatus === 'PAID') 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                                }`}>
                                    Status: {transaction.status || transaction.paymentStatus}
                                </span>
                            </div>
                            
                            <div className="p-12 space-y-8">
                                <div className="space-y-4">
                                    {(transaction.items || []).map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-8 bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-100 transition-all group">
                                            <div className="flex items-center gap-8">
                                                <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-blue-200 transition-colors">
                                                    {item.product?.image ? (
                                                        <img src={item.product.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" alt={item.product.name} />
                                                    ) : (
                                                        <ShoppingBag className="w-8 h-8 text-slate-200" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{item.product?.name || 'Asset Unidentified'}</h4>
                                                    <div className="flex gap-4 mt-2">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.quantity} UNIT(S)</p>
                                                        <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest italic">@ {currencySymbol}{(item.price || item.unitCost || 0).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-950 italic tracking-tighter">
                                                    {currencySymbol}{((item.price || item.unitCost || 0) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Financial Summary Sub-Matrix */}
                                <div className="mt-12 pt-12 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-12">
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol Subtotal</p>
                                        <p className="text-xl font-black italic text-slate-900 tracking-tighter">
                                            {currencySymbol}{(transaction.totalAmount + (transaction.discountAmount || 0) - (transaction.taxAmount || 0)).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Execution Fees (Tax)</p>
                                        <p className="text-xl font-black italic text-slate-900 tracking-tighter">
                                            {currencySymbol}{(transaction.taxAmount || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em]">Rebate (Discount)</p>
                                        <p className="text-xl font-black italic text-emerald-500 tracking-tighter">
                                            -{currencySymbol}{(transaction.discountAmount || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Massive Total Banner */}
                            <div className="p-12 bg-slate-950 text-white flex flex-col md:flex-row justify-between items-end gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            {transaction.paymentMethod === 'CARD' ? <CreditCard className="w-8 h-8 text-blue-400" /> : 
                                             transaction.paymentMethod === 'CASH' ? <Banknote className="w-8 h-8 text-emerald-400" /> : 
                                             <Landmark className="w-8 h-8 text-sky-400" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Settlement Protocol</p>
                                            <p className="text-xl font-black uppercase italic text-blue-400 tracking-tighter">
                                                {transaction.paymentMethod || 'STANDARD'} {type === 'SALE' ? 'INFLOW' : 'OUTFLOW'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] font-black text-blue-400 uppercase tracking-[0.5em] mb-4 italic">Total Signature Value</p>
                                    <h3 className="text-9xl font-black italic tracking-tighter leading-none">
                                        {currencySymbol}{transaction.totalAmount.toFixed(2)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Counterparty Intelligence */}
                    <div className="lg:col-span-4 space-y-12">
                        
                        {/* Profile Card */}
                        <div className="bg-white rounded-[3.5rem] p-10 border border-white shadow-2xl shadow-slate-200/50 space-y-10">
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-8">Target Intelligence</h3>
                            
                            <div className="flex items-center gap-6">
                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black italic ${type === 'SALE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {(type === 'SALE' ? (transaction.customer?.name?.[0] || 'G') : (transaction.supplier?.name?.[0] || 'V'))}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{type === 'SALE' ? 'Primary Customer' : 'Vetted Vendor'}</p>
                                    <h4 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase leading-none">
                                        {type === 'SALE' ? (transaction.customer?.name || 'Guest Asset Holder') : (transaction.supplier?.name || 'Authorized Supplier')}
                                    </h4>
                                </div>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-slate-50">
                                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Authorization Code</span>
                                    <span className="text-xs font-black text-slate-950 uppercase italic tracking-tighter">#{transaction.id.slice(0, 12).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Chronos Stamp</span>
                                    <span className="text-xs font-black text-slate-950 italic">{new Date(transaction.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Location Context */}
                        <div className="bg-slate-950 rounded-[3rem] p-10 text-white space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full" />
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] italic">Deployment Node</h4>
                            <div className="space-y-2">
                                <p className="text-4xl font-black italic tracking-tighter uppercase leading-none">{transaction.location?.name || 'CENTRAL MATRIX'}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{transaction.location?.type || 'CORE STORAGE'}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
