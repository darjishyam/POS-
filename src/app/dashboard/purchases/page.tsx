import { checkRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import PurchasesClient from './PurchasesClient'

export const dynamic = 'force-dynamic'

export default async function PurchasesPage() {
    const isAdmin = await checkRole('admin')

    if (!isAdmin) {
        redirect('/denied')
    }

    return <PurchasesClient />
}
