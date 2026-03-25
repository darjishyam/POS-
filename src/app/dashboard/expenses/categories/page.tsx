'use client'

import ExpenseCategoryClient from './ExpenseCategoryClient'
import { Suspense } from 'react'

export default function ExpenseCategoryPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-xs font-black uppercase tracking-widest text-slate-300 animate-pulse italic">Accessing Classification Registers...</div>}>
            <ExpenseCategoryClient />
        </Suspense>
    )
}
