'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useSettings } from '@/context/SettingsContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function POSPage() {
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [cart, setCart] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [locations, setLocations] = useState<any[]>([])
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [taxAmount, setTaxAmount] = useState<number>(0)
    const [discountAmount, setDiscountAmount] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
    const [isSplit, setIsSplit] = useState(false)
    const [payments, setPayments] = useState<{ method: string, amount: number }[]>([])
    const [receipt, setReceipt] = useState<any>(null)
    const { settings } = useSettings()

    useEffect(() => {
        // Fetch everything in parallel initial load
        Promise.all([
            fetch('/api/products').then(res => res.json()),
            fetch('/api/categories').then(res => res.json()),
            fetch('/api/customers').then(res => res.json()),
            fetch('/api/locations').then(res => res.json())
        ]).then(([p, cat, cust, locs]) => {
            setProducts(p)
            setCategories(cat)
            setCustomers(cust)
            setLocations(locs)
            if (locs.length > 0) setSelectedLocationId(locs[0].id)
        })

        // Magic Sync Polling: Silently update Product Stock levels in the background
        const productSyncInterval = setInterval(() => {
            fetch('/api/products')
                .then(res => res.json())
                .then(newProducts => {
                    if (Array.isArray(newProducts)) {
                        setProducts(newProducts)
                    }
                })
                .catch(err => console.error('POS Sync Error:', err))
        }, 3500)

        return () => clearInterval(productSyncInterval)
    }, [])

    useEffect(() => {
        if (selectedCustomerId) {
            const customer = customers.find(c => c.id === selectedCustomerId)
            if (customer?.customerGroup) {
                const discountPct = customer.customerGroup.discount
                const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0)
                setDiscountAmount((subtotal * discountPct) / 100)
            }
        } else {
            setDiscountAmount(0)
        }
        
        // Auto-calculate tax from global settings if not manually changed
        const currentSubtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0)
        setTaxAmount((currentSubtotal * (settings.taxRate || 0)) / 100)
    }, [selectedCustomerId, cart, customers, settings.taxRate])

    const filteredProducts = products.filter(p => {
        if (p.stock <= 0) return false;
        
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !selectedCategoryId || p.categoryId === selectedCategoryId
        return matchesSearch && matchesCategory
    })

    const addToCart = (product: any) => {
        if (product.stock <= 0) {
            toast.error('No inventory available!', { id: 'cart-operation-status', duration: 3000, style: { background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 'bold' } })
            return
        }

        const existing = cart.find(item => item.id === product.id)
        if (existing && existing.quantity >= product.stock) {
            toast.error(`Maximum stock reached! Only ${product.stock} available.`, { 
                id: 'cart-operation-status', 
                duration: 3000, 
                style: { background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 'bold' } 
            })
            return
        }

        setCart(prev => {
            const innerExisting = prev.find(item => item.id === product.id)
            if (innerExisting) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...prev, { ...product, quantity: 1 }]
        })
        
        toast.success(`${product.name} added to cart`, {
            id: 'cart-operation-status',
            duration: 2000,
            style: { background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '12px' }
        })
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const total = subtotal + taxAmount - discountAmount

    const handleCheckout = async () => {
        if (cart.length === 0) return
        setIsProcessing(true)

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    customerId: selectedCustomerId,
                    taxAmount,
                    discountAmount,
                    paymentMethod: isSplit ? undefined : paymentMethod,
                    payments: isSplit ? payments : undefined,
                    locationId: selectedLocationId
                })
            })

            const data = await res.json()

            if (res.ok) {
                setReceipt(data)
                setCart([])
                setTaxAmount(0)
                setDiscountAmount(0)
                setIsCartOpen(false)
                // Refresh products
                const pRes = await fetch('/api/products')
                setProducts(await pRes.json())
            } else {
                alert(`Checkout failure: ${data.error}`)
            }
        } catch (error) {
            alert('Hardware/Network interrupt.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-100 print:bg-white text-slate-900">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden !important; }
                    .print-receipt, .print-receipt * { visibility: visible !important; }
                    .print-receipt { 
                        position: fixed !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    header, nav, .print-hidden { display: none !important; }
                }
            `}} />
            
            {/* Header / Search Controls */}
            <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-30 px-6 py-4 shadow-sm print:hidden">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">{settings.storeName.split(' ')[0]} <span className="text-emerald-500 NOT-italic">{settings.storeName.split(' ').slice(1).join(' ')}</span></h1>
                    </div>

                    <div className="flex-1 w-full relative">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Scan SKU or type product name..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-100 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-800"
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                
                                // Auto-scan logic: If SKU matches exactly, add to cart and clear search
                                const exactMatch = products.find(p => p.sku.toLowerCase() === val.toLowerCase());
                                if (exactMatch && exactMatch.stock > 0) {
                                    addToCart(exactMatch);
                                    setSearch('');
                                }
                            }}
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 min-w-[200px]">
                        <div className="pl-3 py-1 border-r border-slate-200 pr-3">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Site Node</p>
                        </div>
                        <select
                            className="bg-transparent text-[10px] font-black text-slate-900 uppercase tracking-widest outline-none px-2 py-1 flex-1 cursor-pointer"
                            value={selectedLocationId || ''}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                        >
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto w-full p-6 flex flex-col md:flex-row gap-8 flex-1 mb-24 md:mb-0">
                {/* Left Side: Product Discovery */}
                <div className="flex-1 flex flex-col gap-8">
                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                        <button
                            onClick={() => setSelectedCategoryId(null)}
                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${!selectedCategoryId ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-100'}`}
                        >
                            All Units
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategoryId === cat.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-100'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    <motion.div 
                        layout
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xxl:grid-cols-5 gap-6"
                    >
                        <AnimatePresence mode='popLayout'>
                            {filteredProducts.map((product, idx) => (
                                <motion.button
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 300, 
                                        damping: 25,
                                        delay: Math.min(idx * 0.05, 0.5) 
                                    }}
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-300 text-left border border-slate-100 group relative overflow-hidden"
                                >
                                    <div className="aspect-square w-full overflow-hidden bg-slate-50 relative">
                                        <img
                                            src={product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <motion.div 
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 border border-slate-100 shadow-sm"
                                        >
                                            {product.stock} IN STOCK
                                        </motion.div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 line-clamp-2 min-h-[3.5rem]">{product.name}</h3>
                                        <div className="flex justify-between items-center">
                                            <motion.div 
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                className="text-2xl font-black text-emerald-500 font-mono tracking-tighter"
                                            >
                                                {settings.currencySymbol}{product.price.toFixed(2)}
                                            </motion.div>
                                            <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-inner">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Right Side: Execution Drawer (Cart) */}
                <div className="hidden md:flex w-[400px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden flex-col h-[calc(100vh-8rem)] sticky top-28 border border-slate-100">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight italic">Pulse Drawer</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Engine</p>
                        </div>
                        <div className="bg-emerald-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-emerald-200">
                            {cart.length}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth thin-scrollbar">
                        <AnimatePresence mode='popLayout'>
                            {cart.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-slate-200 space-y-4"
                                >
                                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                    <p className="font-black uppercase tracking-widest text-xs">Awaiting Input</p>
                                </motion.div>
                            ) : (
                                cart.map(item => (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        key={item.id} 
                                        className="flex justify-between items-center group"
                                    >
                                        <div className="flex-1 pr-6">
                                            <div className="font-black text-slate-900 text-sm leading-tight mb-1 uppercase tracking-tight">{item.name}</div>
                                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{settings.currencySymbol}{item.price.toFixed(2)} × {item.quantity} = {settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}</div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <button onClick={() => removeFromCart(item.id)} className="text-slate-200 hover:text-rose-500 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-8 bg-slate-50/80 border-t border-slate-100 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax ({settings.currencySymbol})</span>
                                <input
                                    type="number"
                                    className="w-20 p-1 bg-white rounded-lg text-right text-xs font-bold outline-none border border-slate-200 focus:border-emerald-500"
                                    value={taxAmount}
                                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount ({settings.currencySymbol})</span>
                                <input
                                    type="number"
                                    className="w-20 p-1 bg-white rounded-lg text-right text-xs font-bold outline-none border border-slate-200 focus:border-emerald-500"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-slate-400 font-black text-[10px] uppercase tracking-widest italic pt-2 border-t border-slate-200">
                            <span>Final Execution</span>
                            <span className="text-3xl font-black text-emerald-500 font-mono tracking-tighter NOT-italic">{settings.currencySymbol}{total.toFixed(2)}</span>
                        </div>

                        {/* Customer Matrix Selection */}
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client ID</label>
                                <select
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-inner"
                                    value={selectedCustomerId || ''}
                                    onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                                >
                                    <option value="">ANONYMOUS TERMINAL</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Strategy</label>
                                    <button 
                                        onClick={() => {
                                            if (!isSplit) {
                                                setPayments([{ method: paymentMethod, amount: total }])
                                            }
                                            setIsSplit(!isSplit)
                                        }}
                                        className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${isSplit ? 'bg-emerald-500 text-white border-emerald-500' : 'text-slate-400 border-slate-200 hover:border-slate-400'}`}
                                    >
                                        {isSplit ? 'Split Active' : 'Enable Split'}
                                    </button>
                                </div>

                                {!isSplit ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {['CASH', 'CARD', 'UPI'].map(method => (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${paymentMethod === method ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                            >
                                                {method}
                                            </motion.button>
                                        ))}
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-hidden"
                                        >
                                            {payments.map((p, idx) => (
                                                <motion.div 
                                                    layout
                                                    initial={{ x: 20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    key={idx} 
                                                    className="flex items-center gap-2"
                                                >
                                                    <select 
                                                        className="bg-white border border-slate-200 rounded-lg text-[10px] font-black p-2 outline-none cursor-pointer"
                                                        value={p.method}
                                                        onChange={(e) => {
                                                            const newPayments = [...payments]
                                                            newPayments[idx].method = e.target.value
                                                            setPayments(newPayments)
                                                        }}
                                                    >
                                                        {['CASH', 'CARD', 'UPI'].map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                    <input 
                                                        type="number"
                                                        className="flex-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black p-2 outline-none text-right placeholder:text-slate-200"
                                                        value={p.amount || ''}
                                                        placeholder="0.00"
                                                        onChange={(e) => {
                                                            const newPayments = [...payments]
                                                            newPayments[idx].amount = Number(e.target.value)
                                                            setPayments(newPayments)
                                                        }}
                                                    />
                                                    {payments.length > 1 && (
                                                        <button 
                                                            onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                                                            className="text-rose-400 hover:text-rose-600 p-1 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
                                            <motion.button 
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setPayments([...payments, { method: 'CASH', amount: 0 }])}
                                                className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[8px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-500 transition-all"
                                            >
                                                + Add Payment Channel
                                            </motion.button>
                                            <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-black text-[9px] uppercase tracking-widest">
                                                <span className={Math.abs(payments.reduce((s, p) => s + p.amount, 0) - total) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}>
                                                    Total Split: {settings.currencySymbol}{payments.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                                                </span>
                                                <span className="text-slate-400 italic">Target: {settings.currencySymbol}{total.toFixed(2)}</span>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: '#10b981' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCheckout}
                            disabled={isProcessing || cart.length === 0 || (isSplit && Math.abs(payments.reduce((s, p) => s + p.amount, 0) - total) > 0.01)}
                            className={`w-full py-5 rounded-[2rem] font-black text-lg text-white shadow-2xl transition-all active:scale-95 ${isProcessing || cart.length === 0 || (isSplit && Math.abs(payments.reduce((s, p) => s + p.amount, 0) - total) > 0.01) ? 'bg-slate-300 shadow-none grayscale opacity-50 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
                        >
                            {isProcessing ? 'SYNCHRONIZING...' : 'SWIPE TO EXECUTE'}
                        </motion.button>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Control Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t p-4 md:hidden z-40">
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="w-full bg-emerald-500 text-white p-5 rounded-[2rem] flex justify-between items-center font-black italic shadow-2xl shadow-emerald-500/40"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] NOT-italic">{cart.length}</div>
                        <span>EXTRACT ORDER</span>
                    </div>
                    <span className="NOT-italic font-mono text-2xl tracking-tighter">{settings.currencySymbol}{total.toFixed(2)}</span>
                </button>
            </div>

            {/* Full-Screen Cart Overlay (Mobile) */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto my-6" />
                        <div className="p-10 pt-4 flex-1 overflow-y-auto">
                            <h2 className="text-3xl font-black mb-8 italic">Review Drawer</h2>
                            <div className="space-y-8">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center group">
                                        <div className="flex-1 pr-6">
                                            <div className="font-black text-slate-900 text-xl uppercase tracking-tighter leading-none mb-1">{item.name}</div>
                                            <div className="text-xs font-black text-emerald-500 uppercase tracking-widest">{settings.currencySymbol}{item.price.toFixed(2)} × {item.quantity}</div>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-10 bg-slate-50 border-t space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <span>Tax</span>
                                    <input type="number" className="w-20 p-2 rounded-xl text-right outline-none" value={taxAmount} onChange={(e) => setTaxAmount(Number(e.target.value))} />
                                </div>
                                <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <span>Discount</span>
                                    <input type="number" className="w-20 p-2 rounded-xl text-right outline-none" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-black uppercase text-xs tracking-widest italic">Total</span>
                                <span className="text-4xl font-black text-emerald-500 font-mono tracking-tighter">{settings.currencySymbol}{total.toFixed(2)}</span>
                            </div>
                            <button onClick={handleCheckout} className="w-full py-6 rounded-[2.5rem] bg-emerald-500 text-white font-black text-2xl shadow-2xl">EXECUTE PAY</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {receipt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl print:hidden" onClick={() => setReceipt(null)} />
                    <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col items-center p-0 text-center border border-slate-100 print-receipt">
                        {/* Receipt Header */}
                        <div className="w-full bg-slate-50 p-8 border-b border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg shadow-emerald-200">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">{settings.storeName} Receipt</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px] mt-1">Transaction: {receipt.id.slice(-8).toUpperCase()}</p>
                        </div>

                        {/* Receipt Content */}
                        <div className="w-full p-8 pb-4 space-y-4 text-left">
                            <div className="space-y-3 pb-4 border-b border-dashed border-slate-100">
                                {receipt.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                                        <span className="flex-1 pr-4">Unit Purchase × {item.quantity}</span>
                                        <span className="font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                                <div className="flex justify-between">
                                    <span>Base Amount</span>
                                    <span className="text-slate-600 font-mono">₹{(receipt.totalAmount - receipt.taxAmount + receipt.discountAmount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax Amount</span>
                                    <span className="text-slate-600 font-mono">+₹{receipt.taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Special Discount</span>
                                    <span className="text-rose-500 font-mono">-₹{receipt.discountAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Total Extraction</span>
                                <span className="text-3xl font-black text-emerald-500 font-mono tracking-tighter">{settings.currencySymbol}{receipt.totalAmount.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                                    {receipt.payments && receipt.payments.length > 1 
                                        ? `Split: ${receipt.payments.map((p: any) => `${p.method}`).join(' + ')}`
                                        : `Execution via ${receipt.paymentMethod}`}
                                </span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{new Date(receipt.createdAt).toLocaleString()}</span>
                            </div>

                            {receipt.payments && receipt.payments.length > 1 && (
                                <div className="mt-4 pt-4 border-t border-slate-50 space-y-1">
                                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-2">Payment Breakdown</p>
                                    {receipt.payments.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[9px] font-black text-slate-500 uppercase italic">
                                            <span>{p.method}</span>
                                            <span>{settings.currencySymbol}{p.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Receipt Footer */}
                        <div className="w-full p-8 pt-4">
                            <button
                                onClick={() => {
                                    window.print();
                                    setReceipt(null);
                                }}
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 print:hidden"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                Print Execution Log
                            </button>
                            
                            {/* Visual Barcode Segment */}
                            <div className="mt-6 flex flex-col items-center gap-2 opacity-80">
                                <div className="flex items-center gap-[1px] h-8">
                                    {[...Array(40)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="bg-slate-900" 
                                            style={{ 
                                                width: `${[1, 2, 1, 3, 1][i % 5]}px`,
                                                height: '100%'
                                            }} 
                                        />
                                    ))}
                                </div>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.6em]">*{receipt.id.slice(-12).toUpperCase()}*</p>
                            </div>

                            <p className="mt-4 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">BardPOS Execution Verified</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
