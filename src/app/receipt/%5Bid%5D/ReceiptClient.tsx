'use client'

import { useEffect, useState } from 'react'
import { 
    CheckCircle2, 
    Calendar, 
    Hash, 
    ShoppingBag, 
    Printer, 
    ArrowLeft,
    Box,
    MapPin,
    Phone,
    Mail,
    CreditCard,
    Banknote,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ReceiptProps {
    id: string
}

export default function ReceiptClient({ id }: ReceiptProps) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const res = await fetch(`/api/receipt/${id}`)
                if (res.ok) {
                    const result = await res.json()
                    setData(result)
                }
            } catch (error) {
                console.error('Failed to fetch receipt', error)
            } finally {
                setLoading(false)
            }
        }
        fetchReceipt()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-6 animate-pulse">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-100">
                        <Zap className="w-10 h-10 text-emerald-600" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Synchronizing Asset Registry...</p>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 italic uppercase">Registry Not Found</h1>
                    <p className="text-slate-500 mb-8">This order identification does not exist in our secure database.</p>
                    <Link href="/" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform inline-block">
                        Return to Headquarters
                    </Link>
                </div>
            </div>
        )
    }

    const { order, settings } = data
    const currencySymbol = settings.currencySymbol || '₹'

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6 sm:px-12 font-sans selection:bg-emerald-100">
            <div className="max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-12 no-print">
                    <Link href="/" className="flex items-center gap-3 text-slate-400 hover:text-emerald-600 transition-colors group">
                        <div className="p-2 group-hover:bg-emerald-50 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                    </Link>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-3 px-6 py-3 bg-white text-slate-950 rounded-xl border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm shadow-gray-100 hover:shadow-emerald-50"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Hard Copy</span>
                    </button>
                </div>

                <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none">
                    {/* Brand Header */}
                    <div className="bg-slate-950 p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-transparent to-emerald-500 opacity-20" />
                        <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase mb-2">
                            {settings.storeName}
                        </h1>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] opacity-80 italic">Verified Transaction Registry</p>
                    </div>

                    <div className="p-10 sm:p-14 space-y-12">
                        {/* Transaction Metadata */}
                        <div className="grid grid-cols-2 gap-8 pb-12 border-b border-dashed border-gray-200">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Identification</p>
                                <div className="flex items-center gap-2 text-slate-950">
                                    <Hash className="w-4 h-4 text-emerald-600" />
                                    <span className="font-mono font-bold text-sm">{order.id.slice(-8).toUpperCase()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Timestamp</p>
                                <div className="flex items-center justify-end gap-2 text-slate-950">
                                    <Calendar className="w-4 h-4 text-emerald-600" />
                                    <span className="font-mono font-bold text-sm tracking-tight">{format(new Date(order.createdAt), 'dd MMM yyyy')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Store Info */}
                        {(settings.address || settings.phone) && (
                            <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100/50 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {settings.address && (
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                                        <p className="text-[11px] font-black text-slate-700 tracking-tight leading-relaxed">{settings.address}</p>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {settings.phone && (
                                        <div className="flex items-center gap-4">
                                            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <p className="text-[11px] font-black text-slate-700">{settings.phone}</p>
                                        </div>
                                    )}
                                    {settings.email && (
                                        <div className="flex items-center gap-4 text-emerald-600">
                                            <Mail className="w-4 h-4 shrink-0" />
                                            <p className="text-[11px] font-black">{settings.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order Registry */}
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h4 className="text-lg font-black text-slate-950 tracking-tighter italic uppercase">Items Registered</h4>
                            </div>

                            <div className="space-y-6">
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-gray-100">
                                                <Box className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-950 tracking-tight">{item.product.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.quantity} units x {currencySymbol}{item.price}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-950 font-mono tracking-tight bg-slate-50 px-4 py-2 rounded-xl border border-gray-50 group-hover:border-emerald-100 transition-colors">
                                            {currencySymbol}{(item.quantity * item.price).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Financial Ledger */}
                        <div className="pt-12 border-t border-dashed border-gray-200 space-y-4">
                            <div className="flex justify-between items-center text-slate-400 px-4">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Asset Total</span>
                                <span className="text-sm font-bold font-mono">{currencySymbol}{order.totalAmount.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center bg-slate-950 p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] block mb-1 leading-none italic">Total Verified Bill</span>
                                        <span className="text-3xl font-black text-white tracking-tighter italic leading-none">{currencySymbol}{order.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Verification */}
                        <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-gray-100">
                            <div className="flex items-center gap-4">
                                {order.paymentMethod === 'CARD' ? (
                                    <CreditCard className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <Banknote className="w-5 h-5 text-emerald-600" />
                                )}
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{order.paymentMethod} SETTLED</span>
                            </div>
                            <div className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">
                                Verified Transaction
                            </div>
                        </div>

                        {/* Customer Info if available */}
                        {order.customer && (
                            <div className="pt-8 text-center border-t border-gray-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Loyal Customer Matrix</p>
                                <div className="inline-flex flex-col items-center">
                                    <span className="text-lg font-black text-slate-950 tracking-tighter uppercase italic">{order.customer.name}</span>
                                    {order.customer.phone && <span className="text-[11px] font-bold text-emerald-600 font-mono tracking-tighter">{order.customer.phone}</span>}
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-12 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Thank you for your strategy</p>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] mt-3">Powered by BardPOS Digital Infrastructure</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background-color: white !important;
                        padding: 0 !important;
                    }
                    .print-m-0 {
                        margin: 0 !important;
                    }
                }
            `}</style>
        </div>
    )
}
