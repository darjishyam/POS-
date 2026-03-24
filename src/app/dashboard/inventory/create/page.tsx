'use client'

import { useRouter } from 'next/navigation'
import ProductForm from '@/components/ProductForm'
import { toast } from 'react-hot-toast'

export default function CreateProductPage() {
    const router = useRouter()

    const handleSave = async (data: any) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (res.ok) {
                toast.success('Asset Globally Recognized')
                router.push('/dashboard/inventory')
            } else {
                toast.error('Registration Protocol Failure')
            }
        } catch (error) {
            toast.error('System Synchronization Error')
        }
    }

    return (
        <div className="min-h-screen bg-transparent">
            <ProductForm 
                onSave={handleSave} 
                onCancel={() => router.push('/dashboard/inventory')} 
            />
        </div>
    )
}
