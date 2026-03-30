'use client'

import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import { Plus, ShoppingBag } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

import { useAuth } from '@/context/AuthContext'

interface Product {
    id: string
    name: string
    price: number
    image?: string
    category?: { name: string }
}

export default function ProductShelf({ products }: { products: Product[] }) {
    const { addToCart } = useCart()
    const { user, loading } = useAuth()
    const isSignedIn = !!user

    const handleAdd = (product: Product) => {
        if (loading) return

        if (!isSignedIn) {
            toast.error('Authentication Required: Please login to synchronize assets', {
                icon: '🔒',
                duration: 4000,
                style: {
                    borderRadius: '1.5rem',
                    background: '#be123c',
                    color: '#fff',
                    fontWeight: '900',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    boxShadow: '0 20px 25px -5px rgba(190, 18, 60, 0.2)'
                }
            })
            return
        }

        addToCart(product)
        toast.success(`${product.name} synchronized to your cart`, {
            icon: '🛍️',
            duration: 3000,
            style: {
                borderRadius: '1.5rem',
                background: '#059669',
                color: '#fff',
                fontWeight: '900',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                boxShadow: '0 20px 25px -5px rgba(5, 150, 105, 0.2)'
            }
        })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
                <div key={product.id} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                    <div className="aspect-[4/3] overflow-hidden bg-gray-50 relative">
                        <img 
                            src={product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-900 border border-gray-50 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {product.category?.name || 'ASSET'}
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="flex flex-col gap-1 mb-6">
                            <h3 className="text-xl font-black text-gray-950 tracking-tight italic uppercase truncate">{product.name}</h3>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Enterprise Asset ID: {product.id.slice(-8).toUpperCase()}</p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-black text-emerald-600 font-mono tracking-tighter italic">₹{product.price.toFixed(2)}</span>
                            <button 
                                onClick={() => handleAdd(product)}
                                className="w-14 h-14 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-90 border border-emerald-400 group/btn relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 animate-ping opacity-20" />
                                <Plus className="w-8 h-8 group-hover/btn:rotate-90 transition-transform duration-500 relative z-10" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
