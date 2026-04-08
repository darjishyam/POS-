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
    Activity,
    Truck
} from 'lucide-react'
import Link from 'next/link'
import { toast, Toaster } from 'react-hot-toast'
import { useSettings } from '@/context/SettingsContext'
import BarcodeScanner from '@/components/BarcodeScanner'
import { motion, AnimatePresence } from 'framer-motion'

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
    
    // Delivery Protocol States
    const [isDelivery, setIsDelivery] = useState(false)
    const [shippingName, setShippingName] = useState('')
    const [shippingAddress, setShippingAddress] = useState('')
    const [shippingCity, setShippingCity] = useState('')
    const [shippingPhone, setShippingPhone] = useState('')
    const [shippingCost, setShippingCost] = useState(0)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [me, setMe] = useState<any>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [lastScannedSku, setLastScannedSku] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    const [isSplit, setIsSplit] = useState(false)
    const [payments, setPayments] = useState<{ amount: number, method: string }[]>([
        { amount: 0, method: 'CASH' }
    ])

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
    const finalTotal = taxableAmount + taxAmount + (isDelivery ? (Number(shippingCost) || 0) : 0)

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
                    cartItems: cart,
                    totalAmount: finalTotal,
                    paymentMethod: isSplit ? undefined : paymentMethod,
                    payments: isSplit ? payments : undefined,
                    status: options?.isDraft ? 'DRAFT' : options?.isQuotation ? 'QUOTATION' : 'COMPLETED',
                    cardDetails: paymentMethod === 'CARD' ? cardDetails : null,
                    upiId: paymentMethod === 'UPI' ? upiId : null,
                    agentId: selectedAgentId,
                    customerId: selectedCustomerId,
                    discountAmount: discountAmount,
                    taxAmount: taxAmount,
                    isDelivery,
                    shippingName: isDelivery ? shippingName : null,
                    shippingAddress: isDelivery ? shippingAddress : null,
                    shippingCity: isDelivery ? shippingCity : null,
                    shippingPhone: isDelivery ? shippingPhone : null,
                    shippingCost: isDelivery ? (Number(shippingCost) || 0) : 0,
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
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 md:p-12 font-sans selection:bg-blue-100"
            >
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
                                    <motion.div 
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className="w-20 h-20 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-400 no-print"
                                    >
                                        <ShieldCheck className="w-10 h-10" />
                                    </motion.div>
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
                                    <p className="text-sm font-bold text-slate-800">
                                        {orderData.payments && orderData.payments.length > 1 
                                            ? `Split: ${orderData.payments.map((p: any) => `${p.method}`).join(' + ')}`
                                            : orderData.paymentMethod.toUpperCase() === 'UPI' ? `UPI (${orderData.upiId || 'Direct'})` : orderData.paymentMethod.toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {orderData.payments && orderData.payments.length > 1 && (
                                <div className="mt-8 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-3 animate-in fade-in duration-1000">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 italic">Settlement Breakdown</p>
                                    {orderData.payments.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase italic">
                                            <span>{p.method}</span>
                                            <span className="font-mono text-slate-950 font-black">{settings.currencySymbol}{p.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

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
            </motion.div>
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
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-7 space-y-8"
                    >
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
                                <AnimatePresence mode="popLayout">
                                    {cart.map((item) => (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            key={item.id} 
                                            className="flex gap-6 items-center p-4 hover:bg-slate-50 rounded-3xl transition-all group"
                                        >
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
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

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
                    </motion.div>

                    {/* Summary & Action */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-5 bg-slate-950/80 backdrop-blur-3xl rounded-[3.5rem] p-12 text-white shadow-2xl shadow-blue-900/30 border border-white/10 relative overflow-hidden group/panel transition-all duration-700 hover:shadow-blue-900/40 hover:bg-slate-950/90"
                    >
                        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-blue-600/20 blur-[128px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover/panel:opacity-100 opacity-60" />
                        <div className="absolute -top-40 -left-40 w-[20rem] h-[20rem] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
                        
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Payment Strategy</h4>
                                <button 
                                    onClick={() => {
                                        setIsSplit(!isSplit);
                                        if (!isSplit) {
                                            setPayments([{ amount: finalTotal, method: paymentMethod }]);
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border ${
                                        isSplit ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    {isSplit ? 'Split Active' : 'Enable Split'}
                                </button>
                            </div>

                            {!isSplit && (
                                <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl border border-white/10">
                                    {[
                                        { id: 'CARD', label: 'Card', icon: CreditCard },
                                        { id: 'CASH', label: 'Cash', icon: Banknote },
                                        { id: 'UPI', label: 'UPI', icon: Landmark }
                                    ].map((method) => (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
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
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <AnimatePresence>
                                {isSplit && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 mb-8 p-6 bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden"
                                    >
                                        {payments.map((p, idx) => (
                                            <motion.div 
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                key={idx} 
                                                className="flex gap-3 items-center group"
                                            >
                                                <select 
                                                    value={p.method}
                                                    onChange={(e) => {
                                                        const newPayments = [...payments];
                                                        newPayments[idx].method = e.target.value;
                                                        setPayments(newPayments);
                                                    }}
                                                    className="bg-slate-900 border border-white/5 rounded-xl px-4 py-4 text-[10px] font-black text-white uppercase outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                                >
                                                    <option value="CASH">Cash</option>
                                                    <option value="CARD">Card</option>
                                                    <option value="UPI">UPI</option>
                                                </select>
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="number"
                                                        value={p.amount || ''}
                                                        placeholder="Amount"
                                                        onChange={(e) => {
                                                            const newPayments = [...payments];
                                                            newPayments[idx].amount = parseFloat(e.target.value) || 0;
                                                            setPayments(newPayments);
                                                        }}
                                                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-6 py-4 text-xs font-black text-blue-400 placeholder:text-slate-700 outline-none focus:border-blue-500 transition-colors"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-800">{settings.currencySymbol}</span>
                                                </div>
                                                {payments.length > 1 && (
                                                    <button 
                                                        onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                                                        className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setPayments([...payments, { amount: 0, method: 'CASH' }])}
                                            className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all active:scale-[0.98]"
                                        >
                                            + Add Payment Channel
                                        </motion.button>
                                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Total Split</p>
                                                <p className={`text-lg font-black italic tracking-tighter ${Math.abs(payments.reduce((sum, p) => sum + p.amount, 0) - finalTotal) < 0.01 ? 'text-emerald-400' : 'text-red-500'}`}>
                                                    {settings.currencySymbol}{payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Target</p>
                                                <p className="text-lg font-black text-slate-300 italic tracking-tighter">{settings.currencySymbol}{finalTotal.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {paymentMethod === 'CARD' ? (
                                <div className="space-y-6 mb-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Authorization Key</label>
                                        <input
                                            type="text"
                                            placeholder="4242 4242 4242 4242"
                                            value={cardDetails.number}
                                            onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                            className={`w-full bg-white/5 border ${errors.number ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-5 text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700`}
                                        />
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
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Hash</label>
                                            <input
                                                type="text"
                                                placeholder="***"
                                                value={cardDetails.cvc}
                                                onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                                className={`w-full bg-white/5 border ${errors.cvc ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-5 text-sm font-mono focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-700`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : paymentMethod === 'UPI' ? (
                                <div className="space-y-6 mb-10">
                                    <div className="p-8 bg-blue-600/5 border-2 border-dashed border-blue-600/20 rounded-[2.5rem] flex flex-col items-center text-center space-y-4">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl border border-blue-50">
                                            <Landmark className="w-8 h-8" />
                                        </div>
                                        <h4 className="font-black text-sm uppercase italic text-blue-900">Scan & Pay Interface</h4>
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
                                <div className="mb-10 p-8 border-2 border-dashed border-white/10 rounded-3xl text-center space-y-4">
                                    <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full w-fit mx-auto">
                                        <Banknote className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-black text-sm uppercase italic">Terminal Cash Settlement</h4>
                                </div>
                            )}

                            <div className="flex-1 space-y-6 pt-6 border-t border-white/10">
                                {role === 'admin' ? (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acquiring Client</label>
                                        <select
                                            value={selectedCustomerId || ''}
                                            onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white italic outline-none"
                                        >
                                            <option value="" className="bg-slate-900">Walk-in Customer</option>
                                            {customers.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                                        </select>
                                    </div>
                                ) : me && (
                                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center text-white italic">
                                        <span>{me.name}</span>
                                        <span className="text-[9px] uppercase tracking-widest font-black text-emerald-500">Authenticated</span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Agent</label>
                                    <select
                                        value={selectedAgentId || ''}
                                        onChange={(e) => setSelectedAgentId(e.target.value || null)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white italic outline-none"
                                    >
                                        <option value="" className="bg-slate-900">Direct Sale (No Agent)</option>
                                        {agents.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>)}
                                    </select>
                                </div>

                                {/* Delivery Protocol */}
                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <div 
                                        onClick={() => setIsDelivery(!isDelivery)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                                            isDelivery 
                                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 font-black' 
                                                : 'bg-white/5 border-white/10 text-slate-500 font-bold'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isDelivery ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-white/5'}`}>
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-widest leading-none">Require Delivery Protocol</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full transition-all relative ${isDelivery ? 'bg-blue-500' : 'bg-white/10'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDelivery ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isDelivery && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden space-y-4"
                                            >
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recipient Name</label>
                                                        <input 
                                                            type="text"
                                                            placeholder="Identity Signature"
                                                            value={shippingName}
                                                            onChange={(e) => setShippingName(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Phone Axis</label>
                                                        <input 
                                                            type="text"
                                                            placeholder="+91-0000000000"
                                                            value={shippingPhone}
                                                            onChange={(e) => setShippingPhone(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Geographic Address</label>
                                                    <textarea 
                                                        placeholder="Full Physical Coordinates"
                                                        rows={2}
                                                        value={shippingAddress}
                                                        onChange={(e) => setShippingAddress(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors resize-none"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">City Node</label>
                                                        <input 
                                                            type="text"
                                                            placeholder="Urban Sector"
                                                            value={shippingCity}
                                                            onChange={(e) => setShippingCity(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Shipping Fee</label>
                                                        <div className="relative">
                                                            <input 
                                                                type="number"
                                                                placeholder="0.00"
                                                                value={shippingCost || ''}
                                                                onChange={(e) => setShippingCost(Number(e.target.value))}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-8 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-colors"
                                                            />
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-black">{settings.currencySymbol}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <span>Gross Subtotal</span>
                                    <span className="text-white">{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                                </div>
                                
                                <div className="pt-8 border-t border-white/10">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic mb-2">Total Payable Matrix</span>
                                    <h2 className="text-5xl font-black text-blue-400 italic tracking-tighter leading-none">
                                        {settings.currencySymbol}{mounted ? finalTotal.toFixed(2) : '--'}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                    <button 
                                        onClick={() => handleCheckout({ isDraft: true })}
                                        className="bg-slate-900 text-slate-400 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-slate-800"
                                    >
                                        Save Draft
                                    </button>
                                    <motion.button 
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(37, 99, 235, 1)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleCheckout()}
                                        disabled={status !== 'idle' || cart.length === 0 || (isSplit && Math.abs(payments.reduce((sum, p) => sum + p.amount, 0) - finalTotal) >= 0.01)}
                                        className="bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3"
                                    >
                                        {status === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-5 h-5 fill-white" />}
                                        Authorize
                                    </motion.button>
                                </div>
                            </div>
                            
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-6 text-center italic">
                                By authorizing, you agree to our marketplace protocols.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
