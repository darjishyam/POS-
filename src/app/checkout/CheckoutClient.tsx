'use client'

import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import {
    CreditCard,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    ShoppingBag,
    Banknote,
    Landmark,
    Printer,
    Calendar,
    Hash,
    Search,
    List,
    Camera,
    Zap,
    MessageSquare,
    Share2,
    Cpu,
    Target,
    Activity
} from 'lucide-react'
import Link from 'next/link'
import { toast, Toaster } from 'react-hot-toast'
import { useSettings } from '@/context/SettingsContext'
import BarcodeScanner from '@/components/BarcodeScanner'

export default function CheckoutClient() {
    const { settings } = useSettings()
    const { cart, addToCart, totalAmount: subtotal, clearCart } = useCart()
    const { user, role } = useAuth()
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle')
    const [orderData, setOrderData] = useState<any>(null)
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'UPI'>('CARD')
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvc: ''
    })
    const [upiId, setUpiId] = useState('')
    const [agents, setAgents] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [me, setMe] = useState<any>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [lastScannedSku, setLastScannedSku] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    const validateCard = () => {
        const newErrors: Record<string, string> = {}
        if (paymentMethod === 'CARD') {
            if (!/^\d{16}$/.test(cardDetails.number.replace(/\s/g, ''))) {
                newErrors.number = 'Invalid Card Number (16 digits required)'
            }
            if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
                newErrors.expiry = 'Invalid Expiry (MM/YY)'
            }
            if (!/^\d{3}$/.test(cardDetails.cvc)) {
                newErrors.cvc = 'Invalid CVC (3 digits)'
            }
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    useEffect(() => {
        setMounted(true)
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        fetchAgents()
        fetchCustomers()
    }, [])

    useEffect(() => {
        if (user) {
            fetchMe()
        } else {
            setMe(null)
            if (role !== 'admin') {
                setSelectedCustomerId(null)
            }
        }
    }, [user, role])

    const fetchMe = async () => {
        try {
            const res = await fetch('/api/customers/me')
            if (res.ok) {
                const data = await res.json()
                setMe(data)
                setSelectedCustomerId(data.id)
            } else {
                setMe(null)
                if (role !== 'admin') {
                    setSelectedCustomerId(null)
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile')
            setMe(null)
            if (role !== 'admin') {
                setSelectedCustomerId(null)
            }
        }
    }

    const handleScan = async (decodedText: string) => {
        const cleanSku = decodedText.trim()
        console.log('SCAN DETECTED:', cleanSku)

        // Prevent duplicate immediate scans of the same SKU
        if (cleanSku === lastScannedSku) return
        
        setLastScannedSku(cleanSku)
        setTimeout(() => setLastScannedSku(null), 2000)

        try {
            const res = await fetch(`/api/products?sku=${encodeURIComponent(cleanSku)}`)
            console.log('FETCH STATUS:', res.status)
            
            if (res.ok) {
                const product = await res.json()
                console.log('PRODUCT FOUND:', product)
                if (product) {
                    addToCart(product)
                    toast.success(`Asset identified: ${product.name}`, {
                        icon: '🎯',
                        style: {
                            borderRadius: '1.5rem',
                            background: '#059669',
                            color: '#fff',
                            fontWeight: '900',
                            fontSize: '10px'
                        }
                    })
                } else {
                    toast.error(`Unrecognized Asset SKU: ${decodedText}`, {
                        icon: '⚠️',
                        style: {
                            borderRadius: '1.5rem',
                            background: '#991b1b',
                            color: '#fff',
                            fontWeight: '900',
                            fontSize: '10px'
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Scan lookup failure', error)
        }
    }

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers')
            const data = await res.json()
            setCustomers(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to fetch customers')
        }
    }

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/agents')
            const data = await res.json()
            setAgents(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to fetch agents')
        }
    }

    const selectedCustomer = role === 'admin'
        ? customers.find(c => c.id === selectedCustomerId) || me
        : me;

    const groupDiscountPercent = selectedCustomer?.customerGroup?.discount || 0
    const discountAmount = (subtotal * groupDiscountPercent) / 100
    const taxableAmount = subtotal - discountAmount
    const taxAmount = (taxableAmount * (settings.taxRate || 0)) / 100
    const finalTotal = taxableAmount + taxAmount

    useEffect(() => {
        // Restore payment intent from draft resumption if available
        const savedMethod = localStorage.getItem('pos_resume_payment_method');
        const savedUpi = localStorage.getItem('pos_resume_upi_id');
        
        if (savedMethod) {
            setPaymentMethod(savedMethod as any);
            localStorage.removeItem('pos_resume_payment_method');
        }
        if (savedUpi) {
            setUpiId(savedUpi);
            localStorage.removeItem('pos_resume_upi_id');
        }
    }, [])

    const handleCheckout = async (options?: { isDraft?: boolean, isQuotation?: boolean }) => {
        if (cart.length === 0) return

        if (paymentMethod === 'CARD' && !validateCard() && !options?.isDraft) {
            toast.error('Please correct the validation errors')
            return
        }

        setStatus('processing')
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    totalAmount: finalTotal,
                    paymentMethod,
                    status: options?.isDraft ? 'DRAFT' : options?.isQuotation ? 'QUOTATION' : 'COMPLETED',
                    cardDetails: paymentMethod === 'CARD' ? cardDetails : null,
                    upiId: paymentMethod === 'UPI' ? upiId : null,
                    agentId: selectedAgentId,
                    customerId: selectedCustomerId,
                    discountAmount: discountAmount,
                    taxAmount: taxAmount
                })
            })

            if (res.ok) {
                const order = await res.json();
                setOrderData(order);
                setStatus('success')
                
                if (options?.isDraft || options?.isQuotation) {
                    toast.success(options?.isQuotation ? 'Sales Quotation Generated' : 'Asset Session Virtualized: Draft Stored')
                    setStatus('idle') // Return to form state but keep data
                } else {
                    setOrderData(order);
                    setStatus('success')
                    clearCart()
                    toast.success('System Asset Acquisition Complete', { duration: 4000 })
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.error || 'Authorization Protocol Failure')
                setStatus('idle')
            }
        } catch (error) {
            toast.error('Network Synchronization Error')
            setStatus('idle')
        }
    }

    if (status === 'success' && orderData) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 md:p-12 font-sans selection:bg-blue-100 animate-in fade-in duration-700">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body * { visibility: hidden; }
                        #invoice-content, #invoice-content * { visibility: visible; }
                        #invoice-content { position: absolute; left: 0; top: 0; width: 100%; border: none !important; shadow: none !important; }
                        .no-print { display: none !important; }
                    }
                `}} />

                <div className="max-w-3xl w-full space-y-8">
                    {/* Header Action */}
                    <div className="flex justify-between items-center no-print">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors uppercase text-[10px] font-black tracking-widest">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Matrix Hub
                        </Link>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    const receiptUrl = `${window.location.origin}/receipt/${orderData.id}`
                                    const itemsSummary = orderData.items
                                        .map((item: any) => `${item.quantity}x ${item.product?.name || 'Asset'}: ${settings.currencySymbol}${(item.price * item.quantity).toFixed(2)}`)
                                        .join('\n')
                                    
                                    const text = `🧾 BARDPOS RECEIPT #${orderData.id.slice(-8).toUpperCase()}\n` +
                                                 `-----------------------------------\n` +
                                                 `${itemsSummary}\n` +
                                                 `-----------------------------------\n` +
                                                 `TOTAL AUTHORIZED: ${settings.currencySymbol}${orderData.totalAmount.toFixed(2)}\n` +
                                                 `-----------------------------------\n` +
                                                 `🔗 View Secure Digital Ledger:\n${receiptUrl}\n\n` +
                                                 `Thank you for your strategy! 🚀`
                                    window.open(`https://wa.me/${orderData.customer?.phone || ''}?text=${encodeURIComponent(text)}`, '_blank')
                                }}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20 active:scale-95 translate-y-0 hover:-translate-y-1"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Push to WhatsApp
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-100 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all shadow-lg shadow-slate-100 active:scale-95"
                            >
                                <Printer className="w-4 h-4" />
                                Dispatch Asset Proof
                            </button>
                        </div>
                    </div>

                    {/* Invoice Card */}
                    <div id="invoice-content" className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden relative">
                        {/* Decorative Gradient Top */}
                        <div className="h-6 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 opacity-80" />

                        <div className="p-12 md:p-20 space-y-16">
                            {/* Success Banner */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-400 no-print animate-in zoom-in duration-700">
                                        <ShieldCheck className="w-10 h-10" />
                                    </div>
                                    <h1 className="text-6xl font-black text-slate-950 tracking-tighter italic leading-none uppercase">Order <br /><span className="text-blue-600 NOT-italic">Authorized.</span></h1>
                                </div>
                                <div className="text-right space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Authentication Signature</p>
                                    <p className="text-xl font-mono font-black text-slate-950 tracking-tighter uppercase tabular-nums">#{orderData.id.slice(-12)}</p>
                                    <div className="flex items-center justify-end gap-2 text-[9px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">
                                        <Zap className="w-3 h-3 fill-blue-600" />
                                        Verified Protocol
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-50" />

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Temporal Signature
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">{mounted ? new Date(orderData.createdAt).toLocaleString() : '--'}</p>
                                </div>
                                <div className="space-y-4 md:text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center md:justify-end gap-2">
                                        <CreditCard className="w-3 h-3" />
                                        Protocol Authorized
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">{orderData.paymentMethod.toUpperCase() === 'UPI' ? `UPI (${orderData.upiId || 'Direct'})` : orderData.paymentMethod.toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Itemized Assets */}
                            <div className="space-y-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Acquired Assets</p>
                                <div className="space-y-4">
                                    {orderData.items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center py-8 border-b border-slate-50 last:border-0 group">
                                            <div className="flex gap-6 items-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                                                    {item.product?.image ? (
                                                        <img src={item.product.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" alt={item.product.name} />
                                                    ) : (
                                                        <ShoppingBag className="w-8 h-8 text-slate-200" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase italic leading-none">{item.product?.name || 'Authorized Asset'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{item.quantity.toString().padStart(2, '0')} Unit(s) Locked</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-950 italic font-mono tracking-tighter tabular-nums">{settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1 italic">Authorized</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Final Tally */}
                            <div className="bg-slate-950 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
                                
                                <div className="space-y-6 mb-10">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                                        <span>Gross Property Value</span>
                                        <span className="text-white">{settings.currencySymbol}{mounted ? (orderData.totalAmount + (orderData.discountAmount || 0)).toFixed(2) : '--'}</span>
                                    </div>
                                    {orderData.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">
                                            <span>Tier Privilege Applied</span>
                                            <span>-{settings.currencySymbol}{mounted ? orderData.discountAmount.toFixed(2) : '--'}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                                        <span>Compliance Tax ({settings.taxRate}%)</span>
                                        <span>{settings.currencySymbol}{mounted ? (orderData.taxAmount || 0).toFixed(2) : '--'}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-white/10 pt-10">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-3 italic">Total Authorized Settlement</p>
                                        <h2 className="text-6xl font-black italic tracking-tighter tabular-nums leading-none">
                                            {settings.currencySymbol}{mounted ? orderData.totalAmount.toFixed(2) : '--'}
                                        </h2>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-4 inline-block">
                                            <Target className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Status</p>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1 italic">Acquisition Finalized</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="bg-slate-50 px-10 md:px-16 py-10 text-center border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">This is a cryptographically verified digital proof of asset acquisition.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent p-8 md:p-12 font-sans selection:bg-emerald-100">
            {isScannerOpen && (
                <BarcodeScanner 
                    onScan={handleScan} 
                    onClose={() => setIsScannerOpen(false)} 
                />
            )}
            <div className="w-full mx-auto px-6 lg:px-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="w-14 h-14 bg-white hover:bg-slate-950 rounded-2xl transition-all text-slate-400 hover:text-white shadow-xl flex items-center justify-center border border-white hover:border-slate-800">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 mb-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Execution Hub v2.0</span>
                            </div>
                            <h2 className="text-7xl font-black text-slate-950 tracking-tighter italic leading-none">Checkout <span className="text-blue-600 NOT-italic">Protocol</span></h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">Network Status</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-2">
                                SYNC: ACTIVE <Activity className="w-3 h-3" />
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Items List */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-white rounded-[3.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/30">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-950 tracking-tighter italic uppercase">Registry</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{cart.length} Secured Asset Signatures</p>
                                </div>
                                <button 
                                    onClick={() => setIsScannerOpen(true)}
                                    className="flex items-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-200 transition-all group font-black uppercase text-[10px] tracking-[0.2em] active:scale-95"
                                >
                                    <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span>Scan Asset</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex gap-6 items-center p-4 hover:bg-slate-50 rounded-3xl transition-all group">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 bg-slate-50 flex-shrink-0">
                                            <img src={item.image} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt={item.name} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-900 uppercase italic leading-none truncate">{item.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{item.quantity} Unit(s) Locked</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-950 italic font-mono tracking-tighter">{settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}

                                {cart.length === 0 && (
                                    <div className="text-center py-12 space-y-4">
                                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest italic">Registry is Empty</p>
                                        <Link href="/" className="text-emerald-600 font-black text-[10px] underline uppercase tracking-widest">Back to Products</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-600/5 rounded-[2.5rem] p-8 border border-blue-600/10 flex items-center gap-6">
                            <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm border border-blue-50">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-950 uppercase italic">Cryptographic Security</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    All marketplace transactions are cryptographically verified and broadcast to the secure pos-ledger.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary & Action */}
                    <div className="lg:col-span-5 bg-slate-950/80 backdrop-blur-3xl rounded-[3.5rem] p-12 text-white shadow-2xl shadow-blue-900/30 border border-white/10 relative overflow-hidden group/panel transition-all duration-700 hover:shadow-blue-900/40 hover:bg-slate-950/90">
                        {/* Ambient Glows */}
                        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-blue-600/20 blur-[128px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover/panel:opacity-100 opacity-60" />
                        <div className="absolute -top-40 -left-40 w-[20rem] h-[20rem] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
                        
                        <div className="relative z-10">
                        {/* Payment Method Selection */}
                        <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl border border-white/10">
                            {[
                                { id: 'CARD', label: 'Card', icon: CreditCard },
                                { id: 'CASH', label: 'Cash', icon: Banknote },
                                { id: 'UPI', label: 'UPI', icon: Landmark }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        paymentMethod === method.id
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <method.icon className="w-4 h-4" />
                                    {method.label}
                                </button>
                            ))}
                        </div>

                        {/* Simulated Card Form */}
                        {paymentMethod === 'CARD' ? (
                            <div className="space-y-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Authorization Key (Card Number)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="4242 4242 4242 4242"
                                            value={cardDetails.number}
                                            onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                            className={`w-full bg-white/5 border ${errors.number ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-5 text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700`}
                                        />
                                        {errors.number && <p className="text-[10px] text-red-400 font-black mt-2 uppercase tracking-tight">{errors.number}</p>}
                                        <div className="absolute right-5 top-5 flex gap-2">
                                            <div className="w-8 h-5 bg-white/10 rounded-sm" />
                                            <div className="w-8 h-5 bg-white/10 rounded-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiry Protocol</label>
                                        <input
                                            type="text"
                                            placeholder="MM / YY"
                                            value={cardDetails.expiry}
                                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                            className={`w-full bg-white/5 border ${errors.expiry ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-5 text-sm font-mono focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700`}
                                        />
                                        {errors.expiry && <p className="text-[10px] text-red-400 font-black mt-2 uppercase tracking-tight">{errors.expiry}</p>}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Hash (CVC)</label>
                                        <input
                                            type="text"
                                            placeholder="***"
                                            value={cardDetails.cvc}
                                            onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                            className={`w-full bg-white/5 border ${errors.cvc ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-5 text-sm font-mono focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700`}
                                        />
                                        {errors.cvc && <p className="text-[10px] text-red-400 font-black mt-2 uppercase tracking-tight">{errors.cvc}</p>}
                                    </div>
                                </div>
                            </div>
                        ) : paymentMethod === 'UPI' ? (
                            <div className="space-y-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-8 bg-blue-600/5 border-2 border-dashed border-blue-600/20 rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl border border-blue-50">
                                        <Landmark className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase italic text-blue-900">Scan & Pay Interface</h4>
                                        <p className="text-[10px] text-blue-600/60 uppercase tracking-widest mt-2 font-bold italic">Settlement Protocol Ready</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Asset Link (UPI ID)</label>
                                    <input
                                        type="text"
                                        placeholder="username@bank"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-sm font-black italic tracking-widest focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="mb-10 p-8 border-2 border-dashed border-white/10 rounded-3xl text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full w-fit mx-auto">
                                    <Banknote className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-sm uppercase italic">Terminal Cash Settlement</h4>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
                                        Please ensure the asset exchange value is settled in physical currency at the terminal desk.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 mb-10 pt-6 border-t border-white/10">
                            {/* Identity Verification (Customer Dropdown - ADMIN ONLY) */}
                            {role === 'admin' ? (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Acquiring Client (POS Mode)
                                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Admin Override</span>
                                    </label>
                                    <select
                                        value={selectedCustomerId || ''}
                                        onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all appearance-none text-white italic"
                                    >
                                        <option value="" className="bg-slate-900">Walk-in Customer (Standard Price)</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id} className="bg-slate-900">
                                                {customer.name} {customer.customerGroup ? `[${customer.customerGroup.name}]` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : me ? (
                                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-black text-xs">
                                            {me.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Authenticated User</p>
                                            <p className="text-xs font-bold text-white uppercase italic">{me.name}</p>
                                        </div>
                                    </div>
                                    {me.customerGroup && (
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Tier</p>
                                            <p className="text-[10px] font-black text-emerald-400 uppercase italic">{me.customerGroup.name}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link href="/sign-in" className="block p-5 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-2xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pricing Strategy</p>
                                            <p className="text-xs font-bold text-white uppercase italic">Guest Mode (Standard)</p>
                                        </div>
                                        <p className="text-[8px] font-black text-emerald-500 uppercase underline">Sign in for VIP Discounts</p>
                                    </div>
                                </Link>
                            )}

                             <div className="mb-4 flex items-center gap-3 pt-6 border-t border-white/10">
                                 <Cpu className="w-4 h-4 text-blue-500" />
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Commission Protocol</span>
                             </div>

                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commission Agent (Optional)</label>
                                <select
                                    value={selectedAgentId || ''}
                                    onChange={(e) => setSelectedAgentId(e.target.value || null)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all appearance-none text-white"
                                >
                                    <option value="" className="bg-slate-900">No Agent (Direct Sale)</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id} className="bg-slate-900">
                                            {agent.name} ({agent.commissionRate}%)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <span>Gross Subtotal</span>
                                <span className="text-white">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] animate-pulse">
                                    <span>{selectedCustomer?.customerGroup?.name || 'Tier'} Discount ({groupDiscountPercent}%)</span>
                                    <span>-{settings.currencySymbol}{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <span>Global Logistics</span>
                                <span className="text-emerald-400">FREE</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <span>Compliance Tax ({settings.taxRate}%)</span>
                                <span className="text-white">{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic mb-2">Total Payable Matrix</span>
                                    <h2 className="text-5xl font-black text-blue-400 italic tracking-tighter truncate leading-none">
                                        {settings.currencySymbol}{mounted ? finalTotal.toFixed(2) : '--'}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleCheckout({ isDraft: true })}
                                disabled={status !== 'idle' || cart.length === 0}
                                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-400 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all border border-slate-800 flex items-center justify-center gap-2 group italic"
                            >
                                <List className="w-3.5 h-3.5" />
                                Save Draft
                            </button>

                             <button 
                                 onClick={() => handleCheckout()}
                                 disabled={status !== 'idle' || cart.length === 0}
                                 className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3 group active:scale-95 overflow-hidden relative border border-blue-500/30"
                             >
                                 {status === 'processing' ? (
                                     <Loader2 className="w-4 h-4 animate-spin text-white" />
                                 ) : (
                                     <>
                                         <Zap className="w-5 h-5 fill-white" />
                                         Authorize
                                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                     </>
                                 )}
                             </button>
                        </div>
                        
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-6 text-center italic">
                            By authorizing, you agree to our marketplace protocols and asset licensing terms.
                        </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
