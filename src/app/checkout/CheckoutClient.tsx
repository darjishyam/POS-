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
    Share2
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
    const finalTotal = subtotal - discountAmount

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
                    discountAmount: discountAmount
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
                    toast.success('System Asset Acquisition Complete')
                }
            } else {
                toast.error('Authorization Protocol Failure')
                setStatus('idle')
            }
        } catch (error) {
            toast.error('Network Synchronization Error')
            setStatus('idle')
        }
    }

    if (status === 'success' && orderData) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 md:p-12 font-sans selection:bg-emerald-100 animate-in fade-in duration-700">
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
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors uppercase text-[10px] font-black tracking-widest">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Matrix
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Push to WhatsApp
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                Dispatch Hard-Copy
                            </button>
                        </div>
                    </div>

                    {/* Invoice Card */}
                    <div id="invoice-content" className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden relative">
                        {/* Decorative Gradient Top */}
                        <div className="h-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600" />

                        <div className="p-10 md:p-16 space-y-12">
                            {/* Success Banner */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-200 no-print animate-bounce">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h1 className="text-4xl font-black text-slate-950 tracking-tighter italic leading-none">Order <br /><span className="text-emerald-600 NOT-italic font-black">Authorized.</span></h1>
                                </div>
                                <div className="text-right space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Authentication ID</p>
                                    <p className="text-lg font-mono font-black text-slate-900 tracking-tighter uppercase">#{orderData.id.slice(-12)}</p>
                                    <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                        <ShieldCheck className="w-3 h-3" />
                                        Verified Hash
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-50" />

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Temporal Signature
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">{new Date(orderData.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="space-y-4 md:text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center md:justify-end gap-2">
                                        <CreditCard className="w-3 h-3" />
                                        Protocol Authorized
                                    </p>
                                    <p className="text-sm font-bold text-slate-800">{orderData.paymentMethod.toUpperCase() === 'UPI' ? `UPI (${orderData.upiId || 'Direct'})` : orderData.paymentMethod.toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Itemized Assets */}
                            <div className="space-y-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Acquired Assets</p>
                                <div className="space-y-4">
                                    {orderData.items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center py-6 border-b border-slate-50 last:border-0 group">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                                                    {item.product?.image ? (
                                                        <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                                                    ) : (
                                                        <ShoppingBag className="w-6 h-6 text-slate-200" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase italic leading-none">{item.product?.name || 'Authorized Asset'}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{item.quantity} Unit(s) Locked</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-950 italic font-mono tracking-tighter">{settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1 italic">Verified</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Final Tally */}
                            <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[60px] rounded-full" />
                                
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                        <span>Gross Asset Value</span>
                                        <span className="text-white">{settings.currencySymbol}{(orderData.totalAmount + (orderData.discountAmount || 0)).toFixed(2)}</span>
                                    </div>
                                    {orderData.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                            <span>Tier Reward Applied</span>
                                            <span>-{settings.currencySymbol}{orderData.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-end border-t border-white/10 pt-8">
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2 italic">Total Payable</p>
                                        <h2 className="text-5xl font-black italic tracking-tighter">{settings.currencySymbol}{orderData.totalAmount.toFixed(2)}</h2>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Status</p>
                                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-1">Acquisition Finalized</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="bg-slate-50 px-10 md:px-16 py-8 text-center border-t border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">This is a cryptographically verified digital proof of asset acquisition.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent p-8 md:p-12 font-sans selection:bg-emerald-100">
            <Toaster position="bottom-right" />
            {isScannerOpen && (
                <BarcodeScanner 
                    onScan={handleScan} 
                    onClose={() => setIsScannerOpen(false)} 
                />
            )}
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-6 mb-16">
                    <Link href="/" className="p-4 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-emerald-600 shadow-sm border border-transparent hover:border-emerald-100">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h2 className="text-5xl font-black text-slate-950 tracking-tighter italic leading-none">Checkout <span className="text-emerald-600 NOT-italic">Protocol</span></h2>
                        <p className="text-emerald-600/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">Securing Marketplace Assets {user ? `| LOGGED AS ${user.email?.toUpperCase()}` : ''}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Items List */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-white rounded-[3.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/30">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic uppercase">Order Registry</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{cart.length} Unique Assets Secured</p>
                                </div>
                                <button 
                                    onClick={() => setIsScannerOpen(true)}
                                    className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-[2rem] border border-emerald-500/20 transition-all group font-black uppercase text-[10px] tracking-widest"
                                >
                                    <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span>Scan Protocol</span>
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

                        <div className="bg-emerald-500/5 rounded-[2.5rem] p-8 border border-emerald-500/10 flex items-center gap-6">
                            <div className="p-4 bg-white rounded-2xl text-emerald-600 shadow-sm">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-emerald-900 uppercase italic">Encrypted Authorization</h4>
                                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest leading-relaxed">
                                    All marketplace transactions are secured by 256-bit AES encryption and verified through our global pos-logic network.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary & Action */}
                    <div className="lg:col-span-5 bg-gray-950 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-emerald-900/10 border border-emerald-500/20">
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
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        paymentMethod === method.id
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
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
                                <div className="p-8 bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                        <Landmark className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase italic text-emerald-900">Scan & Pay Protocol</h4>
                                        <p className="text-[10px] text-emerald-600 uppercase tracking-widest mt-1">Instant Settlement Enabled</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Universal Payment Interface (UPI ID)</label>
                                    <input
                                        type="text"
                                        placeholder="username@bank"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
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
                                <span>Compliance Tax</span>
                                <span className="text-white">{settings.currencySymbol}0.00</span>
                            </div>
                            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                <div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Authorized Total</span>
                                    <span className="text-4xl font-black text-emerald-400 italic tracking-tighter font-mono">{settings.currencySymbol}{finalTotal.toFixed(2)}</span>
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
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 group italic overflow-hidden relative"
                            >
                                {status === 'processing' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Authorize
                                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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
    )
}
