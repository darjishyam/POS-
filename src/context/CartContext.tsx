'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    image?: string
    stock: number
}

interface CartContextType {
    cart: CartItem[]
    addToCart: (product: any, successMessage?: string) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    totalItems: number
    totalAmount: number
    isCartOpen: boolean
    setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('pos_marketplace_cart')
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart))
            } catch (e) {
                console.error('Failed to parse cart')
            }
        }
    }, [])

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('pos_marketplace_cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (product: any, successMessage?: string) => {
        if (!product || product.stock <= 0) return;

        let canAdd = true;
        const existing = cart.find(item => item.id === product.id);
        
        if (existing && existing.quantity >= product.stock) {
            toast.error(`Maximum stock reached! Only ${product.stock} available.`, { 
                id: 'cart-operation-status', 
                duration: 3000, 
                style: { background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 'bold' } 
            });
            canAdd = false;
            return;
        }

        if (canAdd) {
            setCart(prev => {
                const innerExisting = prev.find(item => item.id === product.id)
                if (innerExisting) {
                    return prev.map(item => 
                        item.id === product.id 
                        ? { ...item, quantity: item.quantity + 1, stock: product.stock } 
                        : item
                    )
                }
                return [...prev, { 
                    id: product.id, 
                    name: product.name, 
                    price: product.price, 
                    quantity: 1, 
                    image: product.image,
                    stock: product.stock
                }]
            });

            if (successMessage) {
                toast.success(successMessage, {
                    id: 'cart-operation-status',
                    duration: 3000,
                    style: { background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '12px' }
                });
            }
        }
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                if (item.stock && quantity > item.stock) {
                    toast.error(`Maximum stock reached! Only ${item.stock} available.`, { id: 'max-stock-alert', duration: 3000, style: { background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 'bold' } })
                    return { ...item, quantity: item.stock }
                }
                return { ...item, quantity }
            }
            return item
        }))
    }

    const clearCart = () => setCart([])

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    return (
        <CartContext.Provider value={{ 
            cart, addToCart, removeFromCart, updateQuantity, clearCart, 
            totalItems, totalAmount, isCartOpen, setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
