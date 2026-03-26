import { checkRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import PurchasesClient from './PurchasesClient'

export const dynamic = 'force-dynamic'

export default async function PurchasesPage() {
    const isAdmin = await checkRole('admin')

    if (!isAdmin) {
        redirect('/denied')
    }

    return (
        <Suspense fallback={<div>Loading Procurement Ledger...</div>}>
            <PurchasesClient />
        </Suspense>
    )
}
