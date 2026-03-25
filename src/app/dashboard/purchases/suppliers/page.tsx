'use client'

import SupplierClient from './SupplierClient'
import { Suspense } from 'react'

export default function SupplierPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-xs font-black uppercase tracking-widest text-slate-300 animate-pulse italic">Accessing Supplier Matrix...</div>}>
            <SupplierClient />
        </Suspense>
    )
}
