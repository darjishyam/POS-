'use client'

import AdminUsersClient from './AdminUsersClient'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default function UserManagementPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center p-20 animate-pulse bg-slate-50">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Initializing Identity Matrix...</p>
            </div>
        }>
            <AdminUsersClient />
        </Suspense>
    )
}
