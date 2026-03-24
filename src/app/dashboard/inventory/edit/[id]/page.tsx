'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import ProductForm from '@/components/ProductForm'
import { toast } from 'react-hot-toast'

export default function EditProductPage() {
    const router = useRouter()
    const { id } = useParams()
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch('/api/products')
                const data = await res.json()
                const found = data.find((p: any) => p.id === id)
                setProduct(found)
            } catch (error) {
                toast.error('Registry Retrieval Failure')
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [id])

    const handleSave = async (data: any) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                toast.success('Asset Globally Updated')
                router.push('/dashboard/inventory')
            } else {
                toast.error('Update Protocol Failure')
            }
        } catch (error) {
            toast.error('System Synchronization Error')
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full animate-pulse" />
        </div>
    )

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-slate-400 font-black uppercase tracking-widest">Asset Not Found in Registry</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-transparent">
            <ProductForm 
                initialData={product}
                onSave={handleSave} 
                onCancel={() => router.push('/dashboard/inventory')} 
            />
        </div>
    )
}
