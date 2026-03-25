'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { StoreHeader } from '@/components/StoreHeader'
import { 
    ShoppingBag, 
    Search, 
    ShieldCheck, 
    Box, 
    Tag, 
    Layers, 
    Plus, 
    ExternalLink,
    Printer,
    Calendar,
    Hash,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        sku: '',
        stock: '0',
        description: '',
        categoryId: '',
        image: '',
        brochureUrl: ''
    })

    const { user, role, loading: authLoading } = useAuth()
    const { addToCart } = useCart()
    const isAdmin = role === 'admin'
    const isSignedIn = !!user

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const fetchProducts = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/products')
            const data = await res.json()
            setProducts(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching products:', error)
            toast.error('Failed to synchronize with global registry')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories')
            const data = await res.json()
            setCategories(Array.isArray(data) ? data : [])
            if (Array.isArray(data) && data.length > 0 && !formData.categoryId) {
                setFormData(prev => ({ ...prev, categoryId: data[0].id }))
            }
        } catch (error) {
            console.error('Failed to fetch categories')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.categoryId) {
            toast.error('Identity protocol incomplete: Category required')
            return
        }

        setIsAdding(true)
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                manageStock: true,
                alertQuantity: 5,
                unit: 'Piece',
                barcodeType: 'CODE128'
            }

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('Asset Registry Updated')
                setFormData({
                    name: '',
                    price: '',
                    sku: '',
                    stock: '0',
                    description: '',
                    categoryId: categories[0]?.id || '',
                    image: '',
                    brochureUrl: ''
                })
                fetchProducts()
            } else {
                toast.error('Registry Authorization Denied')
            }
        } catch (error) {
            toast.error('Network Protocol Error')
        } finally {
            setIsAdding(true) // Should be false, fixed below
            setIsAdding(false)
        }
    }

    const handleAddToCart = (product: any) => {
        if (!isSignedIn) {
            toast.error('Authentication Required: Please login to sync assets', {
                position: 'top-center',
                style: { background: '#ef4444', color: '#fff', fontWeight: '900', fontSize: '12px' }
            })
            return
        }
        addToCart(product)
        toast.success(`${product.name} synced to local cache`, {
            position: 'top-center',
            style: { background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '12px' }
        })
    }

    const handleViewSpecs = (brochureUrl?: string) => {
        if (brochureUrl) {
            window.open(brochureUrl, '_blank')
        } else {
            toast.error('Specification Document Missing', {
                style: { background: '#0f172a', color: '#10b981', border: '1px solid #10b981' }
            })
        }
    }

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (authLoading) return null

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-emerald-100 italic-text-fix">
            <Toaster />
            <StoreHeader />
            
            <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
                {/* Hero section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-slate-200 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px]">
                            <Box className="w-4 h-4" />
                            Global Asset Repository
                        </div>
                        <h1 className="text-7xl font-black text-slate-950 tracking-tighter italic leading-none">
                            The <span className="text-emerald-600 NOT-italic">Collection.</span>
                        </h1>
                    </div>
                    
                    <div className="w-full md:w-96 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search protocol (Name/SKU)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Admin Registration Form */}
                    {isAdmin && (
                        <div className="lg:col-span-4 self-start sticky top-12">
                            <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-950/20 border border-emerald-500/20 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />
                                
                                <h2 className="text-2xl font-black italic tracking-tight uppercase mb-8 flex items-center gap-3">
                                    <Plus className="w-6 h-6 text-emerald-400" />
                                    Register Asset
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Nomenclature</label>
                                        <input 
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            placeholder="Product Title"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Value (USD)</label>
                                            <input 
                                                required
                                                type="number"
                                                step="0.01"
                                                value={formData.price}
                                                onChange={e => setFormData({...formData, price: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stock Level</label>
                                            <input 
                                                required
                                                type="number"
                                                value={formData.stock}
                                                onChange={e => setFormData({...formData, stock: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SKU identifier</label>
                                        <input 
                                            required
                                            value={formData.sku}
                                            onChange={e => setFormData({...formData, sku: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            placeholder="UNIQUE-SKU"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification Category</label>
                                        <select 
                                            required
                                            value={formData.categoryId}
                                            onChange={e => setFormData({...formData, categoryId: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Imagery (URL)</label>
                                        <input 
                                            value={formData.image}
                                            onChange={e => setFormData({...formData, image: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            placeholder="https://images.unsplash.com/..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Specification Document (URL)</label>
                                        <input 
                                            value={formData.brochureUrl}
                                            onChange={e => setFormData({...formData, brochureUrl: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            placeholder="https://manuals.com/..."
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isAdding}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 uppercase text-xs tracking-widest italic"
                                    >
                                        {isAdding ? 'Processing...' : 'Authorize Registration'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Products Grid */}
                    <div className={isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'}>
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="bg-white rounded-[2.5rem] p-8 aspect-[4/5] animate-pulse border border-slate-100" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="group bg-white rounded-[3rem] p-8 border border-slate-100 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 flex flex-col">
                                        <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 mb-8 border border-slate-50">
                                            <img 
                                                src={product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'} 
                                                alt={product.name}
                                                className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                            />
                                            <div className="absolute top-6 left-6">
                                                <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                                                    {product.category?.name || 'Asset'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-950 uppercase italic leading-none">{product.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{product.sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-emerald-600 italic tracking-tighter font-mono">₹{product.price.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <button 
                                                    onClick={() => handleAddToCart(product)}
                                                    className="flex-1 bg-slate-950 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 group-hover:shadow-emerald-900/10"
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                    Acquire
                                                </button>
                                                {product.brochureUrl && (
                                                    <button 
                                                        onClick={() => handleViewSpecs(product.brochureUrl)}
                                                        className="p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all"
                                                        title="View Specifications"
                                                    >
                                                        <ExternalLink className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full py-32 text-center space-y-4">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                            <Search className="w-10 h-10" />
                                        </div>
                                        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em] italic leading-relaxed">No identical assets found <br/> in global registry</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Footer */}
                <div className="bg-emerald-50 rounded-[3.5rem] p-12 flex flex-col md:flex-row items-center justify-between gap-12 border border-emerald-100/50">
                    <div className="flex gap-8 items-center text-center md:text-left">
                        <div className="w-20 h-20 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-emerald-900 uppercase italic leading-none">Global Asset Security</h4>
                            <p className="text-sm font-bold text-emerald-600/70 max-w-md">Every transaction is cryptographically secured and logged in the marketplace mainframe.</p>
                        </div>
                    </div>
                    <Link href="/checkout" className="bg-slate-950 text-white px-10 py-6 rounded-3xl font-black uppercase text-xs tracking-widest transition-all hover:bg-emerald-600 shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-3">
                        Enter Checkout Matrix
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </main>
        </div>
    )
}
